import { Component, input } from '@angular/core';

export type ChartMarkerDotRole = 'default' | 'first' | 'last' | 'max' | 'min';

@Component({
  selector: 'app-chart-marker-dot',
  standalone: true,
  template: `
    <span
      class="a-chart-marker-dot"
      [class.a-chart-marker-dot--first]="role() === 'first'"
      [class.a-chart-marker-dot--last]="role() === 'last'"
      [class.a-chart-marker-dot--max]="role() === 'max'"
      [class.a-chart-marker-dot--min]="role() === 'min'"
      [class.a-chart-marker-dot--active]="active()"
    ></span>
  `,
  styleUrl: './chart-marker-dot.scss'
})
export class ChartMarkerDotComponent {
  readonly role = input<ChartMarkerDotRole>('default');
  readonly active = input(false);
}
