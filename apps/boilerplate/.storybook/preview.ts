import type { Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { BOILERPLATE_I18N_CONFIG } from '../src/app/i18n.config';

import '../src/styles.scss';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideRouter([]), { provide: I18N_CONFIG_TOKEN, useValue: BOILERPLATE_I18N_CONFIG }]
    })
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: { order: ['Atoms', 'Molecules', 'Organisms', 'Directives', 'Showcase'] }
    },
    a11y: { test: 'error' }
  }
};

export default preview;
