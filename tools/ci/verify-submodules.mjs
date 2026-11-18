import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

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

console.log(`All ${paths.length} submodule(s) are checked out.`);

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
