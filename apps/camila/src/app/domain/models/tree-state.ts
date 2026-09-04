import { BehaviourDomainId, BranchLevels, createEmptyBranches } from './behaviour-domain';

export interface Badge {
  readonly id: string;
  readonly domain: BehaviourDomainId;
  readonly threshold: number;
  readonly earnedAt: number;
}

export interface TreeState {
  readonly childId: string;
  readonly branches: BranchLevels;
  readonly badges: readonly Badge[];
  readonly lastGrowthAt: number;
}

export function createTreeState(childId: string): TreeState {
  return { childId, branches: createEmptyBranches(), badges: [], lastGrowthAt: 0 };
}
