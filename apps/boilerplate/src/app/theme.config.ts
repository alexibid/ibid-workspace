import { ThemeConfig } from '@ibid/services';

export const BOILERPLATE_THEME_CONFIG: ThemeConfig = {
  themes: [
    { id: 'base', label: 'Base' },
    { id: 'sea-glass-pebbles', label: 'Glass' },
    { id: 'kirigami', label: 'Kirigami' },
  ],
  defaultTheme: 'sea-glass-pebbles',
};
