import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';

test.describe('Design system showcase', () => {
  test('renders every component section with its states', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system');

    await page.goto('/');
    await recorder.step(1, 'open showcase', 'every section is rendered');

    for (const heading of [
      'Buttons',
      'Inputs',
      'Segmented control',
      'Values and figures',
      'Structure',
      'Indicators',
      'Empty state',
      'Charts',
      'Table cells',
      'Scrim'
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }

    await expect(page.locator('ibid-button').first()).toBeVisible();
    await expect(page.locator('ibid-currency-display').first()).toBeVisible();
    await expect(page.locator('ibid-bar-chart')).toHaveCount(1);
    await expect(page.locator('.showcase__table tbody tr')).toHaveCount(3);
  });

  test('inputs report their state back to the page', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-inputs');

    await page.goto('/');
    await page.locator('ibid-search-input input').fill('groceries');
    await recorder.step(1, 'type into search', 'state line shows the term');

    await expect(page.locator('.showcase__state').first()).toContainText('groceries');
  });

  test('the scrim opens and dismisses', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-scrim');

    await page.goto('/');
    await expect(page.locator('ibid-scrim')).toHaveCount(0);

    await page.getByRole('button', { name: 'Show scrim' }).click();
    await recorder.step(1, 'open scrim', 'scrim covers the page');
    await expect(page.locator('ibid-scrim')).toHaveCount(1);

    await page.locator('.a-scrim').click();
    await recorder.step(2, 'dismiss scrim', 'scrim is gone');
    await expect(page.locator('ibid-scrim')).toHaveCount(0);
  });

  test('the navigation opens and closes', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-navigation');

    await page.goto('/');
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(1, 'load page', 'navigation is closed');

    await page.locator('ibid-header ibid-icon-button button').click();
    await expect(page.locator('.o-header-nav--open')).toHaveCount(1);
    await recorder.step(2, 'open navigation', 'panel is visible and the toggle stays reachable');

    const toggle = page.locator('ibid-header ibid-icon-button button');
    const toggleBox = await toggle.boundingBox();
    const panelBox = await page.locator('.o-header-nav__panel').boundingBox();
    const coversToggle =
      !!toggleBox &&
      !!panelBox &&
      panelBox.y < toggleBox.y + toggleBox.height &&
      panelBox.y + panelBox.height > toggleBox.y &&
      panelBox.x < toggleBox.x + toggleBox.width &&
      panelBox.x + panelBox.width > toggleBox.x;
    expect(coversToggle, 'the open panel must not cover the header toggle').toBe(false);

    const viewport = page.viewportSize();
    const clickX = panelBox ? Math.min(panelBox.x + panelBox.width + 40, viewport!.width - 10) : 10;
    const clickY = panelBox ? Math.min(panelBox.y + panelBox.height + 40, viewport!.height - 10) : 10;
    await page.mouse.click(
      panelBox && panelBox.width >= viewport!.width - 1 ? viewport!.width / 2 : clickX,
      panelBox && panelBox.width >= viewport!.width - 1 ? clickY : viewport!.height / 2
    );
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(3, 'dismiss navigation', 'panel is hidden again');
  });
});
