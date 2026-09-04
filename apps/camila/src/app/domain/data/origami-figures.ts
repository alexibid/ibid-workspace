import { BehaviourDomainId } from '@domain/models/behaviour-domain';

export const ORIGAMI_STAGES = 4;

export type FacetTone = 'lit' | 'face' | 'turn' | 'under';

export interface OrigamiFacet {
  readonly points: string;
  readonly tone: FacetTone;
  readonly stage: number;
}

export interface OrigamiFigure {
  readonly domain: BehaviourDomainId;
  readonly nameKey: string;
  readonly facets: readonly OrigamiFacet[];
}

const LEAF: readonly OrigamiFacet[] = [
  { stage: 1, tone: 'face', points: '50,92 26,58 50,44' },
  { stage: 2, tone: 'lit', points: '50,92 74,58 50,44' },
  { stage: 3, tone: 'turn', points: '50,44 26,58 34,20 50,8' },
  { stage: 4, tone: 'under', points: '50,44 74,58 66,20 50,8' },
];

const HOUSE: readonly OrigamiFacet[] = [
  { stage: 1, tone: 'face', points: '22,52 50,52 50,92 22,92' },
  { stage: 2, tone: 'lit', points: '50,52 78,52 78,92 50,92' },
  { stage: 3, tone: 'turn', points: '50,10 50,52 12,54' },
  { stage: 4, tone: 'under', points: '50,10 88,54 50,52' },
];

const PLANE: readonly OrigamiFacet[] = [
  { stage: 1, tone: 'face', points: '6,46 94,10 52,56' },
  { stage: 2, tone: 'lit', points: '6,46 52,56 26,86' },
  { stage: 3, tone: 'turn', points: '52,56 94,10 68,82' },
  { stage: 4, tone: 'under', points: '52,56 68,82 44,90' },
];

const BIRD: readonly OrigamiFacet[] = [
  { stage: 1, tone: 'face', points: '20,74 62,58 50,92' },
  { stage: 2, tone: 'lit', points: '20,74 62,58 46,34' },
  { stage: 3, tone: 'turn', points: '46,34 62,58 88,30' },
  { stage: 4, tone: 'under', points: '46,34 88,30 66,10' },
];

const HEART: readonly OrigamiFacet[] = [
  { stage: 1, tone: 'face', points: '50,94 14,50 50,50' },
  { stage: 2, tone: 'lit', points: '50,94 86,50 50,50' },
  { stage: 3, tone: 'turn', points: '14,50 32,20 50,50' },
  { stage: 4, tone: 'under', points: '86,50 68,20 50,50' },
];

export const ORIGAMI_FIGURES: readonly OrigamiFigure[] = [
  { domain: 'comportamento', nameKey: 'origamiLeaf', facets: LEAF },
  { domain: 'tarefas', nameKey: 'origamiHouse', facets: HOUSE },
  { domain: 'escola', nameKey: 'origamiPlane', facets: PLANE },
  { domain: 'conversas', nameKey: 'origamiBird', facets: BIRD },
  { domain: 'familia', nameKey: 'origamiHeart', facets: HEART },
];

export function origamiFor(domain: BehaviourDomainId): OrigamiFigure {
  const figure = ORIGAMI_FIGURES.find((candidate) => candidate.domain === domain);
  if (!figure) throw new Error(`No origami figure for domain "${domain}".`);
  return figure;
}

export function unfoldedStage(badgesEarned: number): number {
  return Math.min(badgesEarned, ORIGAMI_STAGES);
}
