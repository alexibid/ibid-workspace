import { RxJsonSchema } from 'rxdb';

export interface RxRecognitionDocument {
  id: string;
  entryId: string;
  childId: string;
  domain: string;
  points: number;
  source: string;
}

export const RECOGNITION_SCHEMA: RxJsonSchema<RxRecognitionDocument> = {
  title: 'recognition schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 90 },
    entryId: { type: 'string', maxLength: 60 },
    childId: { type: 'string', maxLength: 60 },
    domain: { type: 'string', maxLength: 30 },
    points: { type: 'number' },
    source: { type: 'string', maxLength: 20 },
  },
  required: ['id', 'entryId', 'childId', 'domain', 'points', 'source'],
  indexes: ['childId', 'entryId'],
};
