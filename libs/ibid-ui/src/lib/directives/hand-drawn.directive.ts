import {
  Directive,
  ElementRef,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
  inject,
  input
} from '@angular/core';

export type HandDrawnIntensity = 1 | 2 | 3 | 4 | 5;
export type HandDrawnEdge = 'top' | 'bottom' | 'left' | 'right';

export interface HandDrawnConfig {
  readonly intensity?: HandDrawnIntensity;
  readonly edges?: readonly HandDrawnEdge[];
}

interface IntensityPreset {
  readonly minH: number;
  readonly maxH: number;
  readonly minL: number;
  readonly maxL: number;
  readonly minCorner: number;
  readonly maxCorner: number;
}

/**
 * Every measure is a range, never a single number: two elements at the same intensity read as the
 * same hand drawing twice, not as one shape stamped twice. The corner bands stay clear of one
 * another so the five intensities remain distinguishable.
 */
const INTENSITY_PRESETS: Record<HandDrawnIntensity, IntensityPreset> = {
  1: { minH: 97, maxH: 99, minL: 1, maxL: 3, minCorner: 7, maxCorner: 10 },
  2: { minH: 94, maxH: 96, minL: 4, maxL: 6, minCorner: 12, maxCorner: 16 },
  3: { minH: 90, maxH: 93, minL: 7, maxL: 10, minCorner: 18, maxCorner: 22 },
  4: { minH: 85, maxH: 89, minL: 11, maxL: 15, minCorner: 24, maxCorner: 29 },
  5: { minH: 75, maxH: 84, minL: 16, maxL: 25, minCorner: 31, maxCorner: 38 }
};

const ALL_EDGES: readonly HandDrawnEdge[] = ['top', 'bottom', 'left', 'right'];

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

@Directive({
  selector: '[ibidHandDrawn]',
  exportAs: 'ibidHandDrawn',
  standalone: true
})
export class HandDrawnDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

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

  private apply(): void {
    const activeConfig = this.manualConfig ?? this.config();
    const config = INTENSITY_PRESETS[activeConfig.intensity] ?? INTENSITY_PRESETS[2];
    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    const corner = () => `${r(config.minCorner, config.maxCorner)}px`;

    const edges = activeConfig.edges;
    const isAllEdges = edges.length === 4;

    let value = '';
    let clipPathValue = '';

    if (isAllEdges) {
      const leanLeft = Math.random() > 0.5;

      const h1 = r(config.minH, config.maxH);
      const h2 = r(config.minH, config.maxH);
      const l1 = r(config.minL, config.maxL);
      const l2 = r(config.minL, config.maxL);

      const tl1 = leanLeft ? h1 : l1;
      const tr1 = leanLeft ? l1 : h1;
      const br1 = leanLeft ? h2 : l2;
      const bl1 = leanLeft ? l2 : h2;

      const tl2 = leanLeft ? l1 : h1;
      const tr2 = leanLeft ? h1 : l1;
      const br2 = leanLeft ? l2 : h2;
      const bl2 = leanLeft ? h2 : l2;

      value = `${tl1}% ${tr1}% ${br1}% ${bl1}% / ${tl2}% ${tr2}% ${br2}% ${bl2}%`;
      clipPathValue = `inset(0 round ${corner()} ${corner()} ${corner()} ${corner()})`;
    } else {
      const top = edges.includes('top');
      const bottom = edges.includes('bottom');
      const left = edges.includes('left');
      const right = edges.includes('right');

      const p1 = r(config.minH, config.maxH);
      const p2 = r(config.minH, config.maxH);
      const p3 = r(config.minL, config.maxL);
      const p4 = r(config.minL, config.maxL);

      const tl1 = top && left ? p1 : 0;
      const tr1 = top && right ? p2 : 0;
      const br1 = bottom && right ? p1 : 0;
      const bl1 = bottom && left ? p2 : 0;

      const tl2 = top && left ? p3 : 0;
      const tr2 = top && right ? p4 : 0;
      const br2 = bottom && right ? p3 : 0;
      const bl2 = bottom && left ? p4 : 0;

      value = `${tl1 ? tl1 + '%' : '0'} ${tr1 ? tr1 + '%' : '0'} ${br1 ? br1 + '%' : '0'} ${bl1 ? bl1 + '%' : '0'} / ${tl2 ? tl2 + '%' : '0'} ${tr2 ? tr2 + '%' : '0'} ${br2 ? br2 + '%' : '0'} ${bl2 ? bl2 + '%' : '0'}`;

      const ctl = top && left ? corner() : '0';
      const ctr = top && right ? corner() : '0';
      const cbr = bottom && right ? corner() : '0';
      const cbl = bottom && left ? corner() : '0';

      clipPathValue = `inset(0 round ${ctl} ${ctr} ${cbr} ${cbl})`;
    }

    const gleamAngle = r(106, 148);
    const washAngle = r(110, 152);

    this.renderer.addClass(this.el.nativeElement, 'o-hand-drawn');
    this.renderer.setStyle(
      this.el.nativeElement,
      'border-radius',
      value,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      'clip-path',
      clipPathValue,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--ibid-contour-edges',
      value,
      RendererStyleFlags2.DashCase
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      '--ibid-contour-corners',
      clipPathValue,
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
