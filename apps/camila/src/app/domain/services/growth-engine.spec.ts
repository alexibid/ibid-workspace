import { BEHAVIOUR_DOMAINS, createEmptyBranches } from '@domain/models/behaviour-domain';
import { Recognition } from '@domain/models/recognition';
import { Rule } from '@domain/models/rule';
import { TreeState, createTreeState } from '@domain/models/tree-state';
import {
  REST_AFTER_MS,
  applyRecognitions,
  earnBadges,
  growBranches,
  isResting,
  nextThreshold,
  rebuildTree,
} from './growth-engine';

const RULES: readonly Rule[] = [
  { domain: 'tarefas', threshold: 2 },
  { domain: 'tarefas', threshold: 5 },
  { domain: 'escola', threshold: 2 },
];

const NOW = 1_700_000_000_000;

function recognition(overrides: Partial<Recognition> = {}): Recognition {
  return {
    id: 'entry-1:tarefas',
    entryId: 'entry-1',
    childId: 'child-1',
    domain: 'tarefas',
    points: 1,
    source: 'assistant',
    ...overrides,
  };
}

describe('createEmptyBranches', () => {
  it('starts every behaviour domain at zero', () => {
    const branches = createEmptyBranches();

    expect(Object.keys(branches)).toHaveLength(BEHAVIOUR_DOMAINS.length);
    expect(Object.values(branches).every((level) => level === 0)).toBe(true);
  });
});

describe('growBranches', () => {
  it('grows only the domain of each recognition', () => {
    const branches = growBranches(createEmptyBranches(), [recognition()]);

    expect(branches.tarefas).toBe(1);
    expect(branches.escola).toBe(0);
  });

  it('accumulates the weight of several recognitions', () => {
    const branches = growBranches(createEmptyBranches(), [
      recognition({ points: 2 }),
      recognition({ domain: 'escola' }),
      recognition(),
    ]);

    expect(branches.tarefas).toBe(3);
    expect(branches.escola).toBe(1);
  });
});

describe('earnBadges', () => {
  it('earns a badge when a branch reaches a threshold', () => {
    const branches = growBranches(createEmptyBranches(), [recognition({ points: 2 })]);

    const badges = earnBadges(branches, RULES, [], NOW);

    expect(badges).toHaveLength(1);
    expect(badges[0]).toEqual({ id: 'tarefas-2', domain: 'tarefas', threshold: 2, earnedAt: NOW });
  });

  it('earns every threshold crossed at once', () => {
    const branches = growBranches(createEmptyBranches(), [recognition({ points: 5 })]);

    const badges = earnBadges(branches, RULES, [], NOW);

    expect(badges.map((badge) => badge.id)).toEqual(['tarefas-2', 'tarefas-5']);
  });

  it('never earns the same badge twice', () => {
    const branches = growBranches(createEmptyBranches(), [recognition({ points: 3 })]);
    const first = earnBadges(branches, RULES, [], NOW);

    const second = earnBadges(branches, RULES, first, NOW + 1000);

    expect(second).toHaveLength(0);
  });
});

describe('applyRecognitions', () => {
  it('leaves the state untouched when there is nothing to apply', () => {
    const state = createTreeState('child-1');

    expect(applyRecognitions(state, [], RULES, NOW)).toBe(state);
  });

  it('grows the tree and records when it last grew', () => {
    const state = applyRecognitions(createTreeState('child-1'), [recognition()], RULES, NOW);

    expect(state.branches.tarefas).toBe(1);
    expect(state.lastGrowthAt).toBe(NOW);
    expect(state.badges).toHaveLength(0);
  });

  it('keeps badges earned in earlier rounds', () => {
    const first = applyRecognitions(
      createTreeState('child-1'),
      [recognition({ points: 2 })],
      RULES,
      NOW
    );

    const second = applyRecognitions(first, [recognition({ points: 3 })], RULES, NOW + 1000);

    expect(second.badges.map((badge) => badge.id)).toEqual(['tarefas-2', 'tarefas-5']);
  });
});

describe('rebuildTree', () => {
  it('recomputes the branches from the recognitions it is given', () => {
    const grown = applyRecognitions(createTreeState('child-1'), [recognition()], RULES, NOW);

    const rebuilt = rebuildTree(grown, [recognition({ domain: 'escola' })], RULES, NOW + 1000);

    expect(rebuilt.branches.tarefas).toBe(0);
    expect(rebuilt.branches.escola).toBe(1);
  });

  it('keeps the original date of a badge that is earned again', () => {
    const grown = applyRecognitions(
      createTreeState('child-1'),
      [recognition({ points: 2 })],
      RULES,
      NOW
    );

    const rebuilt = rebuildTree(grown, [recognition({ points: 2 })], RULES, NOW + 5000);

    expect(rebuilt.badges).toEqual([
      { id: 'tarefas-2', domain: 'tarefas', threshold: 2, earnedAt: NOW },
    ]);
  });

  it('drops a badge whose threshold is no longer met', () => {
    const grown = applyRecognitions(
      createTreeState('child-1'),
      [recognition({ points: 2 })],
      RULES,
      NOW
    );

    const rebuilt = rebuildTree(grown, [], RULES, NOW + 1000);

    expect(rebuilt.badges).toHaveLength(0);
  });
});

describe('isResting', () => {
  function grown(lastGrowthAt: number): TreeState {
    return { ...createTreeState('child-1'), lastGrowthAt };
  }

  it('rests once nothing has been recorded for the rest window', () => {
    expect(isResting(grown(NOW), NOW + REST_AFTER_MS)).toBe(true);
  });

  it('does not rest while the window is still open', () => {
    expect(isResting(grown(NOW), NOW + REST_AFTER_MS - 1)).toBe(false);
  });
});

describe('nextThreshold', () => {
  it('reports the closest threshold still ahead', () => {
    const branches = growBranches(createEmptyBranches(), [recognition({ points: 2 })]);

    expect(nextThreshold(branches, RULES, 'tarefas')).toBe(5);
  });

  it('reports nothing once every threshold is behind', () => {
    const branches = growBranches(createEmptyBranches(), [recognition({ points: 9 })]);

    expect(nextThreshold(branches, RULES, 'tarefas')).toBeUndefined();
  });
});
