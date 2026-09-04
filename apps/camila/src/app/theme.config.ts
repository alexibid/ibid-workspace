import {
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { THEME_CONFIG_TOKEN, ThemeConfig, ThemeService } from '@ibid/services';

export const CAMILA_THEME_CONFIG: ThemeConfig = {
  themes: [{ id: 'kirigami', label: 'Kirigami' }],
  defaultTheme: 'kirigami',
};

const wearConfiguredTheme = (): void => {
  inject(ThemeService);
};

export function provideCamilaTheme(): readonly (Provider | EnvironmentProviders)[] {
  return [
    { provide: THEME_CONFIG_TOKEN, useValue: CAMILA_THEME_CONFIG },
    provideEnvironmentInitializer(wearConfiguredTheme),
  ];
}
