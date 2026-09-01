import { pickAccessibleTextColor } from './color-contrast.utils';

describe('pickAccessibleTextColor', () => {
  it('picks black text for a light, low-contrast background (Others, #cbd5e1)', () => {
    expect(pickAccessibleTextColor('#cbd5e1')).toBe('#000000');
  });

  it('picks black text for a mid-tone background where white would fail AA (Income, #22c55e)', () => {
    expect(pickAccessibleTextColor('#22c55e')).toBe('#000000');
  });

  it('picks white text for a dark, saturated background (AssetPurchase, #4338ca)', () => {
    expect(pickAccessibleTextColor('#4338ca')).toBe('#FFFFFF');
  });

  it('picks white text for pure black and black text for pure white', () => {
    expect(pickAccessibleTextColor('#000000')).toBe('#FFFFFF');
    expect(pickAccessibleTextColor('#FFFFFF')).toBe('#000000');
  });

  it('accepts a hex color without a leading #', () => {
    expect(pickAccessibleTextColor('4338ca')).toBe('#FFFFFF');
  });
});
