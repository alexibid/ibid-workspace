import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
  inject,
  input
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type HandDrawnIntensity = 1 | 2 | 3 | 4 | 5;
export type HandDrawnEdge = 'top' | 'bottom' | 'left' | 'right';

export interface HandDrawnConfig {
  readonly intensity?: HandDrawnIntensity;
  readonly edges?: readonly HandDrawnEdge[];
}

interface IntensityRange {
  readonly cornerR: readonly [number, number];
  readonly bulgeY: readonly [number, number];
  readonly bulgeX: readonly [number, number];
  readonly skewX: readonly [number, number];
  readonly skewY: readonly [number, number];
}

export const INTENSITY_RANGES: Record<HandDrawnIntensity, IntensityRange> = {
  1: {
    cornerR: [0.040, 0.055],
    bulgeY: [0.005, 0.010],
    bulgeX: [0.005, 0.010],
    skewX: [-0.010, 0.010],
    skewY: [-0.008, 0.008]
  },
  2: {
    cornerR: [0.065, 0.085],
    bulgeY: [0.010, 0.018],
    bulgeX: [0.010, 0.020],
    skewX: [-0.020, 0.020],
    skewY: [-0.015, 0.015]
  },
  3: {
    cornerR: [0.095, 0.120],
    bulgeY: [0.018, 0.030],
    bulgeX: [0.020, 0.032],
    skewX: [-0.032, 0.032],
    skewY: [-0.025, 0.025]
  },
  4: {
    cornerR: [0.125, 0.155],
    bulgeY: [0.028, 0.045],
    bulgeX: [0.030, 0.048],
    skewX: [-0.048, 0.048],
    skewY: [-0.038, 0.038]
  },
  5: {
    cornerR: [0.160, 0.200],
    bulgeY: [0.040, 0.065],
    bulgeX: [0.042, 0.070],
    skewX: [-0.065, 0.065],
    skewY: [-0.050, 0.050]
  }
};

const ALL_EDGES: readonly HandDrawnEdge[] = ['top', 'bottom', 'left', 'right'];
const SVG_ROOT_ID = 'ibid-pebble-svg-defs';
let pebbleSequence = 0;

function getOrCreateSvgRoot(doc: Document): SVGSVGElement | null {
  if (!doc || !doc.body) {
    return null;
  }
  let svg = doc.getElementById(SVG_ROOT_ID) as unknown as SVGSVGElement | null;
  if (!svg) {
    svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.setAttribute('id', SVG_ROOT_ID);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute(
      'style',
      'position: absolute; width: 0; height: 0; pointer-events: none; overflow: hidden;'
    );
    doc.body.appendChild(svg);
  }
  return svg;
}

function registerClipPath(doc: Document, clipId: string, dNorm: string): void {
  const svgRoot = getOrCreateSvgRoot(doc);
  if (!svgRoot) {
    return;
  }
  let clipEl = svgRoot.querySelector(`#${clipId}`) as SVGClipPathElement | null;
  if (!clipEl) {
    clipEl = doc.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipEl.setAttribute('id', clipId);
    clipEl.setAttribute('clipPathUnits', 'objectBoundingBox');
    const pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', dNorm);
    clipEl.appendChild(pathEl);
    svgRoot.appendChild(clipEl);
  } else {
    const pathEl = clipEl.querySelector('path');
    if (pathEl) {
      pathEl.setAttribute('d', dNorm);
    }
  }
}

function removeClipPath(doc: Document, clipId: string): void {
  if (!doc) {
    return;
  }
  const clipEl = doc.getElementById(clipId);
  if (clipEl && clipEl.parentNode) {
    clipEl.parentNode.removeChild(clipEl);
  }
}

export function parseHandDrawnConfig(
  value: HandDrawnConfig | HandDrawnIntensity | '' | boolean | null | undefined
): Required<HandDrawnConfig> {
  if (value === '' || value === true || value === undefined || value === null) {
    return { intensity: 2, edges: ALL_EDGES };
  }

  if (typeof value === 'number') {
    const clamped = Math.min(5, Math.max(1, Math.round(value))) as HandDrawnIntensity;
    return { intensity: clamped, edges: ALL_EDGES };
  }

  if (typeof value === 'object') {
    const intensity =
      typeof value.intensity === 'number'
        ? (Math.min(5, Math.max(1, Math.round(value.intensity))) as HandDrawnIntensity)
        : 2;
    const edges = value.edges && value.edges.length > 0 ? value.edges : ALL_EDGES;
    return { intensity, edges };
  }

  return { intensity: 2, edges: ALL_EDGES };
}

export function generatePebbleNormalizedPath(
  intensity: HandDrawnIntensity,
  edges: readonly HandDrawnEdge[] = ALL_EDGES
): string {
  const cfg = INTENSITY_RANGES[intensity] ?? INTENSITY_RANGES[2];
  const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

  const hasTop = edges.includes('top');
  const hasBottom = edges.includes('bottom');
  const hasLeft = edges.includes('left');
  const hasRight = edges.includes('right');

  const rTL = hasTop && hasLeft ? rnd(cfg.cornerR[0], cfg.cornerR[1]) : 0;
  const rTR = hasTop && hasRight ? rnd(cfg.cornerR[0], cfg.cornerR[1]) : 0;
  const rBR = hasBottom && hasRight ? rnd(cfg.cornerR[0], cfg.cornerR[1]) : 0;
  const rBL = hasBottom && hasLeft ? rnd(cfg.cornerR[0], cfg.cornerR[1]) : 0;

  const skewX = rnd(cfg.skewX[0], cfg.skewX[1]);
  const skewY = rnd(cfg.skewY[0], cfg.skewY[1]);

  const bulgeTop = hasTop ? rnd(cfg.bulgeY[0], cfg.bulgeY[1]) : 0;
  const bulgeBottom = hasBottom ? rnd(cfg.bulgeY[0], cfg.bulgeY[1]) : 0;
  const bulgeRight = hasRight ? rnd(cfg.bulgeX[0], cfg.bulgeX[1]) : 0;
  const bulgeLeft = hasLeft ? rnd(cfg.bulgeX[0], cfg.bulgeX[1]) : 0;

  const tl_start = { x: Math.max(0, -skewX), y: rTL + Math.max(0, -skewY) };
  const tl_end = { x: rTL + Math.max(0, -skewX), y: Math.max(0, -skewY) };

  const tr_start = { x: 1 - rTR - Math.max(0, skewX), y: Math.max(0, skewY) };
  const tr_end = { x: 1 - Math.max(0, skewX), y: rTR + Math.max(0, skewY) };

  const br_start = { x: 1 - Math.max(0, skewX), y: 1 - rBR - Math.max(0, -skewY) };
  const br_end = { x: 1 - rBR - Math.max(0, skewX), y: 1 - Math.max(0, -skewY) };

  const bl_start = { x: rBL + Math.max(0, -skewX), y: 1 - Math.max(0, skewY) };
  const bl_end = { x: Math.max(0, -skewX), y: 1 - rBL - Math.max(0, skewY) };

  const topPeak = {
    x: 0.5 + skewX * 0.5,
    y: Math.max(0, Math.min(tl_end.y, tr_start.y) - bulgeTop)
  };
  const rightPeak = {
    x: Math.min(1, Math.max(tr_end.x, br_start.x) + bulgeRight),
    y: 0.5 + skewY * 0.5
  };
  const bottomPeak = {
    x: 0.5 - skewX * 0.5,
    y: Math.min(1, Math.max(bl_start.y, br_end.y) + bulgeBottom)
  };
  const leftPeak = {
    x: Math.max(0, Math.min(tl_start.x, bl_end.x) - bulgeLeft),
    y: 0.5 - skewY * 0.5
  };

  const k = 0.5522847498;
  const krTL = rTL * k;
  const krTR = rTR * k;
  const krBR = rBR * k;
  const krBL = rBL * k;

  const f = (n: number) => n.toFixed(4);

  return [
    `M ${f(tl_end.x)},${f(tl_end.y)}`,
    `Q ${f(topPeak.x)},${f(topPeak.y)} ${f(tr_start.x)},${f(tr_start.y)}`,
    `C ${f(tr_start.x + krTR)},${f(tr_start.y)} ${f(tr_end.x)},${f(tr_end.y - krTR)} ${f(tr_end.x)},${f(tr_end.y)}`,
    `Q ${f(rightPeak.x)},${f(rightPeak.y)} ${f(br_start.x)},${f(br_start.y)}`,
    `C ${f(br_start.x)},${f(br_start.y + krBR)} ${f(br_end.x + krBR)},${f(br_end.y)} ${f(br_end.x)},${f(br_end.y)}`,
    `Q ${f(bottomPeak.x)},${f(bottomPeak.y)} ${f(bl_start.x)},${f(bl_start.y)}`,
    `C ${f(bl_start.x - krBL)},${f(bl_start.y)} ${f(bl_end.x)},${f(bl_end.y + krBL)} ${f(bl_end.x)},${f(bl_end.y)}`,
    `Q ${f(leftPeak.x)},${f(leftPeak.y)} ${f(tl_start.x)},${f(tl_start.y)}`,
    `C ${f(tl_start.x)},${f(tl_start.y - krTL)} ${f(tl_end.x - krTL)},${f(tl_end.y)} ${f(tl_end.x)},${f(tl_end.y)}`,
    `Z`
  ].join(' ');
}

@Directive({
  selector: '[ibidHandDrawn]',
  exportAs: 'ibidHandDrawn',
  standalone: true
})
export class HandDrawnDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);

  private readonly clipId = `ibid-pebble-${++pebbleSequence}`;

  readonly config = input<
    Required<HandDrawnConfig>,
    HandDrawnConfig | HandDrawnIntensity | '' | boolean | null | undefined
  >(
    { intensity: 2, edges: ALL_EDGES },
    {
      alias: 'ibidHandDrawn',
      transform: parseHandDrawnConfig
    }
  );

  private manualConfig?: Required<HandDrawnConfig>;

  setConfiguration(config: HandDrawnConfig | HandDrawnIntensity): void {
    this.manualConfig = parseHandDrawnConfig(config);
    this.apply();
  }

  ngOnInit(): void {
    this.apply();
  }

  ngOnDestroy(): void {
    removeClipPath(this.doc, this.clipId);
  }

  private apply(): void {
    const activeConfig = this.manualConfig ?? this.config();
    const dNorm = generatePebbleNormalizedPath(activeConfig.intensity, activeConfig.edges);

    registerClipPath(this.doc, this.clipId, dNorm);

    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    const gleamAngle = r(106, 148);
    const washAngle = r(110, 152);

    const clipUrl = `url(#${this.clipId})`;

    this.renderer.setStyle(
      this.el.nativeElement,
      'clip-path',
      clipUrl,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--ibid-contour-clip',
      clipUrl,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--ibid-contour-corners',
      clipUrl,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--hand-drawn-intensity',
      `${activeConfig.intensity}`,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--glass-gleam-angle',
      `${gleamAngle}deg`,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--glass-angle',
      `${washAngle}deg`,
      RendererStyleFlags2.DashCase
    );
  }
}

