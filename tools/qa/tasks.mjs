import { execFileSync, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';

import { readLines, splitByProject } from './logs.mjs';

const BROWSER_TARGETS = ['e2e', 'e2e-all', 'test-a11y'];
const FAILED_TASK = /^\s*-\s+([A-Za-z0-9._-]+):[A-Za-z0-9._:-]+\s*$/;

import { existsSync, readdirSync } from 'node:fs';

export function discoverProjects(target, scope) {
  const args = ['nx', 'show', 'projects', '--with-target', target, '--json'];

  if (scope.projects.length > 0) args.push('--projects', scope.projects.join(','));
  else if (!scope.everyProject) args.push('--affected');
  if (scope.base) args.push('--base', scope.base);

  const output = execFileSync('npx', args, { encoding: 'utf8', env: cleanEnv() });
  let projects = JSON.parse(lastJsonLine(output));

  if (scope.spec && (target === 'e2e' || target === 'e2e-all' || target === 'test-a11y')) {
    projects = projects.filter((project) => {
      const e2eDir = `apps/${project}/e2e`;
      if (!existsSync(e2eDir)) return false;
      return hasMatchingSpec(e2eDir, scope.spec);
    });
  }

  return projects;
}

function hasMatchingSpec(dir, spec) {
  try {
    const entries = readdirSync(dir, { recursive: true });
    return entries.some((entry) => typeof entry === 'string' && entry.includes(spec));
  } catch {
    return false;
  }
}

export async function runTarget({ target, projects, parallel, directory, spec }) {
  const rawLogPath = join(directory, `${target}.raw.log`);
  const startedAt = Date.now();
  const exitCode = await streamToLog(commandFor(target, projects, parallel, spec), target, projects, rawLogPath);
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

function commandFor(target, projects, parallel, spec) {
  const cmd = [
    'nx',
    'run-many',
    '--target',
    target,
    '--projects',
    projects.join(','),
    '--output-style=stream',
    `--parallel=${parallel}`,
  ];
  if (spec && (target === 'e2e' || target === 'e2e-all' || target === 'test-a11y' || target === 'test')) {
    cmd.push(`--args=${spec}`);
  }
  return cmd;
}

function streamToLog(args, target, projects, logPath) {
  const log = createWriteStream(logPath);

  return new Promise((resolve) => {
    const child = spawn('npx', args, { env: cleanEnv(target), stdio: ['ignore', 'pipe', 'pipe'] });
    const startedAt = Date.now();

    let buffer = '';
    const completedProjects = new Set();
    const startedProjects = new Set();

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    const ticker = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const frame = frames[frameIndex++ % frames.length];
      const remaining = projects.filter((p) => !completedProjects.has(p));
      const remainingText = remaining.length <= 3 ? remaining.join(', ') : `${remaining.length} project(s)`;
      process.stdout.write(`\r\x1b[K    ${frame} [${elapsed}s] running ${target}... (${completedProjects.size}/${projects.length} completed: ${remainingText})`);
    }, 250);

    const clearTicker = () => {
      process.stdout.write('\r\x1b[K');
    };

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const clean = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
        if (!clean) continue;

        let lineProject = null;
        let content = clean;

        for (const project of projects) {
          if (clean.startsWith(`${project}:`)) {
            lineProject = project;
            content = clean.slice(project.length + 1).trim();
            break;
          }
        }

        if (lineProject) {
          if (!startedProjects.has(lineProject)) {
            startedProjects.add(lineProject);
          }

          if (content.startsWith('✓ ') || content.startsWith('PASS ')) {
            const spec = content.split('/').slice(-2).join('/');
            clearTicker();
            process.stdout.write(`    • [${lineProject}] ✓ ${spec || content}\n`);
          } else if (content.includes('›') && (content.includes('.journey.spec.ts') || content.includes('.spec.ts'))) {
            const match = content.match(/›\s*(.+?\.spec\.ts(?::\d+:\d+)?)\s*›?\s*(.*)/);
            const specPath = match ? match[1].split('/').pop() : content;
            const title = match && match[2] ? ` — ${match[2].slice(0, 60)}` : '';
            clearTicker();
            if (content.includes('✓') || content.includes('passed')) {
              process.stdout.write(`    • [${lineProject}] ✓ ${specPath}${title}\n`);
            } else if (/^\d+\)/.test(content) || content.includes('failed')) {
              process.stdout.write(`    ✖ [${lineProject}] ✖ ${specPath}${title}\n`);
            } else {
              process.stdout.write(`    • [${lineProject}] ▶ ${specPath}${title}\n`);
            }
          } else if (content.startsWith('FAIL ') || content.startsWith('✖ ') || content.includes('Lint errors')) {
            clearTicker();
            process.stdout.write(`    ✖ [${lineProject}] ${content}\n`);
          } else if (
            (content.includes('Successfully ran target') ||
              content.includes('Test Files') ||
              content.includes('Application bundle generation complete') ||
              content.includes('All files pass linting') ||
              /\d+\s+passed\s+\(/.test(content)) &&
            !completedProjects.has(lineProject)
          ) {
            completedProjects.add(lineProject);
            const percent = Math.round((completedProjects.size / projects.length) * 100);
            const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
            clearTicker();
            process.stdout.write(`    ✔ [${completedProjects.size}/${projects.length} · ${percent}%] ${lineProject} completed in ${elapsedSec}s\n`);
          }
        }
      }
    });

    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('close', (code) => {
      clearInterval(ticker);
      clearTicker();
      log.end();

      if (code === 0) {
        for (const project of projects) {
          if (!completedProjects.has(project)) {
            completedProjects.add(project);
            const percent = Math.round((completedProjects.size / projects.length) * 100);
            const finalElapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
            process.stdout.write(`    ✔ [${completedProjects.size}/${projects.length} · ${percent}%] ${project} completed in ${finalElapsed}s\n`);
          }
        }
      }

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
