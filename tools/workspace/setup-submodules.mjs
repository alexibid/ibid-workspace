import { execSync } from 'node:child_process';
import { existsSync, cpSync, rmSync, renameSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { buildPackageGitignore } from './package-gitignore.mjs';

const rootDir = resolve(process.cwd());
const targetArg = process.argv[2] || 'oh-save-me';

const SUBMODULES = [
  {
    name: 'oh-save-me',
    path: 'apps/oh-save-me',
    repo: 'https://github.com/alexibid/oh-save-me.git',
  },
  {
    name: 'boilerplate',
    path: 'apps/boilerplate',
    repo: 'https://github.com/alexibid/boilerplate.git',
  },
  { name: 'papikapi', path: 'apps/papikapi', repo: 'https://github.com/alexibid/papikapi.git' },
  { name: 'ibid-ui', path: 'libs/ibid-ui', repo: 'https://github.com/alexibid/ibid-ui.git' },
  { name: 'services', path: 'libs/services', repo: 'https://github.com/alexibid/services.git' },
  { name: 'testing', path: 'libs/testing', repo: 'https://github.com/alexibid/testing.git' },
  { name: 'utils', path: 'libs/utils', repo: 'https://github.com/alexibid/utils.git' },
];

function main() {
  const targets = targetArg === 'all' ? SUBMODULES : SUBMODULES.filter((s) => s.name === targetArg);

  if (targets.length === 0) {
    console.error(
      `Unknown target: ${targetArg}. Available: all, ${SUBMODULES.map((s) => s.name).join(', ')}`,
    );
    process.exit(1);
  }

  console.log(`Setting up Git Submodules for: ${targets.map((t) => t.name).join(', ')}...\n`);

  for (const target of targets) {
    setupSubmodule(target);
  }

  console.log('\n✔ Submodule configuration complete.');
}

function setupSubmodule(target) {
  const fullPath = join(rootDir, target.path);
  console.log(`▶ Processing "${target.name}" at ${target.path}...`);

  try {
    const status = git(`submodule status "${target.path}"`).trim();
    if (status) {
      console.log(`  • "${target.name}" is already a submodule.`);
      return;
    }
  } catch {}

  const backupDir = join(rootDir, 'tmp', 'submodule-backup', target.name);
  if (existsSync(fullPath)) {
    console.log(`  • Creating backup at tmp/submodule-backup/${target.name}...`);
    mkdirSync(backupDir, { recursive: true });
    cpSync(fullPath, backupDir, { recursive: true });
  }

  console.log(`  • Untracking "${target.path}" from parent repository...`);
  try {
    git(`rm -r --cached "${target.path}"`);
  } catch (err) {
    console.log(`  (Untrack note: ${err.message.split('\n')[0]})`);
  }

  const tempPath = `${fullPath}.tmp`;
  if (existsSync(fullPath)) {
    if (existsSync(tempPath)) rmSync(tempPath, { recursive: true, force: true });
    renameSync(fullPath, tempPath);
  }

  console.log(`  • Adding submodule from ${target.repo}...`);
  try {
    git(`submodule add -b main "${target.repo}" "${target.path}"`);
  } catch (err) {
    console.error(`  ✖ Failed to add submodule: ${err.message}`);
    if (existsSync(tempPath)) {
      renameSync(tempPath, fullPath);
    }
    return;
  }

  if (existsSync(backupDir)) {
    console.log(`  • Synchronizing local files into submodule...`);
    cpSync(backupDir, fullPath, { recursive: true });
  }

  if (existsSync(tempPath)) {
    rmSync(tempPath, { recursive: true, force: true });
  }

  writePackageGitignore(fullPath);

  console.log(`  ✔ Submodule "${target.name}" is ready!`);
}

function writePackageGitignore(packageRoot) {
  const gitignore = join(packageRoot, '.gitignore');
  if (existsSync(gitignore)) return;

  writeFileSync(gitignore, buildPackageGitignore(packageRoot));
}

function git(command) {
  return execSync(`git ${command}`, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

main();
