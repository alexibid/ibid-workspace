import { execFileSync, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';

import { readLines, splitByProject } from './logs.mjs';

const BROWSER_TARGETS = ['e2e', 'e2e-all', 'test-a11y'];
const FAILED_TASK = /^\s*-\s+([A-Za-z0-9._-]+):[A-Za-z0-9._:-]+\s*$/;

export function discoverProjects(target, scope) {
  const args = ['nx', 'show', 'projects', '--with-target', target, '--json'];

  if (scope.projects.length > 0) args.push('--projects', scope.projects.join(','));
  else if (!scope.everyProject) args.push('--affected');
  if (scope.base) args.push('--base', scope.base);

  const output = execFileSync('npx', args, { encoding: 'utf8', env: cleanEnv() });
  return JSON.parse(lastJsonLine(output));
}

export async function runTarget({ target, projects, parallel, directory }) {
  const rawLogPath = join(directory, `${target}.raw.log`);
  const startedAt = Date.now();
  const exitCode = await streamToLog(commandFor(target, projects, parallel), target, rawLogPath);
  const logs = splitByProject(rawLogPath, target, projects, directory);

  return {
    target,
    projects,
    failed: resolveFailures(rawLogPath, projects, exitCode),
    durationMs: Date.now() - startedAt,
    logs,
    rawLogPath,
  };
}

function commandFor(target, projects, parallel) {
  return [
    'nx',
    'run-many',
    '--target',
    target,
    '--projects',
    projects.join(','),
    '--output-style=stream',
    `--parallel=${parallel}`,
  ];
}

function streamToLog(args, target, logPath) {
  const log = createWriteStream(logPath);

  return new Promise((resolve) => {
    const child = spawn('npx', args, { env: cleanEnv(target), stdio: ['ignore', 'pipe', 'pipe'] });

    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('close', (code) => {
      log.end();
      resolve(code);
    });
  });
}

function resolveFailures(rawLogPath, projects, exitCode) {
  if (exitCode === 0) return [];

  const reported = readFailedTasks(rawLogPath).filter((project) => projects.includes(project));
  return reported.length > 0 ? reported : projects;
}

function readFailedTasks(rawLogPath) {
  const lines = readLines(rawLogPath);
  const start = lines.findIndex((line) => line.trim() === 'Failed tasks:');
  if (start === -1) return [];

  return lines
    .slice(start + 1)
    .map((line) => FAILED_TASK.exec(line)?.[1])
    .filter(Boolean);
}

function cleanEnv(target) {
  const env = { ...process.env, NO_COLOR: '1', NX_TUI: 'false', TERM: 'dumb' };
  delete env.FORCE_COLOR;

  if (BROWSER_TARGETS.includes(target)) env.PLAYWRIGHT_HTML_OPEN = 'never';
  return env;
}

function lastJsonLine(output) {
  const line = output
    .split('\n')
    .map((entry) => entry.trim())
    .findLast((entry) => entry.startsWith('['));

  if (!line) throw new Error(`Could not read the project list from Nx:\n${output}`);
  return line;
}
