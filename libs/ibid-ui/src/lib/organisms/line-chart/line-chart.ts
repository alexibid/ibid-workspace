import { Component, computed, input } from '@angular/core';
import { ChartComponent, ChartSize } from '../chart/chart';
import { ChartSeries } from '../../models/chart-series.model';

export type LineChartSize = ChartSize;

@Component({
  selector: 'ibid-line-chart',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss'
})
export class LineChartComponent {
  readonly series = input.required<readonly ChartSeries[]>();
  readonly size = input<LineChartSize>('default');
  readonly fillArea = input<boolean>(false);
  readonly caption = input('');
  readonly context = input('');

  protected readonly mappedSeries = computed<readonly ChartSeries[]>(() => {
    return this.series().map(s => ({
      ...s,
      type: 'line',
      fillArea: s.fillArea ?? this.fillArea()
    }));
  });
}
