import { signal } from '@angular/core';
import { I18nConfig } from '@ibid/services';

export const TEST_I18N_CONFIG: I18nConfig = {
  translations: { pt: {}, en: {} },
  defaultLanguage: 'pt',
  localeByLanguage: { pt: 'pt-PT', en: 'en-US' },
  defaultCurrency: 'EUR'
};

export const createMockI18nService = (overrides?: Record<string, unknown>) => ({
  currentLang: signal('pt'),
  formatCurrency: (v: number) => `${v.toFixed(2)} €`,
  formatDate: (d: string) => d,
  translate: (k: string, fallback?: string) => fallback ?? k,
  t: () => ({}),
  ...overrides
});
