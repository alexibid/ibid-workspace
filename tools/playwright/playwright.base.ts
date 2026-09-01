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
  timeout: 90 * 1000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  outputDir: '.playwright-artifacts/',
  projects: DEVICE_PROJECTS,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};
