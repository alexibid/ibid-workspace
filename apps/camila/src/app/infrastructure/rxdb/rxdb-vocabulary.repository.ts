import { Injectable, inject } from '@angular/core';
import { LearnedVocabulary, Vocabulary, createLearnedVocabulary } from '@domain/models/vocabulary';
import { VocabularyRepository } from '@domain/repositories/vocabulary.repository';
import { CamilaDatabaseService } from './camila-database.service';

@Injectable({ providedIn: 'root' })
export class RxdbVocabularyRepository implements VocabularyRepository {
  private readonly databases = inject(CamilaDatabaseService);

  async byChild(childId: string): Promise<LearnedVocabulary> {
    const collection = await this.collection();
    const document = await collection.findOne(childId).exec();
    if (!document) return createLearnedVocabulary(childId);

    const json = document.toJSON();
    return { childId: json.childId, words: json.words as Vocabulary, updatedAt: json.updatedAt };
  }

  async save(vocabulary: LearnedVocabulary): Promise<void> {
    const collection = await this.collection();
    await collection.upsert({
      childId: vocabulary.childId,
      words: vocabulary.words as Record<string, Record<string, number>>,
      updatedAt: vocabulary.updatedAt,
    });
  }

  private async collection() {
    const database = await this.databases.getDatabase();
    return database.collections.vocabularies;
  }
}
