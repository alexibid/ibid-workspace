import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart';
import { ChartSeries } from '../../models/chart-series.model';
import { Component, input } from '@angular/core';
import { ChartComponent } from '../chart/chart';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: '<div class="fake-chart"></div>'
})
class FakeChartComponent {
  series = input<readonly ChartSeries[]>();
  size = input<string>();
  caption = input<string>();
  context = input<string>();
}

describe('LineChartComponent', () => {
  let fixture: ComponentFixture<LineChartComponent>;

  const series: ChartSeries[] = [
    {
      name: 'saldo',
      color: 'var(--color-amber-mid)',
      type: 'line',
      points: [
        { label: 'jan', value: 380 },
        { label: 'fev', value: 420 }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent]
    }).overrideComponent(LineChartComponent, {
      remove: { imports: [ChartComponent] },
      add: { imports: [FakeChartComponent] }
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
  });

  it('maps series to have type="line"', () => {
    const inputSeries = [{ name: 'test', color: '#000', points: [], type: 'bar' as const }];
    fixture.componentRef.setInput('series', inputSeries);
    fixture.detectChanges();

    const mapped = fixture.componentInstance['mappedSeries']();
    expect(mapped[0].type).toBe('line');
  });

  it('sets fillArea based on input', () => {
    const inputSeries = [{ name: 'test', color: '#000', points: [], type: 'bar' as const }];
    fixture.componentRef.setInput('series', inputSeries);
    fixture.componentRef.setInput('fillArea', true);
    fixture.detectChanges();

    const mapped = fixture.componentInstance['mappedSeries']();
    expect(mapped[0].fillArea).toBe(true);
  });

  it('passes inputs correctly to app-chart', () => {
    fixture.componentRef.setInput('series', series);
    fixture.componentRef.setInput('size', 'mini');
    fixture.componentRef.setInput('caption', 'My Caption');
    fixture.detectChanges();

    const chartEl = fixture.nativeElement.querySelector('app-chart');
    expect(chartEl).toBeTruthy();
  });
});
