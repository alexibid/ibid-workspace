import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';

const PAGES = [
  { path: '', headings: ['Colors', 'Typography'] },
  { path: 'actions', headings: ['Buttons', 'Icon buttons and links'] },
  { path: 'inputs', headings: ['Inputs', 'Segmented control'] },
  { path: 'data', headings: ['Values and figures', 'Data table'] },
  { path: 'charts', headings: ['Charts'] },
  { path: 'layout', headings: ['Structure', 'Indicators', 'Empty state'] },
  { path: 'overlays', headings: ['Bottom sheet', 'Scrim'] },
  {
    path: 'hand-drawn',
    headings: [
      'Intensities (1 to 5)',
      'Glass Surface Cards & Rhythm',
      'Edge Controls',
      'Buttons & Feature Displays',
    ],
  },
];

test.describe('Design system showcase', () => {
  for (const page_ of PAGES) {
    const name = page_.path || 'home';

    test(`the ${name} page renders its sections`, async ({ page }, testInfo) => {
      const recorder = new FlowRecorder(page, testInfo, `design-system-${name}`);

      await page.goto(`/${page_.path}`, { waitUntil: 'commit' });
      for (const heading of page_.headings) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      }
      await recorder.step(1, `open ${name}`, 'every section is rendered');
    });
  }

  test('the root renders the home page with every colour and type token', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('boilerplate');
    await expect(page.locator('.boilerplate-swatch')).toHaveCount(29);
    await expect(page.locator('.boilerplate-specimen')).toHaveCount(8);
    await expect(page.locator('.boilerplate-scale__step')).toHaveCount(20);
  });

  test('the header switches the language', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('.boilerplate-language-toggle__code')).toHaveText('PT');

    await page.locator('.boilerplate-language-toggle button').click();
    await expect(page.locator('.boilerplate-language-toggle__code')).toHaveText('EN');
  });

  test('the theme picker swaps the body class and the reported tokens', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('body')).toHaveClass(/glass-surface/);
    const backgroundValue = page.locator('.boilerplate-swatch__value').first();
    await expect(backgroundValue).toHaveText('#F1EFE8');

    await page.locator('.boilerplate-theme-select .mat-mdc-select-trigger').click();
    await page.getByRole('option', { name: 'Kirigami' }).click();

    await expect(page.locator('body')).toHaveClass(/kirigami/);
    await expect(backgroundValue).toHaveText('#FFF8EF');
  });

  test('the data table renders one row per movement', async ({ page }) => {
    await page.goto('/data', { waitUntil: 'commit' });
    await expect(page.locator('ibid-data-table tbody tr')).toHaveCount(3);
    await expect(page.locator('ibid-data-table th')).toHaveCount(5);
    await expect(page.locator('ibid-data-table ibid-smart-currency-cell')).toHaveCount(3);
  });

  test('inputs report their state back to the page', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-inputs-state');

    await page.goto('/inputs', { waitUntil: 'commit' });
    await page.locator('ibid-search-input input').fill('groceries');
    await recorder.step(1, 'type into search', 'state line shows the term');

    await expect(page.locator('.showcase__state').first()).toContainText('groceries');
  });

  test('the scrim opens and dismisses', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-scrim');

    await page.goto('/overlays', { waitUntil: 'commit' });
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

    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(1, 'load page', 'navigation is closed');

    await page.locator('.boilerplate-nav-toggle button').click();
    await expect(page.locator('.o-header-nav--open')).toHaveCount(1);
    await expect(page.locator('ibid-nav-menu .m-nav-menu__link')).toHaveCount(PAGES.length);
    await recorder.step(2, 'open navigation', 'panel lists every page');

    const toggleBox = await page.locator('.boilerplate-nav-toggle button').boundingBox();
    const panelBox = await page.locator('.o-header-nav__panel').boundingBox();
    const coversToggle =
      !!toggleBox &&
      !!panelBox &&
      panelBox.y < toggleBox.y + toggleBox.height &&
      panelBox.y + panelBox.height > toggleBox.y &&
      panelBox.x < toggleBox.x + toggleBox.width &&
      panelBox.x + panelBox.width > toggleBox.x;
    expect(coversToggle, 'the open panel must not cover the header toggle').toBe(false);

    await page.locator('ibid-nav-menu .m-nav-menu__link').nth(3).click();
    await expect(page).toHaveURL(/\/data$/);
    await expect(page.locator('.o-header-nav--open')).toHaveCount(0);
    await recorder.step(3, 'follow a link', 'navigation closes on the new page');
  });

  test('the chosen theme and language survive a reload', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'design-system-persistence');
    await page.clock.setFixedTime(new Date('2026-09-02T10:00:00Z'));

    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('body')).toHaveClass(/glass-surface/);
    await expect(page.locator('.boilerplate-language-toggle__code')).toHaveText('PT');
    await recorder.step(1, 'load the page', 'defaults are glass-surface and PT');

    await page.locator('.boilerplate-theme-select .mat-mdc-select-trigger').click();
    await page.getByRole('option', { name: 'Kirigami' }).click();
    await page.locator('.boilerplate-language-toggle button').click();
    await expect(page.locator('body')).toHaveClass(/kirigami/);
    await expect(page.locator('.boilerplate-language-toggle__code')).toHaveText('EN');
    await recorder.step(2, 'pick kirigami and switch to EN', 'both preferences applied');

    await page.reload();

    await expect(page.locator('body')).toHaveClass(/kirigami/);
    await expect(page.locator('body')).not.toHaveClass(/glass-surface/);
    await expect(page.locator('.boilerplate-language-toggle__code')).toHaveText('EN');
    await expect(page.locator('.boilerplate-swatch__value').first()).toHaveText('#FFF8EF');
    await recorder.step(3, 'reload', 'both preferences restored from storage');
  });
});
