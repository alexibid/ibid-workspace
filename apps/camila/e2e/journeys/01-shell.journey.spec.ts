import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';
import { EN, PROFILE, freezeClock, openSeeded, t } from '../support/app';

test.describe('Application shell', () => {
  test('switches between the child screen and the diary', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'shell-profiles');
    await freezeClock(page, 1_700_000_000_000);
    await openSeeded(page, '/');

    await expect(page.locator('.o-paper-model__stage')).toBeVisible();
    await expect(page.locator(PROFILE)).toHaveText(t('toParents'));
    await recorder.step(1, 'open the child screen', 'the paper model is standing');

    await page.locator(PROFILE).click();
    await expect(page).toHaveURL(/\/diario$/);
    await expect(page.locator(PROFILE)).toHaveText(t('profileToChild'));
    await recorder.step(2, 'switch profile', 'the diary is showing');

    await page.locator(PROFILE).click();
    await expect(page.locator('.o-paper-model__stage')).toBeVisible();
    await expect(page.locator(PROFILE)).toHaveText(t('toParents'));
    await recorder.step(3, 'switch back', 'the child screen returns');
  });

  test('wears the kirigami theme and fits the viewport without scrolling', async ({ page }) => {
    await freezeClock(page, 1_700_000_000_000);
    await openSeeded(page, '/');

    await expect(page.locator('body')).toHaveClass(/kirigami/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('switches the language from the header', async ({ page }) => {
    await openSeeded(page, '/diario');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('diaryTitle'));

    await page.locator('.camila-language').click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(EN('diaryTitle'));
  });
});
