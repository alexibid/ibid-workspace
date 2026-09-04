import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '@ibid/services';
import { ModelBox, ModelPrism, PaperModel } from '@domain/data/paper-models';

export interface BoxFace {
  readonly key: string;
  readonly transform: string;
  readonly width: number;
  readonly height: number;
  readonly shade: number;
  readonly front: boolean;
}

export interface RenderedBand {
  readonly transform: string;
  readonly length: number;
}

export interface RenderedPrism {
  readonly id: string;
  readonly hue: string;
  readonly edge: string;
  readonly clip: string;
  readonly depth: number;
  readonly origin: string;
  readonly bands: readonly RenderedBand[];
}

export interface RenderedBox {
  readonly id: string;
  readonly hue: string;
  readonly decor: string;
  readonly origin: string;
  readonly faces: readonly BoxFace[];
}

const DRAG_SENSITIVITY = 0.5;
const MAX_TILT = 62;
const NUDGE = 24;
const OPENING_SPIN = -32;
const OPENING_TILT = -10;

@Component({
  selector: 'camila-paper-model',
  standalone: true,
  templateUrl: './paper-model.html',
  styleUrl: './paper-model.scss',
})
export class PaperModelComponent implements AfterViewInit, OnDestroy {
  readonly model = input.required<PaperModel>();
  readonly ariaLabel = input('');

  protected readonly i18n = inject(I18nService);

  protected readonly spin = signal(OPENING_SPIN);
  protected readonly tilt = signal(OPENING_TILT);
  protected readonly scale = signal(1);

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly document = inject(DOCUMENT);
  private readonly resizes = this.createObserver();

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  protected readonly boxes = computed<readonly RenderedBox[]>(() =>
    this.model().boxes.map((box) => this.renderBox(box))
  );

  protected readonly prisms = computed<readonly RenderedPrism[]>(() =>
    this.model().prisms.map((prism) => this.renderPrism(prism))
  );

  protected readonly sceneTransform = computed(
    () => `scale(${this.scale()}) rotateX(${this.tilt()}deg) rotateY(${this.spin()}deg)`
  );

  ngAfterViewInit(): void {
    this.fitToStage();
    this.resizes?.observe(this.stage().nativeElement);
  }

  ngOnDestroy(): void {
    this.resizes?.disconnect();
  }

  protected onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.rotateBy(
      (event.clientX - this.lastX) * DRAG_SENSITIVITY,
      (this.lastY - event.clientY) * DRAG_SENSITIVITY
    );
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  protected onPointerUp(): void {
    this.dragging = false;
  }

  protected nudge(direction: number): void {
    this.rotateBy(direction * NUDGE, 0);
  }

  protected reset(): void {
    this.spin.set(OPENING_SPIN);
    this.tilt.set(OPENING_TILT);
  }

  protected spikeTransform(x: number, y: number, z: number): string {
    return `translate3d(${x}px, ${y}px, ${z}px)`;
  }

  private rotateBy(spinBy: number, tiltBy: number): void {
    this.spin.update((value) => value + spinBy);
    this.tilt.update((value) => Math.min(MAX_TILT, Math.max(-MAX_TILT, value + tiltBy)));
  }

  private renderBox(box: ModelBox): RenderedBox {
    const { width: w, height: h, depth: d } = box;

    return {
      id: box.id,
      hue: box.hue,
      decor: box.decor,
      origin: `translate3d(${box.x}px, ${box.y}px, ${box.z}px)`,
      faces: [
        { key: 'front', width: w, height: h, shade: 1, front: true, transform: `translateZ(${d / 2}px)` },
        { key: 'back', width: w, height: h, shade: 0.7, front: false, transform: `rotateY(180deg) translateZ(${d / 2}px)` },
        { key: 'right', width: d, height: h, shade: 0.84, front: false, transform: `rotateY(90deg) translateZ(${w / 2}px)` },
        { key: 'left', width: d, height: h, shade: 0.78, front: false, transform: `rotateY(-90deg) translateZ(${w / 2}px)` },
        { key: 'top', width: w, height: d, shade: 1.14, front: false, transform: `rotateX(90deg) translateZ(${h / 2}px)` },
        { key: 'bottom', width: w, height: d, shade: 0.62, front: false, transform: `rotateX(-90deg) translateZ(${h / 2}px)` },
      ],
    };
  }

  private renderPrism(prism: ModelPrism): RenderedPrism {
    return {
      id: prism.id,
      hue: prism.hue,
      edge: prism.edge,
      depth: prism.depth,
      clip: `polygon(${prism.profile.map(([x, y]) => `${x}px ${y}px`).join(', ')})`,
      origin: `translate3d(${prism.x}px, ${prism.y}px, ${prism.z}px)`,
      bands: prism.profile.map((point, index) => {
        const next = prism.profile[(index + 1) % prism.profile.length];
        const dx = next[0] - point[0];
        const dy = next[1] - point[1];
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return {
          length,
          transform:
            `translate(${(point[0] + next[0]) / 2}px, ${(point[1] + next[1]) / 2}px) ` +
            `rotateZ(${angle}deg) rotateX(90deg) ` +
            `translate(${-length / 2}px, ${-prism.depth / 2}px)`,
        };
      }),
    };
  }

  private createObserver(): ResizeObserver | undefined {
    const view = this.document.defaultView;
    if (!view?.ResizeObserver) return undefined;
    return new view.ResizeObserver(() => this.fitToStage());
  }

  private fitToStage(): void {
    const box = this.stage().nativeElement.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    const span = this.model().span;
    this.scale.set(Math.min((box.width * 0.92) / span, (box.height * 0.92) / span));
  }
}
