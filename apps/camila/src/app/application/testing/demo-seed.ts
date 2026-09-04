import { DiaryDependencies } from '@application/use-cases/diary-dependencies';
import { recordDiaryEntry } from '@application/use-cases/record-diary-entry';
import { confirmRecognitions } from '@application/use-cases/confirm-recognitions';
import { PENDING_SENTENCE, POOLS } from '@domain/data/pt/seed-sentences';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const DEMO_SEED_AT = 1_700_000_000_000;
export const DEMO_SPAN_DAYS = 56;

export { PENDING_SENTENCE };

export const DEMO_ENTRY_COUNT =
  POOLS.reduce((total, pool) => total + pool.count, 0) + 1;

export function demoSentences(): readonly string[] {
  const sentences = POOLS.flatMap((pool) =>
    Array.from({ length: pool.count }, (_unused, index) => pool.sentences[index % pool.sentences.length])
  );

  return [...interleave(sentences), PENDING_SENTENCE];
}

export function recentSeedStart(now: number): number {
  return now - DEMO_SPAN_DAYS * DAY;
}

export async function seedDemoData(
  deps: DiaryDependencies,
  childId: string,
  startedAt: number = DEMO_SEED_AT
): Promise<void> {
  const sentences = demoSentences();
  const step = (DEMO_SPAN_DAYS * DAY) / sentences.length;

  for (const [index, text] of sentences.entries()) {
    const at = Math.round(startedAt + index * step);
    const proposal = await recordDiaryEntry(deps, { childId, text, at });
    if (proposal.hits.length === 0) continue;

    await confirmRecognitions(deps, {
      childId,
      entryId: proposal.entry.id,
      hits: proposal.hits,
      source: 'assistant',
      at,
    });
  }
}

function interleave(sentences: readonly string[]): readonly string[] {
  const shuffled = [...sentences];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = (index * 7 + 3) % (index + 1);
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}
