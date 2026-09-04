import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SUMMARY = /✖ (\d+) problems? \((\d+) errors?, (\d+) warnings?\)/g;
const ANSI = /\[[0-9;]*m/g;

const budget = JSON.parse(readFileSync('tools/ci/lint-budget.json', 'utf8')).maxWarnings;
const { errors, warnings } = countProblems(runLint());

console.log(`\nLint budget: ${warnings} warning(s) against a ceiling of ${budget}, ${errors} error(s).`);

if (errors > 0) {
  console.error('Lint reported errors. Errors always fail the build.');
  process.exit(1);
}

if (warnings > budget) {
  console.error(`This change adds ${warnings - budget} warning(s) over the ceiling. Fix them.`);
  process.exit(1);
}

if (warnings < budget) {
  console.log(`Lower the ceiling to ${warnings} in tools/ci/lint-budget.json.`);
}

function runLint() {
  const result = spawnSync(
    'npx',
    ['nx', 'run-many', '-t', 'lint', '--all', '--output-style=stream'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);
  return output;
}

function countProblems(output) {
  const plain = output.replace(ANSI, '');
  let errors = 0;
  let warnings = 0;

  for (const [, , foundErrors, foundWarnings] of plain.matchAll(SUMMARY)) {
    errors += Number(foundErrors);
    warnings += Number(foundWarnings);
  }

  return { errors, warnings };
}
