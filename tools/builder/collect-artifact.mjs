#!/usr/bin/env node
import { readFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}

const project = args.get('project');
const from = args.get('from');
if (!project || !from) {
  console.error('Missing arguments: --project <name> --from <file|folder>');
  process.exit(1);
}

const wantedExtensions = (args.get('ext') ?? '').split(',').filter(Boolean);

function readVersion(projectName) {
  for (const candidate of [`apps/${projectName}/package.json`, 'package.json']) {
    try {
      return JSON.parse(readFileSync(candidate, 'utf8')).version;
    } catch {
    }
  }
  return '0.0.0';
}

function findArtifacts(path) {
  if (statSync(path).isFile()) return [path];

  const found = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) found.push(...findArtifacts(full));
    else if (wantedExtensions.length === 0 || wantedExtensions.includes(extname(entry.name).slice(1))) {
      found.push(full);
    }
  }
  return found;
}

const version = readVersion(project);
const outDir = resolve('dist', project);
mkdirSync(outDir, { recursive: true });

let artifacts = findArtifacts(resolve(from));
if (artifacts.length === 0) {
  console.error(`No artifact found in ${from}` +
    (wantedExtensions.length ? ` with extension ${wantedExtensions.join(', ')}` : ''));
  process.exit(1);
}

if (artifacts.some((a) => !a.includes('-unsigned.apk') && a.endsWith('.apk'))) {
  artifacts = artifacts.filter((a) => !a.includes('-unsigned.apk'));
} else if (artifacts.some((a) => a.includes('-unsigned.apk'))) {
  console.error('Only unsigned APKs were found (*-unsigned.apk). The APK has to be signed.');
  process.exit(1);
}

for (const artifact of artifacts) {
  const target = join(outDir, `${project}.${version}${extname(artifact)}`);
  copyFileSync(artifact, target);
  console.log(`recolhido: ${target}`);
}
