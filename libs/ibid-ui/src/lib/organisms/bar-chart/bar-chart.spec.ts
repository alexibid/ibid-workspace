import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart';
import { ChartSeries } from '../../models/chart-series.model';
import { Component, input } from '@angular/core';
import { ChartComponent } from '../chart/chart';

@Component({
  selector: 'ibid-chart',
  standalone: true,
  template: '<div class="fake-chart"></div>'
})
class FakeChartComponent {
  series = input<readonly ChartSeries[]>();
  size = input<string>();
  caption = input<string>();
  context = input<string>();
}

describe('BarChartComponent', () => {
  let fixture: ComponentFixture<BarChartComponent>;

  const series: ChartSeries[] = [
    {
      name: 'gasto mensal',
      color: 'var(--color-amber-mid)',
      type: 'bar',
      points: [
        { label: 'jan', value: 380 },
        { label: 'fev', value: 420 }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent]
    }).overrideComponent(BarChartComponent, {
      remove: { imports: [ChartComponent] },
      add: { imports: [FakeChartComponent] }
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
  });

  it('maps series to have type="bar"', () => {
    const inputSeries = [{ name: 'test', color: '#000', points: [], type: 'line' as const }];
    fixture.componentRef.setInput('series', inputSeries);
    fixture.detectChanges();

    const mapped = fixture.componentInstance['mappedSeries']();
    expect(mapped[0].type).toBe('bar');
  });

  it('passes inputs correctly to ibid-chart', () => {
    fixture.componentRef.setInput('series', series);
    fixture.componentRef.setInput('size', 'mini');
    fixture.componentRef.setInput('caption', 'My Caption');
    fixture.detectChanges();

    const chartEl = fixture.nativeElement.querySelector('ibid-chart');
    expect(chartEl).toBeTruthy();
  });
});
