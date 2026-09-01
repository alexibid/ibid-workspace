import { Component, input } from '@angular/core';

export type ChartBarSegmentRole = 'default' | 'first' | 'last' | 'max' | 'min';
export type ChartBarSegmentOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'ibid-chart-bar-segment',
  standalone: true,
  template: `
    <span
      class="a-chart-bar-segment"
      [class.a-chart-bar-segment--horizontal]="orientation() === 'horizontal'"
      [class.a-chart-bar-segment--first]="role() === 'first'"
      [class.a-chart-bar-segment--last]="role() === 'last'"
      [class.a-chart-bar-segment--max]="role() === 'max'"
      [class.a-chart-bar-segment--min]="role() === 'min'"
      [style.--chart-bar-segment-size.%]="percentage()"
    ></span>
  `,
  styleUrl: './chart-bar-segment.scss'
})
export class ChartBarSegmentComponent {
  readonly percentage = input.required<number>();
  readonly orientation = input<ChartBarSegmentOrientation>('vertical');
  readonly role = input<ChartBarSegmentRole>('default');
}
