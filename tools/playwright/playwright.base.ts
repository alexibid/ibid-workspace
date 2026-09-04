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

const budget = {
  test: isCI ? 90 * 1000 : 30 * 1000,
  expect: isCI ? 10 * 1000 : 1000,
  action: isCI ? 15 * 1000 : 1000,
  navigation: isCI ? 30 * 1000 : 1000,
};

export const E2E_SERVER_TIMEOUT = isCI ? 600 * 1000 : 120 * 1000;

export const basePlaywrightConfig: PlaywrightTestConfig = {
  timeout: budget.test,
  expect: {
    timeout: budget.expect,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? [['list'], ['github']] : 'list',
  outputDir: '.playwright-artifacts/',
  projects: DEVICE_PROJECTS,
  use: {
    actionTimeout: budget.action,
    navigationTimeout: budget.navigation,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};
