import { execFileSync } from 'node:child_process';

import { elapsedSeconds, formatSeconds, toolTotals } from './tool-time.mjs';

const REPO = 'alexibid/ibid-workspace';

const ICONS = {
  success: '\x1b[38;2;63;185;80m✔\x1b[0m',
  failure: '\x1b[38;2;248;81;73m✖\x1b[0m',
  cancelled: '\x1b[38;2;139;148;158m⊘\x1b[0m',
  skipped: '\x1b[38;2;139;148;158m·\x1b[0m',
  in_progress: '\x1b[38;2;241;224;90m▸\x1b[0m',
  queued: '\x1b[38;2;139;148;158m…\x1b[0m',
  pending: '\x1b[38;2;139;148;158m…\x1b[0m',
};

const XBAR_COLORS = {
  '✔': '#3fb950',
  '✖': '#f85149',
  '▸': '#d29922',
  '…': '#8b949e',
  '·': '#8b949e',
};

const XBAR_NEUTRAL = '#8b949e';

const watching = process.argv.includes('--watch');
const forXbar = process.argv.includes('--xbar');
const expanded = process.argv.includes('--steps');
const jobCache = new Map();
let buffer = [];

function withoutTemplate(name) {
  return name.replace(/\s*\$\{\{.*$/, ' …').trimEnd();
}

function jobLabel(job) {
  return withoutTemplate(job.name);
}

function out(text = '') {
  buffer.push(String(text));
}

if (forXbar) {
  renderXbar();
} else if (watching) {
  process.stdout.write('\x1b[?25l\x1b[2J\x1b[H');
  const restoreCursor = () => {
    process.stdout.write('\x1b[?25h\n');
    process.exit(0);
  };
  process.on('SIGINT', restoreCursor);
  process.on('SIGTERM', restoreCursor);

  await render();
  while (watching) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    await render();
  }
} else {
  await render();
}

async function render() {
  buffer = [];
  try {
    jobCache.clear();
    const runs = api('/actions/runs?per_page=40').workflow_runs;
    const chain = buildChain(runs);

    out(`\x1b[1mibid-workspace\x1b[0m · ${new Date().toLocaleTimeString('en-US')}\n`);

    if (chain.length === 0) {
      out('No recent workflow runs.');
    } else {
      for (const run of chain) printRun(run);
      printTotals(chain);
      printPerformanceStats(chain, runs);
    }
  } catch (error) {
    out(`\x1b[1mibid-workspace\x1b[0m · ${new Date().toLocaleTimeString('en-US')}\n`);
    out(`\x1b[38;2;241;224;90mWaiting for GitHub Actions update... (${error.message})\x1b[0m`);
  }

  if (watching) {
    const frame = buffer.join('\n').split('\n').map((line) => line + '\x1b[K').join('\n') + '\x1b[J\n';
    process.stdout.write('\x1b[H' + frame);
  } else {
    console.log(buffer.join('\n'));
  }
}

function buildChain(runs) {
  const ci = runs.find((run) => run.name === 'CI');
  if (!ci) return [];

  const version = runs.find(
    (run) => run.name === 'Automatic versioning' && run.head_sha === ci.head_sha,
  );
  const releases = runs
    .filter((run) => run.name === 'Release' && run.created_at > ci.created_at)
    .reverse();

  return [ci, version, ...releases].filter(Boolean);
}

function printRun(run) {
  const label = run.name === 'Release' ? `Release ${run.head_branch}` : run.name;
  const state = run.conclusion ?? run.status;
  const jobs = jobsOf(run);
  const running = jobs.reduce((total, job) => total + jobSeconds(job), 0);
  const waiting = Math.max(0, duration(run) - running);
  const wait = waiting > 30 ? `  ${dim(`queue ${formatSeconds(waiting)}`)}` : '';

  out(`${ICONS[state] ?? '?'} \x1b[1m${label}\x1b[0m  ${formatSeconds(running)}${wait}`);

  jobs.forEach((job, index) => {
    const lastJob = index === jobs.length - 1;
    const jobState = job.conclusion ?? job.status;
    const runner = job.runner_name === 'MAC ALEX' ? dim('mac') : dim(job.runner_name ? 'github' : '—');
    const jobPrefix = lastJob ? '└─' : '├─';
    const subIndent = lastJob ? '    ' : '│   ';

    out(
      `  ${jobPrefix} ${ICONS[jobState] ?? '?'} \x1b[1m${jobLabel(job).padEnd(38)}\x1b[0m ${elapsed(job).padStart(8)}  ${runner}`,
    );

    const steps = (job.steps || []).filter(isMeaningfulStep);
    steps.forEach((step, sIndex) => {
      const lastStep = sIndex === steps.length - 1;
      const stepState = step.conclusion ?? step.status;
      const stepPrefix = lastStep ? '└─' : '├─';
      const time = stepDuration(step);
      out(
        `  ${subIndent}${stepPrefix} ${ICONS[stepState] ?? '?'} ${step.name.padEnd(34)} ${time.padStart(8)}`,
      );
    });
  });

  out();
}

function isMeaningfulStep(step) {
  if (!step || !step.name) return false;
  if (/^(Set up job|Complete job)$/.test(step.name)) return false;
  if (/^Post Run /.test(step.name)) return false;
  if (/^Run actions\/(checkout|upload-artifact|download-artifact)/.test(step.name)) return false;
  if (/^Run \.\/\.github\/actions\/setup-workspace/.test(step.name)) return false;
  if (/^Run nrwl\/nx-set-shas/.test(step.name)) return false;
  if (/^(Refuse to run|Decide the scope|Summary|Skip when)/.test(step.name)) return false;
  return true;
}

function cleanStepName(name) {
  if (/Lint/i.test(name)) return 'Lint budget';
  if (/^Types/i.test(name)) return 'TypeScript check';
  if (/^Unit tests/i.test(name)) return 'Unit tests';
  if (/^Build/i.test(name)) return 'Nx Build';
  if (/Resolve the affected/i.test(name)) return 'Resolve affected';
  return shorten(name);
}

function stepDuration(step) {
  if (step.completed_at && step.started_at) {
    return formatSeconds(elapsedSeconds(step.started_at, step.completed_at));
  }
  if (step.status === 'in_progress' && step.started_at) {
    return formatSeconds(elapsedSeconds(step.started_at, new Date().toISOString()));
  }
  if (step.status === 'in_progress') {
    return '\x1b[38;2;241;224;90mrunning\x1b[0m';
  }
  return '—';
}

function printTotals(chain) {
  const spent = chain.reduce(
    (total, run) => total + jobsOf(run).reduce((sum, job) => sum + jobSeconds(job), 0),
    0,
  );
  const billed = chain.reduce((total, run) => total + billedMinutes(run), 0);
  out(`${dim('total')} ${formatSeconds(spent)}   ${dim('billed')} ${billed} min`);
}

function billedMinutes(run) {
  return jobsOf(run)
    .filter((job) => job.completed_at)
    .reduce((total, job) => {
      if (job.runner_name === 'MAC ALEX') return total;
      const minutes = Math.ceil(elapsedSeconds(job.started_at, job.completed_at) / 60);
      if (/windows/.test(job.name)) return total + minutes * 2;
      if (/macos/.test(job.name)) return total + minutes * 10;
      return total + minutes;
    }, 0);
}

function jobsOf(run) {
  if (!jobCache.has(run.id)) jobCache.set(run.id, api(`/actions/runs/${run.id}/jobs`).jobs);
  return jobCache.get(run.id);
}

function jobSeconds(job) {
  return job.completed_at ? elapsedSeconds(job.started_at, job.completed_at) : 0;
}

function duration(item) {
  const start = item.started_at ?? item.run_started_at ?? item.created_at;
  return elapsedSeconds(start, item.completed_at ?? item.updated_at);
}

function elapsed(item) {
  const start = item.started_at ?? item.run_started_at ?? item.created_at;
  const end = item.completed_at ?? (item.status === 'completed' ? item.updated_at : null);
  return end ? formatSeconds(elapsedSeconds(start, end)) : '\x1b[38;2;241;224;90mrunning\x1b[0m';
}

function dim(text) {
  return `\x1b[38;2;139;148;158m${text}\x1b[0m`;
}

function api(path) {
  return JSON.parse(
    execFileSync('gh', ['api', `/repos/${REPO}${path}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }),
  );
}

function printPerformanceStats(chain, runs) {
  if (chain.length === 0) return;
  const ci = chain.find((r) => r.name === 'CI') ?? chain[0];
  const wall = duration(ci);
  const jobs = jobsOf(ci);

  let slowest = { name: '', seconds: 0, job: '' };
  for (const job of jobs) {
    for (const step of (job.steps || []).filter(isMeaningfulStep)) {
      const sSec = step.completed_at && step.started_at ? elapsedSeconds(step.started_at, step.completed_at) : 0;
      if (sSec > slowest.seconds) slowest = { name: step.name, seconds: sSec, job: jobLabel(job) };
    }
  }

  out();
  out(`\x1b[1mPerformance & Timing Insights\x1b[0m`);
  out(`  ${dim('wall clock')}   ${formatSeconds(wall)}`);
  if (slowest.seconds > 0) {
    const pct = Math.round((slowest.seconds / Math.max(1, wall)) * 100);
    out(`  ${dim('bottleneck')}   \x1b[38;2;241;224;90m${slowest.name}\x1b[0m (${formatSeconds(slowest.seconds)} · ${pct}% of run)`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = runs.filter((r) => r.created_at.startsWith(today) && r.status === 'completed' && r.name === 'CI');
  if (todayRuns.length > 0) {
    const avgSec = Math.round(
      todayRuns.reduce((sum, r) => sum + elapsedSeconds(r.run_started_at || r.created_at, r.updated_at), 0) / todayRuns.length,
    );
    const passCount = todayRuns.filter((r) => r.conclusion === 'success').length;
    out(`  ${dim('daily runs')}   ${todayRuns.length} runs today · avg ${formatSeconds(avgSec)} · ${Math.round((passCount / todayRuns.length) * 100)}% pass`);
  }
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderForXbar() {
  jobCache.clear();
  const runs = api('/actions/runs?per_page=30').workflow_runs || [];
  const now = new Date().toISOString();

  const activeCi = runs.find((r) => r.name === 'CI' && r.status !== 'completed');
  const lastCompletedCi = runs.find((r) => r.name === 'CI' && r.status === 'completed');
  const ciRun = activeCi || lastCompletedCi;

  const activeVersion = runs.find((r) => r.name === 'Automatic versioning' && r.status !== 'completed');
  const lastCompletedVersion = runs.find((r) => r.name === 'Automatic versioning' && r.status === 'completed');
  const versionRun = activeVersion || lastCompletedVersion;

  const activeRelease = runs.find((r) => r.name === 'Release' && r.status !== 'completed');
  const lastCompletedRelease = runs.find((r) => r.name === 'Release' && r.status === 'completed');
  const releaseRun = activeRelease || lastCompletedRelease;

  let rootTitle = '⚡ CI / CD & Deploy Pipeline Flow (All passed ✔)';
  let rootMark = '✔';
  if (activeRelease) {
    const target = resolveTargetName(activeRelease);
    const dur = formatSeconds(elapsedSeconds(activeRelease.run_started_at || activeRelease.created_at, now));
    const activeJob = jobsOf(activeRelease).find((j) => j.status === 'in_progress');
    const phase = activeJob ? shorten(activeJob.name) : 'Release';
    rootTitle = `⚡ Pipeline Flow · ⟳ ${phase} (${target} · ${dur})`;
    rootMark = '▸';
  } else if (activeVersion) {
    const dur = formatSeconds(elapsedSeconds(activeVersion.run_started_at || activeVersion.created_at, now));
    rootTitle = `⚡ Pipeline Flow · ⟳ Auto-Versioning (${dur})`;
    rootMark = '▸';
  } else if (activeCi) {
    const dur = formatSeconds(elapsedSeconds(activeCi.run_started_at || activeCi.created_at, now));
    const activeJob = jobsOf(activeCi).find((j) => j.status === 'in_progress');
    const phase = activeJob ? shorten(activeJob.name) : 'CI';
    rootTitle = `⚡ Pipeline Flow · ⟳ ${phase} (${dur})`;
    rootMark = '▸';
  } else {
    const brokenRun = [ciRun, versionRun, releaseRun].find((run) => run?.conclusion === 'failure');
    if (brokenRun) {
      rootTitle = `⚡ Pipeline Flow · ✖ ${brokenRun.name} failed (${timeAgo(brokenRun.updated_at)})`;
      rootMark = '✖';
    }
  }

  console.log('---');
  console.log(`${rootTitle} | color=${colorFor(rootMark)} bash=/usr/bin/open param1="https://github.com/${REPO}/actions" terminal=false`);

  if (ciRun) {
    const isCiActive = ciRun.status !== 'completed';
    const ciMark = isCiActive ? '▸' : ciRun.conclusion === 'success' ? '✔' : '✖';
    const ciDur = isCiActive
      ? `${formatSeconds(elapsedSeconds(ciRun.run_started_at || ciRun.created_at, now))} running`
      : formatSeconds(elapsedSeconds(ciRun.run_started_at || ciRun.created_at, ciRun.updated_at));
    const ciBranch = ciRun.head_branch ? ` · ${ciRun.head_branch}` : '';
    const ciUrl = `https://github.com/${REPO}/actions/runs/${ciRun.id}`;

    console.log(`-- ┌─ ${ciMark} 1. CI · Quality Gate (${ciDur}${ciBranch}) | font=Menlo size=11 color=${colorFor(ciMark)} bash=/usr/bin/open param1="${ciUrl}" terminal=false`);

    const ciJobs = jobsOf(ciRun);
    const verifyJob = ciJobs.find((j) => j.name.includes('Verify') || j.name.includes('Static'));
    const verifyMark = !verifyJob ? '·' : verifyJob.status === 'in_progress' ? '▸' : verifyJob.conclusion === 'success' ? '✔' : verifyJob.conclusion === 'failure' ? '✖' : '·';
    const verifyTime = !verifyJob ? 'queued' : verifyJob.status === 'in_progress' ? `${formatSeconds(elapsedSeconds(verifyJob.started_at, now))} ▸` : formatSeconds(jobSeconds(verifyJob));
    const verifyUrl = verifyJob ? (verifyJob.html_url || `https://github.com/${REPO}/actions/runs/${ciRun.id}/job/${verifyJob.id}`) : ciUrl;

    printTreeRow('│   ├─', verifyMark, 'Verify · Static, tests and build', verifyTime, verifyUrl);

    if (verifyJob && verifyJob.steps && verifyJob.steps.length > 0) {
      const steps = verifyJob.steps.filter(isMeaningfulStep);
      steps.forEach((step, sIdx) => {
        const isLastStep = sIdx === steps.length - 1;
        const sPrefix = isLastStep ? '│   │   └─' : '│   │   ├─';
        const sState = step.conclusion ?? step.status;
        const sMark = sState === 'success' ? '✔' : sState === 'failure' ? '✖' : sState === 'in_progress' ? '▸' : '·';
        const sTime = stepDuration(step);
        printTreeRow(sPrefix, sMark, cleanStepName(step.name), sTime, verifyUrl);
      });
    }

    const verifyGate = ciJobs.find((j) => j.name.includes('CI verified'));
    if (verifyGate) {
      const gateMark = verifyGate.status === 'in_progress' ? '▸' : verifyGate.conclusion === 'success' ? '✔' : verifyGate.conclusion === 'failure' ? '✖' : '·';
      const gateTime = verifyGate.status === 'in_progress' ? 'running' : formatSeconds(jobSeconds(verifyGate));
      const gateUrl = verifyGate.html_url || `https://github.com/${REPO}/actions/runs/${ciRun.id}/job/${verifyGate.id}`;
      printTreeRow('│   ├─', gateMark, 'CI verified', gateTime, gateUrl);
    }

    const e2eJob = ciJobs.find((j) => j.name.includes('E2E') || j.name.includes('Journeys'));
    if (e2eJob) {
      const e2eMark = e2eJob.status === 'in_progress' ? '▸' : e2eJob.conclusion === 'success' ? '✔' : e2eJob.conclusion === 'failure' ? '✖' : '·';
      const e2eTime = e2eJob.status === 'in_progress' ? 'running' : formatSeconds(jobSeconds(e2eJob));
      const e2eUrl = e2eJob.html_url || `https://github.com/${REPO}/actions/runs/${ciRun.id}/job/${e2eJob.id}`;
      printTreeRow('│   └─', e2eMark, 'Journeys · E2E and accessibility', e2eTime, e2eUrl);
    }
  } else {
    console.log(`-- ┌─ · 1. CI · Quality Gate (no runs) | font=Menlo size=11 color=${XBAR_NEUTRAL}`);
  }

  if (activeCi && !activeVersion) {
    console.log(`-- ├─ … 2. Version · Auto-Tagging (waiting for CI) | font=Menlo size=11 color=${XBAR_NEUTRAL}`);
    printTreeRow('│   └─', '…', 'Tag every changed project', 'queued');
  } else if (versionRun) {
    const isVActive = versionRun.status !== 'completed';
    const vMark = isVActive ? '▸' : versionRun.conclusion === 'success' ? '✔' : versionRun.conclusion === 'skipped' ? '·' : '✖';
    const vDur = isVActive
      ? `${formatSeconds(elapsedSeconds(versionRun.run_started_at || versionRun.created_at, now))} running`
      : formatSeconds(elapsedSeconds(versionRun.run_started_at || versionRun.created_at, versionRun.updated_at));
    const vUrl = `https://github.com/${REPO}/actions/runs/${versionRun.id}`;

    console.log(`-- ├─ ${vMark} 2. Version · Auto-Tagging (${vDur}) | font=Menlo size=11 color=${colorFor(vMark)} bash=/usr/bin/open param1="${vUrl}" terminal=false`);

    const vJobs = jobsOf(versionRun);
    const tagJob = vJobs.find((j) => j.name.includes('Tag') || j.name.includes('Version'));
    if (tagJob) {
      const tagMark = tagJob.status === 'in_progress' ? '▸' : tagJob.conclusion === 'success' ? '✔' : tagJob.conclusion === 'failure' ? '✖' : '·';
      const tagTime = tagJob.status === 'in_progress' ? 'running' : formatSeconds(jobSeconds(tagJob));
      const tagUrl = tagJob.html_url || `https://github.com/${REPO}/actions/runs/${versionRun.id}/job/${tagJob.id}`;
      printTreeRow('│   └─', tagMark, 'Tag every changed project', tagTime, tagUrl);
    } else {
      printTreeRow('│   └─', vMark, 'Tag every changed project', vDur, vUrl);
    }
  } else {
    console.log(`-- ├─ · 2. Version · Auto-Tagging (no runs) | font=Menlo size=11 color=${XBAR_NEUTRAL}`);
  }

  const PLANNED_RELEASE_JOBS = [
    'Inspect · Tag and target',
    'Package · Web bundle',
    'Package · Android APK',
    'Package · Desktop macos',
    'Deliver · Firebase Hosting',
    'Deliver · Google Drive',
    'Release verified',
  ];

  if ((activeCi || activeVersion) && !activeRelease) {
    console.log(`-- ├─ … 3. Release · Package & Deploy (queued) | font=Menlo size=11 color=${XBAR_NEUTRAL}`);
    PLANNED_RELEASE_JOBS.forEach((jName, idx) => {
      const isLast = idx === PLANNED_RELEASE_JOBS.length - 1;
      const prefix = isLast ? '│   └─' : '│   ├─';
      printTreeRow(prefix, '…', jName, 'queued');
    });
  } else if (releaseRun) {
    const isRelActive = releaseRun.status !== 'completed';
    const relMark = isRelActive ? '▸' : releaseRun.conclusion === 'success' ? '✔' : '✖';
    const relTarget = resolveTargetName(releaseRun);
    const relDur = isRelActive
      ? `${formatSeconds(elapsedSeconds(releaseRun.run_started_at || releaseRun.created_at, now))} running`
      : formatSeconds(elapsedSeconds(releaseRun.run_started_at || releaseRun.created_at, releaseRun.updated_at));
    const relUrl = `https://github.com/${REPO}/actions/runs/${releaseRun.id}`;

    console.log(`-- ├─ ${relMark} 3. Release · Package & Deploy (${relDur} · ${relTarget}) | font=Menlo size=11 color=${colorFor(relMark)} bash=/usr/bin/open param1="${relUrl}" terminal=false`);

    const relJobs = jobsOf(releaseRun);
    if (relJobs.length > 0) {
      relJobs.forEach((job, idx) => {
        const isLast = idx === relJobs.length - 1;
        const prefix = isLast ? '│   └─' : '│   ├─';
        const jState = job.conclusion ?? job.status;
        const jMark = jState === 'success' ? '✔' : jState === 'failure' ? '✖' : jState === 'in_progress' ? '▸' : '·';
        const jTime = job.completed_at ? formatSeconds(jobSeconds(job)) : jState === 'in_progress' ? `${formatSeconds(elapsedSeconds(job.started_at, now))} ▸` : 'queued';
        const jUrl = job.html_url || `https://github.com/${REPO}/actions/runs/${releaseRun.id}/job/${job.id}`;
        printTreeRow(prefix, jMark, job.name, jTime, jUrl);
      });
    } else {
      PLANNED_RELEASE_JOBS.forEach((jName, idx) => {
        const isLast = idx === PLANNED_RELEASE_JOBS.length - 1;
        const prefix = isLast ? '│   └─' : '│   ├─';
        printTreeRow(prefix, '…', jName, 'queued', relUrl);
      });
    }
  } else {
    console.log(`-- ├─ · 3. Release · Package & Deploy (no runs) | font=Menlo size=11 color=${XBAR_NEUTRAL}`);
  }

  console.log(`-- └─ 4. Live Applications & Deliverables | font=Menlo size=11`);
  console.log(`--     ├─ 🌐 Papikapi:    https://ibid-papikapi.web.app | font=Menlo size=11 bash=/usr/bin/open param1="https://ibid-papikapi.web.app" terminal=false`);
  console.log(`--     ├─ 🌐 Oh Save Me:  https://ibid-ohsaveme.web.app | font=Menlo size=11 bash=/usr/bin/open param1="https://ibid-ohsaveme.web.app" terminal=false`);
  console.log(`--     ├─ 🌐 Boilerplate: https://ibid-boilerplate.web.app | font=Menlo size=11 bash=/usr/bin/open param1="https://ibid-boilerplate.web.app" terminal=false`);
  console.log(`--     └─ 📁 Google Drive: ibid-builds (APKs & DMG) | font=Menlo size=11 bash=/usr/bin/open param1="https://drive.google.com" terminal=false`);

  console.log('-- ---');
  console.log(`-- ⌁ Open Terminal CI Dashboard | font=Menlo size=11 bash=tools/ci/launch-dashboard.sh terminal=false`);
  console.log(`-- 🐙 Open GitHub Actions in Browser | font=Menlo size=11 bash=/usr/bin/open param1="https://github.com/${REPO}/actions" terminal=false`);
  printXbarRefreshRow();
}

function renderXbar() {
  try {
    renderForXbar();
  } catch (error) {
    renderXbarUnavailable(error);
  }
}

function renderXbarUnavailable(error) {
  const reason = String(error?.message ?? error).split('\n')[0].slice(0, 90);
  console.log('---');
  console.log(`⚠ Pipeline Flow · unavailable | color=${colorFor('✖')} bash=/usr/bin/open param1="https://github.com/${REPO}/actions" terminal=false`);
  console.log(`-- ${reason} | font=Menlo size=11 color=${colorFor('✖')}`);
  printXbarRefreshRow();
}

function printXbarRefreshRow() {
  const plugin = `${process.env.HOME || ''}/Projects/ibid-workspace/tools/xbar/ibid-runner.10s.sh`;
  console.log(`-- ↻ Refresh Pipeline Status | font=Menlo size=11 bash="${plugin}" param1=action param2=refresh-ci terminal=false refresh=true`);
}

function printTreeRow(prefix, mark, name, timeStr, url) {
  const maxLen = 34;
  const label = withoutTemplate(name);
  const truncated = label.length > maxLen ? `${label.slice(0, maxLen - 1)}…` : label;
  const paddedName = truncated.padEnd(maxLen);
  const paddedTime = (timeStr || '—').padStart(8);
  const lineText = `${prefix} ${mark} ${paddedName} ${paddedTime}`;
  const style = `font=Menlo size=11 color=${colorFor(mark)}`;
  const action = url ? ` | ${style} bash=/usr/bin/open param1="${url}" terminal=false` : ` | ${style}`;
  console.log(`-- ${lineText}${action}`);
}

function colorFor(mark) {
  return XBAR_COLORS[mark] ?? XBAR_NEUTRAL;
}

function resolveTargetName(run) {
  if (!run) return 'workspace';
  if (run.head_branch && run.head_branch !== 'main') {
    const tagMatch = run.head_branch.match(/^(?<app>[a-z0-9-]+)-v(?<ver>\d+\.\d+\.\d+.*)$/);
    if (tagMatch?.groups?.app) return `${tagMatch.groups.app} v${tagMatch.groups.ver}`;
    return run.head_branch;
  }
  const title = run.head_commit?.message || run.display_title || '';
  const apps = ['papikapi', 'oh-save-me', 'boilerplate', 'ibid-ui'].filter((a) =>
    new RegExp(`\\b${a}\\b`, 'i').test(title),
  );
  if (apps.length > 0) return apps.join(', ');
  return 'workspace';
}

function shorten(name) {
  return name.split(' · ').pop().slice(0, 28);
}
