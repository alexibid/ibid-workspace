import { I18nConfig } from '@ibid/services';

export const BOILERPLATE_I18N_CONFIG: I18nConfig = {
  translations: {
    pt: {
      title: 'ibid boilerplate',
      subtitle: 'Ponto de partida para novos produtos ibid',
      sampleAmountLabel: 'Saldo de exemplo'
    },
    en: {
      title: 'ibid boilerplate',
      subtitle: 'Starting point for new ibid products',
      sampleAmountLabel: 'Sample balance'
    }
  },
  defaultLanguage: 'pt',
  localeByLanguage: { pt: 'pt-PT', en: 'en-US' },
  defaultCurrency: 'EUR'
};
