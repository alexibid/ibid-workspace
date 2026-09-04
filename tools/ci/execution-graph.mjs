import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import { elapsedSeconds, formatSeconds, toolTotals } from './tool-time.mjs';
import { readPipeline } from './pipelines.mjs';
import { describeOutcome, readJobResults } from './job-results.mjs';

const CLASS_STYLES = [
  'classDef ok fill:#0b3d20,stroke:#2ea043,color:#d2f4dd',
  'classDef ko fill:#3d1216,stroke:#f85149,color:#ffd7d5',
  'classDef idle fill:#21262d,stroke:#6e7681,color:#c9d1d9',
];

const pipeline = readPipeline(process.env['PIPELINE'] ?? 'ci');
const results = readJobResults();
const jobs = readJobs();

console.log(render(pipeline, results));

function render(definition, jobResults) {
  return [
    `### ${definition.title}`,
    '',
    renderGraph(definition, jobResults),
    '',
    renderTable(definition, jobResults),
    renderTools(),
    renderScope(),
    renderLinks(definition, jobResults),
  ].filter(Boolean).join('\n');
}

function renderGraph(definition, jobResults) {
  return [
    '```mermaid',
    'flowchart LR',
    ...definition.groups.flatMap((group) => renderSubgraph(group, jobResults)),
    ...definition.flow.map(([from, to]) => `  group_${from} ==> group_${to}`),
    ...CLASS_STYLES.map((style) => `  ${style}`),
    ...definition.groups.flatMap((group) => renderClasses(group, jobResults)),
    '```',
  ].join('\n');
}

function renderSubgraph(group, jobResults) {
  return [
    `  subgraph group_${group.id}["${group.label}"]`,
    '    direction TB',
    ...group.jobs.map((job) => `    ${job.id}["${job.label}<br/>${outcomeOf(job, jobResults).icon}"]`),
    '  end',
  ];
}

function renderClasses(group, jobResults) {
  return group.jobs.map((job) => `  class ${job.id} ${outcomeOf(job, jobResults).style}`);
}

function renderTable(definition, jobResults) {
  const timings = readTimings();
  const rows = definition.groups.flatMap((group) =>
    group.jobs.map((job) => {
      const outcome = outcomeOf(job, jobResults);
      const timing = timings.get(job.label) ?? '';
      return `| ${group.label} | ${job.label} | ${outcome.icon} ${outcome.label} | ${timing} |`;
    }),
  );

  return ['| Group | Job | Result | Time |', '|---|---|---|---|', ...rows].join('\n');
}

function readTimings() {
  return new Map(
    jobs
      .filter((job) => job.completed_at)
      .map((job) => [
        job.name.split(' · ').pop(),
        formatSeconds(elapsedSeconds(job.started_at, job.completed_at)),
      ]),
  );
}

function renderTools() {
  const totals = toolTotals(jobs);
  if (totals.length === 0) return '';

  const spent = totals.reduce((sum, [, seconds]) => sum + seconds, 0);
  const rows = totals.map(
    ([tool, seconds]) =>
      `| \`${tool}\` | ${formatSeconds(seconds)} | ${Math.round((seconds / spent) * 100)}% |`,
  );

  return [
    '',
    '<details><summary>Time by tool</summary>',
    '',
    '| Tool | Time | Share |',
    '|---|---|---|',
    ...rows,
    '',
    '</details>',
  ].join('\n');
}

function readJobs() {
  const runId = process.env['GITHUB_RUN_ID'];
  const repository = process.env['GITHUB_REPOSITORY'];
  if (!runId || !repository) return [];

  try {
    const raw = execFileSync('gh', ['api', `/repos/${repository}/actions/runs/${runId}/jobs`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    return JSON.parse(raw).jobs;
  } catch {
    return [];
  }
}

function renderScope() {
  const affected = process.env['AFFECTED_PROJECTS'];
  if (!affected) return '';

  const projects = JSON.parse(affected);
  const listed = projects.length > 0 ? projects.map((name) => `\`${name}\``).join(', ') : 'none';
  return `\n**Affected projects:** ${listed}`;
}

function outcomeOf(job, jobResults) {
  return describeOutcome(jobResults[job.id]?.result);
}

function renderLinks(definition, jobResults) {
  if (definition.title !== 'Release · delivery') return '';

  const inspect = jobResults.inspect?.outputs;
  const project = inspect?.project;
  if (!project) return '';

  const links = [];
  const driveUrl = jobResults.drive?.outputs?.drive_url;
  if (driveUrl) {
    links.push(`* 📁 **Google Drive (Instaladores)**: [Abrir pasta de instaladores](${driveUrl})`);
  }

  const webUrl = resolveWebUrl(project);
  if (webUrl) {
    links.push(`* 🌐 **Aplicação Web**: [${webUrl}](${webUrl})`);
  }

  if (links.length === 0) return '';
  return ['', '### 🚀 Links', '', ...links].join('\n');
}

function resolveWebUrl(project) {
  const firebaseRcPath = '.firebaserc';
  if (!existsSync(firebaseRcPath)) return null;

  try {
    const config = JSON.parse(readFileSync(firebaseRcPath, 'utf8'));
    const target = config.targets?.['ibid-32cbe']?.hosting?.[project]?.[0];
    if (target) return `https://${target}.web.app`;
  } catch {
    return null;
  }
  return null;
}
