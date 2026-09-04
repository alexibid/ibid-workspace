import { TestBed } from '@angular/core/testing';
import { ENTRY_SAMPLE } from '@domain/data/pt/corpus';
import { createTreeState } from '@domain/models/tree-state';
import { createLearnedVocabulary } from '@domain/models/vocabulary';
import { RxdbDiaryRepository } from './rxdb-diary.repository';
import { RxdbRecognitionRepository } from './rxdb-recognition.repository';
import { RxdbTreeRepository } from './rxdb-tree.repository';
import { RxdbVocabularyRepository } from './rxdb-vocabulary.repository';
import { CamilaDatabaseService } from './camila-database.service';

const CHILD = 'child-1';
const NOW = 1_700_000_000_000;

describe('the RxDB repositories', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  afterEach(async () => {
    await TestBed.inject(CamilaDatabaseService).close();
  });

  it('round-trips a diary entry and lists it by child', async () => {
    const repository = TestBed.inject(RxdbDiaryRepository);
    await repository.save({ id: 'entry-1', childId: CHILD, at: NOW, text: ENTRY_SAMPLE });

    expect(await repository.byId('entry-1')).toMatchObject({ text: ENTRY_SAMPLE });
    expect(await repository.listByChild(CHILD)).toHaveLength(1);
    expect(await repository.listByChild('other-child')).toHaveLength(0);
  });

  it('throws for a diary entry that does not exist', async () => {
    const repository = TestBed.inject(RxdbDiaryRepository);

    await expect(repository.byId('missing')).rejects.toThrow('missing');
  });

  it('keeps one recognition per entry and domain', async () => {
    const repository = TestBed.inject(RxdbRecognitionRepository);

    await repository.saveAll([
      { id: 'e1:tarefas', entryId: 'e1', childId: CHILD, domain: 'tarefas', points: 3, source: 'assistant' },
      { id: 'e1:familia', entryId: 'e1', childId: CHILD, domain: 'familia', points: 2, source: 'assistant' },
    ]);

    expect(await repository.listByChild(CHILD)).toHaveLength(2);
  });

  it('replaces every recognition of an entry when it is re-read', async () => {
    const repository = TestBed.inject(RxdbRecognitionRepository);
    await repository.saveAll([
      { id: 'e1:tarefas', entryId: 'e1', childId: CHILD, domain: 'tarefas', points: 3, source: 'assistant' },
    ]);

    await repository.removeForEntry('e1');
    await repository.saveAll([
      { id: 'e1:familia', entryId: 'e1', childId: CHILD, domain: 'familia', points: 2, source: 'parent' },
    ]);

    const stored = await repository.listByChild(CHILD);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ domain: 'familia', source: 'parent' });
  });

  it('returns an empty tree for a child that has none', async () => {
    const repository = TestBed.inject(RxdbTreeRepository);

    expect(await repository.byChild(CHILD)).toEqual(createTreeState(CHILD));
  });

  it('round-trips the branches and badges of a tree', async () => {
    const repository = TestBed.inject(RxdbTreeRepository);
    const state = {
      ...createTreeState(CHILD),
      branches: { ...createTreeState(CHILD).branches, tarefas: 4 },
      badges: [{ id: 'tarefas-3', domain: 'tarefas', threshold: 3, earnedAt: NOW }],
      lastGrowthAt: NOW,
    } as const;

    await repository.save(state);

    expect(await repository.byChild(CHILD)).toEqual(state);
  });

  it('round-trips a learned vocabulary', async () => {
    const repository = TestBed.inject(RxdbVocabularyRepository);
    const vocabulary = {
      ...createLearnedVocabulary(CHILD),
      words: { bolinhas: { familia: 3 } },
      updatedAt: NOW,
    };

    await repository.save(vocabulary);

    expect(await repository.byChild(CHILD)).toEqual(vocabulary);
  });

  it('returns an empty vocabulary for a child that has none', async () => {
    const repository = TestBed.inject(RxdbVocabularyRepository);

    expect(await repository.byChild(CHILD)).toEqual(createLearnedVocabulary(CHILD));
  });
});
