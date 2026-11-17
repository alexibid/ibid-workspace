import { run } from './shell.mjs';

const REPOSITORY = 'alexibid/ibid-workspace';
const RUN_FIELDS = 'databaseId,workflowName,displayTitle,status,conclusion,url,headBranch,createdAt';

function readRecentRuns() {
  const raw = run('gh', ['run', 'list', '--repo', REPOSITORY, '--limit', '12', '--json', RUN_FIELDS]);
  return JSON.parse(raw || '[]');
}

function latestPerWorkflow(runs) {
  const seen = new Set();
  return runs.filter((entry) => {
    if (seen.has(entry.workflowName)) {
      return false;
    }
    seen.add(entry.workflowName);
    return true;
  });
}

function readFailedJob(runId) {
  const raw = run('gh', ['run', 'view', String(runId), '--repo', REPOSITORY, '--json', 'jobs']);
  const jobs = JSON.parse(raw || '{}').jobs ?? [];
  const job = jobs.find((entry) => entry.conclusion === 'failure');
  if (!job) {
    return undefined;
  }
  const step = (job.steps ?? []).find((entry) => entry.conclusion === 'failure');
  return { name: job.name, step: step?.name ?? '', url: job.url };
}

function toRun(entry) {
  const failed = entry.status === 'completed' && entry.conclusion === 'failure';
  return {
    id: entry.databaseId,
    workflow: entry.workflowName,
    title: entry.displayTitle,
    branch: entry.headBranch,
    status: entry.status,
    conclusion: entry.conclusion ?? '',
    url: entry.url,
    startedAt: entry.createdAt,
    failedJob: failed ? readFailedJob(entry.databaseId) : undefined,
  };
}

export function readPipeline() {
  return latestPerWorkflow(readRecentRuns()).map(toRun);
}
