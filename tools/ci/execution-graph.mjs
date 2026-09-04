import { readPipeline } from './pipelines.mjs';
import { describeOutcome, readJobResults } from './job-results.mjs';

const CLASS_STYLES = [
  'classDef ok fill:#0b3d20,stroke:#2ea043,color:#d2f4dd',
  'classDef ko fill:#3d1216,stroke:#f85149,color:#ffd7d5',
  'classDef idle fill:#21262d,stroke:#6e7681,color:#c9d1d9',
];

const pipeline = readPipeline(process.env['PIPELINE'] ?? 'ci');
const results = readJobResults();

console.log(render(pipeline, results));

function render(definition, jobResults) {
  return [
    `### ${definition.title}`,
    '',
    renderGraph(definition, jobResults),
    '',
    renderTable(definition, jobResults),
    renderScope(),
  ].join('\n');
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
  const rows = definition.groups.flatMap((group) =>
    group.jobs.map((job) => {
      const outcome = outcomeOf(job, jobResults);
      return `| ${group.label} | ${job.label} | ${outcome.icon} ${outcome.label} |`;
    }),
  );

  return ['| Group | Job | Result |', '|---|---|---|', ...rows].join('\n');
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
