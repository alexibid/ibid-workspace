import { Injectable, computed, inject, signal } from '@angular/core';
import { BOOTSTRAP_RULES } from '@domain/data/bootstrap-rules';
import { BEHAVIOUR_DOMAINS, BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DiaryEntry } from '@domain/models/diary-entry';
import { DomainHit, Recognition } from '@domain/models/recognition';
import { Badge, TreeState, createTreeState } from '@domain/models/tree-state';
import { nextThreshold } from '@domain/services/growth-engine';
import { CamilaDatabaseService } from '@infrastructure/rxdb/camila-database.service';
import { RxdbDiaryRepository } from '@infrastructure/rxdb/rxdb-diary.repository';
import { RxdbRecognitionRepository } from '@infrastructure/rxdb/rxdb-recognition.repository';
import { RxdbTreeRepository } from '@infrastructure/rxdb/rxdb-tree.repository';
import { RxdbVocabularyRepository } from '@infrastructure/rxdb/rxdb-vocabulary.repository';
import { DEFAULT_CHILD_ID } from '@application/config/child';
import { confirmRecognitions } from '@application/use-cases/confirm-recognitions';
import { DiaryDependencies } from '@application/use-cases/diary-dependencies';
import { recordDiaryEntry } from '@application/use-cases/record-diary-entry';

export interface PendingProposal {
  readonly entry: DiaryEntry;
  readonly hits: readonly DomainHit[];
}

@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly deps: DiaryDependencies = {
    diary: inject(RxdbDiaryRepository),
    recognitions: inject(RxdbRecognitionRepository),
    tree: inject(RxdbTreeRepository),
    vocabulary: inject(RxdbVocabularyRepository),
    rules: BOOTSTRAP_RULES,
    newId: () => crypto.randomUUID(),
  };

  private readonly databases = inject(CamilaDatabaseService);

  private readonly entriesState = signal<readonly DiaryEntry[]>([]);
  private readonly recognitionsState = signal<readonly Recognition[]>([]);
  private readonly treeState = signal<TreeState>(createTreeState(DEFAULT_CHILD_ID));
  private readonly proposalState = signal<PendingProposal | undefined>(undefined);
  private readonly celebratingState = signal<readonly Badge[]>([]);

  private seeding?: Promise<void>;

  readonly entries = this.entriesState.asReadonly();
  readonly tree = this.treeState.asReadonly();
  readonly proposal = this.proposalState.asReadonly();
  readonly celebrating = this.celebratingState.asReadonly();

  readonly progress = computed(() =>
    BEHAVIOUR_DOMAINS.map((domain) => {
      const points = this.treeState().branches[domain];
      const target = nextThreshold(this.treeState().branches, this.deps.rules, domain);
      return {
        domain,
        points,
        target,
        folds: this.treeState().badges.filter((badge) => badge.domain === domain).length,
      };
    })
  );

  async load(): Promise<void> {
    await this.refresh();
  }

  async record(text: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    const proposal = await recordDiaryEntry(this.deps, {
      childId: DEFAULT_CHILD_ID,
      text: trimmed,
      at: Date.now(),
    });

    this.celebratingState.set([]);
    this.proposalState.set(proposal);
    await this.refresh();
  }

  async confirm(hits: readonly DomainHit[]): Promise<void> {
    const proposal = this.proposalState();
    if (!proposal) return;

    const proposed = new Set(proposal.hits.map((hit) => hit.domain));
    const chosen = new Set(hits.map((hit) => hit.domain));
    const untouched = proposed.size === chosen.size && [...chosen].every((d) => proposed.has(d));

    const result = await confirmRecognitions(this.deps, {
      childId: DEFAULT_CHILD_ID,
      entryId: proposal.entry.id,
      hits,
      source: untouched ? 'assistant' : 'parent',
      at: Date.now(),
    });

    this.celebratingState.set(result.newBadges);
    this.proposalState.set(undefined);
    await this.refresh();
  }

  dismissProposal(): void {
    this.proposalState.set(undefined);
  }

  domainsOf(entryId: string): readonly BehaviourDomainId[] {
    return this.recognitionsState()
      .filter((recognition) => recognition.entryId === entryId)
      .map((recognition) => recognition.domain);
  }

  seedIfEmpty(): Promise<void> {
    this.seeding ??= this.seedWhenEmpty();
    return this.seeding;
  }

  async seed(startedAt?: number): Promise<void> {
    const { seedDemoData } = await import('@application/testing/demo-seed');
    await seedDemoData(this.deps, DEFAULT_CHILD_ID, startedAt);
    await this.refresh();
  }

  async reset(): Promise<void> {
    await this.seeding?.catch(() => undefined);
    this.seeding = undefined;
    this.proposalState.set(undefined);
    this.celebratingState.set([]);
    await this.databases.reset();
    await this.refresh();
  }

  private async seedWhenEmpty(): Promise<void> {
    await this.refresh();
    if (this.entriesState().length > 0) return;

    const { recentSeedStart } = await import('@application/testing/demo-seed');
    await this.seed(recentSeedStart(Date.now()));
  }

  private async refresh(): Promise<void> {
    const [entries, recognitions, tree] = await Promise.all([
      this.deps.diary.listByChild(DEFAULT_CHILD_ID),
      this.deps.recognitions.listByChild(DEFAULT_CHILD_ID),
      this.deps.tree.byChild(DEFAULT_CHILD_ID),
    ]);

    this.entriesState.set([...entries].sort((a, b) => b.at - a.at));
    this.recognitionsState.set(recognitions);
    this.treeState.set(tree);
  }
}
