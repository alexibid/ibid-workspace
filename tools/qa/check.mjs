import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describeScope, parseOptions } from './options.mjs';
import { discoverProjects, runTarget } from './tasks.mjs';
import { renderSummary } from './report.mjs';

const LOG_ROOT = 'test-results/qa';
const LAST_RUN = join(LOG_ROOT, 'last');
const KEPT_RUNS = 10;

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const startedAt = Date.now();

  const runDirectory = prepareLogDirectory();

  const results = [];
  const skipped = [];
  let halted = false;

  for (const tier of options.tiers) {
    if (halted) {
      skipped.push({ tier: tier.name, reason: 'earlier tier failed' });
      continue;
    }

    results.push(...(await runTier(tier, options, runDirectory)));
    halted = options.stopOnFailure && results.some((result) => result.failed.length > 0);
  }

  const summary = renderSummary({
    results,
    skipped,
    scope: describeScope(options),
    durationMs: Date.now() - startedAt,
  });

  const summaryFile = join(runDirectory, 'summary.md');
  const lastRunLogFile = join(runDirectory, 'last-run.log');
  writeFileSync(summaryFile, `${summary}\n`);
  writeFileSync(lastRunLogFile, `${summary}\n`);
  console.log(summary);

  process.exit(results.some((result) => result.failed.length > 0) ? 1 : 0);
}

async function runTier(tier, options, runDirectory) {
  const outcomes = [];

  for (const target of tier.targets) {
    const projects = discoverProjects(target, options);
    if (projects.length === 0) continue;

    process.stdout.write(`▶ Running ${target} across ${projects.length} project(s): ${projects.join(', ')}...\n`);

    const outcome = await runTarget({
      target,
      projects,
      parallel: tier.serial ? 1 : options.parallel,
      directory: runDirectory,
      spec: options.spec,
    });

    const statusIcon = outcome.failed.length === 0 ? '✔' : '✖';
    const duration = (outcome.durationMs / 1000).toFixed(1);
    process.stdout.write(`  ${statusIcon} ${target} completed in ${duration}s (${outcome.failed.length === 0 ? 'passed' : `failed: ${outcome.failed.join(', ')}`})\n\n`);

    outcomes.push(outcome);
  }

  return outcomes;
}

function prepareLogDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDirectory = join(LOG_ROOT, timestamp);

  mkdirSync(runDirectory, { recursive: true });

  try {
    if (existsSync(LAST_RUN) || lstatSafe(LAST_RUN)) {
      unlinkSync(LAST_RUN);
    }
  } catch {
    rmSync(LAST_RUN, { force: true, recursive: true });
  }

  symlinkSync(timestamp, LAST_RUN, 'dir');

  mkdirSync('test-results', { recursive: true });
  writeFileSync(join(runDirectory, 'last-run.log'), '');

  const lastRunSymlink = 'test-results/last-run.log';
  try {
    if (existsSync(lastRunSymlink) || lstatSafe(lastRunSymlink)) {
      unlinkSync(lastRunSymlink);
    }
  } catch {
    rmSync(lastRunSymlink, { force: true });
  }

  symlinkSync('qa/last/last-run.log', lastRunSymlink);
  prunePastRuns();

  return runDirectory;
}

function lstatSafe(path) {
  try {
    return Boolean(lstatSync(path));
  } catch {
    return false;
  }
}

function prunePastRuns() {
  const entries = readdirSync(LOG_ROOT, { withFileTypes: true });
  const runs = entries
    .filter((entry) => entry.isDirectory() && entry.name !== 'last')
    .map((entry) => entry.name)
    .sort();

  for (const stale of runs.slice(0, -KEPT_RUNS)) {
    rmSync(join(LOG_ROOT, stale), { force: true, recursive: true });
  }
}
