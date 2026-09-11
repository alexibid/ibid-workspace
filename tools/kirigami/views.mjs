import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

import { already, draw, measureText, PRICES, root, secret, suffix, VIEWS } from './gemini.mjs';

const CEILING = 12;

async function main() {
  const asked = read(process.argv.slice(2));
  if (typeof asked === 'string') {
    console.error(asked);
    return 1;
  }
  const brief = asked.brief ?? await describe();
  if (!brief) {
    console.error('No description given. Pass --brief "..." or run this in a terminal.');
    return 1;
  }
  const { subject, model, views, go, force, wireframe } = asked;
  const subjectRoot = root(subject);
  const wanted = views.filter((view) => force || !already(subjectRoot, view));

  const planned = wanted.length * (wireframe ? 2 : 1);
  report(subject, model, views, wanted, force, planned);
  if (planned > CEILING) {
    console.error(`\nRefused: ${planned} images exceeds the ceiling of ${CEILING}.`);
    return 1;
  }
  if (!go) {
    console.log('\nDry run. Nothing was called and nothing was billed.');
    console.log('Add --go to generate.');
    return 0;
  }

  mkdirSync(subjectRoot, { recursive: true });
  const key = secret();
  let anchor = null;
  let drawn = 0;
  for (const view of wanted) {
    const made = await draw(key, model, brief, view, anchor, false);
    writeFileSync(join(subjectRoot, `${view}.${suffix(made.mime)}`), made.bytes);
    anchor = anchor ?? made.bytes;
    drawn += 1;
    console.log(`   ${view.padEnd(11)} ${made.mime} `
      + `${(made.bytes.length / 1024).toFixed(0)}kb · ${made.seconds}s`);
    if (!wireframe) {
      continue;
    }
    const traced = await draw(key, model, brief, view, made.bytes, true);
    writeFileSync(join(subjectRoot, `${view}-wire.${suffix(traced.mime)}`), traced.bytes);
    drawn += 1;
    console.log(`   ${`${view}-wire`.padEnd(11)} ${traced.mime} `
      + `${(traced.bytes.length / 1024).toFixed(0)}kb · ${traced.seconds}s`);
  }
  console.log(`\nWrote ${drawn} image(s) into ${subjectRoot}`);
  console.log(`Spent about $${(drawn * PRICES[model]).toFixed(3)}`);
  console.log(`\n${measureText(subjectRoot)}`);
  return 0;
}

async function describe() {
  if (!process.stdin.isTTY) {
    return null;
  }
  const line = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await line.question(
    'Describe the subject (e.g. "a fun and colourful brontosaurus"): ');
  line.close();
  return answer.trim() || null;
}

function report(subject, model, views, wanted, force, planned) {
  const skipped = views.filter((view) => !wanted.includes(view));
  console.log(`subject   ${subject}`);
  console.log(`model     ${model} · $${PRICES[model].toFixed(3)} per image`);
  console.log(`views     ${views.join(', ')}`);
  if (skipped.length && !force) {
    console.log(`existing  ${skipped.join(', ')} — skipped, add --force to replace`);
  }
  console.log(`to make   ${planned} image(s)`);
  console.log(`estimate  $${(planned * PRICES[model]).toFixed(3)}`);
}

function read(argv) {
  const asked = { model: 'gemini-3.1-flash-lite-image', views: VIEWS, go: false,
                   force: false, wireframe: false };
  const loose = [];
  for (let at = 0; at < argv.length; at += 1) {
    const word = argv[at];
    if (word === '--go') {
      asked.go = true;
    } else if (word === '--force') {
      asked.force = true;
    } else if (word === '--wireframe') {
      asked.wireframe = true;
    } else if (word === '--brief' || word === '--model') {
      asked[word.slice(2)] = argv[at + 1];
      at += 1;
    } else if (word === '--views') {
      asked.views = argv[at + 1].split(',');
      at += 1;
    } else if (word.startsWith('--')) {
      return `'${word}' is not a flag this runner knows.`;
    } else {
      loose.push(word);
    }
  }
  asked.subject = loose[0];
  if (!asked.subject) {
    return 'Name the subject: node tools/kirigami/views.mjs <subject> --brief "..."';
  }
  if (!PRICES[asked.model]) {
    return `Unknown model '${asked.model}'. Known: ${Object.keys(PRICES).join(', ')}`;
  }
  const stray = asked.views.filter((view) => !VIEWS.includes(view));
  if (stray.length) {
    return `Not a view: ${stray.join(', ')}. Known: ${VIEWS.join(', ')}`;
  }
  return asked;
}

process.exit(await main());
