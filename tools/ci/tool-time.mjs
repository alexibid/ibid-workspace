const TOOLS = [
  [/^(Set up|Complete) job$/i, 'runner'],
  [/setup-workspace/i, 'npm'],
  [/rust-toolchain|desktop-build/i, 'cargo'],
  [/setup-java|mobile-apk|mobile platform/i, 'gradle'],
  [/browser|journey/i, 'playwright'],
  [/checkout|nx-set-shas|^Git /i, 'git'],
  [/artifact|installers/i, 'artefactos'],
  [/hosting-deploy/i, 'firebase'],
  [/rclone|Drive/i, 'rclone'],
  [/^(Build|Types|Unit tests)$|nx |Lint|versions/i, 'nx'],
];

export function toolOf(step) {
  const named = step.replace(/^Post /, '');
  return TOOLS.find(([pattern]) => pattern.test(named))?.[1] ?? 'scripts';
}

export function toolTotals(jobs) {
  const totals = new Map();

  for (const job of jobs) {
    for (const step of job.steps ?? []) {
      if (!step.completed_at) continue;
      const spent = elapsedSeconds(step.started_at, step.completed_at);
      if (spent === 0) continue;
      const tool = toolOf(step.name);
      totals.set(tool, (totals.get(tool) ?? 0) + spent);
    }
  }

  return [...totals].sort((a, b) => b[1] - a[1]);
}

export function elapsedSeconds(from, to) {
  return Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000));
}

export function formatSeconds(total) {
  const minutes = Math.floor(total / 60);
  return minutes > 0 ? `${minutes}m${String(total % 60).padStart(2, '0')}s` : `${total}s`;
}
