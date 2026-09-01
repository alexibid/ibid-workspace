import { Component, computed, inject, input, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { I18N_SHARED, I18nService } from '@ibid/services';

export type SmartCurrencyCellVariant = 'primary' | 'secondary';

const BALLOON_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
];

@Component({
  selector: 'ibid-smart-currency-cell',
  standalone: true,
  imports: [OverlayModule, ...I18N_SHARED],
  template: `
    @if (interactive()) {
      <button
        #trigger="cdkOverlayOrigin"
        cdkOverlayOrigin
        type="button"
        class="a-smart-currency-cell"
        [class.a-smart-currency-cell--secondary]="variant() === 'secondary'"
        [class.a-smart-currency-cell--negative]="isNegative()"
        [class.a-smart-currency-cell--positive]="isPositive()"
        (click)="toggle()"
      >{{ display() }}</button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayHasBackdrop]="false"
        (overlayOutsideClick)="close()"
      >
        <div class="a-smart-currency-cell__popover">
          <div class="a-smart-currency-cell__row">
            <span class="a-smart-currency-cell__label">{{ 'smartCurrencyCellAmountLabel' | translate }}</span>
            <span class="a-smart-currency-cell__value">{{ display() }}</span>
          </div>
          @if (balance() !== undefined) {
            <div class="a-smart-currency-cell__row">
              <span class="a-smart-currency-cell__label">{{ 'smartCurrencyCellBalanceLabel' | translate }}</span>
              <span class="a-smart-currency-cell__value">{{ balanceDisplay() }}</span>
            </div>
          }
        </div>
      </ng-template>
    } @else {
      <span
        class="a-smart-currency-cell"
        [class.a-smart-currency-cell--secondary]="variant() === 'secondary'"
        [class.a-smart-currency-cell--negative]="isNegative()"
        [class.a-smart-currency-cell--positive]="isPositive()"
      >{{ display() }}</span>
    }
  `,
  styleUrl: './smart-currency-cell.scss'
})
export class SmartCurrencyCellComponent {
  private readonly i18n = inject(I18nService);

  protected readonly positions = BALLOON_POSITIONS;

  readonly value = input.required<number | undefined>();
  readonly variant = input<SmartCurrencyCellVariant>('primary');
  readonly balance = input<number | undefined>(undefined);
  readonly interactive = input(true);

  protected readonly isOpen = signal(false);

  protected readonly isNegative = computed(() => (this.value() ?? 0) < 0);
  protected readonly isPositive = computed(() => (this.value() ?? 0) > 0);

  protected readonly display = computed(() => {
    const value = this.value();
    return value === undefined ? '—' : this.i18n.formatCurrency(value);
  });

  protected readonly balanceDisplay = computed(() => {
    const balance = this.balance();
    return balance === undefined ? '—' : this.i18n.formatCurrency(balance);
  });

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }
}
