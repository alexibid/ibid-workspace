import { execFileSync, spawnSync } from 'node:child_process';

const MANIFEST = /(^|\/)package(-lock)?\.json$/;

const unstaged = readUnstagedManifests();
if (unstaged.length > 0) {
  console.error('These manifests differ from what is staged, so the commit cannot be checked:\n');
  for (const path of unstaged) console.error(`  ${path}`);
  console.error('\nStage them, or restore them, and commit again.');
  process.exit(1);
}

const install = spawnSync('npm', ['ci', '--dry-run', '--no-audit', '--no-fund', '--loglevel=error'], {
  encoding: 'utf8',
});

if (install.status !== 0) {
  console.error(install.stderr.trim());
  console.error('\npackage-lock.json does not match the package.json files, so `npm ci` fails in CI.');
  console.error('Run `npm install --package-lock-only`, stage package-lock.json and commit again.');
  process.exit(1);
}

console.log('package-lock.json matches every package.json; `npm ci` will install it.');

function readUnstagedManifests() {
  const output = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' });
  return output.split('\n').filter((path) => MANIFEST.test(path));
}
