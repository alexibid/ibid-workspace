import { DiaryEntry } from '@domain/models/diary-entry';
import { DomainHit } from '@domain/models/recognition';
import { predictDomains } from '@domain/services/domain-classifier';
import { DiaryDependencies } from './diary-dependencies';

export interface RecordDiaryEntryInput {
  readonly childId: string;
  readonly text: string;
  readonly at: number;
}

export interface DiaryProposal {
  readonly entry: DiaryEntry;
  readonly hits: readonly DomainHit[];
}

export async function recordDiaryEntry(
  deps: DiaryDependencies,
  input: RecordDiaryEntryInput
): Promise<DiaryProposal> {
  const entry: DiaryEntry = {
    id: deps.newId(),
    childId: input.childId,
    at: input.at,
    text: input.text,
  };
  await deps.diary.save(entry);

  const vocabulary = await deps.vocabulary.byChild(input.childId);
  return { entry, hits: predictDomains(input.text, vocabulary.words) };
}
