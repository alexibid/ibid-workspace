export type RunMode = 'terminal' | 'background' | 'open';

export interface MenuAction {
  readonly key: string;
  readonly label: string;
  readonly run: RunMode;
}

export interface ActionGroup {
  readonly title: string;
  readonly actions: readonly MenuAction[];
}

export interface ActionCatalog {
  readonly groups: readonly ActionGroup[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMenuAction(value: unknown): value is MenuAction {
  return isRecord(value) && typeof value['key'] === 'string' && typeof value['label'] === 'string';
}

function isActionGroup(value: unknown): value is ActionGroup {
  return (
    isRecord(value) &&
    typeof value['title'] === 'string' &&
    Array.isArray(value['actions']) &&
    value['actions'].every(isMenuAction)
  );
}

export function isActionCatalog(value: unknown): value is ActionCatalog {
  return isRecord(value) && Array.isArray(value['groups']) && value['groups'].every(isActionGroup);
}
