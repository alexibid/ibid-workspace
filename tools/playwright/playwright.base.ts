import { devices, type PlaywrightTestConfig } from '@playwright/test';

export const DEVICE_PROJECTS: PlaywrightTestConfig['projects'] = [
  {
    name: 'mobile',
    use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
  },
  {
    name: 'tablet',
    use: { ...devices['iPad (gen 7)'], viewport: { width: 810, height: 1080 } },
  },
  {
    name: 'desktop',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  },
];

const isCI = !!process.env['CI'];

export const basePlaywrightConfig: PlaywrightTestConfig = {
  timeout: 30 * 1000,
  expect: {
    timeout: 1000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  outputDir: '.playwright-artifacts/',
  projects: DEVICE_PROJECTS,
  use: {
    actionTimeout: 1000,
    navigationTimeout: 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};
