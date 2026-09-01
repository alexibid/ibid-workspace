import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '@ibid/services';

@Component({
  selector: 'ibid-progress-row',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  template: `
    <div class="m-progress-row">
      <div class="m-progress-row__header">
        <span class="m-progress-row__label">
          <span class="m-progress-row__dot" [style.background-color]="color"></span>
          {{ label }}
        </span>
        <span class="m-progress-row__value">
          {{ value | appCurrency }} ({{ percentage.toFixed(1) }}%)
        </span>
      </div>
      <div class="m-progress-row__bg">
        <div
          class="m-progress-row__fill"
          [style.width.%]="percentage > 100 ? 100 : percentage"
          [style.background-color]="color"
        ></div>
      </div>
      @if (attribution) {
        <span class="m-progress-row__attribution">{{ attribution }}</span>
      }
    </div>
  `,
  styleUrl: './progress-row.scss'
})
export class ProgressRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) percentage!: number;
  @Input({ required: true }) color!: string;
  @Input() attribution = '';
}
