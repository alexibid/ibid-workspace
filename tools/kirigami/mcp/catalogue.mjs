import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { JobError, manifestOf } from './jobs.mjs';
import { STUDIO_RESOURCES, STUDIO_UPLOADS, jobDirectory } from './paths.mjs';

const GALLERY = join(STUDIO_UPLOADS, 'gallery.json');
const MODELS_ROOT = join(STUDIO_UPLOADS, 'models');
const KEEP = 120;

export function publish(id) {
  const manifest = manifestOf(id);
  const subject = join(STUDIO_RESOURCES, id);
  if (!existsSync(subject)) {
    throw new JobError(`'${id}' has no subject folder in resources, so there is nothing to publish onto.`);
  }
  const output = join(jobDirectory(id), 'out');
  copyFileSync(join(output, 'manifest.json'), join(subject, 'manifest.json'));
  if (existsSync(join(output, 'nets'))) {
    rmSync(join(subject, 'nets'), { recursive: true, force: true });
    cpSync(join(output, 'nets'), join(subject, 'nets'), { recursive: true });
  }
  rebuildIndex();
  return { entry: find(id), directory: join(MODELS_ROOT, id), gallery: GALLERY, manifest };
}

export function approve(id) {
  const contract = join(STUDIO_RESOURCES, id, 'model.json');
  if (!existsSync(contract)) {
    throw new JobError(`'${id}' has no subject folder in resources, so there is nothing to approve.`);
  }
  writeFileSync(contract, `${JSON.stringify({ ...readJson(contract), state: 'ready' }, null, 2)}\n`, 'utf8');
  rebuildIndex();
  return { entry: find(id), directory: join(MODELS_ROOT, id) };
}

export function withdraw(id) {
  const kept = gallery().filter((item) => item.id !== id);
  if (kept.length === gallery().length) {
    throw new JobError(`The gallery holds no model called '${id}'.`);
  }
  writeFileSync(GALLERY, JSON.stringify(kept, null, 2), 'utf8');
  rmSync(join(MODELS_ROOT, id), { recursive: true, force: true });
  return kept.length;
}

export function rebuildIndex() {
  const entries = subjects()
    .map(stock)
    .filter(Boolean)
    .sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''))
    .slice(0, KEEP);
  mkdirSync(STUDIO_UPLOADS, { recursive: true });
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

function subjects() {
  if (!existsSync(STUDIO_RESOURCES)) {
    return [];
  }
  return readdirSync(STUDIO_RESOURCES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(STUDIO_RESOURCES, name, 'grids')));
}

function stock(name) {
  const source = join(STUDIO_RESOURCES, name);
  const contract = readJson(join(source, 'model.json'));
  const manifest = readJson(join(source, 'manifest.json'));
  const levels = contract?.difficulty?.levels ?? [];
  if (!contract || !manifest || levels.length === 0) {
    return undefined;
  }

  const target = join(MODELS_ROOT, name);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  const grids = levels
    .filter((level) => existsSync(join(source, 'grids', `grid-${level.grid}.glb`)))
    .map((level) => {
      const file = `grid-${level.intensity}.glb`;
      copyFileSync(join(source, 'grids', `grid-${level.grid}.glb`), join(target, file));
      return {
        intensity: level.intensity,
        grid: level.grid,
        spacingMm: level.spacingMm,
        faces: level.faces,
        previewPath: `/uploads/models/${name}/${file}`,
      };
    });
  if (grids.length === 0) {
    rmSync(target, { recursive: true, force: true });
    return undefined;
  }

  copyFileSync(join(source, 'manifest.json'), join(target, 'manifest.json'));
  if (existsSync(join(source, 'nets'))) {
    cpSync(join(source, 'nets'), join(target, 'nets'), { recursive: true });
  }

  return {
    id: name,
    state: contract.state === 'ready' ? 'ready' : 'draft',
    title: contract.title ?? name,
    tier: manifest.tier,
    createdAt: manifest.createdAt,
    clean: manifest.clean,
    provenance: manifest.provenance,
    grids,
    previewPath: (grids[Math.floor(grids.length / 2)] ?? grids[0]).previewPath,
    parts: manifest.parts.map((part) => ({
      name: part.name,
      role: part.role,
      faces: part.mesh.faces,
      pages: part.net?.pages ?? 0,
      colours: part.colours ?? [{ role: part.role }],
      netPath: sheetOf(part, name, '.pdf'),
      vectorPaths: (part.net?.vectors ?? []).map((file) => `/uploads/models/${name}/nets/${file}`),
    })),
  };
}

function sheetOf(part, id, suffix) {
  const file = (part.net?.files ?? []).find((name) => name.endsWith(suffix));
  return file ? `/uploads/models/${id}/nets/${file}` : undefined;
}

function find(id) {
  const entry = gallery().find((row) => row.id === id);
  if (!entry) {
    throw new JobError(`The gallery holds no model called '${id}'.`);
  }
  return entry;
}

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
}
