import { defineConfig } from '@playwright/test';
import { DEVICE_PROJECTS, basePlaywrightConfig } from '../../tools/playwright/playwright.base';

const BASE_URL = 'http://localhost:4401';

export default defineConfig({
  ...basePlaywrightConfig,
  projects: (DEVICE_PROJECTS ?? []).filter((project) => project.name === 'mobile'),
  testDir: './e2e',
  use: {
    ...basePlaywrightConfig.use,
    baseURL: BASE_URL
  },
  webServer: {
    command: 'npx nx run camila:serve-e2e',
    cwd: '../..',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000
  }
});
