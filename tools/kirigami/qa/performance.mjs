import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

import { PERFORMANCE_REPORT, RUN_LOG, WORKSPACE_ROOT } from '../mcp/paths.mjs';

const TRACKED = ['preflight', 'validate', 'build'];
const RECENT = 10;
const SILENT = [
  ['vision · segment', 'features.py', 'no MCP tool, run by hand'],
  ['vision · reconstruct', 'imagine.py', 'no MCP tool, run by hand'],
  ['publish', 'kirigami_publish', 'never calls note()'],
  ['approve', 'kirigami_approve', 'never calls note()'],
  ['reindex', 'kirigami_reindex', 'never calls note()'],
];

function main() {
  const runs = read();
  const report = runs.length ? render(runs) : empty();
  mkdirSync(dirname(PERFORMANCE_REPORT), { recursive: true });
  writeFileSync(PERFORMANCE_REPORT, report, 'utf8');
  console.log(`PERFORMANCE ${relative(WORKSPACE_ROOT, PERFORMANCE_REPORT)} runs=${runs.length}`);
}

function read() {
  if (!existsSync(RUN_LOG)) {
    return [];
  }
  return readFileSync(RUN_LOG, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function render(runs) {
  const span = `${day(runs[0].at)} to ${day(runs.at(-1).at)}`;
  return [
    '# Factory performance',
    '',
    `${runs.length} runs recorded, ${span}. Derived from \`${relative(WORKSPACE_ROOT, RUN_LOG)}\`;`,
    'regenerate with `npm run kirigami:performance` from apps/kirigami-studio. '
    + 'Never edit by hand.',
    '',
    '## What each stage costs',
    '',
    table(['Stage', 'Runs', 'Median', 'p90', 'Slowest', 'Failed'], TRACKED.map((stage) =>
      cost(stage, runs.filter((run) => run.mode === stage))).filter(Boolean)),
    '',
    '## What is never measured',
    '',
    'A stage missing here is a stage the factory cannot report on, and therefore one an agent',
    'has to time by hand.',
    '',
    table(['Stage', 'Driver', 'Why it is silent'], SILENT.map(([stage, driver, why]) =>
      [stage, `\`${driver}\``, why])),
    '',
    `## The last ${RECENT} runs`,
    '',
    table(['When', 'Model', 'Stage', 'Seconds', 'Faces', 'Result'],
      runs.slice(-RECENT).reverse().map((run) => [
        run.at.replace('T', ' ').slice(0, 19),
        run.id, run.mode, seconds(run.seconds),
        run.faces ?? '—', run.ok ? 'ok' : `failed at ${run.stage ?? 'unknown'}`,
      ])),
    '',
  ].join('\n');
}

function cost(stage, rows) {
  if (rows.length === 0) {
    return null;
  }
  const times = rows.filter((row) => typeof row.seconds === 'number')
    .map((row) => row.seconds).sort((a, b) => a - b);
  return [stage, String(rows.length), seconds(quantile(times, 0.5)),
    seconds(quantile(times, 0.9)), seconds(times.at(-1)),
    String(rows.filter((row) => !row.ok).length)];
}

function quantile(times, share) {
  return times.length ? times[Math.min(times.length - 1, Math.floor(times.length * share))] : undefined;
}

function seconds(value) {
  return typeof value === 'number' ? `${value.toFixed(1)} s` : '—';
}

function day(stamp) {
  return stamp.slice(0, 10);
}

function table(headers, rows) {
  return [`| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');
}

function empty() {
  return ['# Factory performance', '', 'No runs recorded yet.', ''].join('\n');
}

main();
