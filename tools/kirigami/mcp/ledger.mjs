import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { LEDGER } from './paths.mjs';

const KEEP = 400;

export class LedgerError extends Error {}

export function record(entry) {
  if (!entry.remedy || !entry.diagnosis) {
    throw new LedgerError(
      'A lesson without a diagnosis and a remedy teaches nothing. Say what went wrong and what '
      + 'changed to fix it.'
    );
  }
  const lesson = {
    at: new Date().toISOString(),
    id: entry.id,
    tier: entry.tier,
    subject: entry.subject,
    stage: entry.stage,
    offenders: entry.offenders ?? {},
    diagnosis: entry.diagnosis,
    remedy: entry.remedy,
  };
  write([lesson, ...read().filter((row) => !sameLesson(row, lesson))].slice(0, KEEP));
  return lesson;
}

export function lessons({ tier, subject, stage, limit = 12 } = {}) {
  const wanted = (subject ?? '').toLowerCase();
  return read()
    .filter((row) => !tier || row.tier === tier)
    .filter((row) => !stage || row.stage === stage)
    .filter((row) => !wanted || (row.subject ?? '').toLowerCase().includes(wanted))
    .slice(0, limit);
}

export function tally() {
  const rows = read();
  const byStage = {};
  for (const row of rows) {
    byStage[row.stage] = (byStage[row.stage] ?? 0) + 1;
  }
  return { total: rows.length, byStage };
}

function sameLesson(left, right) {
  return left.stage === right.stage && left.remedy === right.remedy && left.tier === right.tier;
}

function read() {
  if (!existsSync(LEDGER)) {
    return [];
  }
  const parsed = JSON.parse(readFileSync(LEDGER, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function write(rows) {
  mkdirSync(dirname(LEDGER), { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(rows, null, 2), 'utf8');
}
