import { execSync } from 'node:child_process';

const TARGETS = [
  { name: 'oh-save-me', prefix: 'apps/oh-save-me', repo: 'alexibid/oh-save-me' },
  { name: 'camila', prefix: 'apps/camila', repo: 'alexibid/camila' },
  { name: 'boilerplate', prefix: 'apps/boilerplate', repo: 'alexibid/boilerplate' },
  { name: 'ibid-ui', prefix: 'libs/ibid-ui', repo: 'alexibid/ibid-ui' },
  { name: 'services', prefix: 'libs/services', repo: 'alexibid/services' },
  { name: 'testing', prefix: 'libs/testing', repo: 'alexibid/testing' },
  { name: 'utils', prefix: 'libs/utils', repo: 'alexibid/utils' },
  { name: 'tools', prefix: 'tools', repo: 'alexibid/tools' },
];

const REF_NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const MIRROR_BRANCH = 'main';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isPull = args.includes('--pull');
const skipTags = args.includes('--skip-tags');
const projectFilter = args.find((arg) => arg.startsWith('--project='))?.split('=')[1];
const sourceRef = readRefOption('--ref') ?? 'HEAD';
const targetBranch = readRefOption('--branch') ?? MIRROR_BRANCH;
const isMirror = targetBranch === MIRROR_BRANCH;

const selectedTargets = projectFilter
  ? TARGETS.filter((target) => projectFilter.split(',').includes(target.name))
  : TARGETS;

if (selectedTargets.length === 0) {
  console.error(`No matching targets found for filter: ${projectFilter}`);
  process.exit(1);
}

const token = process.env['SPLIT_TOKEN'] || process.env['RELEASE_TOKEN'] || process.env['GITHUB_TOKEN'] || getGhToken();

for (const target of selectedTargets) {
  assertPrefixIsFiles(target, sourceRef);
}

if (isPull) {
  console.log(`Starting Subtree Pull for ${selectedTargets.length} project(s)...`);
  for (const target of selectedTargets) {
    pullSubtree(target);
  }
} else {
  console.log(`Starting Monorepo Split for ${selectedTargets.length} project(s)...`);
  if (isDryRun) console.log('Mode: DRY RUN (no remote changes will be applied)\n');

  for (const target of selectedTargets) {
    splitAndPush(target);
  }
}

console.log('\n✔ All target operations completed successfully.');

function readRefOption(flag) {
  const raw = args.find((arg) => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  if (raw === undefined) return undefined;

  if (!REF_NAME.test(raw) || raw.includes('..')) {
    throw new Error(`${flag} accepts a git ref name only, received: ${raw}`);
  }

  return raw;
}

function assertPrefixIsFiles(target, ref) {
  const entry = git(`ls-tree ${ref} "${target.prefix}"`).trim();

  if (!entry) {
    throw new Error(`${target.prefix} does not exist at ${ref}, so there is nothing to split.`);
  }

  if (!entry.startsWith('160000')) return;

  throw new Error(
    `${target.prefix} is a git submodule at ${ref}, so its files are not in this history. ` +
      `A subtree split there resolves to the snapshot taken before the migration and would ` +
      `overwrite ${target.repo}, discarding every commit made there since. Split from a ref ` +
      `that predates the migration, or publish from the submodule working tree instead.`,
  );
}

function pullSubtree(target) {
  const start = Date.now();
  console.log(`\n▶ Pulling ${target.name} from ${target.repo}:${targetBranch} -> ${target.prefix}...`);
  const remoteUrl = resolveRemote(target.repo, token);
  try {
    git(`subtree pull --prefix=${target.prefix} "${remoteUrl}" ${targetBranch} -m "sync(${target.name}): pull updates from standalone repo" --squash`);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✔ Successfully pulled ${target.name} in ${duration}s`);
  } catch (err) {
    console.error(`✖ Failed to pull ${target.name}:`, err.message);
  }
}

function splitAndPush(target) {
  const start = Date.now();
  console.log(`\n▶ Splitting ${target.name} (${target.prefix}@${sourceRef}) -> ${target.repo}:${targetBranch}...`);

  const branchSha = git(`subtree split --prefix=${target.prefix} ${sourceRef}`).trim();
  console.log(`  Tree SHA: ${branchSha}`);

  const remoteUrl = resolveRemote(target.repo, token);
  const refspec = `${branchSha}:refs/heads/${targetBranch}`;

  if (!isDryRun) {
    git(`push "${remoteUrl}" ${isMirror ? `${refspec} --force` : refspec}`);
    console.log(`  ✔ Branch ${targetBranch} pushed to ${target.repo}`);
  } else {
    console.log(`  [dry-run] Would push ${branchSha} to ${target.repo}:${targetBranch}`);
  }

  if (isMirror && !skipTags) {
    syncTags(target, remoteUrl);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✔ Finished ${target.name} in ${duration}s`);
}

function syncTags(target, remoteUrl) {
  const prefix = `${target.name}-v`;
  const rawTags = git(`tag --list "${prefix}*"`).trim();
  if (!rawTags) return;

  const tags = rawTags.split('\n').filter(Boolean);
  const refspecs = [];

  for (const tag of tags) {
    const versionTag = tag.slice(target.name.length + 1);
    const tagSha = git(`subtree split --prefix=${target.prefix} ${tag}`).trim();
    refspecs.push(`${tagSha}:refs/tags/${versionTag}`);
    console.log(`  Tag mapping: ${tag} -> ${versionTag} (${tagSha})`);
  }

  if (refspecs.length === 0) return;

  if (!isDryRun) {
    git(`push "${remoteUrl}" ${refspecs.join(' ')} --force`);
    console.log(`  ✔ Pushed ${refspecs.length} tag(s) to ${target.repo}`);
  } else {
    console.log(`  [dry-run] Would push ${refspecs.length} tag(s) to ${target.repo}`);
  }
}

function resolveRemote(repo, authToken) {
  if (authToken) {
    return `https://x-access-token:${authToken}@github.com/${repo}.git`;
  }
  return `https://github.com/${repo}.git`;
}

function getGhToken() {
  try {
    return execSync('gh auth token', { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function git(command) {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const safeMsg = (error.message || '').replace(
      /https:\/\/x-access-token:[^@]+@/g,
      'https://x-access-token:***@',
    );
    throw new Error(safeMsg);
  }
}
