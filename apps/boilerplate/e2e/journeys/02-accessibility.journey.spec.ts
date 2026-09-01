import { test } from '@playwright/test';
import { A11yAuditor } from '@ibid/testing';

const PAGES = ['actions', 'inputs', 'data', 'charts', 'layout', 'overlays'];

test.describe('Accessibility', () => {
  for (const path of PAGES) {
    test(`the ${path} page has no critical or serious violations`, async ({ page }) => {
      await page.goto(`/${path}`);
      await page.waitForLoadState('networkidle');
      await page
        .waitForFunction(
          () => document.getAnimations().every((animation) => animation.playState !== 'running'),
          undefined,
          { polling: 100, timeout: 5000 }
        )
        .catch(() => undefined);

      await A11yAuditor.assertAccessible(page, `${path} page`);
    });
  }
});
