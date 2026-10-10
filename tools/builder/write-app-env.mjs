import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VARIABLES = {
  FIGURE_DRIVE_API_KEY: 'driveApiKey',
  FIGURE_DRIVE_INDEX_FILE_ID: 'driveIndexFileId',
};

const project = argumentValue('--project');
if (!project) throw new Error('Usage: write-app-env.mjs --project <name> [--hash]');

const appRoot = join('apps', project);
const values = resolveValues(readDotenv(join(appRoot, '.env')));
const json = `${JSON.stringify(values)}\n`;

if (process.argv.includes('--hash')) {
  console.log(createHash('sha256').update(json).digest('hex'));
} else {
  writeFileSync(join(appRoot, 'public', 'app-env.json'), json);
  const names = Object.keys(values).join(', ') || 'no values, Drive stays off';
  console.log(`[app-env] ${project}: ${names}`);
}

function resolveValues(fromFile) {
  return Object.fromEntries(
    Object.entries(VARIABLES).flatMap(([variable, field]) => {
      const value = process.env[variable] || fromFile[variable] || '';
      return value ? [[field, value]] : [];
    }),
  );
}

function readDotenv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const at = line.indexOf('=');
        return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

function argumentValue(flag) {
  const at = process.argv.indexOf(flag);
  return at === -1 ? '' : (process.argv[at + 1] ?? '');
}
