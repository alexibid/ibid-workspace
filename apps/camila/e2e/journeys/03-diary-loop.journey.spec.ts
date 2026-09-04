import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';
import {
  CHIP,
  COMPOSER,
  CONFIRM,
  DISMISS,
  ENTRY,
  ENTRY_DOMAINS,
  ENTRY_TEXT,
  JUST_AFTER_SEED,
  READING,
  READING_HIT,
  SEEDED_ENTRIES,
  MODEL_PANEL,
  UNREAD_SENTENCE,
  bothDomains,
  freezeClock,
  openEmpty,
  openSeeded,
  sentenceFor,
  t,
  write,
} from '../support/app';

const TAREFAS = t('domainTarefas');
const FAMILIA = t('domainFamilia');

test.describe('The diary loop', () => {
  test('one sentence is read into two domains and confirmed', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'diary-reading');
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/diario');

    await write(page, bothDomains('tarefas', 'familia'));
    await expect(page.locator(READING_HIT)).toHaveText([`${FAMILIA} +3`, `${TAREFAS} +2`]);
    await recorder.step(1, 'write one sentence', 'the diary reads two domains');

    await page.locator(CONFIRM).click();
    await expect(page.locator(READING)).toHaveCount(0);
    await expect(page.locator(ENTRY)).toHaveCount(SEEDED_ENTRIES + 1);
    await expect(page.locator(ENTRY_DOMAINS).first()).toHaveText(`${TAREFAS} · ${FAMILIA}`);
    await recorder.step(2, 'confirm the reading', 'the entry carries both domains');

    await page.reload({ waitUntil: 'commit' });
    await expect(page.locator(ENTRY_DOMAINS).first()).toHaveText(`${TAREFAS} · ${FAMILIA}`);
    await recorder.step(3, 'reload', 'the reading survived');
  });

  test('the parent can overrule the reading, and that teaches it', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'diary-correction');
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/diario');

    await write(page, `${UNREAD_SENTENCE} 1`);
    await expect(page.locator(READING_HIT)).toHaveCount(0);
    await recorder.step(1, 'write something it cannot read', 'nothing is proposed');

    await page.locator(CHIP).filter({ hasText: FAMILIA }).click();
    await page.locator(CONFIRM).click();
    await expect(page.locator(ENTRY_DOMAINS).first()).toHaveText(FAMILIA);
    await recorder.step(2, 'assign it by hand', 'the entry lands on the chosen domain');

    await write(page, `${UNREAD_SENTENCE} 2`);
    await expect(page.locator(READING_HIT)).toHaveText([`${FAMILIA} +3`]);
    await recorder.step(3, 'write a similar sentence', 'the correction taught the diary');
  });

  test('a reading can be dismissed and leaves the entry unread', async ({ page }) => {
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/diario');

    await write(page, sentenceFor('tarefas'));
    await expect(page.locator(ENTRY)).toHaveCount(SEEDED_ENTRIES + 1);
    await expect(page.locator(ENTRY_TEXT).first()).toHaveText(sentenceFor('tarefas'));

    await page.locator(DISMISS).click();

    await expect(page.locator(READING)).toHaveCount(0);
    await expect(page.locator(ENTRY).first().locator(ENTRY_DOMAINS)).toHaveCount(0);
  });

  test('the child screen stands the paper model up and turns it', async ({ page }) => {
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/');

    const scene = page.locator('.o-paper-model__scene');
    await expect(page.locator('.o-paper-model__stage')).toBeVisible();
    await expect(page.locator(MODEL_PANEL).first()).toBeVisible();
    const opening = await scene.getAttribute('style');

    await page.locator('.o-paper-model__key').nth(2).click();

    await expect(scene).not.toHaveAttribute('style', opening ?? '');
  });

  test('the composer empties itself once the entry is kept', async ({ page }) => {
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/diario');

    await write(page, sentenceFor('escola'));

    await expect(page.locator(COMPOSER)).toHaveValue('', { timeout: 20_000 });
  });

  test('the first run is empty and never blames anyone for it', async ({ page }) => {
    await openEmpty(page, '/diario');

    await expect(page.locator(ENTRY)).toHaveCount(0);
    await expect(page.getByText(/nada|nothing/i)).toHaveCount(1);
  });
});
