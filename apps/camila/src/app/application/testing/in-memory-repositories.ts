import { DiaryEntry } from '@domain/models/diary-entry';
import { Recognition } from '@domain/models/recognition';
import { TreeState, createTreeState } from '@domain/models/tree-state';
import { LearnedVocabulary, createLearnedVocabulary } from '@domain/models/vocabulary';
import { DiaryRepository } from '@domain/repositories/diary.repository';
import { RecognitionRepository } from '@domain/repositories/recognition.repository';
import { TreeRepository } from '@domain/repositories/tree.repository';
import { VocabularyRepository } from '@domain/repositories/vocabulary.repository';

export class InMemoryDiaryRepository implements DiaryRepository {
  private readonly entries = new Map<string, DiaryEntry>();

  async save(entry: DiaryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async byId(id: string): Promise<DiaryEntry> {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`No diary entry with id "${id}".`);
    return entry;
  }

  async listByChild(childId: string): Promise<readonly DiaryEntry[]> {
    return [...this.entries.values()].filter((entry) => entry.childId === childId);
  }
}

export class InMemoryRecognitionRepository implements RecognitionRepository {
  private readonly recognitions = new Map<string, Recognition>();

  async saveAll(recognitions: readonly Recognition[]): Promise<void> {
    for (const recognition of recognitions) this.recognitions.set(recognition.id, recognition);
  }

  async removeForEntry(entryId: string): Promise<void> {
    for (const [id, recognition] of this.recognitions) {
      if (recognition.entryId === entryId) this.recognitions.delete(id);
    }
  }

  async listByChild(childId: string): Promise<readonly Recognition[]> {
    return [...this.recognitions.values()].filter((item) => item.childId === childId);
  }
}

export class InMemoryTreeRepository implements TreeRepository {
  private readonly trees = new Map<string, TreeState>();

  async byChild(childId: string): Promise<TreeState> {
    return this.trees.get(childId) ?? createTreeState(childId);
  }

  async save(state: TreeState): Promise<void> {
    this.trees.set(state.childId, state);
  }
}

export class InMemoryVocabularyRepository implements VocabularyRepository {
  private readonly vocabularies = new Map<string, LearnedVocabulary>();

  async byChild(childId: string): Promise<LearnedVocabulary> {
    return this.vocabularies.get(childId) ?? createLearnedVocabulary(childId);
  }

  async save(vocabulary: LearnedVocabulary): Promise<void> {
    this.vocabularies.set(vocabulary.childId, vocabulary);
  }
}
