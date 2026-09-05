import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const repository = requireEnvironment('GITHUB_REPOSITORY');
const runId = requireEnvironment('GITHUB_RUN_ID');

const jobs = readJobs();
const failed = jobs.filter(hasFailed);

annotate(failed);
const report = renderReport(failed);
console.error(report);
appendToSummary(report);
cancelRun();

function renderReport(failed) {
  const delivered = jobs.filter((job) => job.conclusion === 'success');
  const stopped = jobs.filter(isStillPending);

  return [
    '## Release stopped',
    '',
    ...failed.flatMap(describeFailure),
    ...section('Delivered before the failure', delivered.map((job) => `✅ ${job.name}`)),
    ...section('Stopped without running', stopped.map((job) => `⏹ ${job.name}`)),
    '',
    'Nothing else will run. Fix the cause and push the tag again.',
  ].join('\n');
}

function annotate(failed) {
  for (const job of failed) {
    console.log(`::error title=Release stopped::${locate(job)}`);
  }
}

function describeFailure(job) {
  return [`**Failed:** ${locate(job)}`, ''];
}

function locate(job) {
  const step = job.steps?.find((candidate) => candidate.conclusion === 'failure');
  return step ? `${job.name} → ${step.name}` : job.name;
}

function section(title, lines) {
  if (lines.length === 0) return [];
  return ['', `**${title}**`, '', ...lines.map((line) => `- ${line}`)];
}

function hasFailed(job) {
  return job.conclusion === 'failure' || job.steps?.some((step) => step.conclusion === 'failure');
}

function isStillPending(job) {
  return job.status !== 'completed' && !hasFailed(job);
}

function readJobs() {
  const raw = gh(['api', `repos/${repository}/actions/runs/${runId}/jobs?per_page=100`]);
  return JSON.parse(raw).jobs ?? [];
}

function cancelRun() {
  try {
    gh(['api', '-X', 'POST', `repos/${repository}/actions/runs/${runId}/cancel`]);
    console.error('Remaining jobs cancelled.');
  } catch (error) {
    console.error(`Could not cancel the remaining jobs: ${error.message}`);
  }
}

function appendToSummary(text) {
  const file = process.env['GITHUB_STEP_SUMMARY'];
  if (file) appendFileSync(file, `${text}\n`);
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not defined`);
  return value;
}
