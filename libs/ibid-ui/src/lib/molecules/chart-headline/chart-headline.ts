import { Component, input } from '@angular/core';
import { CurrencyDisplayComponent } from '../../atoms/currency-display/currency-display';

@Component({
  selector: 'app-chart-headline',
  standalone: true,
  imports: [CurrencyDisplayComponent],
  template: `
    <div class="m-chart-headline">
      <div class="m-chart-headline__caption">{{ caption() }}</div>
      <app-currency-display class="m-chart-headline__value" [value]="value()" size="lg" />
      <div class="m-chart-headline__context">{{ context() }}</div>
    </div>
  `,
  styleUrl: './chart-headline.scss'
})
export class ChartHeadlineComponent {
  readonly caption = input.required<string>();
  readonly value = input.required<number>();
  readonly context = input.required<string>();
}
