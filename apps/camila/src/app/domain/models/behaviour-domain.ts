export const BEHAVIOUR_DOMAINS = [
  'comportamento',
  'tarefas',
  'escola',
  'conversas',
  'familia',
] as const;

export type BehaviourDomainId = (typeof BEHAVIOUR_DOMAINS)[number];

export interface BehaviourDomain {
  readonly id: BehaviourDomainId;
  readonly labelKey: string;
  readonly icon: string;
}

export type BranchLevels = Readonly<Record<BehaviourDomainId, number>>;

export function createEmptyBranches(): BranchLevels {
  const branches = {} as Record<BehaviourDomainId, number>;
  for (const id of BEHAVIOUR_DOMAINS) branches[id] = 0;
  return branches;
}

export function isBehaviourDomainId(value: string): value is BehaviourDomainId {
  return (BEHAVIOUR_DOMAINS as readonly string[]).includes(value);
}
