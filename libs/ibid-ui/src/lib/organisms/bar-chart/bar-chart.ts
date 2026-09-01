import { Component, computed, input } from '@angular/core';
import { ChartComponent, ChartSize } from '../chart/chart';
import { ChartSeries } from '../../models/chart-series.model';
import { ChartBarSegmentOrientation } from '../../atoms/chart-bar-segment/chart-bar-segment';

export type BarChartSize = ChartSize;

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss'
})
export class BarChartComponent {
  readonly series = input.required<readonly ChartSeries[]>();
  readonly orientation = input<ChartBarSegmentOrientation>('vertical');
  readonly size = input<BarChartSize>('default');
  readonly caption = input('');
  readonly context = input('');

  protected readonly mappedSeries = computed<readonly ChartSeries[]>(() => {
    return this.series().map(s => ({
      ...s,
      type: 'bar'
    }));
  });
}
