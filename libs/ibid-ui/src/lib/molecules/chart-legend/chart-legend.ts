import { Component, input } from '@angular/core';
import { LegendItemComponent } from '../../atoms/legend-item/legend-item';

export interface ChartLegendEntry {
  readonly label: string;
  readonly color: string;
}

@Component({
  selector: 'ibid-chart-legend',
  standalone: true,
  imports: [LegendItemComponent],
  template: `
    <div class="m-chart-legend">
      @for (entry of entries(); track entry.label) {
        <ibid-legend-item [label]="entry.label" [color]="entry.color" />
      }
    </div>
  `,
  styleUrl: './chart-legend.scss'
})
export class ChartLegendComponent {
  readonly entries = input.required<readonly ChartLegendEntry[]>();
}
