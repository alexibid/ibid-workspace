import { BehaviourDomainId } from './behaviour-domain';

export type DomainScores = Readonly<Partial<Record<BehaviourDomainId, number>>>;

export type Vocabulary = Readonly<Record<string, DomainScores>>;

export interface LearnedVocabulary {
  readonly childId: string;
  readonly words: Vocabulary;
  readonly updatedAt: number;
}

export function createLearnedVocabulary(childId: string): LearnedVocabulary {
  return { childId, words: {}, updatedAt: 0 };
}
