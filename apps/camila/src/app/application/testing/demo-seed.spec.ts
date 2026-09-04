import { BOOTSTRAP_RULES } from '@domain/data/bootstrap-rules';
import { ORIGAMI_STAGES, unfoldedStage } from '@domain/data/origami-figures';
import { BEHAVIOUR_DOMAINS, BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DiaryDependencies } from '@application/use-cases/diary-dependencies';
import {
  InMemoryDiaryRepository,
  InMemoryRecognitionRepository,
  InMemoryTreeRepository,
  InMemoryVocabularyRepository,
} from './in-memory-repositories';
import {
  DEMO_ENTRY_COUNT,
  DEMO_SEED_AT,
  DEMO_SPAN_DAYS,
  PENDING_SENTENCE,
  recentSeedStart,
  seedDemoData,
} from './demo-seed';

const CHILD = 'demo-child';

function createDeps(): DiaryDependencies {
  let sequence = 0;
  return {
    diary: new InMemoryDiaryRepository(),
    recognitions: new InMemoryRecognitionRepository(),
    tree: new InMemoryTreeRepository(),
    vocabulary: new InMemoryVocabularyRepository(),
    rules: BOOTSTRAP_RULES,
    newId: () => `demo-${++sequence}`,
  };
}

async function seeded() {
  const deps = createDeps();
  await seedDemoData(deps, CHILD);
  return { deps, tree: await deps.tree.byChild(CHILD) };
}

describe('the demo seed', () => {
  it('records a history worth showing', async () => {
    const { deps } = await seeded();

    expect(await deps.diary.listByChild(CHILD)).toHaveLength(DEMO_ENTRY_COUNT);
    expect(DEMO_ENTRY_COUNT).toBeGreaterThan(50);
  });

  it('leaves exactly one entry the assistant could not read', async () => {
    const { deps } = await seeded();

    const entries = await deps.diary.listByChild(CHILD);
    const recognitions = await deps.recognitions.listByChild(CHILD);
    const read = new Set(recognitions.map((recognition) => recognition.entryId));
    const unread = entries.filter((entry) => !read.has(entry.id));

    expect(unread.map((entry) => entry.text)).toEqual([PENDING_SENTENCE]);
  });

  it('puts points on every domain, so no figure starts blank', async () => {
    const { tree } = await seeded();

    for (const domain of BEHAVIOUR_DOMAINS) {
      expect(tree.branches[domain]).toBeGreaterThan(0);
    }
  });

  it('unfolds the figures across several stages, including one complete', async () => {
    const { tree } = await seeded();

    const stageOf = (domain: BehaviourDomainId) =>
      unfoldedStage(tree.badges.filter((badge) => badge.domain === domain).length);
    const stages = BEHAVIOUR_DOMAINS.map(stageOf);

    expect(Math.max(...stages)).toBe(ORIGAMI_STAGES);
    expect(Math.min(...stages)).toBeGreaterThan(0);
    expect(new Set(stages).size).toBeGreaterThan(2);
  });

  it('spreads the history across the weeks it claims', async () => {
    const { deps } = await seeded();

    const entries = [...(await deps.diary.listByChild(CHILD))].sort((a, b) => a.at - b.at);
    const span = entries[entries.length - 1].at - entries[0].at;

    expect(entries[0].at).toBe(DEMO_SEED_AT);
    expect(span).toBeGreaterThan((DEMO_SPAN_DAYS - 2) * 24 * 60 * 60 * 1000);
  });

  it('starts a recent history so an opened app never looks abandoned', () => {
    expect(recentSeedStart(1_800_000_000_000)).toBeLessThan(1_800_000_000_000);
  });

  it('is deterministic, so a journey can assert exact counts', async () => {
    const first = await seeded();
    const second = await seeded();

    expect(first.tree.branches).toEqual(second.tree.branches);
  });
});
