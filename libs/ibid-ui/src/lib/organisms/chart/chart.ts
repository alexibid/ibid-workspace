import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChartPoint, ChartSeries } from '../../models/chart-series.model';
import { computeChartSeriesStats } from '../../models/chart-series-stats';
import { ChartHeadlineComponent } from '../../molecules/chart-headline/chart-headline';
import { ChartLegendComponent, ChartLegendEntry } from '../../molecules/chart-legend/chart-legend';
import { ChartTooltipComponent } from '../../atoms/chart-tooltip/chart-tooltip';
import { EmptyStateComponent } from '../../atoms/empty-state/empty-state';

export type ChartSize = 'default' | 'mini';

export interface PlottedPoint {
  readonly point: ChartPoint;
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
}

export interface PlottedSeries {
  readonly series: ChartSeries;
  readonly points: readonly PlottedPoint[];
}

export interface ChartMarker extends PlottedPoint {
  readonly role: 'first' | 'last' | 'max' | 'min' | 'default';
  readonly seriesName: string;
  readonly color: string;
  readonly isBar: boolean;
}

const VIEWBOX_WIDTH = 350;
const MIN_VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 165;
const MARGIN_X = 6;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [OverlayModule, ChartHeadlineComponent, ChartLegendComponent, ChartTooltipComponent, EmptyStateComponent],
  templateUrl: './chart.html',
  styleUrl: './chart.scss'
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private resizeObserver?: ResizeObserver;

  readonly series = input.required<readonly ChartSeries[]>();
  readonly size = input<ChartSize>('default');
  readonly caption = input('');
  readonly context = input('');

  protected readonly plotWidth = signal(VIEWBOX_WIDTH);

  protected readonly viewBox = computed(() => `0 0 ${this.plotWidth()} ${VIEWBOX_HEIGHT}`);

  ngAfterViewInit(): void {
    const host = this.hostElement.nativeElement as HTMLElement;
    if (typeof ResizeObserver === 'undefined') return;
    this.plotWidth.set(Math.max(MIN_VIEWBOX_WIDTH, Math.round(host.getBoundingClientRect().width || VIEWBOX_WIDTH)));
    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width <= 0) return;
      this.zone.run(() => this.plotWidth.set(Math.max(MIN_VIEWBOX_WIDTH, Math.round(width))));
    });
    this.resizeObserver.observe(host);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected readonly activeMarker = signal<ChartMarker | null>(null);
  protected readonly activeOrigin = signal<CdkOverlayOrigin | null>(null);

  protected readonly primarySeries = computed(() => {
    const all = this.series();
    return all.length > 0 ? all[0] : undefined;
  });

  protected readonly hasEnoughData = computed(() => (this.primarySeries()?.points.length ?? 0) >= 2);

  protected readonly seriesStats = computed(() => {
    const primary = this.primarySeries();
    return primary ? computeChartSeriesStats(primary) : undefined;
  });

  protected readonly plottedSeries = computed<readonly PlottedSeries[]>(() => {
    const allSeries = this.series();
    if (allSeries.length === 0) return [];

    const lineSeries = allSeries.filter(s => s.type === 'line');
    const barSeries = allSeries.filter(s => s.type === 'bar');

    const lineValues = lineSeries.flatMap(s => s.points.map(p => p.value));
    const lineMin = lineValues.length ? Math.min(...lineValues) : 0;
    const lineMax = lineValues.length ? Math.max(...lineValues) : 0;
    const lineRange = lineMax - lineMin || 1;

    const barValues = barSeries.flatMap(s => s.points.map(p => p.value));
    const barMin = barValues.length ? Math.min(0, ...barValues) : 0;
    const barMax = barValues.length ? Math.max(0, ...barValues) : 0;
    const barRange = (barMax - barMin) || 1;

    const numPoints = allSeries[0].points.length;
    const step = numPoints > 1 ? (this.plotWidth() - 2 * MARGIN_X) / (numPoints - 1) : 0;
    const plotHeight = VIEWBOX_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

    const totalBarWidth = numPoints > 1 ? step * 0.6 : 20;
    const singleBarWidth = barSeries.length > 0 ? totalBarWidth / barSeries.length : 0;

    return allSeries.map((series) => {
      const isBar = series.type === 'bar';
      const barIndex = barSeries.indexOf(series);

      const points = series.points.map((point, index) => {
        const cx = MARGIN_X + index * step;

        if (isBar) {
          const baselineY = MARGIN_TOP + plotHeight - ((0 - barMin) / barRange) * plotHeight;
          const valueY = MARGIN_TOP + plotHeight - ((point.value - barMin) / barRange) * plotHeight;
          const x = cx - (totalBarWidth / 2) + (barIndex * singleBarWidth);
          return {
            point,
            x,
            y: Math.min(valueY, baselineY),
            width: singleBarWidth - 1,
            height: Math.abs(valueY - baselineY),
          };
        } else {
          const y = MARGIN_TOP + plotHeight - ((point.value - lineMin) / lineRange) * plotHeight;
          return { point, x: cx, y };
        }
      });

      return { series, points };
    });
  });

  protected readonly markers = computed<readonly ChartMarker[]>(() => {
    const markersList: ChartMarker[] = [];
    
    for (const plotted of this.plottedSeries()) {
      const isPrimary = plotted.series.name === this.primarySeries()?.name;
      const isBar = plotted.series.type === 'bar';

      if (isBar) {
        plotted.points.forEach((p) => {
          markersList.push({ ...p, role: 'default', seriesName: plotted.series.name, color: plotted.series.color, isBar });
        });
      } else {
        const stats = computeChartSeriesStats(plotted.series);
        const roleByIndex = new Map<number, ChartMarker['role']>();
        
        if (isPrimary) {
          roleByIndex.set(plotted.series.points.indexOf(stats.max), 'max');
          roleByIndex.set(plotted.series.points.indexOf(stats.min), 'min');
          roleByIndex.set(plotted.series.points.indexOf(stats.first), 'first');
          roleByIndex.set(plotted.series.points.indexOf(stats.last), 'last');
        }

        plotted.points.forEach((p, index) => {
          const role = roleByIndex.get(index) || 'default';
          markersList.push({ ...p, role, seriesName: plotted.series.name, color: plotted.series.color, isBar });
        });
      }
    }

    return markersList;
  });

  protected readonly pathStrokeWidth = computed(() => {
    const primary = this.primarySeries();
    if (!primary) return 2;
    const len = primary.points.length;
    
    if (len >= 365) return 2;
    if (len <= 30) return 4;
    
    const t = (len - 30) / (365 - 30);
    return 4 - (t * 2);
  });

  protected readonly xAxisTicks = computed(() => {
    if (this.size() === 'mini') return [];
    const primary = this.primarySeries();
    if (!primary || primary.points.length === 0) return [];
    
    const points = primary.points;
    const len = points.length;
    const step = len > 1 ? (this.plotWidth() - 2 * MARGIN_X) / (len - 1) : 0;
    
    const ticks = [];
    const maxTicks = 31; 
    const stride = Math.ceil(len / maxTicks);

    for (let i = 0; i < len; i += stride) {
      const rawLabel = points[i].label;
      const strippedLabel = rawLabel.replace(/\/\d{4}$/, '');
      ticks.push({ x: MARGIN_X + i * step, label: strippedLabel });
    }

    if (len > 1 && (len - 1) % stride !== 0) {
      const lastIdx = len - 1;
      const rawLabel = points[lastIdx].label;
      const strippedLabel = rawLabel.replace(/\/\d{4}$/, '');
      
      if (ticks.length > 0 && lastIdx - (lastIdx - (lastIdx % stride)) < stride * 0.5) {
        ticks.pop();
      }
      ticks.push({ x: MARGIN_X + lastIdx * step, label: strippedLabel });
    }
    
    return ticks;
  });

  protected readonly yAxisTicks = computed(() => {
    if (this.size() === 'mini') return [];
    const allSeries = this.series();
    if (allSeries.length === 0) return [];

    const lineSeries = allSeries.filter(s => s.type === 'line');
    const scaleSeries = lineSeries.length > 0 ? lineSeries : allSeries;
    const lineValues = scaleSeries.flatMap(s => s.points.map(p => p.value));
    const lineMin = lineValues.length ? Math.min(0, ...lineValues) : 0;
    const lineMax = lineValues.length ? Math.max(...lineValues) : 0;
    const lineRange = lineMax - lineMin || 1;

    const plotHeight = VIEWBOX_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

    const ticks = [];
    const numSteps = 5; 
    for (let i = 0; i <= numSteps; i++) {
       const pct = i / numSteps;
       const val = lineMax - (lineRange * pct);
       const y = MARGIN_TOP + plotHeight * pct;
       ticks.push({ y, value: val });
    }
    return ticks;
  });

  protected readonly legendEntries = computed<readonly ChartLegendEntry[]>(() =>
    this.series().map((series) => ({ label: series.name, color: series.color }))
  );

  protected readonly headlineCaption = computed(() => this.caption() || this.primarySeries()?.name || '');

  protected readonly ariaSummary = computed(() => {
    const stats = this.seriesStats();
    if (!stats) return '';
    return `${this.headlineCaption()}: ${stats.last.value}. ${this.context()}`.trim();
  });

  protected pathFor(points: readonly PlottedPoint[]): string {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }

  protected areaPathFor(points: readonly PlottedPoint[]): string {
    if (points.length < 2) return '';
    const linePath = this.pathFor(points);
    const first = points[0];
    const last = points[points.length - 1];
    const floor = VIEWBOX_HEIGHT - MARGIN_BOTTOM;
    return `${linePath} L${last.x},${floor} L${first.x},${floor} Z`;
  }

  protected markerLabelFor(marker: ChartMarker): string {
    const val = marker.point.displayValue || `${marker.point.value}€`;
    switch (marker.role) {
      case 'first': return `início ${val}`;
      case 'min': return `mín ${val}`;
      case 'max': return `máx ${val}`;
      case 'last': return `agora ${val}`;
      default: return '';
    }
  }

  protected openTooltip(marker: ChartMarker, origin: CdkOverlayOrigin): void {
    const current = this.activeMarker();
    if (current && current.role === marker.role && current.point.label === marker.point.label && current.seriesName === marker.seriesName) {
      this.closeTooltip();
      return;
    }
    this.activeMarker.set(marker);
    this.activeOrigin.set(origin);
  }

  protected closeTooltip(): void {
    this.activeMarker.set(null);
    this.activeOrigin.set(null);
  }
}
