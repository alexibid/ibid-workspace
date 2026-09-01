import { expect, test } from '@playwright/test';
import { A11yAuditor } from '@ibid/testing';

test.describe('Accessibility', () => {
  test('the showcase page has no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.getAnimations().every((animation) => animation.playState !== 'running'),
      undefined,
      { polling: 100, timeout: 5000 }
    ).catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible();

    await A11yAuditor.assertAccessible(page, 'design system showcase');
  });
});
