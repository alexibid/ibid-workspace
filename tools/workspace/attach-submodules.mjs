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

function clearSubmoduleUpdateMode(name) {
  if (succeeds(rootDir, 'config', '--local', '--get', `submodule.${name}.update`)) {
    git(rootDir, 'config', '--local', '--unset-all', `submodule.${name}.update`);
  }
}

function moveBranchToPinned(directory, path, branch) {
  git(directory, 'checkout', '-B', branch, 'HEAD');
  console.log(`attached ${path} to ${branch} at the pinned commit`);
}

function returnToBranchAhead(directory, path, branch) {
  git(directory, 'checkout', branch);
  console.log(`attached ${path} to ${branch}, which is ahead of the pinned commit: bump it in the workspace`);
}

function mergePinnedIntoBranch(directory, path, branch) {
  const pinned = git(directory, 'rev-parse', 'HEAD');
  git(directory, 'checkout', branch);
  try {
    git(directory, 'merge', '--no-edit', pinned);
    console.log(`attached ${path} to ${branch} and merged the pinned commit ${pinned.slice(0, 7)}`);
  } catch {
    git(directory, 'merge', '--abort');
    console.warn(
      `attached ${path} to ${branch}, but merging the pinned commit ${pinned.slice(0, 7)} conflicts: ` +
        `run "git merge ${pinned.slice(0, 7)}" in ${path} and resolve it`
    );
  }
}

function reattach(directory, path, branch) {
  if (!succeeds(directory, 'rev-parse', '--verify', `refs/heads/${branch}`)) {
    git(directory, 'checkout', '-b', branch);
    console.log(`attached ${path} to new branch ${branch}`);
  } else if (succeeds(directory, 'merge-base', '--is-ancestor', branch, 'HEAD')) {
    moveBranchToPinned(directory, path, branch);
  } else if (succeeds(directory, 'merge-base', '--is-ancestor', 'HEAD', branch)) {
    returnToBranchAhead(directory, path, branch);
  } else {
    mergePinnedIntoBranch(directory, path, branch);
  }
}

function attach({ path, branch }) {
  const directory = join(rootDir, path);
  if (!existsSync(join(directory, '.git'))) return;
  if (succeeds(directory, 'symbolic-ref', '-q', 'HEAD')) return;
  try {
    reattach(directory, path, branch);
  } catch (error) {
    console.error(`${path} is still detached: ${error.stderr?.trim() || error.message}`);
    process.exitCode = 1;
  }
}

function attachEverySubmodule() {
  if (!existsSync(join(rootDir, '.git'))) {
    console.log('not a git checkout, so there is no submodule to attach');
    return;
  }
  const submodules = readSubmodules();
  for (const submodule of submodules) {
    clearSubmoduleUpdateMode(submodule.name);
  }
  if (process.env['CI']) return;
  git(rootDir, 'config', '--local', 'push.recurseSubmodules', 'on-demand');
  for (const submodule of submodules) {
    attach(submodule);
  }
}

attachEverySubmodule();
