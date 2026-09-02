import { readLines } from './logs.mjs';

const MAX_SIGNAL_LINES = 10;
const MAX_SIGNAL_WIDTH = 160;

const SIGNAL_PATTERNS = {
  lint: [/^\/.*\.(ts|html|scss|mjs|js|json)$/, /^\s+\d+:\d+\s+(error|warning)\s/],
  test: [
    /^\s*(FAIL|×|✗)\s/,
    /^\s*(Assertion|Type|Reference|Range)?Error:/,
    /^\s*→\s/,
    /^\s*Expected\b/,
    /^\s*Received\b/,
  ],
  build: [/error TS\d+/, /^\s*✘/, /^ERROR\b/, /^\s*Error:/, /exceeded maximum budget/],
  e2e: [
    /^\s*\d+\)\s/,
    /^\s*(Timeout|Assertion)?Error:/,
    /^\s*Expected:/,
    /^\s*Received:/,
    /^\s*\d+ failed$/,
  ],
};

export function renderSummary({ results, skipped, scope, durationMs }) {
  const lines = [
    `run ${new Date().toISOString()} · scope ${scope} · ${seconds(durationMs)}`,
    '',
    ...results.map(statusLine),
    ...skipped.map((entry) => `SKIP  ${pad(entry.tier, 7)} ${pad('—', 7)} ${entry.reason}`),
  ];

  const failures = results.flatMap(toFailures);
  if (failures.length === 0) return [...lines, '', 'All green.'].join('\n');

  for (const failure of failures) lines.push('', ...renderFailure(failure));
  return lines.join('\n');
}

function statusLine(result) {
  const passed = result.projects.filter((project) => !result.failed.includes(project));
  const duration = pad(seconds(result.durationMs), 7);

  if (result.failed.length === 0) {
    return `PASS  ${pad(result.target, 7)} ${duration} ${passed.join(' · ')}`;
  }

  const passedNote = passed.length > 0 ? ` · passed ${passed.join(', ')}` : '';
  return `FAIL  ${pad(result.target, 7)} ${duration} failed ${result.failed.join(', ')}${passedNote}`;
}

function toFailures(result) {
  return result.failed.map((project) => ({
    project,
    target: result.target,
    logPath: result.logs[project] ?? result.rawLogPath,
  }));
}

function renderFailure(failure) {
  const signals = extractSignals(failure.logPath, kindOf(failure.target));
  const body = signals.length > 0 ? signals : ['      (no pattern matched — read the log tail)'];

  return [`── ${failure.project} · ${failure.target} ──`, ...body, `→ ${failure.logPath}`];
}

function extractSignals(logPath, kind) {
  const patterns = SIGNAL_PATTERNS[kind];
  const signals = [];

  for (const [index, line] of readLines(logPath).entries()) {
    if (!patterns.some((pattern) => pattern.test(line))) continue;

    signals.push(`${String(index + 1).padStart(5)}  ${line.trim().slice(0, MAX_SIGNAL_WIDTH)}`);
    if (signals.length === MAX_SIGNAL_LINES) {
      signals.push(`      … more matches below line ${index + 1}`);
      break;
    }
  }

  return signals;
}

function kindOf(target) {
  if (target.startsWith('e2e') || target === 'test-a11y') return 'e2e';
  return SIGNAL_PATTERNS[target] ? target : 'build';
}

function seconds(durationMs) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function pad(value, width) {
  return String(value).padEnd(width);
}
