import { formatSmartDate, isOpenPeriod, subtractDays, widenStart } from './date.utils';

describe('formatSmartDate', () => {
  it('formats as day+month, lowercased, with no previous date given', () => {
    expect(formatSmartDate('2026-08-02', undefined, 'pt')).toBe('2 ago');
  });

  it('omits the year when the previous row is in the same year', () => {
    expect(formatSmartDate('2026-08-02', '2026-08-01', 'pt')).toBe('2 ago');
  });

  it('injects the year when the previous row crosses a year boundary', () => {
    expect(formatSmartDate('2026-01-01', '2025-12-31', 'pt')).toBe('1 jan 2026');
  });

  it('formats in English when lang is "en"', () => {
    expect(formatSmartDate('2026-08-02', undefined, 'en')).toBe('2 aug');
  });
});

describe('subtractDays', () => {
  it('subtracts the given number of days from an ISO date string', () => {
    expect(subtractDays('2026-08-01', 30)).toBe('2026-07-02');
  });

  it('rolls back across a month boundary', () => {
    expect(subtractDays('2026-08-01', 1)).toBe('2026-07-31');
  });

  it('rolls back across a year boundary', () => {
    expect(subtractDays('2026-01-05', 10)).toBe('2025-12-26');
  });
});

describe('isOpenPeriod', () => {
  const today = '2026-08-01';

  it('is open when the end date is today or later', () => {
    expect(isOpenPeriod('2026-08-01', today)).toBe(true);
    expect(isOpenPeriod('2026-08-28', today)).toBe(true);
  });

  it('is open when there is no end date at all', () => {
    expect(isOpenPeriod('', today)).toBe(true);
  });

  it('is closed once the end date is in the past', () => {
    expect(isOpenPeriod('2026-06-30', today)).toBe(false);
  });
});

describe('widenStart', () => {
  const today = '2026-08-01';

  it('pulls a start date that is too recent back to the minimum window before today', () => {
    expect(widenStart('2026-07-28', today, 30)).toBe('2026-07-02');
  });

  it('leaves a start date alone once it already covers the minimum window', () => {
    expect(widenStart('2026-05-01', today, 30)).toBe('2026-05-01');
  });

  it('falls back to exactly the minimum window when there is no start date at all', () => {
    expect(widenStart('', today, 30)).toBe('2026-07-02');
  });
});
