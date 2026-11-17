import { execFileSync } from 'node:child_process';

import { elapsedSeconds, formatSeconds, toolTotals } from './tool-time.mjs';

const REPO = 'alexibid/ibid-workspace';

const ICONS = {
  success: '\x1b[38;2;63;185;80m✔\x1b[0m',
  failure: '\x1b[38;2;248;81;73m✖\x1b[0m',
  cancelled: '\x1b[38;2;139;148;158m⊘\x1b[0m',
  skipped: '\x1b[38;2;139;148;158m·\x1b[0m',
  in_progress: '\x1b[38;2;241;224;90m▸\x1b[0m',
  queued: '\x1b[38;2;139;148;158m…\x1b[0m',
  pending: '\x1b[38;2;139;148;158m…\x1b[0m',
};

const watching = process.argv.includes('--watch');
const expanded = process.argv.includes('--steps');
const jobCache = new Map();
let buffer = [];

function withoutTemplate(name) {
  return name.replace(/\s*\$\{\{.*$/, ' …').trimEnd();
}

function jobLabel(job) {
  return withoutTemplate(job.name);
}

function out(text = '') {
  buffer.push(String(text));
}

if (watching) {
  process.stdout.write('\x1b[?25l\x1b[2J\x1b[H');
  const restoreCursor = () => {
    process.stdout.write('\x1b[?25h\n');
    process.exit(0);
  };
  process.on('SIGINT', restoreCursor);
  process.on('SIGTERM', restoreCursor);

  await render();
  while (watching) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    await render();
  }
} else {
  await render();
}

async function render() {
  buffer = [];
  try {
    jobCache.clear();
    const runs = api('/actions/runs?per_page=40').workflow_runs;
    const chain = buildChain(runs);

    out(`\x1b[1mibid-workspace\x1b[0m · ${new Date().toLocaleTimeString('en-US')}\n`);

    if (chain.length === 0) {
      out('No recent workflow runs.');
    } else {
      for (const run of chain) printRun(run);
      printTotals(chain);
      printPerformanceStats(chain, runs);
    }
  } catch (error) {
    out(`\x1b[1mibid-workspace\x1b[0m · ${new Date().toLocaleTimeString('en-US')}\n`);
    out(`\x1b[38;2;241;224;90mWaiting for GitHub Actions update... (${error.message})\x1b[0m`);
  }

  if (watching) {
    const frame = buffer.join('\n').split('\n').map((line) => line + '\x1b[K').join('\n') + '\x1b[J\n';
    process.stdout.write('\x1b[H' + frame);
  } else {
    console.log(buffer.join('\n'));
  }
}

function buildChain(runs) {
  const ci = runs.find((run) => run.name === 'CI');
  if (!ci) return [];

  const version = runs.find(
    (run) => run.name === 'Automatic versioning' && run.head_sha === ci.head_sha,
  );
  const releases = runs
    .filter((run) => run.name === 'Release' && run.created_at > ci.created_at)
    .reverse();

  return [ci, version, ...releases].filter(Boolean);
}

function printRun(run) {
  const label = run.name === 'Release' ? `Release ${run.head_branch}` : run.name;
  const state = run.conclusion ?? run.status;
  const jobs = jobsOf(run);
  const running = jobs.reduce((total, job) => total + jobSeconds(job), 0);
  const waiting = Math.max(0, duration(run) - running);
  const wait = waiting > 30 ? `  ${dim(`queue ${formatSeconds(waiting)}`)}` : '';

  out(`${ICONS[state] ?? '?'} \x1b[1m${label}\x1b[0m  ${formatSeconds(running)}${wait}`);

  jobs.forEach((job, index) => {
    const lastJob = index === jobs.length - 1;
    const jobState = job.conclusion ?? job.status;
    const runner = job.runner_name === 'MAC ALEX' ? dim('mac') : dim(job.runner_name ? 'github' : '—');
    const jobPrefix = lastJob ? '└─' : '├─';
    const subIndent = lastJob ? '    ' : '│   ';

    out(
      `  ${jobPrefix} ${ICONS[jobState] ?? '?'} \x1b[1m${jobLabel(job).padEnd(38)}\x1b[0m ${elapsed(job).padStart(8)}  ${runner}`,
    );

    const steps = (job.steps || []).filter(isMeaningfulStep);
    steps.forEach((step, sIndex) => {
      const lastStep = sIndex === steps.length - 1;
      const stepState = step.conclusion ?? step.status;
      const stepPrefix = lastStep ? '└─' : '├─';
      const time = stepDuration(step);
      out(
        `  ${subIndent}${stepPrefix} ${ICONS[stepState] ?? '?'} ${step.name.padEnd(34)} ${time.padStart(8)}`,
      );
    });
  });

  out();
}

function isMeaningfulStep(step) {
  if (!step || !step.name) return false;
  if (/^(Set up job|Complete job)$/.test(step.name)) return false;
  if (/^Post Run /.test(step.name)) return false;
  if (/^Run actions\/(checkout|upload-artifact|download-artifact)/.test(step.name)) return false;
  if (/^Run \.\/\.github\/actions\/setup-workspace/.test(step.name)) return false;
  if (/^Run nrwl\/nx-set-shas/.test(step.name)) return false;
  if (/^(Refuse to run|Decide the scope|Summary|Skip when)/.test(step.name)) return false;
  return true;
}

function cleanStepName(name) {
  if (/Lint/i.test(name)) return 'Lint budget';
  if (/^Types/i.test(name)) return 'TypeScript check';
  if (/^Unit tests/i.test(name)) return 'Unit tests';
  if (/^Build/i.test(name)) return 'Nx Build';
  if (/Resolve the affected/i.test(name)) return 'Resolve affected';
  return shorten(name);
}

function stepDuration(step) {
  if (step.completed_at && step.started_at) {
    return formatSeconds(elapsedSeconds(step.started_at, step.completed_at));
  }
  if (step.status === 'in_progress' && step.started_at) {
    return formatSeconds(elapsedSeconds(step.started_at, new Date().toISOString()));
  }
  if (step.status === 'in_progress') {
    return '\x1b[38;2;241;224;90mrunning\x1b[0m';
  }
  return '—';
}

function printTotals(chain) {
  const spent = chain.reduce(
    (total, run) => total + jobsOf(run).reduce((sum, job) => sum + jobSeconds(job), 0),
    0,
  );
  const billed = chain.reduce((total, run) => total + billedMinutes(run), 0);
  out(`${dim('total')} ${formatSeconds(spent)}   ${dim('billed')} ${billed} min`);
}

function billedMinutes(run) {
  return jobsOf(run)
    .filter((job) => job.completed_at)
    .reduce((total, job) => {
      if (job.runner_name === 'MAC ALEX') return total;
      const minutes = Math.ceil(elapsedSeconds(job.started_at, job.completed_at) / 60);
      if (/windows/.test(job.name)) return total + minutes * 2;
      if (/macos/.test(job.name)) return total + minutes * 10;
      return total + minutes;
    }, 0);
}

function jobsOf(run) {
  if (!jobCache.has(run.id)) jobCache.set(run.id, api(`/actions/runs/${run.id}/jobs`).jobs);
  return jobCache.get(run.id);
}

function jobSeconds(job) {
  return job.completed_at ? elapsedSeconds(job.started_at, job.completed_at) : 0;
}

function duration(item) {
  const start = item.started_at ?? item.run_started_at ?? item.created_at;
  return elapsedSeconds(start, item.completed_at ?? item.updated_at);
}

function elapsed(item) {
  const start = item.started_at ?? item.run_started_at ?? item.created_at;
  const end = item.completed_at ?? (item.status === 'completed' ? item.updated_at : null);
  return end ? formatSeconds(elapsedSeconds(start, end)) : '\x1b[38;2;241;224;90mrunning\x1b[0m';
}

function dim(text) {
  return `\x1b[38;2;139;148;158m${text}\x1b[0m`;
}

function api(path) {
  return JSON.parse(
    execFileSync('gh', ['api', `/repos/${REPO}${path}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }),
  );
}

function printPerformanceStats(chain, runs) {
  if (chain.length === 0) return;
  const ci = chain.find((r) => r.name === 'CI') ?? chain[0];
  const wall = duration(ci);
  const jobs = jobsOf(ci);

  let slowest = { name: '', seconds: 0, job: '' };
  for (const job of jobs) {
    for (const step of (job.steps || []).filter(isMeaningfulStep)) {
      const sSec = step.completed_at && step.started_at ? elapsedSeconds(step.started_at, step.completed_at) : 0;
      if (sSec > slowest.seconds) slowest = { name: step.name, seconds: sSec, job: jobLabel(job) };
    }
  }

  out();
  out(`\x1b[1mPerformance & Timing Insights\x1b[0m`);
  out(`  ${dim('wall clock')}   ${formatSeconds(wall)}`);
  if (slowest.seconds > 0) {
    const pct = Math.round((slowest.seconds / Math.max(1, wall)) * 100);
    out(`  ${dim('bottleneck')}   \x1b[38;2;241;224;90m${slowest.name}\x1b[0m (${formatSeconds(slowest.seconds)} · ${pct}% of run)`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = runs.filter((r) => r.created_at.startsWith(today) && r.status === 'completed' && r.name === 'CI');
  if (todayRuns.length > 0) {
    const avgSec = Math.round(
      todayRuns.reduce((sum, r) => sum + elapsedSeconds(r.run_started_at || r.created_at, r.updated_at), 0) / todayRuns.length,
    );
    const passCount = todayRuns.filter((r) => r.conclusion === 'success').length;
    out(`  ${dim('daily runs')}   ${todayRuns.length} runs today · avg ${formatSeconds(avgSec)} · ${Math.round((passCount / todayRuns.length) * 100)}% pass`);
  }
}

function shorten(name) {
  return name.split(' · ').pop().slice(0, 28);
}
