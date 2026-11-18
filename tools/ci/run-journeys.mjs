import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const apps = JSON.parse(process.env['APPS'] ?? '[]');

if (apps.length === 0) {
  console.log('No affected app carries a journey suite.');
  process.exit(0);
}

const failures = apps
  .flatMap((app) => [
    hasTarget(app, 'e2e') ? runTarget('e2e', app) : null,
    hasTarget(app, 'test-a11y') ? runTarget('test-a11y', app) : null,
  ])
  .filter(Boolean);

if (failures.length === 0) {
  console.log(`\nEvery journey passed across ${apps.join(', ')}.`);
  process.exit(0);
}

console.error(`\nFailed: ${failures.join(', ')}`);
process.exit(1);

function hasTarget(app, target) {
  const manifestPath = join('apps', app, 'project.json');
  if (!existsSync(manifestPath)) return false;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return Boolean(manifest.targets?.[target]);
}

function runTarget(target, app) {
  console.log(`\n──── ${target} · ${app} ────`);
  const result = spawnSync('npx', ['nx', target, app], { stdio: 'inherit' });
  return result.status === 0 ? null : `${target}:${app}`;
}
