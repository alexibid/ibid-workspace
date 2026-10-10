import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { platformsOf } from './platforms.mjs';

const tag = process.env['RELEASE_TAG'];
if (!tag) throw new Error('RELEASE_TAG is not defined');

const { project, version } = parseTag(tag);
const appRoot = join('apps', project);
const isApp = existsSync(appRoot);

const platforms = isApp ? platformsOf(project) : [];
const hasHostingTarget = declaresHostingTarget(project);

for (const line of [
  `project=${project}`,
  `version=${version}`,
  `is_app=${isApp}`,
  `has_web=${platforms.includes('web')}`,
  `has_android=${platforms.includes('android')}`,
  `has_desktop=${platforms.includes('desktop')}`,
  `has_hosting_target=${hasHostingTarget}`,
]) {
  console.log(line);
}

function declaresHostingTarget(name) {
  const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
  return [config.hosting ?? []].flat().some((site) => site.target === name);
}

function parseTag(value) {
  const scoped = value.match(/^(?<project>.+)-v(?<version>\d+\.\d+\.\d+.*)$/);
  if (scoped?.groups) return { project: scoped.groups.project, version: scoped.groups.version };
  return { project: 'oh-save-me', version: value.replace(/^v/, '') };
}
