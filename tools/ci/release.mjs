import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LOG_FORMAT, parseCommits, renderChangelogEntry, resolveSpecifier } from './conventional-commits.mjs';

const RELEASE_FILES = ['package.json', 'CHANGELOG.md'];
const ORDERED_SPECIFIERS = ['major', 'minor', 'patch'];

const isDryRun = process.argv.includes('--dry-run');

const submodulePaths = readSubmodulePaths();
const projects = readReleasableProjects();
const plans = planReleases();

if (plans.length === 0) {
  console.log('No releasable commit since the last tag of any project.');
  process.exit(0);
}

applyVersions();
for (const plan of plans) writeChangelog(plan);

const pending = projects.filter(isPending);
for (const project of pending.filter(isSubmodule)) publishSubmodule(project);
publishContainer(pending);

console.log(`\nReleased ${pending.map(describe).join(', ')}.`);

function planReleases() {
  const planned = [];

  for (const project of projects) {
    const commits = readOwnCommits(project);
    const specifier = resolveSpecifier(commits);
    if (!specifier) continue;

    console.log(`${project.name}: ${specifier} from ${commits.length} commit(s) of its own history`);
    planned.push({ project, specifier, commits });
  }

  return planned;
}

function applyVersions() {
  for (const specifier of ORDERED_SPECIFIERS) {
    const names = plans.filter((plan) => plan.specifier === specifier).map((plan) => plan.project.name);
    if (names.length === 0) continue;

    runInherited('npx', [
      'nx',
      'release',
      'version',
      `--projects=${names.join(',')}`,
      specifier,
      ...(isDryRun ? ['--dry-run'] : []),
    ]);
  }
}

function writeChangelog(plan) {
  const version = readVersion(plan.project);
  const file = join(plan.project.root, 'CHANGELOG.md');
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : '';

  announce(`write ${file} for v${version}`);
  if (!isDryRun) writeFileSync(file, `${renderChangelogEntry(version, plan.commits)}\n${existing}`);
}

function publishSubmodule(project) {
  const version = `v${readVersion(project)}`;
  console.log(`\n▶ ${project.name} · ${project.root}`);

  if (hasUnreleasedFiles(project)) {
    stage(project.root, releaseFilesOf(project));
    commit(project.root, `chore(release): ${version}`);
  }

  const refspecs = ['origin', 'HEAD:refs/heads/main'];
  if (!tagExistsIn(project.root, version)) {
    tag(project.root, version);
    refspecs.push(`refs/tags/${version}`);
  }

  push(project.root, refspecs);
}

function publishContainer(released) {
  console.log(`\n▶ container · recording ${released.length} project(s)`);

  stage('.', released.map((project) => project.root));
  commit('.', `chore(release): ${released.map(describe).join(', ')}`);

  const refspecs = ['origin', 'HEAD:refs/heads/main'];
  for (const project of released) {
    const name = containerTag(project);
    if (tagExistsIn('.', name)) continue;
    tag('.', name);
    refspecs.push(`refs/tags/${name}`);
  }

  push('.', refspecs);
}

function readOwnCommits(project) {
  const since = lastVersionTag(project);
  const range = since ? [`${since}..HEAD`] : [];
  const args = isSubmodule(project)
    ? ['-C', project.root, 'log', LOG_FORMAT, ...range]
    : ['log', LOG_FORMAT, ...range, '--', project.root];

  return parseCommits(runSilent('git', args));
}

function lastVersionTag(project) {
  const [root, pattern] = isSubmodule(project) ? [project.root, 'v*'] : ['.', `${project.name}-v*`];

  try {
    return runSilent('git', ['-C', root, 'describe', '--tags', '--abbrev=0', '--match', pattern]).trim();
  } catch {
    return undefined;
  }
}

function isPending(project) {
  return hasUnreleasedFiles(project) || !tagExistsIn('.', containerTag(project));
}

function isSubmodule(project) {
  return submodulePaths.has(project.root);
}

function containerTag(project) {
  return `${project.name}-v${readVersion(project)}`;
}

function describe(project) {
  return `${project.name} v${readVersion(project)}`;
}

function releaseFilesOf(project) {
  return RELEASE_FILES.filter((file) => existsSync(join(project.root, file)));
}

function hasUnreleasedFiles(project) {
  const files = releaseFilesOf(project);
  if (files.length === 0) return false;

  const status = isSubmodule(project)
    ? runSilent('git', ['-C', project.root, 'status', '--porcelain', '--', ...files])
    : runSilent('git', ['status', '--porcelain', '--', ...files.map((file) => join(project.root, file))]);

  return status.trim().length > 0;
}

function readReleasableProjects() {
  const file = join(tmpdir(), `ibid-graph-${process.pid}.json`);

  try {
    runSilent('npx', ['nx', 'graph', `--file=${file}`]);
    const { nodes } = JSON.parse(readFileSync(file, 'utf8')).graph;
    return Object.values(nodes)
      .map((node) => ({ name: node.name, root: node.data.root }))
      .filter((project) => existsSync(join(project.root, 'package.json')))
      .sort((a, b) => a.name.localeCompare(b.name));
  } finally {
    rmSync(file, { force: true });
  }
}

function readSubmodulePaths() {
  if (!existsSync('.gitmodules')) return new Set();

  const pattern = '^submodule\\..*\\.path$';
  const output = runSilent('git', ['config', '--file', '.gitmodules', '--get-regexp', pattern]);
  return new Set(output.split('\n').filter(Boolean).map((line) => line.split(' ')[1]));
}

function readVersion(project) {
  return JSON.parse(readFileSync(join(project.root, 'package.json'), 'utf8')).version;
}

function tagExistsIn(root, name) {
  return runSilent('git', ['-C', root, 'tag', '--list', name]).trim() === name;
}

function stage(root, paths) {
  if (paths.length === 0) return;
  announce(`git -C ${root} add ${paths.join(' ')}`);
  if (!isDryRun) runSilent('git', ['-C', root, 'add', '--', ...paths]);
}

function commit(root, message) {
  announce(`git -C ${root} commit -m "${message}"`);
  if (!isDryRun) runSilent('git', ['-C', root, 'commit', '--no-verify', '-m', message]);
}

function tag(root, name) {
  announce(`git -C ${root} tag ${name}`);
  if (!isDryRun) runSilent('git', ['-C', root, 'tag', '-a', name, '-m', name]);
}

function push(root, refspecs) {
  announce(`git -C ${root} push ${refspecs.join(' ')}`);
  if (!isDryRun) runSilent('git', ['-C', root, 'push', ...refspecs]);
}

function announce(command) {
  console.log(`  ${isDryRun ? '[dry-run] ' : ''}${command}`);
}

function runSilent(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function runInherited(command, args) {
  execFileSync(command, args, { stdio: 'inherit', env: { ...process.env, HUSKY: '0' } });
}
