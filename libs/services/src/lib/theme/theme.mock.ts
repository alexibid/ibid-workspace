import { ThemeConfig } from './theme.service';

export const MOCK_THEME_CONFIG: ThemeConfig = {
  themes: [
    { id: 'base', label: 'Base' },
    { id: 'sea-glass-pebbles', label: 'Glass surface' },
    { id: 'kirigami', label: 'Kirigami' }
  ],
  defaultTheme: 'sea-glass-pebbles'
};

export const MOCK_UNDECLARED_THEME_ID = 'brutalist';

export const MOCK_THEME_STORAGE_KEY = 'ibid_theme';
