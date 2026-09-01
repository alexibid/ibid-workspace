import { Component } from '@angular/core';
import {
  BarChartComponent,
  ChartHeadlineComponent,
  ChartLegendComponent,
  LineChartComponent
} from 'ibid-ui';

@Component({
  selector: 'boilerplate-charts-page',
  standalone: true,
  imports: [BarChartComponent, ChartHeadlineComponent, ChartLegendComponent, LineChartComponent],
  templateUrl: './charts.page.html'
})
export class ChartsPage {
  protected readonly spendingSeries = [
    {
      name: 'Spending',
      color: '#2c6a4d',
      type: 'bar' as const,
      points: [
        { label: 'May', value: 820 },
        { label: 'Jun', value: 1140 },
        { label: 'Jul', value: 960 },
        { label: 'Aug', value: 1320 }
      ]
    }
  ];

  protected readonly balanceSeries = [
    {
      name: 'Balance',
      color: '#333f8f',
      type: 'line' as const,
      fillArea: true,
      points: [
        { label: 'May', value: 2400 },
        { label: 'Jun', value: 2180 },
        { label: 'Jul', value: 2620 },
        { label: 'Aug', value: 2310 }
      ]
    }
  ];

  protected readonly legendEntries = [
    { label: 'Essentials', color: '#2c6a4d' },
    { label: 'Lifestyle', color: '#8a5712' }
  ];
}
