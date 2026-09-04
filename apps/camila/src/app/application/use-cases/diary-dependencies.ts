import { Rule } from '@domain/models/rule';
import { DiaryRepository } from '@domain/repositories/diary.repository';
import { RecognitionRepository } from '@domain/repositories/recognition.repository';
import { TreeRepository } from '@domain/repositories/tree.repository';
import { VocabularyRepository } from '@domain/repositories/vocabulary.repository';

export interface DiaryDependencies {
  readonly diary: DiaryRepository;
  readonly recognitions: RecognitionRepository;
  readonly tree: TreeRepository;
  readonly vocabulary: VocabularyRepository;
  readonly rules: readonly Rule[];
  readonly newId: () => string;
}
