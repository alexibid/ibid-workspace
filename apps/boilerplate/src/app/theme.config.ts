import { ThemeConfig } from '@ibid/services';

export const BOILERPLATE_THEME_CONFIG: ThemeConfig = {
  themes: [
    { id: 'base', label: 'Base' },
    { id: 'glass-surface', label: 'Glass' },
    { id: 'kirigami', label: 'Kirigami' },
  ],
  defaultTheme: 'glass-surface',
};
