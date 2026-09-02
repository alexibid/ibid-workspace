import { Component, computed, inject, input, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { I18nService } from '@ibid/services';
import { FeatureExplanationRow } from '../../models/ui.model';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

export type FeatureDisplaySize = 'sm' | 'md' | 'lg' | 'xl';

const BALLOON_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function decorationStyle(): Record<string, string> {
  return {
    '--feature-delay': `${randomBetween(0, 6).toFixed(2)}s`,
    '--feature-lean': `${randomBetween(-1.6, 1.6).toFixed(2)}deg`
  };
}

@Component({
  selector: 'ibid-feature-display, ibid-currency-display',
  standalone: true,
  imports: [OverlayModule, HandDrawnDirective],
  template: `
    <span class="a-feature-display-wrapper">
      <span
        #trigger="cdkOverlayOrigin"
        cdkOverlayOrigin
        class="a-feature-display-hit-area"
        [class.a-feature-display-hit-area--interactive]="showInfo()"
        ibidHandDrawn
        [style]="decorStyle"
        [attr.role]="showInfo() ? 'button' : null"
        [attr.tabindex]="showInfo() ? 0 : null"
        [attr.aria-label]="showInfo() ? explanationLabel() : null"
        [attr.aria-expanded]="showInfo() ? isOpen() : null"
        (click)="showInfo() && toggle()"
        (keydown.enter)="showInfo() && toggle()"
        (keydown.space)="onSpaceKey($event)"
      >
        <span
          class="a-feature-display"
          [class.a-feature-display--sm]="size() === 'sm'"
          [class.a-feature-display--md]="size() === 'md'"
          [class.a-feature-display--lg]="size() === 'lg'"
          [class.a-feature-display--xl]="size() === 'xl'"
          [class.a-feature-display--positive]="isPositive()"
          [class.a-feature-display--negative]="isNegative()"
        >{{ display() }}</span>

        @if (showInfo()) {
          <span class="a-feature-display__info" aria-hidden="true">i</span>
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
          <div class="a-feature-display__balloon" role="dialog" [attr.aria-label]="explanationLabel()">
            @if (explanationTitle()) {
              <span class="a-feature-display__balloon-title">{{ explanationTitle() }}</span>
            }
            @for (row of balloonRows(); track row.label) {
              <div class="a-feature-display__balloon-row">
                <span class="a-feature-display__balloon-label">{{ row.label }}</span>
                <span class="a-feature-display__balloon-value">{{ row.value }}</span>
              </div>
            }
          </div>
        </ng-template>
      }
    </span>
  `,
  styleUrl: './feature-display.scss'
})
export class FeatureDisplayComponent {
  private readonly i18n = inject(I18nService);

  protected readonly positions = BALLOON_POSITIONS;
  protected readonly decorStyle = decorationStyle();

  readonly value = input.required<number | undefined>();
  readonly size = input<FeatureDisplaySize>('lg');

  readonly signed = input(false);

  readonly showPositiveSign = input(false);

  readonly absolute = input(false);

  readonly showInfo = input(true);

  readonly explanation = input<readonly FeatureExplanationRow[]>([]);
  readonly explanationTitle = input('');

  protected readonly isOpen = signal(false);

  protected readonly hasOpened = signal(false);

  protected readonly balloonRows = computed<readonly FeatureExplanationRow[]>(() => {
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

/**
 * @deprecated `ibid-currency-display` is the former name of this component. The selector and
 * these aliases keep the products compiling until each one migrates to `ibid-feature-display`.
 */
export { FeatureDisplayComponent as CurrencyDisplayComponent };
export type CurrencyDisplaySize = FeatureDisplaySize;
export type CurrencyExplanationRow = FeatureExplanationRow;
