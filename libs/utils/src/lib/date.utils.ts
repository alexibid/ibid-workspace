export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateDisplay(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function subtractDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() - days);
  return formatDateLocal(d);
}

export function isOpenPeriod(endDate: string, today: string): boolean {
  return !endDate || endDate >= today;
}

export function widenStart(startDate: string, today: string, minDays: number): string {
  const earliestAllowed = subtractDays(today, minDays);
  if (!startDate) return earliestAllowed;
  return earliestAllowed < startDate ? earliestAllowed : startDate;
}

const SHORT_MONTHS: Record<'pt' | 'en', readonly string[]> = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
};

export function formatSmartDate(dateStr: string, previousDateStr: string | undefined, lang: string): string {
  const date = parseLocalDate(dateStr);
  const months = SHORT_MONTHS[lang as keyof typeof SHORT_MONTHS] ?? SHORT_MONTHS.en;
  const dayMonth = `${date.getDate()} ${months[date.getMonth()]}`;

  const crossesYearBoundary = previousDateStr !== undefined && parseLocalDate(previousDateStr).getFullYear() !== date.getFullYear();
  if (!crossesYearBoundary) return dayMonth;

  return `${dayMonth} ${date.getFullYear()}`;
}

export interface CalendarDay {
  readonly date: string;
  readonly day: number;
  readonly isCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const mondayFirstOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayFirstOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return {
      date: formatDateLocal(cellDate),
      day: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month
    };
  });
}
