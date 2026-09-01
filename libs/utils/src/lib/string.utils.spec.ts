import { describe, it, expect } from 'vitest';
import { normalizeText, slugify } from './string.utils';

describe('string.utils', () => {
  describe('normalizeText', () => {
    it('should return empty string for null, undefined, or empty values', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
      expect(normalizeText('')).toBe('');
    });

    it('should convert to lowercase, remove accents, and replace punctuation with spaces', () => {
      expect(normalizeText('Águas de Gaia')).toBe('aguas de gaia');
      expect(normalizeText('PINGO DOCE! - MATOSINHOS')).toBe('pingo doce matosinhos');
    });

    it('should trim and collapse multiple spaces', () => {
      expect(normalizeText('   COMPRA   CONTINENTE   ')).toBe('compra continente');
    });
  });

  describe('slugify', () => {
    it('should return empty string for null, undefined, or empty values', () => {
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
      expect(slugify('')).toBe('');
    });

    it('should convert strings to URL-friendly slugs', () => {
      expect(slugify('Férias de Verão 2026')).toBe('ferias-de-verao-2026');
      expect(slugify('  Conta / Alimentação & Refeições!!  ')).toBe('conta-alimentacao-refeicoes');
    });
  });
});
