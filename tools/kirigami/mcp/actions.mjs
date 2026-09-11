import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { BLENDER_ROOT, JOBS_ROOT, STUDIO_UPLOADS, WORKSPACE_ROOT } from './paths.mjs';
import { probe, runJob } from './blender.mjs';
import { list, manifestOf, prepare, scriptOf } from './jobs.mjs';
import { approve, gallery, publish, rebuildIndex, withdraw } from './catalogue.mjs';
import { lessons, record, tally } from './ledger.mjs';
import { history, note, pace } from './runlog.mjs';

const CONTRACT = join(BLENDER_ROOT, 'dump_contract.py');

export async function environment() {
  const blender = await probe();
  return {
    ...blender,
    ready: blender.paperModelAddon,
    advice: blender.paperModelAddon
      ? undefined
      : "Install the 'Export Paper Model' extension from the Blender extensions platform.",
    roots: { workspace: WORKSPACE_ROOT, jobs: JOBS_ROOT, studioUploads: STUDIO_UPLOADS },
  };
}

export function tiers() {
  return JSON.parse(execFileSync('python3', [CONTRACT], { encoding: 'utf8' }));
}

export async function validate(request) {
  return execute({ ...request, outputs: { pdf: false, glb: false } });
}

export async function preflight(request) {
  return execute({ ...request, preflightOnly: true, outputs: { pdf: false, glb: false } });
}

export async function build(request) {
  return execute({ ...request, outputs: { pdf: true, glb: true } });
}

export function job(id) {
  return { id, manifest: manifestOf(id), script: scriptOf(id) };
}

export function jobs() {
  return { jobs: list(), pace: pace() };
}

export function runs(id) {
  return { runs: history(id), pace: pace() };
}

export function publishJob(id) {
  return publish(id);
}

export function approveJob(id) {
  return approve(id);
}

export function catalogue(stage) {
  return gallery(stage);
}

export function learn(entry) {
  return record(entry);
}

export function recall(filter) {
  return { ...tally(), lessons: lessons(filter) };
}

export function reindex() {
  const entries = rebuildIndex();
  return { total: entries.length, shelves: countByShelf(entries) };
}

export function unpublish(id) {
  return { id, remaining: withdraw(id) };
}

function countByShelf(entries) {
  const shelves = {};
  for (const entry of entries) {
    shelves[entry.state] = (shelves[entry.state] ?? 0) + 1;
  }
  return shelves;
}

async function execute(request) {
  const { jobPath, outDir, resultPath } = prepare(request);
  const result = await runJob(jobPath, outDir, resultPath, { timeoutMs: request.timeoutMs });
  const mode = request.preflightOnly ? 'preflight'
    : request.outputs?.pdf === false ? 'validate' : 'build';
  note({
    id: request.id, tier: request.tier, mode, seconds: result.seconds,
    ok: result.ok, stage: result.stage,
    faces: result.manifest?.parts?.reduce((sum, p) => sum + (p.mesh?.faces ?? p.faces ?? 0), 0),
  });
  const answer = result.ok ? summarise(result.manifest) : failure(request.id, result);
  return { ...answer, seconds: result.seconds,
           lessons: lessons({ tier: request.tier, stage: result.stage, limit: 5 }) };
}

function summarise(manifest) {
  if (manifest.preflight) {
    return { ok: true, id: manifest.id, clean: manifest.clean,
             offenders: manifest.offenders, parts: manifest.parts, ...manifest.survey };
  }
  return {
    ok: true,
    id: manifest.id,
    tier: manifest.tier,
    clean: manifest.clean,
    offenders: manifest.offenders,
    parts: manifest.parts.map((part) => ({
      name: part.name,
      role: part.role,
      faces: part.mesh.faces,
      triangles: part.mesh.triangles,
      volumeMm3: part.mesh.volumeMm3,
      failures: part.mesh.failures,
      sheets: (part.net?.files ?? []).map(
        (file) => join(JOBS_ROOT, manifest.id, 'out', 'nets', file)
      ),
      pages: part.net?.pages,
      islands: part.net?.islands,
    })),
    preview: manifest.preview
      ? join(JOBS_ROOT, manifest.id, 'out', manifest.preview.file)
      : undefined,
    manifest: join(JOBS_ROOT, manifest.id, 'out', 'manifest.json'),
  };
}

function failure(id, result) {
  return {
    ok: false,
    id,
    stage: result.stage,
    error: result.error,
    trace: result.trace,
    fix: HINTS[result.stage] ?? 'Read the error and change the model script.',
  };
}

const HINTS = {
  build:
    'The script broke a tier contract or the studio API. Call kirigami_tiers for the budget and '
    + 'rewrite build(studio).',
  validate:
    'The welded mesh still carries offenders. Every solid of a part must overlap its neighbours '
    + 'so the EXACT boolean fuses them into one closed shell.',
  unfold:
    'The net could not be laid flat. Usually a part is larger than the page or a face is '
    + 'degenerate; simplify the geometry or move to a larger page preset.',
  preview: 'The glTF export failed. Check that the parts still exist after welding.',
  arguments: 'The job description was incomplete.',
};
