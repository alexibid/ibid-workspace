const RECORD = '\x1e';
const FIELD = '\x1f';

const TYPES = new Map([
  ['feat', { section: '🚀 Features', bump: 'minor' }],
  ['fix', { section: '🐛 Bug Fixes', bump: 'patch' }],
  ['perf', { section: '🔥 Performance', bump: 'patch' }],
  ['refactor', { section: '💅 Refactors', bump: 'patch' }],
]);

const RANK = { patch: 1, minor: 2, major: 3 };
const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<summary>.+)$/;
const BREAKING_BODY = /^BREAKING[ -]CHANGE:/m;

export const LOG_FORMAT = `--format=%H${FIELD}%s${FIELD}%b${RECORD}`;

export function parseCommits(raw) {
  return raw
    .split(RECORD)
    .map((record) => record.trim())
    .filter(Boolean)
    .map(toCommit)
    .filter((commit) => commit !== undefined);
}

export function resolveSpecifier(commits) {
  const bumps = commits.map(bumpOf).filter(Boolean);
  if (bumps.length === 0) return undefined;
  return bumps.reduce((highest, bump) => (RANK[bump] > RANK[highest] ? bump : highest));
}

export function renderChangelogEntry(version, commits, today = new Date()) {
  const lines = [`## ${version} (${today.toISOString().slice(0, 10)})`, ''];

  for (const [section, entries] of groupBySection(commits)) {
    lines.push(`### ${section}`, '');
    for (const entry of entries) lines.push(`- ${renderEntry(entry)}`);
    lines.push('');
  }

  const breaking = commits.filter(isBreaking);
  if (breaking.length > 0) {
    lines.push('### ⚠️ Breaking Changes', '');
    for (const entry of breaking) lines.push(`- ${renderEntry(entry)}`);
    lines.push('');
  }

  return lines.join('\n');
}

function toCommit(record) {
  const [sha, subject, body] = record.split(FIELD);
  const groups = HEADER.exec(subject ?? '')?.groups;
  if (!groups) return undefined;

  return {
    sha: (sha ?? '').trim().slice(0, 7),
    type: groups.type,
    scope: groups.scope,
    summary: groups.summary,
    breaking: groups.breaking === '!' || BREAKING_BODY.test(body ?? ''),
  };
}

function bumpOf(commit) {
  if (commit.breaking) return 'major';
  return TYPES.get(commit.type)?.bump;
}

function isBreaking(commit) {
  return commit.breaking;
}

function groupBySection(commits) {
  const sections = new Map();

  for (const commit of commits.filter((commit) => TYPES.has(commit.type))) {
    const { section } = TYPES.get(commit.type);
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(commit);
  }

  return sections;
}

function renderEntry(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  return `${scope}${commit.summary} (${commit.sha})`;
}
