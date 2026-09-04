import { LearnedVocabulary } from '@domain/models/vocabulary';

export interface VocabularyRepository {
  byChild(childId: string): Promise<LearnedVocabulary>;
  save(vocabulary: LearnedVocabulary): Promise<void>;
}
