import { spawnSync } from 'node:child_process';

const apps = JSON.parse(process.env['APPS'] ?? '[]');

if (apps.length === 0) {
  console.log('No affected app carries a journey suite.');
  process.exit(0);
}

const failures = apps.flatMap((app) => [
  runTarget('e2e', app),
  runTarget('test-a11y', app),
]).filter(Boolean);

if (failures.length === 0) {
  console.log(`\nEvery journey passed across ${apps.join(', ')}.`);
  process.exit(0);
}

console.error(`\nFailed: ${failures.join(', ')}`);
process.exit(1);

function runTarget(target, app) {
  console.log(`\n──── ${target} · ${app} ────`);
  const result = spawnSync('npx', ['nx', target, app], { stdio: 'inherit' });
  return result.status === 0 ? null : `${target}:${app}`;
}
