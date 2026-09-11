import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { STUDIO_RESOURCES, WORKSPACE_ROOT } from '../mcp/paths.mjs';

const VIEWS = ['front', 'back', 'left', 'right', 'top'];

function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Name the subject: node tools/kirigami/qa/dossier.mjs <subject>');
    process.exit(1);
  }
  const root = join(STUDIO_RESOURCES, name);
  if (!existsSync(root)) {
    console.error(`There is no subject at ${relative(WORKSPACE_ROOT, root)}`);
    process.exit(1);
  }
  const contract = read(join(root, 'model.json')) ?? { id: name };
  const metrics = measure(root, contract);
  writeFileSync(join(root, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  writeFileSync(join(root, 'MODEL.md'), describe(contract, metrics), 'utf8');
  console.log(`DOSSIER ${relative(WORKSPACE_ROOT, root)} views=${metrics.reference.views.length} `
    + `figures=${metrics.figures.total}`);
}

function measure(root, contract) {
  const views = VIEWS.filter((view) => source(root, view));
  const figures = views.map((view) => {
    const catalogue = read(join(root, 'figures', `${view}.json`));
    return { view, found: catalogue?.features?.length ?? 0, features: catalogue?.features ?? [] };
  });
  return {
    id: contract.id ?? null,
    reference: {
      views,
      pixels: views.map((view) => ({ view, bytes: statSync(source(root, view)).size })),
      flattened: views.filter((view) => existsSync(join(root, 'flat', `${view}.png`))),
    },
    figures: {
      total: figures.reduce((sum, row) => sum + row.found, 0),
      byView: Object.fromEntries(figures.map((row) => [row.view, row.found])),
      placements: figures.flatMap((row) => row.features.map((feature) => ({
        view: row.view, kind: feature.kind, hex: feature.hex,
        at: feature.at, size: feature.size, art: feature.art,
      }))),
    },
    mesh: contract.mesh ?? null,
    net: contract.net ?? null,
    detector: contract.figures?.detector ?? {},
  };
}

function describe(contract, metrics) {
  const palette = [...new Set(metrics.figures.placements.map((row) => row.hex))];
  return [
    `# ${contract.title ?? contract.id}`,
    '',
    contract.summary ?? 'No summary recorded yet.',
    '',
    '## Reference',
    '',
    `Views on file: ${metrics.reference.views.join(', ') || 'none'}.`,
    `Flattened for the mesher: ${metrics.reference.flattened.join(', ') || 'none'}.`,
    '',
    '## Figures printed on the model',
    '',
    metrics.figures.total === 0
      ? 'None found. The model carries no drawn artwork the extractor can separate.'
      : table(['View', 'Kind', 'Colour', 'Centre', 'Size'],
        metrics.figures.placements.map((row) => [row.view, row.kind, row.hex,
          row.at.map((v) => v.toFixed(3)).join(', '), row.size.map((v) => v.toFixed(3)).join(', ')])),
    '',
    `Colours carried by the figures: ${palette.join(', ') || '—'}.`,
    '',
    '## Detector settings',
    '',
    Object.keys(metrics.detector).length === 0
      ? 'Defaults, unchanged.'
      : table(['Dial', 'Value'], Object.entries(metrics.detector).map(([k, v]) => [k, String(v)])),
    '',
    '## Difficulty',
    '',
    contract.difficulty === undefined ? 'No difficulty scale recorded.'
      : [`Grid ${contract.difficulty.grid}, on a scale of `
        + `${(contract.difficulty.levels ?? []).length} intensities.`, '',
        table(['Intensity', 'Grid', 'Spacing mm', 'Faces'],
          (contract.difficulty.levels ?? []).map((row) => [String(row.intensity),
            String(row.grid), Number(row.spacingMm ?? 0).toFixed(3),
            String(row.faces)]))].join('\n'),
    '',
    '## Mesh',
    '',
    metrics.mesh === null ? 'Not reconstructed yet.'
      : table(['Measure', 'Value'], Object.entries(metrics.mesh).map(([key, value]) =>
        [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])),
    '',
    '## Development log',
    '',
    (contract.log ?? []).length === 0
      ? 'Nothing recorded yet.'
      : (contract.log ?? []).map((entry) =>
        `- **${entry.at} · ${entry.phase}** — ${entry.note}`).join('\n'),
    '',
  ].join('\n');
}

function source(root, view) {
  const folder = readdirSync(root);
  const match = folder.find((file) => file.replace(/\.[^.]+$/, '') === view);
  return match ? join(root, match) : null;
}

function read(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function table(headers, rows) {
  return [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');
}

main();
