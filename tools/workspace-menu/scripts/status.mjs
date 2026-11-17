import { readOpenPullRequests } from '../../ci/prs.mjs';
import { readRunPodSummary } from '../../ci/runpod-stats.mjs';
import { readDocker } from './status/docker.mjs';
import { readPipeline } from './status/pipeline.mjs';
import { findProblems } from './status/problems.mjs';
import { readDockerRunner, readGitHubRunners, readMacRunner } from './status/runners.mjs';
import { settle, settleAsync } from './status/shell.mjs';

const NO_PODS = { configured: false, balance: 0, spendPerHour: 0, runningPods: [] };

async function readStatus() {
  const workspaceDir = process.cwd();
  const docker = readDocker();
  const remoteRunners = settle(readGitHubRunners, []);
  const pipeline = settle(readPipeline, []);
  const pullRequests = settle(readOpenPullRequests, []);
  const pods = await settleAsync(() => readRunPodSummary(workspaceDir), NO_PODS);
  const online = !(remoteRunners.failed && pipeline.failed && pullRequests.failed);
  const runners = [readDockerRunner(docker, remoteRunners.value), readMacRunner(remoteRunners.value)];

  const status = {
    checkedAt: new Date().toISOString(),
    online,
    docker,
    runners,
    pipeline: pipeline.value,
    pullRequests: pullRequests.value,
    pods: pods.value,
  };
  return { ...status, problems: findProblems(status) };
}

process.stdout.write(JSON.stringify(await readStatus()));
