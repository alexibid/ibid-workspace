import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sourceDirectory = requireEnv('SOURCE_DIR');
const targetDirectory = requireEnv('TARGET_DIR');

mkdirSync(targetDirectory, { recursive: true });

const installers = existsSync(sourceDirectory) ? listFiles(sourceDirectory) : [];

for (const installer of installers) {
  const destination = join(targetDirectory, installer.split('/').pop());
  copyFileSync(installer, destination);
  console.log(`gathered: ${destination}`);
}

console.log(`${installers.length} installer(s) in ${targetDirectory}`);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not defined`);
  return value;
}
