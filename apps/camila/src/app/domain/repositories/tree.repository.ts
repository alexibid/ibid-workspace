import { TreeState } from '@domain/models/tree-state';

export interface TreeRepository {
  byChild(childId: string): Promise<TreeState>;
  save(state: TreeState): Promise<void>;
}
