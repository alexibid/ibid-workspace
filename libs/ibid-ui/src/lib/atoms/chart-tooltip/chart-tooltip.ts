import { Component, EventEmitter, Output, input } from '@angular/core';
import { CdkOverlayOrigin, ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';

const TOOLTIP_POSITIONS: ConnectedPosition[] = [
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 }
];

@Component({
  selector: 'app-chart-tooltip',
  standalone: true,
  imports: [OverlayModule],
  template: `
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin()"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="closed.emit()"
    >
      <div class="a-chart-tooltip">
        <div class="a-chart-tooltip__title">{{ title() }}</div>
        <div class="a-chart-tooltip__row">
          <span class="a-chart-tooltip__label">{{ label() }}</span>
          <span class="a-chart-tooltip__value">{{ value() }}</span>
        </div>
        @if (context()) {
          <div class="a-chart-tooltip__context">{{ context() }}</div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './chart-tooltip.scss'
})
export class ChartTooltipComponent {
  protected readonly positions = TOOLTIP_POSITIONS;

  readonly origin = input.required<CdkOverlayOrigin>();
  readonly isOpen = input(false);
  readonly title = input('');
  readonly label = input('');
  readonly value = input('');
  readonly context = input<string | undefined>(undefined);

  @Output() closed = new EventEmitter<void>();
}
