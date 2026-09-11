import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync }
  from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { already, draw, measureText, PRICES, root, secret, suffix, VIEWS } from './gemini.mjs';
import { STUDIO_RESOURCES } from './mcp/paths.mjs';

const PORT = Number(process.env.PORT ?? 4700);
const HERE = fileURLToPath(new URL('.', import.meta.url));
const PAGE = join(HERE, 'generate-ui.html');
const CEILING = 12;
const CONTENT_TYPES = { '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.webp': 'image/webp' };

const server = createServer((request, response) => {
  handle(request, response).catch((error) => fail(response, 500, error.message));
});

async function handle(request, response) {
  const url = new URL(request.url, `http://localhost:${PORT}`);

  if (request.method === 'GET' && url.pathname === '/') {
    return send(response, 200, 'text/html', readFileSync(PAGE));
  }
  if (request.method === 'GET' && url.pathname === '/api/subjects') {
    return json(response, 200, listSubjects());
  }
  if (request.method === 'GET' && url.pathname === '/api/subjects/images') {
    const subject = url.searchParams.get('subject');
    if (!subject) {
      return fail(response, 400, 'Name a subject: ?subject=...');
    }
    return json(response, 200, listImages(subject));
  }
  if (request.method === 'GET' && url.pathname.startsWith('/resources/')) {
    return serveImage(response, url.pathname.replace('/resources/', ''));
  }
  if (request.method === 'POST' && url.pathname === '/api/plan') {
    return json(response, 200, await plan(await body(request)));
  }
  if (request.method === 'POST' && url.pathname === '/api/generate') {
    return generate(request, response, await body(request));
  }
  return fail(response, 404, 'Not found');
}

function listSubjects() {
  if (!existsSync(STUDIO_RESOURCES)) {
    return [];
  }
  return readdirSync(STUDIO_RESOURCES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listImages(subject) {
  const subjectRoot = root(subject);
  if (!existsSync(subjectRoot)) {
    return [];
  }
  return readdirSync(subjectRoot)
    .filter((name) => Object.keys(CONTENT_TYPES).includes(extname(name)))
    .sort()
    .map((name) => ({
      name,
      url: `/resources/${subject}/${name}`,
      kb: Math.round(statSync(join(subjectRoot, name)).size / 1024),
    }));
}

function serveImage(response, relative) {
  const target = join(STUDIO_RESOURCES, relative);
  if (!target.startsWith(STUDIO_RESOURCES) || !existsSync(target)) {
    return fail(response, 404, 'No such image');
  }
  const type = CONTENT_TYPES[extname(target)] ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type });
  createReadStream(target).pipe(response);
}

async function plan(input) {
  const asked = validated(input);
  const subjectRoot = root(asked.subject);
  const wanted = asked.views.filter((view) => asked.force || !already(subjectRoot, view));
  const planned = wanted.length * (asked.wireframe ? 2 : 1);
  return {
    subject: asked.subject, model: asked.model, views: asked.views, wanted,
    imageCount: planned, priceEach: PRICES[asked.model],
    estimate: Number((planned * PRICES[asked.model]).toFixed(3)),
    withinCeiling: planned <= CEILING, ceiling: CEILING,
  };
}

async function generate(request, response, input) {
  const asked = validated(input);
  const subjectRoot = root(asked.subject);
  const wanted = asked.views.filter((view) => asked.force || !already(subjectRoot, view));
  const planned = wanted.length * (asked.wireframe ? 2 : 1);
  if (planned > CEILING) {
    return fail(response, 400, `Refused: ${planned} images exceeds the ceiling of ${CEILING}.`);
  }
  if (planned === 0) {
    return fail(response, 400, 'Nothing to generate — every requested view already exists.');
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive',
  });
  const push = (event, data) => response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  mkdirSync(subjectRoot, { recursive: true });
  let key;
  try {
    key = secret();
  } catch (error) {
    push('error', { message: error.message });
    return response.end();
  }

  const totals = { drawn: 0, cost: 0, promptTokens: 0, candidateTokens: 0, totalTokens: 0 };
  let anchor = null;
  try {
    for (const view of wanted) {
      const made = await draw(key, asked.model, asked.brief, view, anchor, false);
      writeFileSync(join(subjectRoot, `${view}.${suffix(made.mime)}`), made.bytes);
      anchor = anchor ?? made.bytes;
      note(push, totals, asked.model, view, made, subjectRoot, asked.subject);
      if (!asked.wireframe) {
        continue;
      }
      const traced = await draw(key, asked.model, asked.brief, view, made.bytes, true);
      writeFileSync(join(subjectRoot, `${view}-wire.${suffix(traced.mime)}`), traced.bytes);
      note(push, totals, asked.model, `${view}-wire`, traced, subjectRoot, asked.subject);
    }
  } catch (error) {
    push('error', { message: error.message, totals });
    return response.end();
  }

  push('measure', { text: measureText(subjectRoot) });
  push('done', { totals });
  response.end();
}

function note(push, totals, model, label, made, subjectRoot, subject) {
  const cost = PRICES[model];
  totals.drawn += 1;
  totals.cost += cost;
  totals.promptTokens += made.usage.promptTokenCount ?? 0;
  totals.candidateTokens += made.usage.candidatesTokenCount ?? 0;
  totals.totalTokens += made.usage.totalTokenCount ?? 0;
  push('image', {
    label, kb: Math.round(made.bytes.length / 1024), seconds: made.seconds,
    promptTokens: made.usage.promptTokenCount ?? 0,
    candidateTokens: made.usage.candidatesTokenCount ?? 0,
    totalTokens: made.usage.totalTokenCount ?? 0,
    cost, runningCost: Number(totals.cost.toFixed(3)),
    url: `/resources/${subject}/${label}.${suffix(made.mime)}`,
  });
}

function validated(input) {
  const subject = String(input.subject ?? '').trim();
  const brief = String(input.brief ?? '').trim();
  const model = input.model ?? 'gemini-3.1-flash-lite-image';
  const views = Array.isArray(input.views) && input.views.length ? input.views : VIEWS;
  if (!subject) {
    throw new Error('Name a subject.');
  }
  if (!brief) {
    throw new Error('Describe the subject.');
  }
  if (!PRICES[model]) {
    throw new Error(`Unknown model '${model}'.`);
  }
  const stray = views.filter((view) => !VIEWS.includes(view));
  if (stray.length) {
    throw new Error(`Not a view: ${stray.join(', ')}.`);
  }
  return { subject, brief, model, views, force: Boolean(input.force), wireframe: Boolean(input.wireframe) };
}

function body(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => { raw += chunk; });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Malformed JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function json(response, status, data) {
  send(response, status, 'application/json', JSON.stringify(data));
}

function fail(response, status, message) {
  json(response, status, { error: message });
}

function send(response, status, type, body_) {
  response.writeHead(status, { 'Content-Type': type });
  response.end(body_);
}

server.listen(PORT, () => {
  console.log(`Kirigami reference-view generator on http://localhost:${PORT}`);
  console.log('Local only. The Gemini key stays in this process and never reaches the browser.');
});
