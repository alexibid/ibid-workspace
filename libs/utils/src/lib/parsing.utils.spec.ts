import { parseDate, normalizeAmount } from './parsing.utils';

describe('parseDate', () => {
  it('parses ISO datetime by truncating to the date part', () => {
    expect(parseDate('2025-07-01T07:38:21Z')).toBe('2025-07-01');
  });

  it('parses year-first dates with any of -, / or . separators', () => {
    expect(parseDate('2026-07-23')).toBe('2026-07-23');
    expect(parseDate('2026/07/23')).toBe('2026-07-23');
    expect(parseDate('2026.7.3')).toBe('2026-07-03');
  });

  it('parses day-first (European) dates with any of -, / or . separators', () => {
    expect(parseDate('23-07-2026')).toBe('2026-07-23');
    expect(parseDate('23/07/2026')).toBe('2026-07-23');
    expect(parseDate('3.7.2026')).toBe('2026-07-03');
  });

  it('returns null for empty or unrecognized input', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('normalizeAmount', () => {
  it('parses a plain dot-decimal number', () => {
    expect(normalizeAmount('123.45')).toBe(123.45);
  });

  it('parses a comma-decimal number', () => {
    expect(normalizeAmount('123,45')).toBe(123.45);
  });

  it('parses a thousands-dot + comma-decimal number', () => {
    expect(normalizeAmount('1.234,56')).toBe(1234.56);
  });

  it('strips whitespace before parsing', () => {
    expect(normalizeAmount(' 1 234,56 ')).toBe(1234.56);
  });

  it('returns 0 for unparseable input', () => {
    expect(normalizeAmount('abc')).toBe(0);
  });
});
