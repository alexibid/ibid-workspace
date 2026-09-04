import { RxJsonSchema } from 'rxdb';

export interface RxVocabularyDocument {
  childId: string;
  words: Record<string, Record<string, number>>;
  updatedAt: number;
}

export const VOCABULARY_SCHEMA: RxJsonSchema<RxVocabularyDocument> = {
  title: 'learned vocabulary schema',
  version: 0,
  primaryKey: 'childId',
  type: 'object',
  properties: {
    childId: { type: 'string', maxLength: 60 },
    words: { type: 'object' },
    updatedAt: { type: 'number' },
  },
  required: ['childId', 'words', 'updatedAt'],
};
