import { Component, Input } from '@angular/core';
import { StatIconComponent } from '../../atoms/stat-icon/stat-icon';
import { AppCurrencyPipe } from '@ibid/services';
import { StatCardData } from '../../models/ui.model';
import { CardComponent } from '../card/card';
import { I18N_SHARED } from '@ibid/services';

@Component({
  selector: 'ibid-stat-card',
  standalone: true,
  imports: [I18N_SHARED, StatIconComponent, CardComponent, AppCurrencyPipe],
  template: `
    <ibid-card class="m-stat-card">
        <div class="m-stat-card__body">
          <ibid-stat-icon
            [icon]="data.icon"
            [theme]="data.theme || 'neutral'"
          ></ibid-stat-icon>

          <div class="m-stat-card__content">
            <span class="m-stat-card__label">{{ data.label | translate }}</span>
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
          </div>
        </div>
    </ibid-card>
  `,
  styleUrl: './stat-card.scss'
})
export class StatCardComponent {
  @Input({ required: true }) data!: StatCardData;

  isNumber(val: unknown): val is number {
    return typeof val === 'number';
  }
}