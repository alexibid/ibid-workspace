import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { platformsOf } from './platforms.mjs';

const tag = process.env['RELEASE_TAG'];
if (!tag) throw new Error('RELEASE_TAG is not defined');

const { project, version } = parseTag(tag);
const appRoot = join('apps', project);
const isApp = existsSync(appRoot);

const platforms = isApp ? platformsOf(project) : [];

for (const line of [
  `project=${project}`,
  `version=${version}`,
  `is_app=${isApp}`,
  `has_web=${platforms.includes('web')}`,
  `has_android=${platforms.includes('android')}`,
  `has_desktop=${platforms.includes('desktop')}`,
]) {
  console.log(line);
}

function parseTag(value) {
  const scoped = value.match(/^(?<project>.+)-v(?<version>\d+\.\d+\.\d+.*)$/);
  if (scoped?.groups) return { project: scoped.groups.project, version: scoped.groups.version };
  return { project: 'oh-save-me', version: value.replace(/^v/, '') };
}
