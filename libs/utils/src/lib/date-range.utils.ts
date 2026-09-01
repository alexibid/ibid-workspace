import { isOpenPeriod, widenStart } from './date.utils';

export function isReversedDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return endDate < startDate;
}

export interface ChartWindow {
  readonly start: string;
  readonly asOf: string;
}

export function resolveChartWindow(
  period: { readonly start: string; readonly end: string },
  today: string,
  minimumLookbackDays: number
): ChartWindow {
  if (!isOpenPeriod(period.end, today)) {
    return { start: period.start, asOf: period.end };
  }
  return { start: widenStart(period.start, today, minimumLookbackDays), asOf: today };
}

export function latestKnownDay(realToday: string, lastImportedDate: string): string {
  return lastImportedDate > realToday ? lastImportedDate : realToday;
}
