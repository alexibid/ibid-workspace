import { execSync } from 'node:child_process';

const KNOWN_REPOS = new Set([
  'ibid-workspace',
  'oh-save-me',
  'camila',
  'boilerplate',
  'ibid-ui',
  'services',
  'testing',
  'utils',
]);

function main() {
  try {
    const raw = execSync(
      'gh search prs --owner alexibid --state open --json number,title,url,repository,updatedAt,isDraft',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();

    const allPrs = JSON.parse(raw || '[]');
    const prs = allPrs.filter((pr) => KNOWN_REPOS.has(pr.repository?.name));

    echoPrs(prs);
  } catch {
    console.log('🔀 PRs: Unable to check | bash=/usr/bin/open param1="https://github.com/pulls" terminal=false');
  }
}

function echoPrs(prs) {
  if (prs.length === 0) {
    console.log('---');
    console.log('🔀 Pull Requests: All clear (0 open) | bash=/usr/bin/open param1="https://github.com/pulls" terminal=false');
    return;
  }

  console.log('---');
  console.log(`🔀 Pull Requests (${prs.length} awaiting approval/merge)`);
  for (const pr of prs) {
    const repo = pr.repository.name;
    const fullRepo = pr.repository.nameWithOwner || `alexibid/${repo}`;
    const num = pr.number;
    const title = escapeXbar(pr.title);
    const draft = pr.isDraft ? ' [DRAFT]' : '';

    console.log(`-- 🔀 [${repo}] #${num}: ${title}${draft} | bash=/usr/bin/open param1="${pr.url}" terminal=false`);
    console.log(`---- 🌐 Open on GitHub | bash=/usr/bin/open param1="${pr.url}" terminal=false`);
    console.log(`---- ✔ Merge PR (Squash) | bash="$SELF" param1=action param2=merge-pr param3="${fullRepo}" param4="${num}" param5="squash" terminal=true refresh=true`);
    console.log(`---- ✔ Merge PR (Rebase) | bash="$SELF" param1=action param2=merge-pr param3="${fullRepo}" param4="${num}" param5="rebase" terminal=true refresh=true`);
  }
}

function escapeXbar(str) {
  return (str || '').replace(/\|/g, '-').slice(0, 45);
}

main();
