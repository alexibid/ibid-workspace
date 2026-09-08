import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { JobError, manifestOf } from './jobs.mjs';
import { STAGES, STUDIO_UPLOADS, jobDirectory, stageDirectory } from './paths.mjs';

const GALLERY = join(STUDIO_UPLOADS, 'gallery.json');
const KEEP = 120;

export function publish(id, stage = 'draft') {
  assertStage(stage);
  const manifest = manifestOf(id);
  const target = stageDirectory(stage, id);

  mkdirSync(target, { recursive: true });
  cpSync(join(jobDirectory(id), 'out'), target, { recursive: true });
  const script = join(jobDirectory(id), 'model.py');
  const authored = existsSync(script);
  if (authored) {
    copyFileSync(script, join(target, 'model.py'));
  }

  const entry = describe(id, stage, manifest, authored);
  writeFileSync(GALLERY, JSON.stringify(nextIndex(entry), null, 2), 'utf8');
  return { entry, directory: target, gallery: GALLERY };
}

export function approve(id) {
  const draft = stageDirectory('draft', id);
  if (!existsSync(draft)) {
    throw new JobError(`'${id}' is not in the draft shelf, so there is nothing to approve.`);
  }
  const ready = stageDirectory('ready', id);
  mkdirSync(ready, { recursive: true });
  cpSync(draft, ready, { recursive: true });
  rmSync(draft, { recursive: true, force: true });

  const entry = { ...find(id), state: 'ready', approvedAt: new Date().toISOString() };
  writeFileSync(GALLERY, JSON.stringify(nextIndex(entry), null, 2), 'utf8');
  return { entry, directory: ready };
}

export function rebuildIndex() {
  const entries = STAGES
    .flatMap((stage) => shelved(stage).map((id) => describe(id, stage, manifestOnShelf(stage, id))))
    .sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''))
    .slice(0, KEEP);
  writeFileSync(GALLERY, JSON.stringify(entries, null, 2), 'utf8');
  return entries;
}

export function gallery(stage) {
  if (!existsSync(GALLERY)) {
    return [];
  }
  const parsed = JSON.parse(readFileSync(GALLERY, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : [];
  return stage ? rows.filter((row) => row.state === stage) : rows;
}

export function withdraw(id) {
  const remaining = gallery().filter((item) => item.id !== id);
  if (remaining.length === gallery().length) {
    throw new JobError(`The gallery holds no model called '${id}'.`);
  }
  writeFileSync(GALLERY, JSON.stringify(remaining, null, 2), 'utf8');
  for (const stage of STAGES) {
    rmSync(stageDirectory(stage, id), { recursive: true, force: true });
  }
  return remaining.length;
}

function shelved(stage) {
  const shelf = join(STUDIO_UPLOADS, stage);
  if (!existsSync(shelf)) {
    return [];
  }
  return readdirSync(shelf, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(stageDirectory(stage, id), 'manifest.json')));
}

function manifestOnShelf(stage, id) {
  return JSON.parse(readFileSync(join(stageDirectory(stage, id), 'manifest.json'), 'utf8'));
}

function describe(id, stage, manifest, authored = true) {
  return {
    id,
    state: stage,
    title: manifest.title,
    tier: manifest.tier,
    createdAt: manifest.createdAt,
    clean: manifest.clean,
    scriptPath: authored ? `/uploads/${stage}/${id}/model.py` : undefined,
    previewPath: manifest.preview ? `/uploads/${stage}/${id}/${manifest.preview.file}` : undefined,
    parts: manifest.parts.map((part) => ({
      name: part.name,
      role: part.role,
      faces: part.mesh.faces,
      pages: part.net?.pages ?? 0,
      colours: part.colours ?? [{ role: part.role }],
      netPath: sheetOf(part, stage, id, '.pdf'),
      vectorPaths: (part.net?.vectors ?? []).map((file) => `/uploads/${stage}/${id}/nets/${file}`),
    })),
  };
}

function sheetOf(part, stage, id, suffix) {
  const file = (part.net?.files ?? []).find((name) => name.endsWith(suffix));
  return file ? `/uploads/${stage}/${id}/nets/${file}` : undefined;
}

function find(id) {
  const entry = gallery().find((row) => row.id === id);
  if (!entry) {
    throw new JobError(`The gallery holds no model called '${id}'.`);
  }
  return { ...entry, ...retarget(entry) };
}

function retarget(entry) {
  const swap = (value) => (value ? value.replace('/uploads/draft/', '/uploads/ready/') : value);
  return {
    scriptPath: swap(entry.scriptPath),
    previewPath: swap(entry.previewPath),
    parts: entry.parts.map((part) => ({
      ...part,
      netPath: swap(part.netPath),
      vectorPaths: (part.vectorPaths ?? []).map(swap),
    })),
  };
}

function assertStage(stage) {
  if (!STAGES.includes(stage)) {
    throw new JobError(`Unknown shelf '${stage}'. Known: ${STAGES.join(', ')}.`);
  }
}

function nextIndex(entry) {
  return [entry, ...gallery().filter((item) => item.id !== entry.id)].slice(0, KEEP);
}
