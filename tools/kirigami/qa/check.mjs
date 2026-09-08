import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { STUDIO_UPLOADS, WORKSPACE_ROOT, blenderBinary } from '../mcp/paths.mjs';

const INSPECTOR = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'qa', 'inspect.py');
const OUT = join(WORKSPACE_ROOT, 'test-results', 'kirigami-studio');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHEET = { width: 860, height: 1216 };

function main() {
  mkdirSync(OUT, { recursive: true });
  inspect();

  const report = JSON.parse(readFileSync(join(OUT, 'report.json'), 'utf8'));
  for (const model of report.models) {
    model.nets = model.nets.map((net) => ({ ...net, shot: rasterise(model, net) }));
    announce(model);
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(join(OUT, 'report.html'), sheet(report), 'utf8');
  console.log(`\n${report.models.length} models · snapshots in ${OUT}`);
  console.log(`contact sheet  ${join(OUT, 'report.html')}`);
  return report.failures.length ? 1 : 0;
}

function inspect() {
  try {
    execFileSync(blenderBinary(),
      ['--background', '--factory-startup', '--python', INSPECTOR, '--', STUDIO_UPLOADS, OUT],
      { stdio: 'pipe' });
  } catch (error) {
    if (!existsSync(join(OUT, 'report.json'))) {
      console.error('The inspector never produced a report.');
      console.error(String(error.stdout ?? '').split('\n').slice(-25).join('\n'));
      process.exit(1);
    }
  }
}

function rasterise(model, net) {
  if (!existsSync(CHROME) || !net.source) {
    return undefined;
  }
  const name = `net.${basename(net.file, '.svg')}.png`;
  const target = join(OUT, model.folder, name);
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--enable-unsafe-swiftshader', '--allow-file-access-from-files',
    `--screenshot=${target}`, `--window-size=${SHEET.width},${SHEET.height}`,
    '--default-background-color=FFFFFFFF',
    pathToFileURL(net.source).href,
  ], { stdio: 'pipe' });
  return existsSync(target) ? name : undefined;
}

function announce(model) {
  const view = model.views['three-quarter'] ?? {};
  const shots = model.nets.filter((net) => net.shot).length;
  console.log(
    `${model.problems.length ? '✗' : '✓'} ${model.id.padEnd(28)}`
    + ` ${String(view.blobs ?? '-').padStart(2)} blob(s)`
    + ` · solidity ${String(view.solidity ?? '-').padEnd(6)}`
    + ` · ${String(view.colours ?? '-').padStart(3)} colours in 3D`
    + ` · ${Object.keys(model.views).length} render(s) · ${shots}/${model.nets.length} net shot(s)`
  );
  model.problems.forEach((problem) => console.log(`    ${problem}`));
}

function sheet(report) {
  const cards = report.models.map((model) => `
  <section class="model${model.problems.length ? ' bad' : ''}">
    <h2>${model.title ?? model.id} <small>${model.tier} · ${model.shelf}</small></h2>
    <div class="strip">
      ${Object.entries(model.views).map(([view, shot]) => `
        <figure><img src="${model.folder}/${shot.file}" alt="${view}"><figcaption>${view} ·
        ${shot.blobs} blob(s) · solidity ${shot.solidity} · ${shot.colours} colours</figcaption></figure>`).join('')}
    </div>
    <div class="strip nets">
      ${model.nets.map((net) => net.shot
        ? `<figure><img src="${model.folder}/${net.shot}" alt="${net.file}"><figcaption>${net.file} ·
           ${net.colours} colours (declares ${net.declared})</figcaption></figure>`
        : `<figure class="missing"><figcaption>${net.file} · no snapshot</figcaption></figure>`).join('')}
    </div>
    ${model.problems.length ? `<ul>${model.problems.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
  </section>`).join('');

  return `<!doctype html><meta charset="utf-8"><title>Kirigami QA</title>
<style>
 body{font:15px/1.5 system-ui;margin:0;padding:28px;background:#f6f6f3;color:#1b1d22}
 h1{font-size:24px;margin:0 0 4px} .sub{color:#666;margin:0 0 26px}
 .model{background:#fff;border:1px solid #dcdcd6;border-radius:6px;padding:18px 20px;margin:0 0 18px}
 .model.bad{border-color:#8e3131}
 h2{font-size:17px;margin:0 0 12px} h2 small{font-weight:400;color:#83868d}
 .strip{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:12px}
 .nets img{background:#fff}
 figure{margin:0;width:220px} img{width:100%;background:#eceae4;border:1px solid #e4e4de;border-radius:4px}
 .missing{height:60px;display:flex;align-items:center}
 figcaption{font-size:11px;color:#666;margin-top:4px}
 ul{color:#8e3131;font-size:13px;margin:8px 0 0}
</style>
<h1>Kirigami QA</h1>
<p class="sub">${report.models.length} models · ${report.failures.length} failing</p>
${cards}`;
}

process.exit(main());
