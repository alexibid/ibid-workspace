import { defineConfig } from '@playwright/test';
import { basePlaywrightConfig } from '../../tools/playwright/playwright.base';

const BASE_URL = 'http://localhost:4300';

export default defineConfig({
  ...basePlaywrightConfig,
  testDir: './e2e',
  use: {
    ...basePlaywrightConfig.use,
    baseURL: BASE_URL
  },
  webServer: {
    command: 'npx nx serve boilerplate --port=4300',
    cwd: '../..',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000
  }
});
