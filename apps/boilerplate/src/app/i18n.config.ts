import { I18nConfig } from '@ibid/services';

export const BOILERPLATE_I18N_CONFIG: I18nConfig = {
  translations: {
    pt: {
      title: 'boilerplate',
      subtitle: 'As cores e a tipografia do design system ibid, num só sítio',
      sampleAmountLabel: 'Saldo de exemplo',
      navToggleLabel: 'Abrir navegação',
      languageToggleLabel: 'Mudar de idioma',
      navCloseLabel: 'Fechar navegação',
      navHome: 'Início',
      viewMoreBtn: 'Ver mais',
      infoBalloonClose: 'Fechar',
      categoryUncategorizedLabel: 'Sem categoria',
    },
    en: {
      title: 'boilerplate',
      subtitle: 'The colors and typography of the ibid design system, in one place',
      sampleAmountLabel: 'Sample balance',
      navToggleLabel: 'Open navigation',
      languageToggleLabel: 'Change language',
      navCloseLabel: 'Close navigation',
      navHome: 'Home',
      viewMoreBtn: 'View more',
      infoBalloonClose: 'Close',
      categoryUncategorizedLabel: 'Uncategorised',
    },
  },
  defaultLanguage: 'pt',
  localeByLanguage: { pt: 'pt-PT', en: 'en-US' },
  defaultCurrency: 'EUR',
};
