import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { ChartComponent, PlottedSeries } from './chart';
import { ChartSeries } from '../../models/chart-series.model';
import { TEST_I18N_CONFIG } from '../../../testing/i18n.mock';

const bars = (values: readonly number[]): ChartSeries => ({
  name: 'Fluxo',
  color: '#5DCAA5',
  type: 'bar',
  points: values.map((value, index) => ({ label: `m${index}`, value }))
});

const line = (values: readonly number[]): ChartSeries => ({
  name: 'Saldo',
  color: '#8a8a85',
  type: 'line',
  points: values.map((value, index) => ({ label: `m${index}`, value }))
});

describe('ChartComponent bar geometry', () => {
  let fixture: ComponentFixture<ChartComponent>;
  let component: ChartComponent;

  const plot = (series: readonly ChartSeries[]): readonly PlottedSeries[] => {
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();
    return component['plottedSeries']();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
      providers: [{ provide: I18N_CONFIG_TOKEN, useValue: TEST_I18N_CONFIG }]
    }).compileComponents();
    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
  });

  it('draws a month that lost money instead of collapsing it to nothing', () => {
    const [barSeries] = plot([bars([500, -300, 200])]);
    const negative = barSeries.points[1];

    expect(negative.height).toBeGreaterThan(0);
    expect(negative.y).toBeGreaterThan(barSeries.points[0].y);
  });

  it('never produces a negative height, which an SVG rect refuses to render', () => {
    const [barSeries] = plot([bars([-100, -500, -50])]);

    for (const point of barSeries.points) {
      expect(point.height!).toBeGreaterThanOrEqual(0);
    }
  });

  it('hangs losses below the same baseline that gains rise from', () => {
    const [barSeries] = plot([bars([400, -400])]);
    const [gain, loss] = barSeries.points;

    expect(gain.y + gain.height!).toBeCloseTo(loss.y, 5);
  });

  it('scales the flow bars on their own range, so a balance in thousands cannot flatten them', () => {
    const [barSeries] = plot([bars([100, 200, 300]), line([9000, 9500, 10000])]);
    const heights = barSeries.points.map(point => point.height!);

    expect(new Set(heights).size).toBe(3);
    expect(Math.max(...heights)).toBeGreaterThan(0);
  });
});
