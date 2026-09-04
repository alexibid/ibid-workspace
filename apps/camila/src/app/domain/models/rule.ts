import { BehaviourDomainId } from './behaviour-domain';

export interface Rule {
  readonly domain: BehaviourDomainId;
  readonly threshold: number;
}

export function badgeIdFor(rule: Rule): string {
  return `${rule.domain}-${rule.threshold}`;
}
