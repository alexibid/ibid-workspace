import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const requireClean = process.argv.includes('--clean');
const paths = readSubmodulePaths();
const missing = paths.filter(isNotCheckedOut);
const mergeModes = readMergeUpdateSubmodules();

if (missing.length > 0) {
  console.error(`${missing.length} of ${paths.length} submodule(s) are empty on this runner:\n`);
  for (const path of missing) console.error(`  ${path}`);
  console.error('\nWithout them Nx sees no projects and every target passes without running.');
  console.error('Give actions/checkout `submodules: recursive` and a token that can read them.');
  process.exit(1);
}

if (mergeModes.length > 0) {
  console.error(`Submodule update=merge in .gitmodules breaks shallow actions/checkout runs:\n`);
  for (const key of mergeModes) console.error(`  ${key}`);
  process.exit(1);
}

if (requireClean) {
  const dirty = findDirtySubmodules(paths);
  if (dirty.length > 0) {
    console.error(`${dirty.length} submodule(s) contain leftover modified, untracked or gitignored files:\n`);
    for (const { path, entries } of dirty) {
      console.error(`  ${path} (${entries.length} entries, showing up to 10):`);
      for (const entry of entries.slice(0, 10)) console.error(`    ${entry}`);
    }
    console.error("\nRun `git submodule foreach --recursive 'git reset --hard --quiet && git clean -ffdx --quiet'` after checkout.");
    process.exit(1);
  }
}

console.log(
  requireClean
    ? `All ${paths.length} submodule(s) are checked out and clean.`
    : `All ${paths.length} submodule(s) are checked out.`,
);

function findDirtySubmodules(submodulePaths) {
  return submodulePaths
    .map((path) => ({ path, entries: readDirtyEntries(path) }))
    .filter((item) => item.entries.length > 0);
}

function readDirtyEntries(path) {
  const output = execFileSync(
    'git',
    ['-C', path, 'status', '--porcelain', '--ignored'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  return output.split('\n').filter(Boolean);
}

function readMergeUpdateSubmodules() {
  try {
    const output = execFileSync(
      'git',
      ['config', '--file', '.gitmodules', '--get-regexp', '^submodule\\..*\\.update$'],
      { encoding: 'utf8' },
    );
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith(' merge'));
  } catch {
    return [];
  }
}

function readSubmodulePaths() {
  const output = execFileSync(
    'git',
    ['config', '--file', '.gitmodules', '--get-regexp', '^submodule\\..*\\.path$'],
    { encoding: 'utf8' },
  );
  return output.split('\n').filter(Boolean).map((line) => line.split(' ')[1]);
}

function isNotCheckedOut(path) {
  try {
    return readdirSync(path).length === 0;
  } catch {
    return true;
  }
}
