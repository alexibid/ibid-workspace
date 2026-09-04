import { normalizeText } from '@ibid/utils';
import { BEHAVIOUR_DOMAINS, BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DomainHit, MAX_POINTS_PER_DOMAIN } from '@domain/models/recognition';
import { DomainScores, LearnedVocabulary, Vocabulary } from '@domain/models/vocabulary';
import {
  BOOTSTRAP_VOCABULARY,
  CLAUSE_BOUNDARY,
  CLAUSE_CONJUNCTIONS,
  NEGATION_WORDS,
  STOPWORDS,
} from '@domain/data/pt/vocabulary';

export const MIN_SCORE_TO_COUNT = 2;

const POINTS_PER_SCORE = 2;
const LEARNED_WEIGHT = 4;

export function tokenize(text: string): readonly string[] {
  return normalizeText(text).split(' ').filter(Boolean);
}

export function splitClauses(text: string): readonly string[] {
  return text
    .split(CLAUSE_BOUNDARY)
    .flatMap((part) => normalizeText(part).split(CLAUSE_CONJUNCTIONS))
    .map((clause) => clause.trim())
    .filter(Boolean);
}

export function contentWords(text: string): readonly string[] {
  return tokenize(text).filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export function predictDomains(text: string, learned: Vocabulary = {}): readonly DomainHit[] {
  const words = affirmedWords(text);

  const learnedScores = accumulate(words, learned);
  const scores = total(learnedScores) > 0 ? learnedScores : accumulate(words, BOOTSTRAP_VOCABULARY);

  return BEHAVIOUR_DOMAINS.filter((domain) => scores[domain] >= MIN_SCORE_TO_COUNT)
    .map((domain) => ({ domain, points: pointsFor(scores[domain]) }))
    .sort((left, right) => right.points - left.points || left.domain.localeCompare(right.domain));
}

export function learn(
  vocabulary: LearnedVocabulary,
  text: string,
  domains: readonly BehaviourDomainId[],
  at: number
): LearnedVocabulary {
  const words = contentWords(text);
  if (words.length === 0 || domains.length === 0) return vocabulary;

  const updated: Record<string, DomainScores> = { ...vocabulary.words };
  for (const word of words) {
    const existing = updated[word] ?? {};
    const grown = { ...existing };
    for (const domain of domains) grown[domain] = (existing[domain] ?? 0) + LEARNED_WEIGHT;
    updated[word] = grown;
  }

  return { ...vocabulary, words: updated, updatedAt: at };
}

function pointsFor(score: number): number {
  return Math.min(Math.max(Math.round(score / POINTS_PER_SCORE), 1), MAX_POINTS_PER_DOMAIN);
}

function affirmedWords(text: string): readonly string[] {
  return splitClauses(text)
    .map((clause) => clause.split(' ').filter(Boolean))
    .filter((words) => !words.some((word) => NEGATION_WORDS.includes(word)))
    .flat();
}

function accumulate(
  words: readonly string[],
  vocabulary: Vocabulary
): Record<BehaviourDomainId, number> {
  const scores = emptyScores();

  for (const word of words) {
    const entry = vocabulary[word];
    if (!entry) continue;

    for (const domain of BEHAVIOUR_DOMAINS) {
      scores[domain] += entry[domain] ?? 0;
    }
  }

  return scores;
}

function total(scores: Record<BehaviourDomainId, number>): number {
  return BEHAVIOUR_DOMAINS.reduce((sum, domain) => sum + scores[domain], 0);
}

function emptyScores(): Record<BehaviourDomainId, number> {
  const scores = {} as Record<BehaviourDomainId, number>;
  for (const domain of BEHAVIOUR_DOMAINS) scores[domain] = 0;
  return scores;
}
