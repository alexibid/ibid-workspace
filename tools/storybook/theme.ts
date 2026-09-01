import { create } from 'storybook/theming';

export const ibidTheme = create({
  base: 'light',
  brandTitle: 'ibid — Design System',
  brandUrl: '/',
  brandImage: 'icons/ibid.svg',
  brandTarget: '_self',

  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',

  colorPrimary: '#2c6a4d',
  colorSecondary: '#333f8f',

  appBg: '#f1efe8',
  appContentBg: '#ffffff',
  appBorderColor: '#e2ddd2',
  appBorderRadius: 8,

  textColor: '#2c2c2a',
  textInverseColor: '#ffffff',

  barTextColor: '#6b6a66',
  barSelectedColor: '#2c6a4d',
  barBg: '#ffffff'
});
