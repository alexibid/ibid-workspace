import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const policy = JSON.parse(readFileSync('tools/ci/audit-allowlist.json', 'utf8'));
const manifests = findLockfiles();

console.log(`Auditing ${manifests.length} lockfile(s): ${manifests.join(', ')}\n`);

const findings = manifests.flatMap(audit);
const [accepted, unresolved] = partition(findings, isAccepted);

printAccepted(accepted);
printExpiredAcceptances();

if (unresolved.length === 0) {
  console.log('\nNo unaccepted vulnerability at or above the failing severity.');
  process.exit(0);
}

printUnresolved(unresolved);
process.exit(1);

function findLockfiles() {
  const output = execFileSync('git', ['ls-files', '*package-lock.json'], { encoding: 'utf8' });
  return output.split('\n').filter(Boolean);
}

function audit(manifest) {
  const cwd = dirname(manifest) || '.';
  const result = spawnSync('npm', ['audit', '--json'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  const output = result.stdout ?? '';
  if (!output.trim().startsWith('{')) {
    throw new Error(`npm audit gave no report for ${manifest}:\n${result.stderr ?? output}`);
  }

  const report = JSON.parse(output);
  printCounts(manifest, report.metadata?.vulnerabilities ?? {});

  return Object.values(report.vulnerabilities ?? {})
    .filter((vulnerability) => policy.failOn.includes(vulnerability.severity))
    .map((vulnerability) => ({ ...vulnerability, manifest }));
}

function printCounts(manifest, counts) {
  const shown = ['critical', 'high', 'moderate', 'low']
    .map((severity) => `${counts[severity] ?? 0} ${severity}`)
    .join(' · ');
  console.log(`  ${manifest}: ${shown}`);
}

function isAccepted(finding) {
  return policy.accepted.some((entry) => entry.package === finding.name);
}

function partition(items, predicate) {
  return [items.filter(predicate), items.filter((item) => !predicate(item))];
}

function printAccepted(accepted) {
  if (accepted.length === 0) return;

  console.log('\nKnowingly accepted:');
  for (const finding of accepted) {
    const entry = policy.accepted.find((candidate) => candidate.package === finding.name);
    console.log(`  ${finding.name} (${finding.severity}) — review by ${entry.reviewBy}`);
    console.log(`    ${entry.reason}`);
  }
}

function printExpiredAcceptances() {
  const today = new Date().toISOString().slice(0, 10);
  const expired = policy.accepted.filter((entry) => entry.reviewBy < today);
  if (expired.length === 0) return;

  console.log('\nAcceptances past their review date, decide again:');
  for (const entry of expired) console.log(`  ${entry.package} — due ${entry.reviewBy}`);
}

function printUnresolved(unresolved) {
  console.error('\nVulnerabilities that must be fixed or explicitly accepted:');
  for (const finding of unresolved) {
    const fix = finding.fixAvailable ? 'run `npm audit fix`' : 'no registry fix';
    console.error(`  ${finding.severity.padEnd(8)} ${finding.name} (${finding.manifest}) — ${fix}`);
    for (const via of finding.via) {
      if (typeof via !== 'string') console.error(`    ${via.title}: ${via.url}`);
    }
  }
  console.error('\nAccept one only with a reason and a review date in tools/ci/audit-allowlist.json.');
}
