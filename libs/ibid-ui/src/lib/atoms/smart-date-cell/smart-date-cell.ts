import { Component, computed, inject, input, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { formatSmartDate } from '@ibid/utils';
import { I18N_SHARED, I18nService } from '@ibid/services';

const BALLOON_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
];

@Component({
  selector: 'ibid-smart-date-cell',
  standalone: true,
  imports: [OverlayModule, ...I18N_SHARED],
  template: `
    <button
      #trigger="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="a-smart-date-cell"
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
      <div class="a-smart-date-cell__popover">
        <span class="a-smart-date-cell__full-date">{{ fullDate() }}</span>
        <div class="a-smart-date-cell__row">
          <span class="a-smart-date-cell__label">{{ 'smartDateCellPeriodLabel' | translate }}</span>
          <span class="a-smart-date-cell__value">{{ periodLabel() }}</span>
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './smart-date-cell.scss'
})
export class SmartDateCellComponent {
  readonly periodStart = input('');
  readonly periodEnd = input('');

  private readonly i18n = inject(I18nService);

  protected readonly positions = BALLOON_POSITIONS;

  readonly value = input.required<string>();
  readonly previousValue = input<string | undefined>(undefined);

  protected readonly isOpen = signal(false);

  protected readonly display = computed(() => formatSmartDate(this.value(), this.previousValue(), this.i18n.currentLang()));
  protected readonly fullDate = computed(() => this.i18n.formatDate(this.value()));
  protected readonly periodLabel = computed(() =>
    `${this.i18n.formatDate(this.periodStart())} – ${this.i18n.formatDate(this.periodEnd())}`
  );

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }
}
