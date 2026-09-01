import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';

export type TranslationDictionary = Readonly<Record<string, string>>;
export type TranslationTable = Readonly<Record<string, TranslationDictionary>>;

export interface I18nConfig {
  readonly translations: TranslationTable;
  readonly defaultLanguage: string;
  readonly localeByLanguage: Readonly<Record<string, string>>;
  readonly defaultCurrency?: string;
}

export const I18N_CONFIG_TOKEN = new InjectionToken<I18nConfig>('ibid-services.i18n-config');

const UNCONFIGURED: I18nConfig = {
  translations: {},
  defaultLanguage: 'en',
  localeByLanguage: {},
  defaultCurrency: 'EUR'
};

const LANGUAGE_STORAGE_KEY = 'ibid_lang';
const CURRENCY_STORAGE_KEY = 'ibid_currency';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly config = inject(I18N_CONFIG_TOKEN, { optional: true }) ?? UNCONFIGURED;

  private readonly currentLanguage = signal<string>(
    this.readStored(LANGUAGE_STORAGE_KEY) ?? this.config.defaultLanguage
  );
  private readonly currentCurrency = signal<string>(
    this.readStored(CURRENCY_STORAGE_KEY) ?? this.config.defaultCurrency ?? 'EUR'
  );

  readonly currentLang = this.currentLanguage.asReadonly();
  readonly currency = this.currentCurrency.asReadonly();
  readonly availableLanguages = Object.keys(this.config.translations);

  readonly locale = computed(
    () => this.config.localeByLanguage[this.currentLanguage()] ?? this.currentLanguage()
  );

  readonly currencySymbol = computed(() => {
    const parts = new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: this.currentCurrency()
    }).formatToParts(0);
    return parts.find(part => part.type === 'currency')?.value ?? this.currentCurrency();
  });

  readonly translations = computed<TranslationDictionary>(
    () => this.config.translations[this.currentLanguage()] ?? {}
  );

  readonly t = this.translations;

  translate(key: string, fallback?: string): string {
    if (!key) return fallback ?? '';
    const table = this.translations();
    if (table[key]) return table[key];
    const lower = key.toLowerCase();
    if (table[lower]) return table[lower];
    return fallback ?? key;
  }

  setLanguage(language: string): void {
    this.currentLanguage.set(language);
    this.writeStored(LANGUAGE_STORAGE_KEY, language);
  }

  toggleLanguage(): void {
    const languages = this.availableLanguages;
    const index = languages.indexOf(this.currentLanguage());
    const next = languages[(index + 1) % languages.length] ?? this.currentLanguage();
    this.setLanguage(next);
  }

  setCurrency(code: string): void {
    this.currentCurrency.set(code);
    this.writeStored(CURRENCY_STORAGE_KEY, code);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: this.currentCurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
      .format(value)
      .replace(/[  ]/g, ' ');
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(this.locale()).format(date);
  }

  private readStored(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStored(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {

    }
  }
}

export function translate(key: string, fallback?: string): string {
  try {
    const service = inject(I18nService, { optional: true });
    if (service) return service.translate(key, fallback);
  } catch {

  }
  return fallback ?? key;
}
