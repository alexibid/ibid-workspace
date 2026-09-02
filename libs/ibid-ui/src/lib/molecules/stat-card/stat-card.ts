import { Component, Input } from '@angular/core';
import { StatIconComponent } from '../../atoms/stat-icon/stat-icon';
import { AppCurrencyPipe, I18N_SHARED } from '@ibid/services';
import { StatCardData } from '../../models/ui.model';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';
import { FeatureDisplayComponent } from '../../atoms/feature-display/feature-display';

@Component({
  selector: 'ibid-stat-card',
  standalone: true,
  imports: [I18N_SHARED, StatIconComponent, AppCurrencyPipe, HandDrawnDirective, FeatureDisplayComponent],
  template: `
    <div class="m-stat-card" ibidHandDrawn>
      <div class="m-stat-card__body">
        <ibid-stat-icon
          [icon]="data.icon"
          [theme]="data.theme || 'neutral'"
        ></ibid-stat-icon>

        <div class="m-stat-card__content">
          <span class="m-stat-card__label">{{ data.label | translate }}</span>
          @if (data.useFeatureDisplay && isNumber(data.value)) {
            <ibid-feature-display
              [value]="data.value"
              [size]="'md'"
              [showInfo]="data.showInfo ?? false"
              [explanationTitle]="data.explanationTitle ?? ''"
              [explanation]="data.explanation ?? []"
            />
          } @else {
            <strong
              class="m-stat-card__value"
              [class]="'m-stat-card__value--' + (data.theme || 'neutral')"
            >
              @if (data.isCurrency && isNumber(data.value)) {
                {{ data.value | appCurrency }}
              } @else {
                {{ data.value }}
              }
            </strong>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './stat-card.scss'
})
export class StatCardComponent {
  @Input({ required: true }) data!: StatCardData;

  isNumber(val: unknown): val is number {
    return typeof val === 'number';
  }
}