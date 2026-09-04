import { test } from '@playwright/test';
import { A11yAuditor } from '@ibid/testing';
import { JUST_AFTER_SEED, freezeClock, openSeeded } from '../support/app';

const SCREENS = [
  { path: '/', name: 'child' },
  { path: '/diario', name: 'diary' },
];

test.describe('Accessibility', () => {
  for (const screen of SCREENS) {
    test(`the seeded ${screen.name} screen has no critical or serious violations`, async ({
      page,
    }) => {
      await freezeClock(page, JUST_AFTER_SEED);
      await openSeeded(page, screen.path);
      await page.waitForLoadState('networkidle');
      await page
        .waitForFunction(
          () => document.getAnimations().every((animation) => animation.playState !== 'running'),
          undefined,
          { polling: 100, timeout: 800 }
        )
        .catch(() => undefined);

      await A11yAuditor.assertAccessible(page, `${screen.name} screen`);
    });
  }
});
