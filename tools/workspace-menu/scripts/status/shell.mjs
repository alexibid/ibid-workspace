import { execFileSync } from 'node:child_process';

export function run(command, args, timeout = 15_000) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
  }).trim();
}

export function succeeds(command, args) {
  try {
    run(command, args);
    return true;
  } catch {
    return false;
  }
}

export function settle(read, fallback) {
  try {
    return { value: read(), failed: false };
  } catch {
    return { value: fallback, failed: true };
  }
}

export async function settleAsync(read, fallback) {
  try {
    return { value: await read(), failed: false };
  } catch {
    return { value: fallback, failed: true };
  }
}
