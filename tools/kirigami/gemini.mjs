import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { STUDIO_RESOURCES, WORKSPACE_ROOT } from './mcp/paths.mjs';

export const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
export const PYTHON = process.env.KIRIGAMI_PYTHON
  ?? join(process.env.HOME ?? '', 'Projects/local-models/kirigami/venv/bin/python');
export const MEASURE = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'vision', 'measure_views.py');
export const SECRETS = join(WORKSPACE_ROOT, 'apps', 'kirigami-studio', '.env');
export const VIEWS = ['front', 'back', 'left', 'right', 'top'];
export const PRICES = {
  'gemini-3.1-flash-lite-image': 0.02,
  'gemini-3.1-flash-image': 0.067,
  'gemini-3-pro-image': 0.134,
};
const SIZES = {
  'gemini-3.1-flash-lite-image': null,
  'gemini-3.1-flash-image': '2K',
  'gemini-3-pro-image': '2K',
};
const SUFFIXES = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' };
const ANGLES = {
  front: 'facing the camera, head on',
  back: 'rotated 180 degrees, seen from directly behind',
  left: 'rotated 90 degrees, showing its left side in full profile',
  right: 'rotated 90 degrees the other way, showing its right side in full profile',
  top: 'seen from directly above, nose toward the top of the frame',
};
const WIRE = `Redraw the attached photograph as a precise technical line drawing of its fold
structure only: pure white background, solid black lines of uniform weight, no fill, no
shading, no colour, no grey values, no texture, no hatching, no sketchy or doubled lines.

Draw exactly two kinds of line and nothing else: the outer silhouette, and every crease where
two flat facets meet. Omit every printed or sculpted detail that is not a fold: no eyes, no
pupils, no nose, no mouth, no whiskers, no printed markings, no patterns, no decorative dots,
no texture hints, no construction guides, no dimension marks, no shading strokes.

Every line is a straight geometric segment between two real vertices of the folded form, drawn
with the precision of a technical diagram, never a curved or freehand stroke. The silhouette,
proportions and camera framing must match the attached image exactly, pixel for pixel: same
object, same angle, same absolute size and position in frame.`;
const STYLE = `Low-poly papercraft figure folded from matte card stock. Every surface is a flat
triangular facet with a visible fold crease. No smooth shading, no rounded surfaces, no gloss.
Two to six flat colour zones with hard edges, no gradients inside a zone. Facial features are
flat shapes printed on the surface, never sculpted volume.

One flat mid-grey background that appears nowhere on the subject. The subject floats against
that background with no ground contact whatsoever: no cast shadow, no contact shadow, no
darkening anywhere near the feet, no ground plane, no horizon, no reflection, no gradient,
no vignette, no text, no watermark. Every pixel that is not the subject is exactly the same
grey.

The subject fills about 85 percent of the frame, centred, with even margin all round. Camera
level with the middle of the subject. No perspective convergence: parallel edges stay parallel.
Limbs visibly separate, with background showing through the gap between the legs.

This subject has one fixed physical size, in millimetres, that does not change between views —
only the camera orbits around it. Its silhouette must occupy the same pixel height in every
view that shows its standing height (front, back, left, right), and front and back must share
the same body width, and left and right must share the same body length, since they are mirror
profiles of the same rigid object.`;

export function root(subject) {
  return join(STUDIO_RESOURCES, subject);
}

export function already(subjectRoot, view) {
  return Object.values(SUFFIXES).some((ext) => existsSync(join(subjectRoot, `${view}.${ext}`)));
}

export function suffix(mime) {
  const known = SUFFIXES[mime];
  if (!known) {
    throw new Error(`The model returned an unexpected image type: ${mime}`);
  }
  return known;
}

export function frame(model) {
  const size = SIZES[model];
  return size ? { aspectRatio: '16:9', imageSize: size } : { aspectRatio: '16:9' };
}

export function secret() {
  if (!existsSync(SECRETS)) {
    throw new Error(`No .env at ${SECRETS}`);
  }
  const found = /^GEMINI_API_KEY=(.*)$/m.exec(readFileSync(SECRETS, 'utf8'));
  if (!found) {
    throw new Error('GEMINI_API_KEY is not set in the .env');
  }
  return found[1].trim().replace(/^["']|["']$/g, '');
}

export async function draw(key, model, brief, view, anchor, wire) {
  const parts = wire
    ? [{ inlineData: { mimeType: 'image/jpeg', data: anchor.toString('base64') } },
       { text: WIRE }]
    : [{ text: `${brief}\n\nThis view: the subject ${ANGLES[view]}.\n\n${STYLE}` }];
  if (anchor && !wire) {
    parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: anchor.toString('base64') } });
    parts.push({ text: 'Match the attached image exactly: the same physical object at the same '
      + 'physical size, the same colours in the same places, the same absolute silhouette height '
      + 'in pixels, the same lens. Only the angle changes — never the scale.' });
  }

  const started = Date.now();
  const answer = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { imageConfig: frame(model) },
    }),
  });
  const body = await answer.json();
  if (body.error) {
    throw new Error(`${view}: ${answer.status} ${body.error.status} — ${body.error.message}`);
  }
  const image = (body.candidates?.[0]?.content?.parts ?? []).find((part) => part.inlineData);
  if (!image) {
    throw new Error(`${view}: the model answered without an image`);
  }
  return {
    bytes: Buffer.from(image.inlineData.data, 'base64'),
    mime: image.inlineData.mimeType,
    seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
    usage: body.usageMetadata ?? {},
  };
}

export function measureText(subjectRoot) {
  const ran = spawnSync(PYTHON, [MEASURE, '--root', subjectRoot], { encoding: 'utf8' });
  if (ran.error || ran.status !== 0) {
    return `(proportion check skipped: ${ran.error?.message ?? ran.stderr.trim()})`;
  }
  return ran.stdout.trim();
}
