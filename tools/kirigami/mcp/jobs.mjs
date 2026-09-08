import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { JOBS_ROOT, jobDirectory } from './paths.mjs';
import { screen } from './screen.mjs';

const SLUG = /^[a-z0-9][a-z0-9-]{1,63}$/;

export class JobError extends Error {}

export function prepare({ id, title, tier, script, mesh, features, part, role, page, outputs, family, preflightOnly }) {
  if (!SLUG.test(id)) {
    throw new JobError(
      `Job id '${id}' must be lowercase letters, digits and hyphens, 2 to 64 characters.`
    );
  }
  const dir = jobDirectory(id);
  mkdirSync(dir, { recursive: true });

  if (!script && !mesh) {
    throw new JobError(`Job '${id}' needs either a model script or a mesh to adopt.`);
  }
  const scriptPath = script ? join(dir, 'model.py') : undefined;
  if (script) {
    writeFileSync(scriptPath, screen(script), 'utf8');
  }

  const job = {
    id,
    title: title ?? id,
    tier,
    ...(scriptPath ? { script: scriptPath } : {}),
    ...(mesh ? { mesh, part: part ?? 'subject', ...(role ? { role } : {}), ...(features ? { features } : {}) } : {}),
    page: page ?? { preset: 'A4', marginMm: 5 },
    outputs: outputs ?? { pdf: true, glb: true },
    family: family ?? 'sitting-animal',
    preflightOnly: preflightOnly ?? false,
  };
  const jobPath = join(dir, 'job.json');
  writeFileSync(jobPath, JSON.stringify(job, null, 2), 'utf8');
  return { dir, jobPath, outDir: join(dir, 'out'), resultPath: join(dir, 'result.json') };
}


export function manifestOf(id) {
  const path = join(jobDirectory(id), 'out', 'manifest.json');
  if (!existsSync(path)) {
    throw new JobError(`Job '${id}' has produced no manifest yet.`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function scriptOf(id) {
  const path = join(jobDirectory(id), 'model.py');
  if (!existsSync(path)) {
    throw new JobError(`Job '${id}' has no model script on disk.`);
  }
  return readFileSync(path, 'utf8');
}

export function list() {
  if (!existsSync(JOBS_ROOT)) {
    return [];
  }
  return readdirSync(JOBS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => summarise(entry.name))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function summarise(id) {
  const resultPath = join(jobDirectory(id), 'result.json');
  if (!existsSync(resultPath)) {
    return { id, state: 'prepared', createdAt: '' };
  }
  const result = JSON.parse(readFileSync(resultPath, 'utf8'));
  if (!result.ok) {
    return { id, state: 'failed', stage: result.stage, error: result.error, createdAt: '' };
  }
  const { manifest } = result;
  return {
    id,
    state: manifest.preflight ? 'surveyed' : manifest.clean ? 'clean' : 'dirty',
    tier: manifest.tier?.id ?? '',
    title: manifest.title ?? id,
    parts: manifest.parts?.length ?? 0,
    createdAt: manifest.createdAt ?? '',
  };
}
