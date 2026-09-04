import { DomainHit, Recognition, RecognitionSource, recognitionId } from '@domain/models/recognition';
import { Badge, TreeState } from '@domain/models/tree-state';
import { learn } from '@domain/services/domain-classifier';
import { badgesGained, rebuildTree } from '@domain/services/growth-engine';
import { DiaryDependencies } from './diary-dependencies';

export interface ConfirmRecognitionsInput {
  readonly childId: string;
  readonly entryId: string;
  readonly hits: readonly DomainHit[];
  readonly source: RecognitionSource;
  readonly at: number;
}

export interface ConfirmRecognitionsResult {
  readonly tree: TreeState;
  readonly newBadges: readonly Badge[];
}

export async function confirmRecognitions(
  deps: DiaryDependencies,
  input: ConfirmRecognitionsInput
): Promise<ConfirmRecognitionsResult> {
  const entry = await deps.diary.byId(input.entryId);

  if (input.source === 'parent') {
    const vocabulary = await deps.vocabulary.byChild(input.childId);
    const domains = input.hits.map((hit) => hit.domain);
    await deps.vocabulary.save(learn(vocabulary, entry.text, domains, input.at));
  }

  await deps.recognitions.removeForEntry(input.entryId);
  await deps.recognitions.saveAll(
    input.hits.map(
      (hit): Recognition => ({
        id: recognitionId(input.entryId, hit.domain),
        entryId: input.entryId,
        childId: input.childId,
        domain: hit.domain,
        points: hit.points,
        source: input.source,
      })
    )
  );

  const before = await deps.tree.byChild(input.childId);
  const recognitions = await deps.recognitions.listByChild(input.childId);
  const tree = rebuildTree(before, recognitions, deps.rules, input.at);
  await deps.tree.save(tree);

  return { tree, newBadges: badgesGained(before, tree) };
}
