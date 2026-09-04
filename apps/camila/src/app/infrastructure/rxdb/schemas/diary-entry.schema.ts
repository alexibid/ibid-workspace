import { RxJsonSchema } from 'rxdb';

export interface RxDiaryEntryDocument {
  id: string;
  childId: string;
  at: number;
  text: string;
}

export const DIARY_ENTRY_SCHEMA: RxJsonSchema<RxDiaryEntryDocument> = {
  title: 'diary entry schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 60 },
    childId: { type: 'string', maxLength: 60 },
    at: { type: 'number' },
    text: { type: 'string' },
  },
  required: ['id', 'childId', 'at', 'text'],
  indexes: ['childId'],
};
