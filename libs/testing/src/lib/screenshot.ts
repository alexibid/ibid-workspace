import * as fs from 'node:fs';
import * as path from 'node:path';
import { Locator, Page, TestInfo } from '@playwright/test';
import { DEFAULT_APP_SHELL } from './app-shell-selectors';

export type DeviceFolder = 'mobile' | 'tablet' | 'desktop';

export function getWorkspaceRoot(): string {
  if (process.env['NX_WORKSPACE_ROOT']) {
    return process.env['NX_WORKSPACE_ROOT'];
  }
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'nx.json'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

export function getDeviceFolder(testInfo: TestInfo): DeviceFolder {
  const name = testInfo.project.name.toLowerCase();
  if (name.includes('mobile')) return 'mobile';
  if (name.includes('tablet')) return 'tablet';
  return 'desktop';
}

export function getProjectFolder(testInfo: TestInfo): string {
  const filePath = testInfo.file ?? '';
  const match = filePath.match(/(?:apps|libs)\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return 'shared';
}

export function getScreenshotPath(testInfo: TestInfo, group: string, filename: string): string {
  const root = getWorkspaceRoot();
  const project = getProjectFolder(testInfo);
  const device = getDeviceFolder(testInfo);
  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
  return path.join(root, 'test-results', project, device, group, cleanFilename);
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
