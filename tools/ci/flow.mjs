import { execFileSync } from 'node:child_process';

import { elapsedSeconds, formatSeconds, toolTotals } from './tool-time.mjs';

const REPO = 'alexibid/ibid-workspace';

const ICONS = {
  success: '\x1b[32m✔\x1b[0m',
  failure: '\x1b[31m✖\x1b[0m',
  cancelled: '\x1b[90m⊘\x1b[0m',
  skipped: '\x1b[90m·\x1b[0m',
  in_progress: '\x1b[33m▸\x1b[0m',
  queued: '\x1b[90m…\x1b[0m',
  pending: '\x1b[90m…\x1b[0m',
};

const watching = process.argv.includes('--watch');
const forXbar = process.argv.includes('--xbar');
const expanded = process.argv.includes('--steps');
const jobCache = new Map();

if (forXbar) {
  renderForXbar();
} else {
  await render();
}

while (watching) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  process.stdout.write('\x1b[2J\x1b[H');
  await render();
}

async function render() {
  jobCache.clear();
  const runs = api('/actions/runs?per_page=40').workflow_runs;
  const chain = buildChain(runs);

  console.log(`\x1b[1mibid-workspace\x1b[0m · ${new Date().toLocaleTimeString('pt-PT')}\n`);

  if (chain.length === 0) {
    console.log('Nenhuma execução recente.');
    return;
  }

  for (const run of chain) printRun(run);
  printTools(chain.flatMap(jobsOf));
  printTotals(chain);
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
  const wait = waiting > 30 ? `  ${dim(`fila ${formatSeconds(waiting)}`)}` : '';

  console.log(`${ICONS[state] ?? '?'} \x1b[1m${label}\x1b[0m  ${formatSeconds(running)}${wait}`);

  jobs.forEach((job, index) => {
    const last = index === jobs.length - 1;
    const jobState = job.conclusion ?? job.status;
    const runner = job.runner_name === 'MAC ALEX' ? dim('mac') : dim(job.runner_name ? 'github' : '—');
    console.log(
      `  ${last ? '└─' : '├─'} ${ICONS[jobState] ?? '?'} ${job.name.padEnd(38)} ${elapsed(job).padStart(8)}  ${runner}`,
    );
    if (expanded) printJobTools(job, last ? '     ' : '  │  ');
  });

  console.log();
}

function printJobTools(job, indent) {
  for (const [tool, spent] of toolTotals([job])) {
    console.log(dim(`${indent}${tool.padEnd(12)} ${formatSeconds(spent).padStart(8)}`));
  }
}

function printTools(jobs) {
  const totals = toolTotals(jobs);
  if (totals.length === 0) return;

  const spent = totals.reduce((sum, [, seconds]) => sum + seconds, 0);
  console.log('\x1b[1mPor ferramenta\x1b[0m');

  for (const [tool, seconds] of totals) {
    const share = seconds / spent;
    const bar = '█'.repeat(Math.max(1, Math.round(share * 24)));
    const percent = `${Math.round(share * 100)}%`.padStart(4);
    console.log(`  ${tool.padEnd(12)} ${formatSeconds(seconds).padStart(8)}  ${dim(bar)} ${dim(percent)}`);
  }

  console.log();
}

function printTotals(chain) {
  const spent = chain.reduce(
    (total, run) => total + jobsOf(run).reduce((sum, job) => sum + jobSeconds(job), 0),
    0,
  );
  const billed = chain.reduce((total, run) => total + billedMinutes(run), 0);
  console.log(`${dim('total')} ${formatSeconds(spent)}   ${dim('faturado')} ${billed} min`);
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
  return end ? formatSeconds(elapsedSeconds(start, end)) : dim('a correr');
}

function dim(text) {
  return `\x1b[90m${text}\x1b[0m`;
}

function api(path) {
  return JSON.parse(
    execFileSync('gh', ['api', `/repos/${REPO}${path}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }),
  );
}

function renderForXbar() {
  jobCache.clear();
  const runs = api('/actions/runs?per_page=20').workflow_runs;
  const active = runs.filter((run) => run.status !== 'completed');

  if (active.length === 0) {
    console.log('○ Sem execuções · em repouso | size=11 color=#8b949e');
    return;
  }

  const running = active.find((run) => run.status === 'in_progress') ?? active[0];
  const label = running.name === 'Release' ? `Release ${running.head_branch}` : running.name;
  const waiting = active.length - 1;
  const queue = waiting > 0 ? ` · ${waiting} em fila` : '';
  const jobs = jobsOf(running);

  console.log(`⟳ ${label}${queue} | size=11 color=#d29922`);

  for (const job of jobs) {
    const state = job.conclusion ?? job.status;
    const mark = state === 'success' ? '✔' : state === 'failure' ? '✖' : state === 'in_progress' ? '▸' : '·';
    const time = job.completed_at ? formatSeconds(jobSeconds(job)) : state === 'in_progress' ? 'a correr' : '—';
    console.log(`-- ${mark} ${shorten(job.name)}  ${time} | size=11 font=Menlo`);
  }

  const totals = toolTotals(jobs).slice(0, 4);
  if (totals.length === 0) return;

  console.log('-----');
  const split = totals.map(([tool, spent]) => `${tool} ${formatSeconds(spent)}`).join(' · ');
  console.log(`-- ${split} | size=10 color=#8b949e font=Menlo`);
}

function shorten(name) {
  return name.split(' · ').pop().slice(0, 26);
}
