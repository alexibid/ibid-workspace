import { execFileSync } from 'node:child_process';

const OWNER = 'alexibid';

const KNOWN_REPOS = new Set([
  'ibid-workspace',
  'oh-save-me',
  'papikapi',
  'boilerplate',
  'ibid-ui',
  'services',
  'testing',
  'utils',
]);

export function readOpenPullRequests() {
  const raw = execFileSync(
    'gh',
    ['search', 'prs', '--owner', OWNER, '--state', 'open', '--json', 'number,title,url,repository,isDraft'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 }
  ).trim();

  return JSON.parse(raw || '[]')
    .filter((pr) => KNOWN_REPOS.has(pr.repository?.name))
    .map((pr) => ({
      repository: pr.repository.nameWithOwner || `${OWNER}/${pr.repository.name}`,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      draft: Boolean(pr.isDraft),
    }));
}
