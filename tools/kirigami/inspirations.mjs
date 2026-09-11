import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

import { WORKSPACE_ROOT } from './mcp/paths.mjs';

const GALLERY = join(WORKSPACE_ROOT, 'apps', 'kirigami-studio', '.agents', 'inspirations');
const INCOMING = join(GALLERY, 'incoming');
const SUFFIX = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

async function main() {
  const transcripts = findTranscripts(process.argv.includes('--all'));
  if (transcripts.length === 0) {
    console.error('No Claude Code transcript found for this workspace.');
    return 1;
  }
  mkdirSync(INCOMING, { recursive: true });
  const known = fingerprints();

  let written = 0;
  for (const transcript of transcripts) {
    for await (const image of imagesIn(transcript)) {
      if (known.has(image.digest)) {
        continue;
      }
      known.add(image.digest);
      const name = `${image.digest.slice(0, 10)}.${SUFFIX[image.type] ?? 'png'}`;
      writeFileSync(join(INCOMING, name), image.bytes);
      console.log(`${name}  ${(image.bytes.length / 1024).toFixed(0)} kB`);
      written += 1;
    }
  }

  console.log(
    written === 0
      ? 'Nothing new: every image in the transcripts is already in the gallery.'
      : `\n${written} new image(s) in ${INCOMING}. Rename each one for what it shows and move it up a level.`
  );
  return 0;
}

function findTranscripts(sweepEverySession) {
  const root = join(homedir(), '.claude', 'projects',
    `-${WORKSPACE_ROOT.replaceAll('/', '-').replace(/^-/, '')}`);
  if (!existsSync(root)) {
    return [];
  }
  const found = readdirSync(root)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => join(root, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  return sweepEverySession ? found : found.slice(0, 1);
}

function fingerprints() {
  const seen = new Set();
  for (const directory of [GALLERY, INCOMING]) {
    if (!existsSync(directory)) {
      continue;
    }
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (name.endsWith('.md') || !existsSync(path)) {
        continue;
      }
      try {
        seen.add(createHash('sha1').update(readFileSync(path)).digest('hex'));
      } catch {
        continue;
      }
    }
  }
  return seen;
}

async function* imagesIn(transcript) {
  const lines = createInterface({ input: createReadStream(transcript), crlfDelay: Infinity });
  for await (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const content = row?.message?.content;
    if (row?.message?.role !== 'user' || !Array.isArray(content)) {
      continue;
    }
    for (const block of content) {
      if (block?.type !== 'image' || block.source?.type !== 'base64') {
        continue;
      }
      const bytes = Buffer.from(block.source.data, 'base64');
      yield {
        bytes,
        type: block.source.media_type,
        digest: createHash('sha1').update(bytes).digest('hex'),
      };
    }
  }
}

process.exit(await main());
