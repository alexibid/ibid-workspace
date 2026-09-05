import { execSync } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const rootDir = resolve(process.cwd());
const parentDir = resolve(rootDir, '..');

const action = process.argv[2] ?? 'help';
const appName = process.argv[3];
const branchName = process.argv[4];

const ALL_TARGETS = [
  { name: 'oh-save-me', type: 'app', path: 'apps/oh-save-me', sparse: ['apps/oh-save-me', 'libs', 'tools'] },
  { name: 'camila', type: 'app', path: 'apps/camila', sparse: ['apps/camila', 'libs', 'tools'] },
  { name: 'boilerplate', type: 'app', path: 'apps/boilerplate', sparse: ['apps/boilerplate', 'libs', 'tools'] },
  { name: 'ibid-ui', type: 'lib', path: 'libs/ibid-ui', sparse: ['libs/ibid-ui', 'libs/utils', 'tools'] },
  { name: 'services', type: 'lib', path: 'libs/services', sparse: ['libs/services', 'libs/utils', 'tools'] },
  { name: 'testing', type: 'lib', path: 'libs/testing', sparse: ['libs/testing', 'libs/utils', 'tools'] },
  { name: 'utils', type: 'lib', path: 'libs/utils', sparse: ['libs/utils', 'tools'] },
  { name: 'tools', type: 'tool', path: 'tools', sparse: ['tools'] },
];

switch (action) {
  case 'create':
  case 'worktree':
    if (appName === 'all') {
      createAll();
    } else {
      createWorktree(appName, branchName);
    }
    break;
  case 'create-all':
    createAll();
    break;
  case 'merge':
    mergeBranch(appName);
    break;
  case 'merge-all':
    mergeAll();
    break;
  case 'list':
    listWorktrees();
    break;
  case 'remove':
    if (appName === 'all') {
      removeAll();
    } else {
      removeTarget(appName);
    }
    break;
  case 'remove-all':
    removeAll();
    break;
  default:
    printHelp();
}

function createAll() {
  console.log(`Setting up isolated worktrees for all ${ALL_TARGETS.length} components...\n`);
  for (const target of ALL_TARGETS) {
    createWorktree(target.name);
  }
  console.log('\n✔ All isolated worktrees are ready!');
}

function removeAll() {
  console.log(`Removing all isolated worktrees...\n`);
  for (const target of ALL_TARGETS) {
    removeTarget(target.name);
  }
  console.log('\n✔ All isolated worktrees removed.');
}

function createWorktree(targetName, customBranch) {
  if (!targetName) {
    console.error('Error: target name is required. Usage: node tools/workspace/worktree.mjs create <name> [branch]');
    process.exit(1);
  }

  const targetConfig = ALL_TARGETS.find((t) => t.name === targetName);
  if (!targetConfig) {
    console.error(`Error: target "${targetName}" is not recognized. Available: ${ALL_TARGETS.map((t) => t.name).join(', ')}`);
    process.exit(1);
  }

  const targetDir = join(parentDir, targetName);
  if (existsSync(targetDir)) {
    console.log(`[skip] Worktree directory already exists at: ${targetDir}`);
    return;
  }

  const branch = customBranch || targetName;
  console.log(`Creating isolated worktree for "${targetName}" (${targetConfig.type}) at: ${targetDir}`);
  console.log(`Target branch: ${branch}`);

  const branchExists = doesBranchExist(branch);
  if (branchExists) {
    git(`worktree add "${targetDir}" "${branch}"`);
  } else {
    git(`worktree add -b "${branch}" "${targetDir}" main`);
  }

  console.log(`Applying sparse-checkout for ${targetName}...`);
  git(`-C "${targetDir}" sparse-checkout init --cone`);
  git(`-C "${targetDir}" sparse-checkout set ${targetConfig.sparse.join(' ')}`);

  const targetNodeModules = join(targetDir, 'node_modules');
  const sourceNodeModules = join(rootDir, 'node_modules');
  if (!existsSync(targetNodeModules) && existsSync(sourceNodeModules)) {
    symlinkSync(sourceNodeModules, targetNodeModules, 'dir');
  }

  console.log(`✔ Worktree "${targetName}" ready!`);
}

function listWorktrees() {
  console.log('=== Isolated Components in ~/Projects ===\n');

  for (const target of ALL_TARGETS) {
    const targetDir = join(parentDir, target.name);
    if (existsSync(join(targetDir, '.git'))) {
      try {
        const branch = execSync(`git -C "${targetDir}" branch --show-current`, { encoding: 'utf8' }).trim();
        console.log(`• ${target.name.padEnd(14)} [branch: ${branch}] (${target.type}) -> ${targetDir}`);
      } catch {
        console.log(`• ${target.name.padEnd(14)} active at ${targetDir}`);
      }
    }
  }

  console.log('\n=== Raw Git Worktree List ===\n');
  try {
    const output = git('worktree list');
    console.log(output);
  } catch {
    console.log('None.');
  }
}

function mergeBranch(branch) {
  if (!branch) {
    console.error('Error: branch name is required. Usage: node tools/workspace/worktree.mjs merge <name>');
    process.exit(1);
  }
  console.log(`\n▶ Integrating branch "${branch}" into workspace main...`);
  const currentBranch = git('branch --show-current').trim();
  if (currentBranch !== 'main') {
    git('checkout main');
  }
  if (!doesBranchExist(branch)) {
    console.error(`✖ Branch "${branch}" does not exist.`);
    return;
  }
  const commitsAhead = git(`log HEAD..${branch} --oneline`).trim();
  if (!commitsAhead) {
    console.log(`• Branch "${branch}" has no new commits to merge.`);
    return;
  }
  const count = commitsAhead.split('\n').length;
  console.log(`Merging ${count} commit(s) from "${branch}"...`);
  try {
    git(`merge "${branch}" --no-edit`);
    console.log(`✔ Successfully merged "${branch}" into main!`);
  } catch (err) {
    console.error(`✖ Merge conflict detected while merging "${branch}". Please resolve in GitHub Desktop.`);
    return;
  }
}

function mergeAll() {
  console.log('\n=== Integrating all active worktree branches into workspace main ===\n');
  const currentBranch = git('branch --show-current').trim();
  if (currentBranch !== 'main') {
    git('checkout main');
  }
  let merged = 0;
  for (const target of ALL_TARGETS) {
    if (doesBranchExist(target.name)) {
      const commitsAhead = git(`log HEAD..${target.name} --oneline`).trim();
      if (commitsAhead) {
        const count = commitsAhead.split('\n').length;
        console.log(`▶ Merging ${target.name} (${count} commit(s))...`);
        try {
          git(`merge "${target.name}" --no-edit`);
          console.log(`  ✔ Merged ${target.name} successfully.`);
          merged++;
        } catch (err) {
          console.error(`  ✖ Conflict in ${target.name}. Please resolve in GitHub Desktop.`);
          break;
        }
      } else {
        console.log(`• ${target.name.padEnd(14)}: up to date.`);
      }
    }
  }
  if (merged > 0) {
    console.log(`\n✔ Merged ${merged} branch(es) into main.`);
  } else {
    console.log('\nAll branches were already up to date with main.');
  }
}

function removeTarget(name) {
  if (!name) {
    console.error('Error: name is required. Usage: node tools/workspace/worktree.mjs remove <name>');
    process.exit(1);
  }

  const targetDir = join(parentDir, name);
  if (!existsSync(targetDir)) {
    return;
  }

  console.log(`Removing worktree: ${targetDir}...`);
  try {
    git(`worktree remove "${targetDir}" --force`);
  } catch {
    execSync(`rm -rf "${targetDir}"`);
  }
  console.log(`✔ "${name}" removed successfully.`);
}

function doesBranchExist(branch) {
  try {
    git(`rev-parse --verify "${branch}"`);
    return true;
  } catch {
    return false;
  }
}

function git(command) {
  return execSync(`git ${command}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function printHelp() {
  console.log(`
Workspace Worktree Manager:
  node tools/workspace/worktree.mjs create <name> [branch]
  node tools/workspace/worktree.mjs create-all
  node tools/workspace/worktree.mjs list
  node tools/workspace/worktree.mjs merge <name>
  node tools/workspace/worktree.mjs merge-all
  node tools/workspace/worktree.mjs remove <name>
  node tools/workspace/worktree.mjs remove-all

Available components:
  Apps:  oh-save-me, camila, boilerplate
  Libs:  ibid-ui, services, testing, utils
  Tools: tools
`);
}
