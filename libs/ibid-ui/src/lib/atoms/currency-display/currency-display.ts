import { Component, computed, inject, input, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { I18nService } from '@ibid/services';

export type CurrencyDisplaySize = 'sm' | 'md' | 'lg' | 'xl';

export interface CurrencyExplanationRow {
  readonly label: string;
  readonly value: string;
}

const BALLOON_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
];

interface MarkerShape {
  readonly transform: string;
  readonly left: string;
  readonly right: string;
  readonly borderRadius: string;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomCornerRadius(): string {
  return `${Math.round(randomBetween(2, 8))}px`;
}

function randomMarkerShape(): MarkerShape {
  return {
    transform: `rotate(${randomBetween(-2.5, 2.5).toFixed(2)}deg)`,
    left: `${Math.round(randomBetween(-6, -3))}px`,
    right: `${Math.round(randomBetween(-6, -3))}px`,
    borderRadius: `${randomCornerRadius()} ${randomCornerRadius()} ${randomCornerRadius()} ${randomCornerRadius()}`
  };
}

function randomSparkleWaypoints(): readonly [string, string][] {
  return Array.from({ length: 3 }, () => [
    `${Math.round(randomBetween(15, 85))}%`,
    `${Math.round(randomBetween(15, 85))}%`
  ]);
}

function markerStyle(shape: MarkerShape, sparkles: readonly [string, string][]): Record<string, string> {
  return {
    left: shape.left,
    right: shape.right,
    'border-radius': shape.borderRadius,
    transform: shape.transform,
    '--sparkle-1-top': sparkles[0][0],
    '--sparkle-1-left': sparkles[0][1],
    '--sparkle-2-top': sparkles[1][0],
    '--sparkle-2-left': sparkles[1][1],
    '--sparkle-3-top': sparkles[2][0],
    '--sparkle-3-left': sparkles[2][1],
    'animation-delay': `${randomBetween(0, 6).toFixed(2)}s`
  };
}

@Component({
  selector: 'ibid-currency-display',
  standalone: true,
  imports: [OverlayModule],
  template: `
    <span class="a-currency-display-wrapper">
      <span
        #trigger="cdkOverlayOrigin"
        cdkOverlayOrigin
        class="a-currency-display-hit-area"
        [class.a-currency-display-hit-area--interactive]="showInfo()"
        [attr.role]="showInfo() ? 'button' : null"
        [attr.tabindex]="showInfo() ? 0 : null"
        [attr.aria-label]="showInfo() ? explanationLabel() : null"
        [attr.aria-expanded]="showInfo() ? isOpen() : null"
        (click)="showInfo() && toggle()"
        (keydown.enter)="showInfo() && toggle()"
        (keydown.space)="onSpaceKey($event)"
      >
        @if (showInfo()) {
          <span
            class="a-currency-display-hit-area__mark"
            aria-hidden="true"
            [style]="markStyle"
          ></span>
        }

        <span
          class="a-currency-display"
          [class.a-currency-display--sm]="size() === 'sm'"
          [class.a-currency-display--md]="size() === 'md'"
          [class.a-currency-display--lg]="size() === 'lg'"
          [class.a-currency-display--xl]="size() === 'xl'"
          [class.a-currency-display--positive]="isPositive()"
          [class.a-currency-display--negative]="isNegative()"
        >{{ display() }}</span>

        @if (showInfo()) {
          <span class="a-currency-display__info" aria-hidden="true">i</span>
        }
      </span>

      @if (showInfo() && hasOpened()) {
        <ng-template
          cdkConnectedOverlay
          [cdkConnectedOverlayOrigin]="trigger"
          [cdkConnectedOverlayOpen]="isOpen()"
          [cdkConnectedOverlayPositions]="positions"
          [cdkConnectedOverlayHasBackdrop]="false"
          (overlayOutsideClick)="close()"
        >
          <div class="a-currency-display__balloon" role="dialog" [attr.aria-label]="explanationLabel()">
            @if (explanationTitle()) {
              <span class="a-currency-display__balloon-title">{{ explanationTitle() }}</span>
            }
            @for (row of balloonRows(); track row.label) {
              <div class="a-currency-display__balloon-row">
                <span class="a-currency-display__balloon-label">{{ row.label }}</span>
                <span class="a-currency-display__balloon-value">{{ row.value }}</span>
              </div>
            }
          </div>
        </ng-template>
      }
    </span>
  `,
  styleUrl: './currency-display.scss'
})
export class CurrencyDisplayComponent {
  private readonly i18n = inject(I18nService);

  protected readonly positions = BALLOON_POSITIONS;
  protected readonly markStyle = markerStyle(randomMarkerShape(), randomSparkleWaypoints());

  readonly value = input.required<number | undefined>();
  readonly size = input<CurrencyDisplaySize>('lg');

  readonly signed = input(false);

  readonly showPositiveSign = input(false);

  readonly absolute = input(false);

  readonly showInfo = input(true);

  readonly explanation = input<readonly CurrencyExplanationRow[]>([]);
  readonly explanationTitle = input('');

  protected readonly isOpen = signal(false);

  protected readonly hasOpened = signal(false);

  protected readonly balloonRows = computed<readonly CurrencyExplanationRow[]>(() => {
    const rows = this.explanation();
    if (rows.length > 0) return rows;
    return [{ label: this.i18n.translate('smartCurrencyCellAmountLabel'), value: this.display() }];
  });

  protected readonly explanationLabel = computed(() =>
    this.explanationTitle() || this.i18n.translate('currencyExplanationLabel')
  );

  protected readonly display = computed(() => {
    const value = this.value();
    if (value === undefined) return '—';

    const amount = this.absolute() ? Math.abs(value) : value;
    const formatted = this.i18n.formatCurrency(amount);
    return this.showPositiveSign() && amount > 0 ? `+${formatted}` : formatted;
  });

  protected readonly isPositive = computed(() => this.signed() && (this.value() ?? 0) > 0);
  protected readonly isNegative = computed(() => this.signed() && (this.value() ?? 0) < 0);

  toggle(): void {
    this.hasOpened.set(true);
    this.isOpen.set(!this.isOpen());
  }

  onSpaceKey(event: Event): void {
    if (!this.showInfo()) return;
    event.preventDefault();
    this.toggle();
  }

  close(): void {
    this.isOpen.set(false);
  }
}
