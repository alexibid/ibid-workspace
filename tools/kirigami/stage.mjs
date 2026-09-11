import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync }
  from 'node:fs';
import { join, relative } from 'node:path';

import { build } from './mcp/actions.mjs';
import { publish, rebuildIndex } from './mcp/catalogue.mjs';
import { STUDIO_RESOURCES, WORKSPACE_ROOT, blenderBinary } from './mcp/paths.mjs';

const PYTHON = process.env.KIRIGAMI_PYTHON
  ?? join(process.env.HOME ?? '', 'Projects/local-models/kirigami/venv/bin/python');
const VISION = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'vision');
const BLENDER = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'blender');
const QA = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'qa');
const VIEWS = ['front', 'back', 'left', 'right', 'top'];
const DEFAULTS = { view: 'left', views: ['left', 'top', 'front'], mcResolution: 512,
  faces: 534, turnDegrees: 0 };
const CHAIN = ['cutout', 'scan', 'reduce', 'net', 'snapshots', 'dossier'];
const ECHO = /^(MEASURED|CUT|CREASED|IMAGINED|BLENDED|REDUCED|SNAPSHOT|SHOT|DOSSIER|KIRIGAMI_RESULT)\b/;

const STAGES = {
  cutout, creases, scan, reduce, net, snapshots, dossier,
  all: async (name, options) => {
    for (const [place, stage] of CHAIN.entries()) {
      console.log(`\n── ${name} · ${stage} · step ${place + 1} of ${CHAIN.length} `
        + `· ${Math.round((place / CHAIN.length) * 100)}% done ──`);
      await STAGES[stage](name, options);
    }
  },
};

async function main() {
  const argv = process.argv.slice(2);
  const stage = argv[0];
  if (!stage || !(stage in STAGES)) {
    console.error(`Name a stage: ${Object.keys(STAGES).join(', ')}`);
    return 1;
  }
  const asked = read(argv.slice(1));
  if (typeof asked === 'string') {
    console.error(asked);
    return 1;
  }
  const { names, options } = asked;

  for (const name of names) {
    console.log(`\n── ${name} · ${stage} ──`);
    await STAGES[stage](name, options);
  }
  if (['all', 'net', 'dossier'].includes(stage)) {
    console.log(`\nINDEXED ${rebuildIndex().length} subject(s) into the gallery`);
  }
  return 0;
}

async function cutout(name) {
  await step('cutout', PYTHON, [join(VISION, 'cutout.py'), '--subject', name],
    join(STUDIO_RESOURCES, name, 'frame.json'));
}

async function creases(name) {
  const root = join(STUDIO_RESOURCES, name);
  await step('creases', PYTHON, [join(VISION, 'creases.py'), '--subject', name],
    join(root, 'scan', 'creases', 'left.svg'));
}

async function scan(name, options) {
  const root = join(STUDIO_RESOURCES, name);
  const contract = settle(root, name);
  const resolution = options.resolution ?? String(contract.build.mcResolution);
  const wanted = contract.build.views.includes(contract.build.view)
    ? contract.build.views
    : [contract.build.view, ...contract.build.views];

  for (const view of wanted) {
    const shed = join(root, 'scan', view);
    await step(`scan ${view} ${resolution}`, PYTHON, [
      join(VISION, 'imagine.py'), '--image', join(root, 'cutouts', `${view}.png`),
      '--precut', '--out', shed, '--resolution', resolution, '--journal', root,
    ], join(shed, 'mesh.glb'));
    await step(`blend ${view}`, blenderBinary(), [
      '--background', '--factory-startup', '--python', join(BLENDER, 'blend.py'), '--',
      join(shed, 'mesh.glb'), join(shed, 'mesh.blend'),
    ], join(shed, 'mesh.blend'));
  }

  const primary = join(root, 'scan', contract.build.view);
  copyFileSync(join(primary, 'mesh.glb'), join(root, 'scan', 'mesh.glb'));
  copyFileSync(join(primary, 'mesh.blend'), join(root, 'scan', 'mesh.blend'));
  console.log(`   ${'primary'.padEnd(14)} ${contract.build.view} → scan/mesh.glb`);
}

async function reduce(name) {
  const root = join(STUDIO_RESOURCES, name);
  const contract = settle(root, name);
  await step('reduce', blenderBinary(), [
    '--background', '--factory-startup', '--python', join(BLENDER, 'reduce.py'), '--',
    join(root, 'scan', 'mesh.glb'), join(root, 'model.glb'),
    String(contract.build.faces), String(contract.build.turnDegrees), root,
  ], join(root, 'model.glb'));
}

async function net(name) {
  const root = join(STUDIO_RESOURCES, name);
  const meshPath = join(root, 'model.glb');
  const made = await build({
    id: name, title: name, tier: 'tier-4',
    mesh: meshPath,
  });
  if (made.ok) {
    publish(name);
    console.log(`   ${'net'.padEnd(14)} built from model.glb `
      + `· ${made.parts[0].pages} pages · ${made.parts[0].islands} islands`);
    return;
  }
  console.error(`   ${'net'.padEnd(14)} FAILED to unfold ${meshPath}`);
  process.exit(1);
}

async function snapshots(name) {
  const root = join(STUDIO_RESOURCES, name);
  await step('snapshots', blenderBinary(), [
    '--background', '--factory-startup', '--python', join(BLENDER, 'snapshot.py'), '--',
    join(root, 'model.glb'), join(root, 'snapshots'),
  ], join(root, 'snapshots', 'front.png'));
}

async function dossier(name, options) {
  await step('dossier', 'node', [join(QA, 'dossier.mjs'), name]);
  await step('provenance', 'node',
    [join(QA, 'provenance.mjs'), name, '--tokens', options.tokens]);
}

function stocked() {
  if (!existsSync(STUDIO_RESOURCES)) {
    return [];
  }
  return readdirSync(STUDIO_RESOURCES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => VIEWS.every((view) => viewFile(name, view)));
}

function viewFile(name, view) {
  return ['.png', '.jpeg', '.jpg']
    .map((suffix) => join(STUDIO_RESOURCES, name, `${view}${suffix}`))
    .find(existsSync);
}

function settle(root, name) {
  const path = join(root, 'model.json');
  const contract = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const settled = {
    id: contract.id ?? name,
    title: contract.title ?? name,
    state: contract.state ?? 'draft',
    ...contract,
    build: { ...DEFAULTS, ...(contract.build ?? {}) },
  };
  writeFileSync(path, `${JSON.stringify(settled, null, 2)}\n`, 'utf8');
  return settled;
}

function spacingOf(root, grid) {
  const ledger = join(root, 'pipeline.json');
  if (!existsSync(ledger)) {
    return undefined;
  }
  return JSON.parse(readFileSync(ledger, 'utf8'))
    .find((row) => row.detail?.grid === grid)?.detail?.spacingMm;
}

function faceCount(blend) {
  if (!existsSync(blend)) {
    return undefined;
  }
  const out = execFileSync(blenderBinary(), ['--background', blend, '--python-expr',
    "import bpy\nprint('FACES', max(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'))",
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const found = /FACES (\d+)/.exec(out);
  return found ? Number(found[1]) : undefined;
}

async function step(label, command, args, expect) {
  const started = Date.now();
  const tail = [];
  console.log(`   ${label.padEnd(14)} started`);
  try {
    await stream(command, args, tail);
    if (expect && !existsSync(expect)) {
      throw new Error(`wrote nothing to ${relative(WORKSPACE_ROOT, expect)}`);
    }
  } catch (error) {
    console.error(`   ${label.padEnd(14)} FAILED — ${error.message}`);
    console.error(tail.slice(-6).join('\n'));
    process.exit(1);
  }
  console.log(`   ${label.padEnd(14)} ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

function stream(command, args, tail) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let rest = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (piece) => {
      const lines = (rest + piece).split('\n');
      rest = lines.pop() ?? '';
      for (const line of lines) {
        tail.push(line);
        if (tail.length > 60) {
          tail.shift();
        }
        if (ECHO.test(line)) {
          console.log(`      ${line}`);
        }
      }
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit code ${code}`))));
  });
}

function read(argv) {
  const names = [];
  const options = { tokens: '0' };
  for (let at = 0; at < argv.length; at += 1) {
    const word = argv[at];
    if (word === '--all') {
      continue;
    } else if (word === '--resolution' || word === '--tokens') {
      options[word.slice(2)] = argv[at + 1];
      at += 1;
    } else if (word.startsWith('--')) {
      return `'${word}' is not a flag this runner knows. Use --all, --resolution or --tokens.`;
    } else {
      names.push(word);
    }
  }
  const chosen = names.length > 0 ? names : stocked();
  if (chosen.length === 0) {
    return `No subject in ${relative(WORKSPACE_ROOT, STUDIO_RESOURCES)} carries the five views.`;
  }
  return { names: chosen, options };
}

process.exit(await main());
