import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const paths = readSubmodulePaths();
const missing = paths.filter(isNotCheckedOut);

if (missing.length > 0) {
  console.error(`${missing.length} of ${paths.length} submodule(s) are empty on this runner:\n`);
  for (const path of missing) console.error(`  ${path}`);
  console.error('\nWithout them Nx sees no projects and every target passes without running.');
  console.error('Give actions/checkout `submodules: recursive` and a token that can read them.');
  process.exit(1);
}

console.log(`All ${paths.length} submodule(s) are checked out.`);

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
