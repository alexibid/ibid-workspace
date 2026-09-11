import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { STUDIO_RESOURCES, WORKSPACE_ROOT } from '../mcp/paths.mjs';
import { blenderBinary } from '../mcp/paths.mjs';

function main() {
  const [subject, ...rest] = process.argv.slice(2);
  if (!subject) {
    console.error('Name the subject: node tools/kirigami/qa/provenance.mjs <subject> [--tokens N]');
    process.exit(1);
  }
  const tokens = Number(value(rest, '--tokens') ?? 0);
  const root = join(STUDIO_RESOURCES, subject);
  const manifestPath = join(root, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`There is no manifest at ${relative(WORKSPACE_ROOT, manifestPath)}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const stages = read(join(root, 'pipeline.json')) ?? [];
  const previous = manifest.provenance?.version ?? 0;

  manifest.provenance = {
    version: previous + 1,
    producedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    machine: machine(),
    software: software(),
    stages: stages.map((row) => ({ stage: row.stage, tool: row.tool,
      seconds: row.seconds, ...(row.detail ? { detail: row.detail } : {}) })),
    secondsTotal: Number(stages.reduce((sum, row) => sum + row.seconds, 0).toFixed(2)),
    agentTokens: {
      spentExploring: tokens,
      spentRerunning: 0,
      measure: 'context budget observed by the agent, not metered by the machine',
    },
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`PROVENANCE ${relative(WORKSPACE_ROOT, manifestPath)} `
    + `version=${manifest.provenance.version} stages=${stages.length} `
    + `seconds=${manifest.provenance.secondsTotal}`);
}

function machine() {
  return {
    cpu: sysctl('machdep.cpu.brand_string'),
    cores: Number(sysctl('hw.ncpu')) || null,
    memoryGb: Math.round(Number(sysctl('hw.memsize') ?? 0) / 1024 ** 3) || null,
    gpu: sysctl('machdep.cpu.brand_string'),
    accelerator: 'Metal Performance Shaders',
    os: `${sysctl('kern.ostype')} ${sysctl('kern.osrelease')}`,
    architecture: process.arch,
  };
}

function software() {
  return {
    blender: run(blenderBinary(), ['--version'])?.split('\n')[0]?.trim() ?? null,
    node: process.version,
    cutout: 'BiRefNet general (rembg)',
    reconstructor: 'stabilityai/TripoSR',
  };
}

function read(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function value(argv, flag) {
  const at = argv.indexOf(flag);
  return at === -1 ? undefined : argv[at + 1];
}

function sysctl(key) {
  return run('sysctl', ['-n', key]);
}

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', timeout: 10_000 }).trim();
  } catch {
    return null;
  }
}

main();
