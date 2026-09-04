import { BehaviourDomainId } from './behaviour-domain';

export const RECOGNITION_SOURCES = ['assistant', 'parent'] as const;

export type RecognitionSource = (typeof RECOGNITION_SOURCES)[number];

export const MAX_POINTS_PER_DOMAIN = 3;

export interface DomainHit {
  readonly domain: BehaviourDomainId;
  readonly points: number;
}

export interface Recognition extends DomainHit {
  readonly id: string;
  readonly entryId: string;
  readonly childId: string;
  readonly source: RecognitionSource;
}

export function recognitionId(entryId: string, domain: BehaviourDomainId): string {
  return `${entryId}:${domain}`;
}
