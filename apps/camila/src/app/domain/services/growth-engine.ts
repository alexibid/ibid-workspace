import {
  BehaviourDomainId,
  BranchLevels,
  createEmptyBranches,
} from '@domain/models/behaviour-domain';
import { Recognition } from '@domain/models/recognition';
import { Rule, badgeIdFor } from '@domain/models/rule';
import { Badge, TreeState } from '@domain/models/tree-state';

export const REST_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function applyRecognitions(
  state: TreeState,
  recognitions: readonly Recognition[],
  rules: readonly Rule[],
  at: number
): TreeState {
  if (recognitions.length === 0) return state;

  const branches = growBranches(state.branches, recognitions);
  const badges = [...state.badges, ...earnBadges(branches, rules, state.badges, at)];

  return { ...state, branches, badges, lastGrowthAt: at };
}

export function rebuildTree(
  previous: TreeState,
  recognitions: readonly Recognition[],
  rules: readonly Rule[],
  at: number
): TreeState {
  const branches = growBranches(createEmptyBranches(), recognitions);
  const earnedAtById = new Map(previous.badges.map((badge) => [badge.id, badge.earnedAt]));

  const badges = earnBadges(branches, rules, [], at).map((badge) => ({
    ...badge,
    earnedAt: earnedAtById.get(badge.id) ?? badge.earnedAt,
  }));

  return { ...previous, branches, badges, lastGrowthAt: at };
}

export function growBranches(
  branches: BranchLevels,
  recognitions: readonly Recognition[]
): BranchLevels {
  const grown = { ...branches } as Record<BehaviourDomainId, number>;
  for (const recognition of recognitions) {
    grown[recognition.domain] += recognition.points;
  }
  return grown;
}

export function earnBadges(
  branches: BranchLevels,
  rules: readonly Rule[],
  earned: readonly Badge[],
  at: number
): readonly Badge[] {
  const alreadyEarned = new Set(earned.map((badge) => badge.id));

  return rules
    .filter((rule) => branches[rule.domain] >= rule.threshold)
    .filter((rule) => !alreadyEarned.has(badgeIdFor(rule)))
    .map((rule) => ({
      id: badgeIdFor(rule),
      domain: rule.domain,
      threshold: rule.threshold,
      earnedAt: at,
    }));
}

export function badgesGained(before: TreeState, after: TreeState): readonly Badge[] {
  const known = new Set(before.badges.map((badge) => badge.id));
  return after.badges.filter((badge) => !known.has(badge.id));
}

export function isResting(state: TreeState, now: number): boolean {
  return now - state.lastGrowthAt >= REST_AFTER_MS;
}

export function nextThreshold(
  branches: BranchLevels,
  rules: readonly Rule[],
  domain: BehaviourDomainId
): number | undefined {
  return rules
    .filter((rule) => rule.domain === domain && rule.threshold > branches[domain])
    .map((rule) => rule.threshold)
    .sort((a, b) => a - b)[0];
}
