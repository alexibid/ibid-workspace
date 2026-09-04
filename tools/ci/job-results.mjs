const OUTCOMES = {
  success: { icon: '✅', label: 'passed', style: 'ok' },
  failure: { icon: '❌', label: 'failed', style: 'ko' },
  cancelled: { icon: '🚫', label: 'cancelled', style: 'ko' },
  skipped: { icon: '⏭️', label: 'not needed', style: 'idle' },
};

const UNKNOWN = { icon: '❔', label: 'unknown', style: 'idle' };

export function readJobResults() {
  const raw = process.env['JOB_RESULTS'];
  if (!raw) throw new Error('JOB_RESULTS is not defined');
  return JSON.parse(raw);
}

export function describeOutcome(result) {
  return OUTCOMES[result] ?? UNKNOWN;
}

export function findBrokenJobs(results) {
  return Object.entries(results)
    .filter(([, job]) => job.result !== 'success' && job.result !== 'skipped')
    .map(([name]) => name);
}
