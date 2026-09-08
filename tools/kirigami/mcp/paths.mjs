import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MCP_ROOT = dirname(fileURLToPath(import.meta.url));
export const WORKSPACE_ROOT = resolve(MCP_ROOT, '../../..');
export const BLENDER_ROOT = resolve(MCP_ROOT, '../blender');
export const RUN_JOB = join(BLENDER_ROOT, 'run_job.py');
export const JOBS_ROOT = join(WORKSPACE_ROOT, 'dist', 'kirigami', 'jobs');
export const STUDIO_UPLOADS = join(WORKSPACE_ROOT, 'apps', 'kirigami-studio', 'uploads');
export const STAGES = ['ready', 'draft', 'backup'];
export const LEDGER = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'ledger', 'lessons.json');

const MAC_BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';

export function blenderBinary() {
  const declared = process.env.KIRIGAMI_BLENDER;
  if (declared) {
    return declared;
  }
  return existsSync(MAC_BLENDER) ? MAC_BLENDER : 'blender';
}

export function stageDirectory(stage, id) {
  return join(STUDIO_UPLOADS, stage, id);
}

export function jobDirectory(id) {
  return join(JOBS_ROOT, id);
}

export function insideJobs(candidate) {
  return resolve(candidate).startsWith(resolve(JOBS_ROOT));
}
