import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '@ibid/services';
import { IconComponent } from '../../atoms/icon/icon';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  selector: 'ibid-metric-card',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe, IconComponent, HandDrawnDirective],
  template: `
    <div class="m-metric-card" [ibidHandDrawn]="4">
      <div class="m-metric-card__header">
        <span class="m-metric-card__title">{{ title }}</span>
        <ibid-icon [name]="icon" [iconClass]="'m-metric-card__icon ' + iconClass"></ibid-icon>
      </div>
      @if (type !== 'custom') {
        <div class="m-metric-card__value" [ngClass]="valueClass">
          @if (type === 'currency') {
            {{ value | appCurrency }}
          } @else {
            {{ value }}%
          }
        </div>
        <div class="m-metric-card__progress-wrapper">
          <div class="m-metric-card__progress-track">
            <div class="m-metric-card__progress-bar" [style.width.%]="value" [style.background-color]="getBudgetColor(value)"></div>
          </div>
        </div>
      }
      <div class="m-metric-card__footer">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './metric-card.scss'
})
export class MetricCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) icon!: string;
  @Input() type: 'currency' | 'percentage' | 'custom' = 'currency';
  @Input() iconClass = 'text-primary';
  @Input() valueClass = '';

  protected getBudgetColor(pct: number): string {
    if (pct >= 85 && pct <= 100) return 'var(--color-amber-text)';
    if (pct > 100) return 'var(--color-danger)';
    return 'var(--color-success)';
  }
}
