import { Injectable, inject } from '@angular/core';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { Recognition, RecognitionSource } from '@domain/models/recognition';
import { RecognitionRepository } from '@domain/repositories/recognition.repository';
import { CamilaDatabaseService } from './camila-database.service';
import { RxRecognitionDocument } from './schemas/recognition.schema';

@Injectable({ providedIn: 'root' })
export class RxdbRecognitionRepository implements RecognitionRepository {
  private readonly databases = inject(CamilaDatabaseService);

  async saveAll(recognitions: readonly Recognition[]): Promise<void> {
    if (recognitions.length === 0) return;
    const collection = await this.collection();
    await collection.bulkUpsert(recognitions.map((recognition) => ({ ...recognition })));
  }

  async removeForEntry(entryId: string): Promise<void> {
    const collection = await this.collection();
    const documents = await collection.find({ selector: { entryId } }).exec();
    await Promise.all(documents.map((document) => document.remove()));
  }

  async listByChild(childId: string): Promise<readonly Recognition[]> {
    const collection = await this.collection();
    const documents = await collection.find({ selector: { childId } }).exec();
    return documents.map((document) => toRecognition(document.toJSON()));
  }

  private async collection() {
    const database = await this.databases.getDatabase();
    return database.collections.recognitions;
  }
}

function toRecognition(document: RxRecognitionDocument): Recognition {
  return {
    id: document.id,
    entryId: document.entryId,
    childId: document.childId,
    domain: document.domain as BehaviourDomainId,
    points: document.points,
    source: document.source as RecognitionSource,
  };
}
