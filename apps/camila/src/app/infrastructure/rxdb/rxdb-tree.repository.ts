import { Injectable, inject } from '@angular/core';
import { BehaviourDomainId, BranchLevels } from '@domain/models/behaviour-domain';
import { Badge, TreeState, createTreeState } from '@domain/models/tree-state';
import { TreeRepository } from '@domain/repositories/tree.repository';
import { CamilaDatabaseService } from './camila-database.service';
import { RxBadgeDocument } from './schemas/tree-state.schema';

@Injectable({ providedIn: 'root' })
export class RxdbTreeRepository implements TreeRepository {
  private readonly databases = inject(CamilaDatabaseService);

  async byChild(childId: string): Promise<TreeState> {
    const collection = await this.collection();
    const document = await collection.findOne(childId).exec();
    return document ? toTreeState(document.toJSON()) : createTreeState(childId);
  }

  async save(state: TreeState): Promise<void> {
    const collection = await this.collection();
    await collection.upsert({
      childId: state.childId,
      branches: { ...state.branches },
      badges: state.badges.map((badge) => ({ ...badge })),
      lastGrowthAt: state.lastGrowthAt,
    });
  }

  private async collection() {
    const database = await this.databases.getDatabase();
    return database.collections.tree_states;
  }
}

interface StoredTreeState {
  readonly childId: string;
  readonly branches: Readonly<Record<string, number>>;
  readonly badges: readonly Readonly<RxBadgeDocument>[];
  readonly lastGrowthAt: number;
}

function toTreeState(document: StoredTreeState): TreeState {
  return {
    childId: document.childId,
    branches: document.branches as BranchLevels,
    badges: document.badges.map(
      (badge): Badge => ({
        id: badge.id,
        domain: badge.domain as BehaviourDomainId,
        threshold: badge.threshold,
        earnedAt: badge.earnedAt,
      })
    ),
    lastGrowthAt: document.lastGrowthAt,
  };
}
