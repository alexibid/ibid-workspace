import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_PATH = '.github/dependabot.yml';
const MANIFESTS = { npm: 'package.json', cargo: 'Cargo.toml' };
const UPDATES_WORKFLOW_PATH = 'dynamic/dependabot/dependabot-updates';
const ALERT_SEVERITIES = 'high,critical';
const API = 'https://api.github.com';
const REPOSITORY = process.env['GITHUB_REPOSITORY'] ?? 'alexibid/ibid-workspace';

const findings = await collectFindings();
report(findings);

async function collectFindings() {
  try {
    return [...configFindings(), ...(await remoteFindings())];
  } catch (error) {
    return [`The Dependabot check could not finish: ${error.message}`];
  }
}

function configFindings() {
  if (!existsSync(CONFIG_PATH)) return [`${CONFIG_PATH} is missing`];
  const content = readFileSync(CONFIG_PATH, 'utf8');
  const entries = readUpdateEntries(content);
  const versionFindings = /^version:\s*['"]?2['"]?\s*$/m.test(content)
    ? []
    : [`${CONFIG_PATH} must declare version: 2`];
  const emptyFindings = entries.length === 0 ? [`${CONFIG_PATH} declares no update entries`] : [];
  return [...versionFindings, ...emptyFindings, ...entries.flatMap(entryFindings)];
}

function readUpdateEntries(content) {
  const updates = (content.split(/^updates:\s*$/m)[1] ?? '').split(/^\S/m)[0];
  return updates
    .split(/^\s{2}-\s+/m)
    .slice(1)
    .map((block) => ({
      ecosystem: valueOf(block, 'package-ecosystem'),
      directory: valueOf(block, 'directory'),
    }));
}

function valueOf(block, key) {
  const match = block.match(new RegExp(`^\\s*${key}:\\s*['"]?([^'"\\n]*)['"]?\\s*$`, 'm'));
  return match?.[1].trim() ?? '';
}

function entryFindings({ ecosystem, directory }) {
  if (!directory.startsWith('/')) {
    return [`The ${ecosystem || 'unnamed'} entry has an invalid directory "${directory}"`];
  }
  const path = join('.', directory);
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    return [`The ${ecosystem} directory "${directory}" does not exist`];
  }
  const manifest = MANIFESTS[ecosystem];
  return manifest && !existsSync(join(path, manifest))
    ? [`The ${ecosystem} directory "${directory}" has no ${manifest}`]
    : [];
}

async function remoteFindings() {
  const token = readToken();
  if (token === '') return ['No GitHub token: the Dependabot run and alerts were not read'];
  const [runFindings, alertFindings] = await Promise.all([
    guarded('the latest Dependabot Updates run', () => latestRunFindings(token)),
    guarded('the open Dependabot alerts', () => openAlertFindings(token)),
  ]);
  return [...runFindings, ...alertFindings];
}

function readToken() {
  const fromEnvironment = process.env['GH_TOKEN'] ?? process.env['GITHUB_TOKEN'] ?? '';
  if (fromEnvironment !== '') return fromEnvironment;
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

async function guarded(subject, read) {
  try {
    return await read();
  } catch (error) {
    return [`Could not read ${subject}: ${error.message}`];
  }
}

async function latestRunFindings(token) {
  const { workflows } = await requestGithub(
    `/repos/${REPOSITORY}/actions/workflows?per_page=100`,
    token,
  );
  const updates = workflows.find((workflow) => workflow.path === UPDATES_WORKFLOW_PATH);
  if (!updates) return ['GitHub lists no Dependabot Updates workflow for this repository'];
  const path = `/repos/${REPOSITORY}/actions/workflows/${updates.id}/runs?status=completed&per_page=1`;
  const [latest] = (await requestGithub(path, token)).workflow_runs;
  if (!latest || latest.conclusion === 'success') return [];
  return [`The latest Dependabot Updates run ended as "${latest.conclusion}": ${latest.html_url}`];
}

async function openAlertFindings(token) {
  const path = `/repos/${REPOSITORY}/dependabot/alerts?state=open&severity=${ALERT_SEVERITIES}&per_page=100`;
  const alerts = await requestGithub(path, token);
  return alerts.map(
    (alert) =>
      `Open ${alert.security_advisory.severity} alert #${alert.number} in ` +
      `${alert.dependency.package.name}: ${alert.html_url}`,
  );
}

async function requestGithub(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path.split('?')[0]}`);
  return response.json();
}

function report(found) {
  if (found.length === 0) {
    console.log(
      'Dependabot: configuration valid, latest run passed, no open high or critical alert.',
    );
    writeSummary('No Dependabot findings.');
    return;
  }
  for (const finding of found) announce(finding);
  writeSummary(
    `⚠️ ${found.length} Dependabot warning(s). They do not fail the pipeline.\n\n` +
      found.map((finding) => `- ${finding}`).join('\n'),
  );
}

function announce(finding) {
  if (process.env['GITHUB_ACTIONS'] === 'true') {
    console.log(`::warning title=Dependabot::${escapeAnnotation(finding)}`);
  } else {
    console.warn(`warning: ${finding}`);
  }
}

function escapeAnnotation(text) {
  return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function writeSummary(body) {
  const summaryPath = process.env['GITHUB_STEP_SUMMARY'];
  if (summaryPath) appendFileSync(summaryPath, `\n### Dependabot\n\n${body}\n`);
}
