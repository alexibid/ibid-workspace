export function parseDate(rawDate: string): string | null {
  const clean = rawDate.trim();
  if (!clean) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(clean)) {
    return clean.substring(0, 10);
  }
  let m = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  m = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  return null;
}

export function normalizeAmount(rawAmount: string): number {
  let clean = rawAmount.replace(/\s/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
