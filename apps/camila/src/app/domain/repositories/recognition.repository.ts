import { Recognition } from '@domain/models/recognition';

export interface RecognitionRepository {
  saveAll(recognitions: readonly Recognition[]): Promise<void>;
  removeForEntry(entryId: string): Promise<void>;
  listByChild(childId: string): Promise<readonly Recognition[]>;
}
