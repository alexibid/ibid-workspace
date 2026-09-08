import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { RUN_JOB, blenderBinary } from './paths.mjs';

const DEFAULT_TIMEOUT_MS = 300_000;

export class BlenderFailure extends Error {
  constructor(message, detail) {
    super(message);
    this.detail = detail;
  }
}

export function runBlender(args, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((settle, fail) => {
    const child = spawn(blenderBinary(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = { out: '', err: '' };
    const alarm = setTimeout(() => {
      child.kill('SIGKILL');
      fail(new BlenderFailure(`Blender did not finish within ${timeoutMs / 1000}s.`, chunks.out));
    }, timeoutMs);

    child.stdout.on('data', (data) => { chunks.out += data; });
    child.stderr.on('data', (data) => { chunks.err += data; });
    child.on('error', (error) => {
      clearTimeout(alarm);
      fail(new BlenderFailure(`Could not launch '${blenderBinary()}': ${error.message}`, ''));
    });
    child.on('close', (code) => {
      clearTimeout(alarm);
      settle({ code, stdout: chunks.out, stderr: chunks.err });
    });
  });
}

export async function runJob(jobPath, outDir, resultPath, options) {
  const args = ['--background', '--factory-startup', '--python', RUN_JOB,
    '--', '--job', jobPath, '--out', outDir, '--result', resultPath];
  const started = Date.now();
  const { code, stdout, stderr } = await runBlender(args, options);
  const seconds = Number(((Date.now() - started) / 1000).toFixed(1));
  if (existsSync(resultPath)) {
    return { ...JSON.parse(readFileSync(resultPath, 'utf8')), seconds };
  }
  throw new BlenderFailure(
    `Blender exited with code ${code} without writing a result to ${resultPath}.`,
    tail(`${stdout}\n${stderr}`)
  );
}

export async function probe() {
  const { stdout } = await runBlender(['--version'], { timeoutMs: 30_000 });
  const version = stdout.split('\n')[0]?.trim() ?? 'unknown';
  const { stdout: addonOut } = await runBlender(
    ['--background', '--factory-startup', '--python-expr',
      'import bpy;bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.export_paper_model");print("PAPER_MODEL_OK")'],
    { timeoutMs: 60_000 }
  );
  return {
    binary: blenderBinary(),
    version,
    paperModelAddon: addonOut.includes('PAPER_MODEL_OK'),
  };
}


function tail(text, lines = 40) {
  return text.trim().split('\n').slice(-lines).join('\n');
}
