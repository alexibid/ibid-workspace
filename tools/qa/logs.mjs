import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

export function readLines(logPath) {
  return readFileSync(logPath, 'utf8').replace(ANSI, '').split('\n');
}

export function splitByProject(rawLogPath, target, projects, directory) {
  const sections = new Map(projects.map((project) => [project, []]));
  const prefixes = new Map(projects.map((project) => [`${project}: `, project]));
  let current;

  for (const line of readLines(rawLogPath)) {
    const owner = ownerOf(line, prefixes) ?? headerOwner(line, sections);

    if (owner) current = owner;
    if (!current) continue;

    sections.get(current).push(stripPrefix(line, current));
  }

  return Object.fromEntries(
    [...sections].map(([project, lines]) => [project, writeSection(directory, project, target, lines)])
  );
}

function ownerOf(line, prefixes) {
  for (const [prefix, project] of prefixes) {
    if (line.startsWith(prefix)) return project;
  }
  return undefined;
}

function headerOwner(line, sections) {
  const match = /^>\s+nx run ([A-Za-z0-9._-]+):/.exec(line.trim());
  return match && sections.has(match[1]) ? match[1] : undefined;
}

function stripPrefix(line, project) {
  return line.startsWith(`${project}: `) ? line.slice(project.length + 2) : line;
}

function writeSection(directory, project, target, lines) {
  const logPath = join(directory, `${project}.${target}.log`);
  writeFileSync(logPath, `${lines.join('\n')}\n`);
  return logPath;
}
