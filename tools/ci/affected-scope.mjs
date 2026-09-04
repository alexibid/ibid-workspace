import { execFileSync } from 'node:child_process';

const projects = readAffectedProjects();
const e2eApps = readAffectedProjects(['--with-target', 'e2e']);

for (const line of [
  `projects=${JSON.stringify(projects)}`,
  `e2e_apps=${JSON.stringify(e2eApps)}`,
  `has_projects=${projects.length > 0}`,
  `has_e2e=${e2eApps.length > 0}`,
]) {
  console.log(line);
}

function readAffectedProjects(extraArguments = []) {
  const output = execFileSync(
    'npx',
    ['nx', 'show', 'projects', '--affected', '--json', ...extraArguments],
    { encoding: 'utf8' },
  );
  return JSON.parse(extractJsonArray(output));
}

function extractJsonArray(output) {
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error(`Nx did not return a project list:\n${output}`);
  return output.slice(start, end + 1);
}
