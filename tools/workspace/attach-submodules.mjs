import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..', '..');
const DEFAULT_BRANCH = 'main';

function git(directory, ...args) {
  return execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function succeeds(directory, ...args) {
  try {
    git(directory, ...args);
    return true;
  } catch {
    return false;
  }
}

function readSubmodules() {
  const listing = git(rootDir, 'config', '-f', '.gitmodules', '--get-regexp', '^submodule\\..*\\.path$');
  return listing.split('\n').map((line) => {
    const [key, path] = line.split(' ');
    const name = key.slice('submodule.'.length, -'.path'.length);
    const branch = succeeds(rootDir, 'config', '-f', '.gitmodules', `submodule.${name}.branch`)
      ? git(rootDir, 'config', '-f', '.gitmodules', `submodule.${name}.branch`)
      : DEFAULT_BRANCH;
    return { name, path, branch };
  });
}

function keepOnBranchDuringUpdate(name) {
  git(rootDir, 'config', `submodule.${name}.update`, 'merge');
}

function attach({ path, branch }) {
  const directory = join(rootDir, path);
  if (!existsSync(join(directory, '.git'))) return;
  if (succeeds(directory, 'symbolic-ref', '-q', 'HEAD')) return;
  if (!succeeds(directory, 'rev-parse', '--verify', `refs/heads/${branch}`)) {
    git(directory, 'checkout', '-b', branch);
    console.log(`attached ${path} to new branch ${branch}`);
    return;
  }
  if (succeeds(directory, 'merge-base', '--is-ancestor', branch, 'HEAD')) {
    git(directory, 'checkout', '-B', branch, 'HEAD');
    console.log(`attached ${path} to ${branch}`);
    return;
  }
  console.warn(`${path} is detached and ${branch} has diverged: left untouched`);
}

for (const submodule of readSubmodules()) {
  keepOnBranchDuringUpdate(submodule.name);
  attach(submodule);
}
