import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { RUN_LOG as LOG } from './paths.mjs';

export function note(entry) {
  mkdirSync(dirname(LOG), { recursive: true });
  appendFileSync(LOG, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, 'utf8');
}

export function history(id, limit = 20) {
  if (!existsSync(LOG)) {
    return [];
  }
  return readFileSync(LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((row) => !id || row.id === id)
    .slice(-limit)
    .reverse();
}

export function pace() {
  const rows = history(undefined, 400).filter((row) => row.seconds);
  if (rows.length === 0) {
    return {};
  }
  const byMode = {};
  for (const row of rows) {
    const bucket = (byMode[row.mode] ??= []);
    bucket.push(row.seconds);
  }
  return Object.fromEntries(Object.entries(byMode).map(([mode, times]) => [mode, {
    runs: times.length,
    medianSeconds: Number(times.sort((a, b) => a - b)[Math.floor(times.length / 2)].toFixed(1)),
  }]));
}
