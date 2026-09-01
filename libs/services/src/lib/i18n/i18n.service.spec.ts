import { TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN, I18nService } from './i18n.service';

describe('I18nService', () => {
  const config = {
    translations: {
      pt: { hello: 'Olá' },
      en: { hello: 'Hello' }
    },
    defaultLanguage: 'pt',
    localeByLanguage: { pt: 'pt-PT', en: 'en-US' },
    defaultCurrency: 'EUR'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: I18N_CONFIG_TOKEN, useValue: config }]
    });
  });

  it('translates using the current language dictionary', () => {
    const service = TestBed.inject(I18nService);
    expect(service.translate('hello')).toBe('Olá');
  });

  it('falls back to the given fallback when the key is missing', () => {
    const service = TestBed.inject(I18nService);
    expect(service.translate('missing', 'default')).toBe('default');
  });

  it('switches language and reflects it in translations', () => {
    const service = TestBed.inject(I18nService);
    service.setLanguage('en');
    expect(service.translate('hello')).toBe('Hello');
  });

  it('formats currency using the configured default currency', () => {
    const service = TestBed.inject(I18nService);
    expect(service.formatCurrency(10)).toContain('€');
  });
});
