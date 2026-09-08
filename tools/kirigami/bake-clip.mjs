import { readFileSync, writeFileSync } from 'node:fs';
import polygonClipping from 'polygon-clipping';

const CURVE_STEPS = 16;
const ERODE = 0.0;

function signedArea(ring) {
  let a = 0;
  for (let k = 0; k < ring.length - 1; k++) a += ring[k][0]*ring[k+1][1] - ring[k+1][0]*ring[k][1];
  return a / 2;
}

function erode(ring, d) {
  const pts = ring.slice(0, -1);
  const n = pts.length;
  if (n < 3) return ring;
  const inward = signedArea(ring) > 0 ? -1 : 1;
  const out = [];
  for (let k = 0; k < n; k++) {
    const prev = pts[(k - 1 + n) % n], cur = pts[k], next = pts[(k + 1) % n];
    const n1 = norm(prev, cur), n2 = norm(cur, next);
    let bx = n1[0] + n2[0], by = n1[1] + n2[1];
    const len = Math.hypot(bx, by);
    if (len < 1e-9) { out.push(cur); continue; }
    bx /= len; by /= len;
    const cos = Math.max(0.35, bx * n1[0] + by * n1[1]);
    out.push([cur[0] + inward * bx * d / cos, cur[1] + inward * by * d / cos]);
  }
  out.push(out[0]);
  return out;
}

function norm(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1e-9;
  return [dy / l, -dx / l];
}

function parsePath(d) {
  const tokens = d.match(/[MLCHVZmlchvz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const rings = [];
  let ring = [];
  let cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  let i = 0;
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLCHVZmlchvz]/.test(t)) { cmd = t; i++; }
    switch (cmd) {
      case 'M':
        if (ring.length >= 3) rings.push(ring);
        cx = num(); cy = num(); sx = cx; sy = cy; ring = [[cx, cy]]; cmd = 'L'; break;
      case 'L': cx = num(); cy = num(); ring.push([cx, cy]); break;
      case 'H': cx = num(); ring.push([cx, cy]); break;
      case 'V': cy = num(); ring.push([cx, cy]); break;
      case 'C': {
        const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const u = s / CURVE_STEPS, v = 1 - u;
          ring.push([
            v*v*v*cx + 3*v*v*u*x1 + 3*v*u*u*x2 + u*u*u*x,
            v*v*v*cy + 3*v*v*u*y1 + 3*v*u*u*y2 + u*u*u*y,
          ]);
        }
        cx = x; cy = y; break;
      }
      case 'Z': case 'z':
        if (ring.length >= 3) { ring.push([sx, sy]); rings.push(ring); ring = []; }
        cx = sx; cy = sy; cmd = ''; break;
      default: i++; break;
    }
  }
  if (ring.length >= 3) rings.push(ring);
  return rings.map(closeRing);
}

function closeRing(r) {
  const [fx, fy] = r[0], [lx, ly] = r[r.length - 1];
  return (fx === lx && fy === ly) ? r : [...r, [fx, fy]];
}

function area(ring) {
  let a = 0;
  for (let k = 0; k < ring.length - 1; k++) a += ring[k][0]*ring[k+1][1] - ring[k+1][0]*ring[k][1];
  return Math.abs(a) / 2;
}

function bbox(rings) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rings) for (const [x, y] of r) {
    if (x < x0) x0 = x; if (y < y0) y0 = y;
    if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

const overlaps = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

function pointInRing([px, py], ring) {
  let inside = false;
  for (let k = 0, j = ring.length - 1; k < ring.length; j = k++) {
    const [xi, yi] = ring[k], [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function toMultiPolygon(rings) {
  const sorted = [...rings].sort((a, b) => area(b) - area(a));
  const polys = [];
  for (const ring of sorted) {
    const host = polys.find((poly) => pointInRing(ring[0], poly[0]));
    if (host) host.push(ring);
    else polys.push([ring]);
  }
  return polys;
}

function toPathData(multi) {
  return multi.map((poly) => poly.map((ring) =>
    'M ' + ring.map(([x, y], k) => `${k ? 'L ' : ''}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + ' Z'
  ).join(' ')).join(' ');
}

const [, , src, dst] = process.argv;
let svg = readFileSync(src, 'utf8');

const clips = new Map();
for (const m of svg.matchAll(/<clipPath id="([^"]+)">\s*<path[^>]*\sd="([^"]+)"[^>]*\/>\s*<\/clipPath>/g)) {
  const rings = parsePath(m[2]);
  rings.sort((a, b) => area(b) - area(a));
  clips.set(m[1], rings.slice(1).map((r) => [[erode(r, ERODE)]]));
}

let flattened = 0, untouched = 0;
svg = svg.replace(/<g id="([^"]+)" clip-path="url\(#([^)]+)\)">([\s\S]*?)<\/g>/g,
  (whole, gid, clipId, body) => {
    const gaps = clips.get(clipId) ?? [];
    const gapBoxes = gaps.map((g) => bbox(g[0]));
    const next = body.replace(/<path([^>]*?)\sd="([^"]+)"([^>]*?)\/>/g, (tag, pre, d, post) => {
      const rings = parsePath(d);
      if (!rings.length) return tag;
      const fill = (tag.match(/fill="([^"]+)"/) ?? [])[1]?.toUpperCase() ?? '';
      const KEYLINE = ['#0D0606', '#040303', '#2E0507', '#1C0305', '#51060A'];
      if (KEYLINE.includes(fill)) { untouched++; return tag; }
      const box = bbox(rings);
      const hit = gaps.filter((_, k) => overlaps(box, gapBoxes[k]));
      if (!hit.length) { untouched++; return tag; }
      let result;
      try {
        result = polygonClipping.difference(toMultiPolygon(rings), ...hit);
      } catch {
        untouched++; return tag;
      }
      if (!result.length) return '';
      try { result = polygonClipping.union(result); } catch { /* keep as is */ }
      flattened++;
      return `<path${pre} d="${toPathData(result)}"${post}/>`;
    });
    return `<g id="${gid}">${next}</g>`;
  });

svg = svg.replace(/<clipPath id="[^"]+">[\s\S]*?<\/clipPath>\s*/g, '');
writeFileSync(dst, svg);
console.log(`recortados por booleano: ${flattened}   intactos (curvas preservadas): ${untouched}`);
