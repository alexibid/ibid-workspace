import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APPS_ROOT = 'apps';
const PLATFORMS = ['web', 'android', 'desktop'];

const REQUIREMENTS = {
  web: [
    { what: 'a build target', has: (root, m) => Boolean(m.targets?.build) },
  ],
  android: [
    { what: 'platforms/mobile/android', has: (root) => existsSync(join(root, 'platforms/mobile/android')) },
    { what: 'a mobile-apk target', has: (root, m) => Boolean(m.targets?.['mobile-apk']) },
    { what: 'a package.json for sync-app-version', shared: true, has: (root) => existsSync(join(root, 'package.json')) },
  ],
  desktop: [
    { what: 'platforms/desktop/src-tauri', has: (root) => existsSync(join(root, 'platforms/desktop/src-tauri')) },
    { what: 'a desktop-build target', has: (root, m) => Boolean(m.targets?.['desktop-build']) },
    { what: 'a package.json for sync-app-version', shared: true, has: (root) => existsSync(join(root, 'package.json')) },
  ],
};

export function readApps() {
  return readdirSync(APPS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(APPS_ROOT, name, 'project.json')))
    .sort();
}

export function inspect(name) {
  const root = join(APPS_ROOT, name);
  const manifest = JSON.parse(readFileSync(join(root, 'project.json'), 'utf8'));
  const skipped = (manifest.tags ?? [])
    .filter((tag) => tag.startsWith('skip-platform:'))
    .map((tag) => tag.slice('skip-platform:'.length));

  const state = {};
  for (const platform of PLATFORMS) {
    const rules = REQUIREMENTS[platform];
    const specificMet = rules.filter((r) => !r.shared && r.has(root, manifest));
    const missing = rules.filter((r) => !r.has(root, manifest));
    state[platform] =
      missing.length === 0 ? 'full' : specificMet.length === 0 ? 'none' : 'partial';
    state[`${platform}Missing`] = missing.map((r) => r.what);
  }
  const ships = PLATFORMS.filter((p) => state[p] === 'full' && !skipped.includes(p));
  return { name, skipped, state, ships };
}

export function platformsOf(name) {
  return inspect(name).ships;
}

function main() {
  const rows = readApps().map(inspect);
  const width = Math.max(...rows.map((r) => r.name.length));
  const problems = [];

  console.log(`${'app'.padEnd(width)}  ships                     skipped`);
  for (const row of rows) {
    console.log(`${row.name.padEnd(width)}  ${row.ships.join(' ').padEnd(25)} ${row.skipped.join(' ')}`);

    for (const platform of PLATFORMS) {
      if (row.state[platform] === 'partial' && !row.skipped.includes(platform)) {
        problems.push(
          `${row.name}: ${platform} is half configured — missing ${row.state[`${platform}Missing`].join(' and ')}. ` +
          `CD skips it without saying so`);
      }
      if (row.skipped.includes(platform) && row.state[platform] === 'full') {
        problems.push(
          `${row.name}: skips ${platform} but is fully configured for it. ` +
          `Remove the configuration or the skip-platform tag`);
      }
    }
    for (const platform of row.skipped) {
      if (!PLATFORMS.includes(platform)) {
        problems.push(`${row.name}: unknown platform in skip-platform:${platform}`);
      }
    }
    if (row.ships.length === 0) {
      problems.push(`${row.name}: ships to no platform at all`);
    }
  }

  if (problems.length > 0) {
    console.error('');
    for (const problem of problems) console.error(`  FAIL  ${problem}`);
    console.error(`\n${problems.length} platform problem(s)`);
    process.exit(1);
  }
  console.log('\nevery app ships everywhere it is configured for, minus what it explicitly skips');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
