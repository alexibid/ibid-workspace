import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN, THEME_CONFIG_TOKEN } from '@ibid/services';
import { appRoutes } from './app.routes';
import { BOILERPLATE_I18N_CONFIG } from './i18n.config';
import { BOILERPLATE_THEME_CONFIG } from './theme.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    { provide: I18N_CONFIG_TOKEN, useValue: BOILERPLATE_I18N_CONFIG },
    { provide: THEME_CONFIG_TOKEN, useValue: BOILERPLATE_THEME_CONFIG }
  ],
};
