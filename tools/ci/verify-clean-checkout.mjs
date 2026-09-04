import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const GATES = [
  { name: 'Lint', command: 'node', args: ['tools/ci/lint-budget.mjs'] },
  { name: 'Types', command: 'npx', args: ['nx', 'run-many', '-t', 'typecheck', '--all'] },
  { name: 'Build', command: 'npx', args: ['nx', 'run-many', '-t', 'build', '--all'] },
  { name: 'Unit tests', command: 'npx', args: ['nx', 'run-many', '-t', 'test', '--all'] },
];

const checkout = stageCommittableFiles();
console.log(`Clean checkout staged in ${checkout}\n`);

install(checkout);
const failures = runGates(checkout);

report(failures, checkout);
process.exit(failures.length === 0 ? 0 : 1);

function stageCommittableFiles() {
  const files = listCommittableFiles();
  const destination = mkdtempSync(join(tmpdir(), 'ibid-clean-'));

  for (const file of files) {
    const target = join(destination, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(file), target);
  }

  console.log(`${files.length} file(s) copied, exactly what a fresh clone would carry.`);
  return destination;
}

function listCommittableFiles() {
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return output.split('\0').filter(Boolean);
}

function install(cwd) {
  console.log('Installing dependencies...');
  const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], {
    cwd,
    stdio: 'inherit',
  });

  if (result.status !== 0) throw new Error('npm ci failed on the clean checkout.');
}

function runGates(cwd) {
  const failures = [];

  for (const gate of GATES) {
    console.log(`\n──── ${gate.name} ────`);
    const result = spawnSync(gate.command, gate.args, { cwd, stdio: 'inherit' });
    if (result.status !== 0) failures.push(gate.name);
  }

  return failures;
}

function report(failures, checkout) {
  if (failures.length === 0) {
    rmSync(checkout, { recursive: true, force: true });
    console.log('\nEvery gate passed on a clean checkout.');
    return;
  }

  console.error(`\nFailed on a clean checkout: ${failures.join(', ')}`);
  console.error(`The checkout was kept at ${checkout} so you can reproduce it there.`);
}
