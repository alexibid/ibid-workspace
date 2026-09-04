import { RxJsonSchema } from 'rxdb';

export interface RxBadgeDocument {
  id: string;
  domain: string;
  threshold: number;
  earnedAt: number;
}

export interface RxTreeStateDocument {
  childId: string;
  branches: Record<string, number>;
  badges: RxBadgeDocument[];
  lastGrowthAt: number;
}

export const TREE_STATE_SCHEMA: RxJsonSchema<RxTreeStateDocument> = {
  title: 'tree state schema',
  version: 0,
  primaryKey: 'childId',
  type: 'object',
  properties: {
    childId: { type: 'string', maxLength: 60 },
    branches: { type: 'object' },
    badges: { type: 'array', items: { type: 'object' } },
    lastGrowthAt: { type: 'number' },
  },
  required: ['childId', 'branches', 'badges', 'lastGrowthAt'],
};
