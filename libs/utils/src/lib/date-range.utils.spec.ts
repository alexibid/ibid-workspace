import { isReversedDateRange, latestKnownDay, resolveChartWindow } from './date-range.utils';

describe('isReversedDateRange', () => {
  it('flags a range whose end falls before its start', () => {
    expect(isReversedDateRange('2026-08-01', '2026-07-31')).toBe(true);
  });

  it('accepts a range in the right order', () => {
    expect(isReversedDateRange('2026-08-01', '2026-08-31')).toBe(false);
  });

  it('accepts a single-day range', () => {
    expect(isReversedDateRange('2026-08-10', '2026-08-10')).toBe(false);
  });

  it('treats a half-filled range as incomplete rather than reversed, so the user is not blocked mid-edit', () => {
    expect(isReversedDateRange('', '2026-08-31')).toBe(false);
    expect(isReversedDateRange('2026-08-01', '')).toBe(false);
    expect(isReversedDateRange('', '')).toBe(false);
  });
});

describe('latestKnownDay', () => {
  it('keeps today when nothing newer was imported', () => {
    expect(latestKnownDay('2026-08-26', '2026-08-20')).toBe('2026-08-26');
  });

  it('follows a statement that reaches into the future', () => {
    expect(latestKnownDay('2026-08-26', '2026-09-05')).toBe('2026-09-05');
  });
});

describe('resolveChartWindow', () => {
  it('leaves a closed period untouched', () => {
    const window = resolveChartWindow({ start: '2026-06-01', end: '2026-06-30' }, '2026-08-26', 30);

    expect(window).toEqual({ start: '2026-06-01', asOf: '2026-06-30' });
  });

  it('follows today and widens the start while the period is still open', () => {
    const window = resolveChartWindow({ start: '2026-08-20', end: '2026-08-31' }, '2026-08-26', 30);

    expect(window.asOf).toBe('2026-08-26');
    expect(window.start < '2026-08-20').toBe(true);
  });

  it('keeps a start that already covers the minimum lookback', () => {
    const window = resolveChartWindow({ start: '2026-01-01', end: '2026-08-31' }, '2026-08-26', 30);

    expect(window.start).toBe('2026-01-01');
  });
});
