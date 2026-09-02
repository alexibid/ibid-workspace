import { Component, input } from '@angular/core';
import { FeatureDisplayComponent } from '../../atoms/feature-display/feature-display';

@Component({
  selector: 'ibid-chart-headline',
  standalone: true,
  imports: [FeatureDisplayComponent],
  template: `
    <div class="m-chart-headline">
      <div class="m-chart-headline__caption">{{ caption() }}</div>
      <ibid-feature-display class="m-chart-headline__value" [value]="value()" size="lg" />
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
