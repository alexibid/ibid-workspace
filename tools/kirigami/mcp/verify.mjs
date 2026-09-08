import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import { build, environment } from './actions.mjs';
import { BLENDER_ROOT } from './paths.mjs';

const EXAMPLES = join(BLENDER_ROOT, 'examples');
const TIER_OF = /^(tier-\d)/;

async function main() {
  const setup = await environment();
  console.log(`${setup.version}  ·  Export Paper Model ${setup.paperModelAddon ? 'installed' : 'MISSING'}`);
  if (!setup.ready) {
    console.error(setup.advice);
    return 1;
  }

  const failures = [];
  for (const { file, id } of scripts()) {
    const tier = TIER_OF.exec(id.replace('collection-', ''))?.[1];
    if (!tier) {
      failures.push(`${id}: the file name must start with the tier it builds for`);
      continue;
    }
    try {
      const result = await build({
        id: `verify-${id}`,
        title: id,
        tier,
        script: readFileSync(file, 'utf8'),
      });
      report(id, result, failures);
    } catch (error) {
      failures.push(`${id}: ${error.message}`);
      console.log(`✗ ${id.padEnd(22)} ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} example(s) failed:`);
    failures.forEach((line) => console.error(`  ${line}`));
    return 1;
  }
  console.log('\nEvery example welds clean and unfolds to a printable net.');
  return 0;
}

function scripts() {
  const roots = [EXAMPLES, join(EXAMPLES, 'collection')];
  return roots
    .filter((root) => existsSync(root))
    .flatMap((root) => readdirSync(root)
      .filter((name) => name.endsWith('.py'))
      .map((name) => ({
        file: join(root, name),
        id: root === EXAMPLES ? basename(name, '.py') : `collection-${basename(name, '.py')}`,
      })))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function report(id, result, failures) {
  if (!result.ok) {
    failures.push(`${id}: ${result.stage} — ${result.error}`);
    console.log(`✗ ${id.padEnd(22)} ${result.stage}`);
    return;
  }
  const dirty = result.parts.filter((part) => part.failures.length > 0);
  if (!result.clean || dirty.length > 0) {
    failures.push(`${id}: ${dirty.map((part) => `${part.name} ${part.failures}`).join(', ')}`);
  }
  const pages = result.parts.reduce((sum, part) => sum + (part.pages ?? 0), 0);
  const faces = result.parts.reduce((sum, part) => sum + part.faces, 0);
  console.log(
    `${result.clean ? '✓' : '✗'} ${id.padEnd(22)} ${String(result.parts.length).padStart(2)} parts`
    + ` · ${String(faces).padStart(4)} faces · ${pages} printed pages`
  );
}

process.exit(await main());
