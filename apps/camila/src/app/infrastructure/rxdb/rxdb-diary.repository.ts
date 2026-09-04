import { Injectable, inject } from '@angular/core';
import { DiaryEntry } from '@domain/models/diary-entry';
import { DiaryRepository } from '@domain/repositories/diary.repository';
import { CamilaDatabaseService } from './camila-database.service';

@Injectable({ providedIn: 'root' })
export class RxdbDiaryRepository implements DiaryRepository {
  private readonly databases = inject(CamilaDatabaseService);

  async save(entry: DiaryEntry): Promise<void> {
    const collection = await this.collection();
    await collection.upsert({ ...entry });
  }

  async byId(id: string): Promise<DiaryEntry> {
    const collection = await this.collection();
    const document = await collection.findOne(id).exec();
    if (!document) throw new Error(`No diary entry with id "${id}".`);
    return document.toJSON() as DiaryEntry;
  }

  async listByChild(childId: string): Promise<readonly DiaryEntry[]> {
    const collection = await this.collection();
    const documents = await collection.find({ selector: { childId } }).exec();
    return documents.map((document) => document.toJSON() as DiaryEntry);
  }

  private async collection() {
    const database = await this.databases.getDatabase();
    return database.collections.diary_entries;
  }
}
