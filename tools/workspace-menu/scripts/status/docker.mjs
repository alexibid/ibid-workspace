import { run, succeeds } from './shell.mjs';

export const WATCHED_CONTAINERS = ['ibid-ci-runner', 'papikapi-api', 'ibid-agents-database'];

function readContainer(name) {
  try {
    const [state, health] = run('docker', [
      'inspect',
      '--format',
      '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{end}}',
      name,
    ]).split('|');
    return { name, exists: true, running: state === 'running', state, health: health || '' };
  } catch {
    return { name, exists: false, running: false, state: 'missing', health: '' };
  }
}

export function readDocker() {
  const running = succeeds('docker', ['info', '--format', '{{.ServerVersion}}']);
  const containers = running ? WATCHED_CONTAINERS.map(readContainer) : [];
  return { running, containers };
}

export function isWorkerBusyInContainer(name) {
  return succeeds('docker', ['exec', name, 'pgrep', '-f', 'Runner.Worker']);
}
