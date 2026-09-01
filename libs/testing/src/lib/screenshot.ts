import { Locator, Page, TestInfo } from '@playwright/test';
import { DEFAULT_APP_SHELL } from './app-shell-selectors';

export type DeviceFolder = 'mobile' | 'tablet' | 'desktop';

export function getDeviceFolder(testInfo: TestInfo): DeviceFolder {
  const name = testInfo.project.name.toLowerCase();
  if (name.includes('mobile')) return 'mobile';
  if (name.includes('tablet')) return 'tablet';
  return 'desktop';
}

export function getScreenshotPath(testInfo: TestInfo, group: string, filename: string): string {
  const device = getDeviceFolder(testInfo);
  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
  return `test-results/${device}/${group}/${cleanFilename}`;
}

export async function takeScreenshot(
  target: Page | Locator,
  testInfo: TestInfo,
  group: string,
  filename: string,
  options?: { fullPage?: boolean },
): Promise<void> {
  const path = getScreenshotPath(testInfo, group, filename);
  await target.screenshot({ path, fullPage: options?.fullPage });
}

export async function scrollContentToTop(
  page: Page,
  scrollContainer: string = DEFAULT_APP_SHELL.scrollContainer,
): Promise<void> {
  await page.evaluate((selector: string) => {
    document.querySelector(selector)?.scrollTo({ top: 0 });
  }, scrollContainer);
}
