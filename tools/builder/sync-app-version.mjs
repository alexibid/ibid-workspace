import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const project = readArgument('project');
const root = join('apps', project);
const version = readVersion();
const buildNumber = toBuildNumber(version);

console.log(`${project} ${version} (build ${buildNumber})`);

const written = [
  writeAndroid(join(root, 'platforms/mobile/android/app/build.gradle')),
  writeApple(join(root, 'platforms/mobile/ios/App/App.xcodeproj/project.pbxproj')),
  writeTauri(join(root, 'platforms/desktop/src-tauri/tauri.conf.json')),
].filter(Boolean);

if (written.length === 0) throw new Error(`No platform manifest found under ${root}`);

function toBuildNumber(semver) {
  const [major, minor, patch] = semver.split('-')[0].split('.').map(Number);
  if ([major, minor, patch].some(Number.isNaN)) throw new Error(`Unreadable version: ${semver}`);
  if (minor > 99 || patch > 99) throw new Error(`Version out of range for a build number: ${semver}`);
  return major * 10000 + minor * 100 + patch;
}

function writeAndroid(path) {
  return rewrite(path, (source) =>
    source
      .replace(/versionCode\s+\d+/, `versionCode ${buildNumber}`)
      .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`),
  );
}

function writeApple(path) {
  return rewrite(path, (source) =>
    source
      .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`)
      .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`),
  );
}

function writeTauri(path) {
  return rewrite(path, (source) => {
    const config = JSON.parse(source);
    config.version = version;
    return `${JSON.stringify(config, null, 2)}\n`;
  });
}

function rewrite(path, transform) {
  if (!existsSync(path)) return null;

  const source = readFileSync(path, 'utf8');
  const next = transform(source);
  if (next !== source) writeFileSync(path, next);

  console.log(`  ${next === source ? 'unchanged' : 'updated  '} ${path}`);
  return path;
}

function readVersion() {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
}

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}
