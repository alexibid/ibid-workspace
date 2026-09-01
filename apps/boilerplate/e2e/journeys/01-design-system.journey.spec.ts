import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';

const PAGES = [
  { path: 'actions', headings: ['Buttons', 'Icon buttons and links'] },
  { path: 'inputs', headings: ['Inputs', 'Segmented control'] },
  { path: 'data', headings: ['Values and figures', 'Data table'] },
  { path: 'charts', headings: ['Charts'] },
  { path: 'layout', headings: ['Structure', 'Indicators', 'Empty state'] },
  { path: 'overlays', headings: ['Bottom sheet', 'Scrim'] }
];

test.describe('Design system showcase', () => {
  for (const page_ of PAGES) {
    test(`the ${page_.path} page renders its sections`, async ({ page }, testInfo) => {
      const recorder = new FlowRecorder(page, testInfo, `design-system-${page_.path}`);

      await page.goto(`/${page_.path}`);
      for (const heading of page_.headings) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      }
      await recorder.step(1, `open ${page_.path}`, 'every section is rendered');
    });
  }

  test('the root redirects to the first page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/actions$/);
  });

  test('the data table renders one row per movement', async ({ page }) => {
    await page.goto('/data');
    await expect(page.locator('ibid-data-table tbody tr')).toHaveCount(3);
    await expect(page.locator('ibid-data-table th')).toHaveCount(5);
    await expect(page.locator('ibid-data-table ibid-smart-currency-cell')).toHaveCount(3);
  });

  test('inputs report their state back to the page', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-inputs-state');

    await page.goto('/inputs');
    await page.locator('ibid-search-input input').fill('groceries');
    await recorder.step(1, 'type into search', 'state line shows the term');

    await expect(page.locator('.showcase__state').first()).toContainText('groceries');
  });

  test('the scrim opens and dismisses', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-scrim');

    await page.goto('/overlays');
    await expect(page.locator('ibid-scrim')).toHaveCount(0);

    await page.getByRole('button', { name: 'Show scrim' }).click();
    await recorder.step(1, 'open scrim', 'scrim covers the page');
    await expect(page.locator('ibid-scrim')).toHaveCount(1);

    await page.locator('.a-scrim').click();
    await recorder.step(2, 'dismiss scrim', 'scrim is gone');
    await expect(page.locator('ibid-scrim')).toHaveCount(0);
  });

  test('the navigation opens, links to every page and closes', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-navigation');

    await page.goto('/');
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(1, 'load page', 'navigation is closed');

    await page.locator('ibid-header ibid-icon-button button').click();
    await expect(page.locator('.o-header-nav--open')).toHaveCount(1);
    await expect(page.locator('ibid-nav-menu .m-nav-menu__link')).toHaveCount(PAGES.length);
    await recorder.step(2, 'open navigation', 'panel lists every page');

    const toggleBox = await page.locator('ibid-header ibid-icon-button button').boundingBox();
    const panelBox = await page.locator('.o-header-nav__panel').boundingBox();
    const coversToggle =
      !!toggleBox &&
      !!panelBox &&
      panelBox.y < toggleBox.y + toggleBox.height &&
      panelBox.y + panelBox.height > toggleBox.y &&
      panelBox.x < toggleBox.x + toggleBox.width &&
      panelBox.x + panelBox.width > toggleBox.x;
    expect(coversToggle, 'the open panel must not cover the header toggle').toBe(false);

    await page.locator('ibid-nav-menu .m-nav-menu__link').nth(2).click();
    await expect(page).toHaveURL(/\/data$/);
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(3, 'follow a link', 'navigation closes on the new page');
  });
});
