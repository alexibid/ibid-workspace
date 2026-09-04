import { Injectable } from '@angular/core';
import { RxCollection, RxDatabase, createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { DIARY_ENTRY_SCHEMA, RxDiaryEntryDocument } from './schemas/diary-entry.schema';
import { RECOGNITION_SCHEMA, RxRecognitionDocument } from './schemas/recognition.schema';
import { RxTreeStateDocument, TREE_STATE_SCHEMA } from './schemas/tree-state.schema';
import { RxVocabularyDocument, VOCABULARY_SCHEMA } from './schemas/vocabulary.schema';

export interface CamilaCollections {
  diary_entries: RxCollection<RxDiaryEntryDocument>;
  recognitions: RxCollection<RxRecognitionDocument>;
  tree_states: RxCollection<RxTreeStateDocument>;
  vocabularies: RxCollection<RxVocabularyDocument>;
}

export type CamilaDatabase = RxDatabase<CamilaCollections>;

const DATABASE_NAME = 'camila_db';

function isTestEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  if ('__vitest_worker__' in window) return true;
  return typeof indexedDB === 'undefined';
}

@Injectable({ providedIn: 'root' })
export class CamilaDatabaseService {
  private connection?: Promise<CamilaDatabase>;

  getDatabase(): Promise<CamilaDatabase> {
    this.connection ??= this.connect();
    return this.connection;
  }

  async close(): Promise<void> {
    const pending = this.connection;
    this.connection = undefined;
    if (pending) await (await pending).close();
  }

  async reset(): Promise<void> {
    const pending = this.connection;
    this.connection = undefined;
    if (pending) await (await pending).remove();
  }

  private async connect(): Promise<CamilaDatabase> {
    const testing = isTestEnvironment();

    const database = await createRxDatabase<CamilaCollections>({
      name: testing ? `${DATABASE_NAME}_${crypto.randomUUID()}` : DATABASE_NAME,
      storage: testing ? getRxStorageMemory() : getRxStorageDexie(),
      multiInstance: !testing,
    });

    await database.addCollections({
      diary_entries: { schema: DIARY_ENTRY_SCHEMA },
      recognitions: { schema: RECOGNITION_SCHEMA },
      tree_states: { schema: TREE_STATE_SCHEMA },
      vocabularies: { schema: VOCABULARY_SCHEMA },
    });

    return database;
  }
}
