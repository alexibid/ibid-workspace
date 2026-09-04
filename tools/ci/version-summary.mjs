import { existsSync, readFileSync } from 'node:fs';

const createdTags = readCreatedTags();
const releaseTokenSet = process.env['RELEASE_TOKEN_SET'] === 'true';

console.log(['### Automatic versioning', '', describeTags(createdTags), describeTrigger()].join('\n'));

function readCreatedTags() {
  if (!existsSync('created-tags.txt')) return [];
  return readFileSync('created-tags.txt', 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function describeTags(tags) {
  if (tags.length === 0) return 'No project required a new version.';
  return ['| Tag |', '|---|', ...tags.map((tag) => `| \`${tag}\` |`)].join('\n');
}

function describeTrigger() {
  if (createdTags.length === 0) return '';
  if (releaseTokenSet) return '\nThe release pipeline starts once per tag.';
  return [
    '',
    '> **RELEASE_TOKEN is not set.** The tags were pushed with GITHUB_TOKEN, which does not start',
    '> other workflows, so the release pipeline did not run. Add a personal token with',
    '> `contents:write` as the `RELEASE_TOKEN` secret, or start the release manually.',
  ].join('\n');
}
