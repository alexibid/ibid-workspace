import { DiaryEntry } from '@domain/models/diary-entry';

export interface DiaryRepository {
  save(entry: DiaryEntry): Promise<void>;
  byId(id: string): Promise<DiaryEntry>;
  listByChild(childId: string): Promise<readonly DiaryEntry[]>;
}
