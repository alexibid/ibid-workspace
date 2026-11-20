import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const MANIFEST = /(^|\/)package(-lock)?\.json$/;
const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const parseOverrideKey = (overrideKey) => {
  const startIndex = overrideKey.startsWith('@') ? 1 : 0;
  const atIndex = overrideKey.indexOf('@', startIndex);
  if (atIndex === -1) {
    return { packageName: overrideKey, targetRange: '' };
  }
  return {
    packageName: overrideKey.slice(0, atIndex),
    targetRange: overrideKey.slice(atIndex + 1),
  };
};

const resolveOverrideRange = (rootManifest, rawValue) => {
  if (typeof rawValue !== 'string') {
    return '';
  }
  if (!rawValue.startsWith('$')) {
    return rawValue;
  }
  const refName = rawValue.slice(1);
  for (const section of DEPENDENCY_SECTIONS) {
    const deps = rootManifest[section];
    if (isRecord(deps) && typeof deps[refName] === 'string') {
      return deps[refName];
    }
  }
  return '';
};

const collectPackageEntries = (packages, packageName) => {
  const exactKey = `node_modules/${packageName}`;
  const nestedSuffix = `/node_modules/${packageName}`;
  const entries = [];
  for (const [lockfilePath, metadata] of Object.entries(packages)) {
    if (lockfilePath !== exactKey && !lockfilePath.endsWith(nestedSuffix)) {
      continue;
    }
    if (isRecord(metadata) && typeof metadata.version === 'string') {
      entries.push({ lockfilePath, installedVersion: metadata.version });
    }
  }
  return entries;
};

const isVersionMismatch = (installedVersion, targetRange, expectedRange) => {
  const options = { includePrerelease: true };
  if (targetRange && !semver.satisfies(installedVersion, targetRange, options)) {
    return false;
  }
  return !semver.satisfies(installedVersion, expectedRange, options);
};

export const findOverrideMismatches = (rootManifest, lockfile) => {
  if (!isRecord(rootManifest) || !isRecord(rootManifest.overrides)) {
    return [];
  }
  if (!isRecord(lockfile) || !isRecord(lockfile.packages)) {
    return [];
  }
  const mismatches = [];
  for (const [overrideKey, rawValue] of Object.entries(rootManifest.overrides)) {
    const expectedRange = resolveOverrideRange(rootManifest, rawValue);
    if (!expectedRange) {
      continue;
    }
    const { packageName, targetRange } = parseOverrideKey(overrideKey);
    const entries = collectPackageEntries(lockfile.packages, packageName);
    for (const { lockfilePath, installedVersion } of entries) {
      if (isVersionMismatch(installedVersion, targetRange, expectedRange)) {
        mismatches.push({
          packageName,
          lockfilePath,
          installedVersion,
          expectedRange,
          overrideKey,
        });
      }
    }
  }
  return mismatches;
};

const parseNonEmptyLines = (text) => {
  if (typeof text !== 'string') {
    return [];
  }
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

export const parseLsProblems = (lsResult) => {
  if (!lsResult || lsResult.status === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(lsResult.stdout ?? '');
    if (isRecord(parsed) && Array.isArray(parsed.problems) && parsed.problems.length > 0) {
      return parsed.problems.map(String);
    }
  } catch {
  }
  const stderrLines = parseNonEmptyLines(lsResult.stderr);
  if (stderrLines.length > 0) {
    return stderrLines;
  }
  const stdoutLines = parseNonEmptyLines(lsResult.stdout);
  if (stdoutLines.length > 0) {
    return stdoutLines;
  }
  return [`npm ls exited with status ${lsResult.status ?? 'unknown'}`];
};

const readUnstagedManifests = (cwd) => {
  const output = execFileSync('git', ['diff', '--name-only'], { cwd, encoding: 'utf8' });
  return output.split('\n').filter((filePath) => MANIFEST.test(filePath));
};

const runNpmCommand = (args, cwd) => {
  const result = spawnSync('npm', args, { cwd, encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

const readJsonFile = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const formatMismatch = (mismatch) =>
  `Override mismatch for ${mismatch.packageName} (${mismatch.overrideKey}): ${mismatch.lockfilePath} has ${mismatch.installedVersion}, expected ${mismatch.expectedRange}`;

export const verifyLockfile = (options = {}) => {
  const cwd = options.cwd ?? process.cwd();
  const readUnstaged = options.readUnstaged ?? (() => readUnstagedManifests(cwd));
  const runCiDryRun =
    options.runCiDryRun ??
    (() => runNpmCommand(['ci', '--dry-run', '--no-audit', '--no-fund', '--loglevel=error'], cwd));
  const runNpmLs =
    options.runNpmLs ?? (() => runNpmCommand(['ls', '--package-lock-only', '--all', '--json'], cwd));
  const readJson = options.readJson ?? readJsonFile;

  const errors = [];
  const unstaged = readUnstaged();
  if (unstaged.length > 0) {
    errors.push(`Unstaged manifest changes: ${unstaged.join(', ')}`);
  }

  const ciResult = runCiDryRun();
  if (ciResult.status !== 0) {
    const message = (ciResult.stderr ?? '').trim() || 'package-lock.json does not match package.json';
    errors.push(message);
  }

  const lsProblems = parseLsProblems(runNpmLs());
  errors.push(...lsProblems);

  const rootManifest = readJson(resolve(cwd, 'package.json'));
  const rootLockfile = readJson(resolve(cwd, 'package-lock.json'));
  const mismatches = findOverrideMismatches(rootManifest, rootLockfile);
  errors.push(...mismatches.map(formatMismatch));

  return { ok: errors.length === 0, errors };
};

const runCli = () => {
  const result = verifyLockfile();
  if (!result.ok) {
    for (const error of result.errors) {
      console.error(error);
    }
    process.exit(1);
  }
  console.log('package-lock.json matches every package.json, npm ls is clean, and overrides are satisfied.');
};

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runCli();
}
