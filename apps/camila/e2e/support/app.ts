import { Page, expect } from '@playwright/test';
import { CAMILA_I18N_CONFIG } from '../../src/app/i18n.config';
import {
  CLAUSE_JOINER,
  PENDING_SENTENCE,
  POOLS,
} from '../../src/app/domain/data/pt/seed-sentences';

const PT = CAMILA_I18N_CONFIG.translations['pt'];

const EN_TABLE = CAMILA_I18N_CONFIG.translations['en'];

export const t = (key: string): string => PT[key];

export const EN = (key: string): string => EN_TABLE[key];

export const UNREAD_SENTENCE = PENDING_SENTENCE;

export const sentenceFor = (domain: string, index = 0): string =>
  POOLS.find((pool) => pool.domain === domain)?.sentences[index] ?? '';

export const bothDomains = (first: string, second: string): string =>
  `${sentenceFor(first)}${CLAUSE_JOINER}${sentenceFor(second)}`;

declare global {
  interface Window {
    camilaDev?: {
      seed(startedAt?: number): Promise<void>;
      reset(): Promise<void>;
    };
  }
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const DEMO_SEED_AT = 1_700_000_000_000;
export const DEMO_SPAN_DAYS = 56;

const SEED_ENDS_AT = DEMO_SEED_AT + DEMO_SPAN_DAYS * DAY;

export const JUST_AFTER_SEED = SEED_ENDS_AT + HOUR;

export const COMPOSER = 'ibid-textarea textarea';
export const SAVE = '.camila-diary__actions button';
export const ENTRY = '.camila-log__entry';
export const ENTRY_TEXT = '.camila-log__text';
export const ENTRY_DOMAINS = '.camila-log__domains';
export const READING = '.camila-reading';
export const READING_HIT = '.camila-reading__hit';
export const CONFIRM = '.camila-reading__actions ibid-button button';
export const DISMISS = '.camila-reading__dismiss';
export const CHIP = '.a-chip__control';
export const HERO_DOMAIN = '.camila-stage__domain';
export const HERO_FOLDS = '.camila-stage__folds';
export const TRAY_SLOT = '.camila-tray__slot';
export const FACET = '.m-origami__facet';
export const MODEL_PANEL = '.o-paper-model__sheet, .o-paper-model__face';
export const PROFILE = '.camila-profile';

export const SEEDED_ENTRIES = 59;

export async function freezeClock(page: Page, at: number): Promise<void> {
  await page.clock.setFixedTime(new Date(at));
}

async function waitForBridge(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForFunction(() => typeof window.camilaDev?.seed === 'function', undefined, {
    timeout: 30_000,
  });
}

export async function openEmpty(page: Page, path = '/'): Promise<void> {
  await waitForBridge(page, path);
  await page.evaluate(() => window.camilaDev?.reset());
}

export async function openSeeded(page: Page, path = '/'): Promise<void> {
  await waitForBridge(page, '/diario');
  await expect(page.locator(ENTRY)).toHaveCount(SEEDED_ENTRIES, { timeout: 60_000 });
  if (path !== '/diario') await page.goto(path, { waitUntil: 'commit' });
}

export async function write(page: Page, text: string): Promise<void> {
  const before = await page.locator(ENTRY).count();
  await page.locator(COMPOSER).fill(text);
  await page.locator(SAVE).click();
  await expect(page.locator(ENTRY)).toHaveCount(before + 1, { timeout: 20_000 });
  await expect(page.locator(READING)).toBeVisible({ timeout: 20_000 });
}
