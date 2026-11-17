import { isWorkerBusyInContainer } from './docker.mjs';
import { run, succeeds } from './shell.mjs';

const REPOSITORY = 'alexibid/ibid-workspace';
const DOCKER_RUNNER_CONTAINER = 'ibid-ci-runner';
const DOCKER_RUNNER_NAME = 'docker-runner';

function readMacService() {
  const listing = run('launchctl', ['list']);
  const line = listing.split('\n').find((entry) => /actions\.runner\./.test(entry));
  if (!line) {
    return { installed: false, running: false };
  }
  const [pid] = line.trim().split(/\s+/);
  return { installed: true, running: pid !== '-' };
}

export function readGitHubRunners() {
  const raw = run('gh', ['api', `repos/${REPOSITORY}/actions/runners`, '--jq', '.runners']);
  return JSON.parse(raw || '[]').map((runner) => ({
    name: runner.name,
    online: runner.status === 'online',
    busy: Boolean(runner.busy),
    labels: (runner.labels ?? []).map((label) => label.name),
  }));
}

function stateOf(localRunning, localBusy, remote) {
  if (!localRunning) {
    return 'off';
  }
  if (localBusy || remote?.busy) {
    return 'busy';
  }
  if (remote && !remote.online) {
    return 'disconnected';
  }
  return 'idle';
}

export function readMacRunner(remoteRunners) {
  const service = readMacService();
  const busy = service.running && succeeds('pgrep', ['-f', 'Runner.Worker']);
  const remote = remoteRunners.find((runner) => runner.labels.includes('macOS'));
  return { id: 'mac', state: stateOf(service.running, busy, remote), installed: service.installed };
}

export function readDockerRunner(docker, remoteRunners) {
  const container = docker.containers.find((entry) => entry.name === DOCKER_RUNNER_CONTAINER);
  const running = Boolean(container?.running);
  const busy = running && isWorkerBusyInContainer(DOCKER_RUNNER_CONTAINER);
  const remote = remoteRunners.find((runner) => runner.name === DOCKER_RUNNER_NAME);
  return { id: 'docker', state: stateOf(running, busy, remote), installed: Boolean(container?.exists) };
}
