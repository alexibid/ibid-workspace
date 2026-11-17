import { COPY } from './copy.mjs';

const RUNNER_REGISTER_ACTION = { docker: 'runner-register:docker', mac: 'runner-start:mac' };

function dockerProblems(docker) {
  if (!docker.running) {
    return [{ id: 'docker-off', level: 'error', title: COPY.dockerOff, detail: COPY.dockerOffDetail, action: 'docker-start' }];
  }
  return docker.containers
    .filter((container) => container.name !== 'ibid-ci-runner')
    .flatMap((container) => containerProblem(container));
}

function containerProblem(container) {
  if (!container.exists) {
    return [{ id: `container-missing:${container.name}`, level: 'warning', title: COPY.containerMissing(container.name) }];
  }
  if (!container.running) {
    return [{
      id: `container-stopped:${container.name}`,
      level: 'error',
      title: COPY.containerStopped(container.name),
      action: `container-start:${container.name}`,
    }];
  }
  if (container.health === 'unhealthy') {
    return [{ id: `container-unhealthy:${container.name}`, level: 'warning', title: COPY.containerUnhealthy(container.name) }];
  }
  return [];
}

function runnerProblem(runner, dockerRunning) {
  if (runner.id === 'docker' && !dockerRunning) {
    return [];
  }
  if (!runner.installed) {
    return [{ id: `runner-missing:${runner.id}`, level: 'error', title: COPY.runnerMissing[runner.id], action: RUNNER_REGISTER_ACTION[runner.id] }];
  }
  if (runner.state === 'off') {
    return [{ id: `runner-off:${runner.id}`, level: 'error', title: COPY.runnerOff[runner.id], action: `runner-start:${runner.id}` }];
  }
  if (runner.state === 'disconnected') {
    return [{ id: `runner-disconnected:${runner.id}`, level: 'warning', title: COPY.runnerDisconnected[runner.id], action: `runner-restart:${runner.id}` }];
  }
  return [];
}

function pipelineProblem(entry) {
  if (!entry.failedJob && entry.conclusion !== 'failure') {
    return [];
  }
  const job = entry.failedJob;
  return [{
    id: `build-failed:${entry.id}`,
    level: 'error',
    title: COPY.buildFailed(entry.workflow),
    detail: [job?.name, job?.step].filter(Boolean).join(' · ') || entry.title,
    url: job?.url ?? entry.url,
  }];
}

export function findProblems({ online, docker, runners, pipeline }) {
  return [
    ...(online ? [] : [{ id: 'offline', level: 'warning', title: COPY.offline, detail: COPY.offlineDetail }]),
    ...dockerProblems(docker),
    ...runners.flatMap((runner) => runnerProblem(runner, docker.running)),
    ...pipeline.flatMap(pipelineProblem),
  ];
}
