import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const tag = process.env['RELEASE_TAG'];
if (!tag) throw new Error('RELEASE_TAG is not defined');

const { project, version } = parseTag(tag);
const appRoot = join('apps', project);
const isApp = existsSync(appRoot);

for (const line of [
  `project=${project}`,
  `version=${version}`,
  `is_app=${isApp}`,
  `has_web=${isApp && hasBuildTarget(appRoot)}`,
  `has_android=${existsSync(join(appRoot, 'platforms/mobile/android'))}`,
  `has_desktop=${existsSync(join(appRoot, 'platforms/desktop'))}`,
]) {
  console.log(line);
}

function parseTag(value) {
  const scoped = value.match(/^(?<project>.+)-v(?<version>\d+\.\d+\.\d+.*)$/);
  if (scoped?.groups) return { project: scoped.groups.project, version: scoped.groups.version };
  return { project: 'oh-save-me', version: value.replace(/^v/, '') };
}

function hasBuildTarget(root) {
  const manifest = join(root, 'project.json');
  if (!existsSync(manifest)) return false;
  return Boolean(JSON.parse(readFileSync(manifest, 'utf8')).targets?.build);
}
