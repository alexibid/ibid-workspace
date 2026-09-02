#!/usr/bin/env node
import { mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describeScope, parseOptions } from './options.mjs';
import { discoverProjects, runTarget } from './tasks.mjs';
import { renderSummary } from './report.mjs';

const LOG_ROOT = 'tmp/qa';
const LAST_RUN = join(LOG_ROOT, 'last');
const KEPT_RUNS = 10;

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const startedAt = Date.now();

  prepareLogDirectory();

  const results = [];
  const skipped = [];
  let halted = false;

  for (const tier of options.tiers) {
    if (halted) {
      skipped.push({ tier: tier.name, reason: 'earlier tier failed' });
      continue;
    }

    results.push(...(await runTier(tier, options)));
    halted = options.stopOnFailure && results.some((result) => result.failed.length > 0);
  }

  const summary = renderSummary({
    results,
    skipped,
    scope: describeScope(options),
    durationMs: Date.now() - startedAt,
  });

  writeFileSync(join(LAST_RUN, 'summary.md'), `${summary}\n`);
  console.log(summary);

  process.exit(results.some((result) => result.failed.length > 0) ? 1 : 0);
}

async function runTier(tier, options) {
  const outcomes = [];

  for (const target of tier.targets) {
    const projects = discoverProjects(target, options);
    if (projects.length === 0) continue;

    outcomes.push(
      await runTarget({
        target,
        projects,
        parallel: tier.serial ? 1 : options.parallel,
        directory: LAST_RUN,
      })
    );
  }

  return outcomes;
}

function prepareLogDirectory() {
  const runDirectory = join(LOG_ROOT, new Date().toISOString().replace(/[:.]/g, '-'));

  mkdirSync(runDirectory, { recursive: true });
  rmSync(LAST_RUN, { force: true, recursive: true });
  symlinkSync(runDirectory.replace(`${LOG_ROOT}/`, ''), LAST_RUN, 'dir');
  prunePastRuns();
}

function prunePastRuns() {
  const runs = readdirSync(LOG_ROOT)
    .filter((entry) => entry !== 'last')
    .sort();

  for (const stale of runs.slice(0, -KEPT_RUNS)) {
    rmSync(join(LOG_ROOT, stale), { force: true, recursive: true });
  }
}
