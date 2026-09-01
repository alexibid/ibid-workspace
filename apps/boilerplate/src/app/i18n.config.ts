import { I18nConfig } from '@ibid/services';

export const BOILERPLATE_I18N_CONFIG: I18nConfig = {
  translations: {
    pt: {
      title: 'ibid boilerplate',
      subtitle: 'Ponto de partida para novos produtos ibid',
      sampleAmountLabel: 'Saldo de exemplo',
      navToggleLabel: 'Abrir navegação',
      navCloseLabel: 'Fechar navegação',
      navHome: 'Início',
      viewMoreBtn: 'Ver mais',
      infoBalloonClose: 'Fechar',
      categoryUncategorizedLabel: 'Sem categoria'
    },
    en: {
      title: 'ibid boilerplate',
      subtitle: 'Starting point for new ibid products',
      sampleAmountLabel: 'Sample balance',
      navToggleLabel: 'Open navigation',
      navCloseLabel: 'Close navigation',
      navHome: 'Home',
      viewMoreBtn: 'View more',
      infoBalloonClose: 'Close',
      categoryUncategorizedLabel: 'Uncategorised'
    }
  },
  defaultLanguage: 'pt',
  localeByLanguage: { pt: 'pt-PT', en: 'en-US' },
  defaultCurrency: 'EUR'
};
