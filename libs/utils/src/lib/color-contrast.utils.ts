function relativeLuminance(hex: string): number {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const channel = (start: number) => parseInt(normalized.slice(start, start + 2), 16) / 255;
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const [r, g, b] = [0, 2, 4].map(start => linearize(channel(start)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const [lighter, darker] = luminanceA > luminanceB ? [luminanceA, luminanceB] : [luminanceB, luminanceA];
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickAccessibleTextColor(backgroundHex: string): '#000000' | '#FFFFFF' {
  const backgroundLuminance = relativeLuminance(backgroundHex);
  const contrastWithBlack = contrastRatio(backgroundLuminance, 0);
  const contrastWithWhite = contrastRatio(backgroundLuminance, 1);
  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#FFFFFF';
}
