import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const directories = process.argv.slice(2);

if (directories.length === 0) throw new Error('Name at least one directory to hash');

const hash = createHash('sha256');
directories.forEach(hashDirectory);
console.log(hash.digest('hex'));

function hashDirectory(directory) {
  hash.update(`dir:${directory}\0`);
  if (!existsSync(directory)) return;
  listFiles(directory).forEach((file) => hashFile(join(directory, file)));
}

function listFiles(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(directory.length + 1))
    .sort();
}

function hashFile(path) {
  hash.update(`file:${path}\0`);
  hash.update(readFileSync(path));
  hash.update('\0');
}
