import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ActionCatalog, isActionCatalog } from '../domain/action-catalog';
import { PullRequest, WorkspaceStatus, isWorkspaceStatus } from '../domain/workspace-status';
import { COPY } from '../i18n/copy';
import { DesktopBridge } from '../infrastructure/desktop-bridge';

const STATUS_EVENT = 'status-changed';
const STALE_AFTER_SECONDS = 90;
const CLOCK_INTERVAL_MS = 1000;

@Injectable({ providedIn: 'root' })
export class MenuStore {
  private readonly bridge = inject(DesktopBridge);
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(Date.now());

  readonly status = signal<WorkspaceStatus | undefined>(undefined);
  readonly catalog = signal<ActionCatalog>({ groups: [] });
  readonly notice = signal('');

  readonly secondsSinceCheck = computed(() => {
    const status = this.status();
    return status ? Math.max(0, Math.round((this.now() - Date.parse(status.checkedAt)) / 1000)) : 0;
  });
  readonly isStale = computed(() => this.secondsSinceCheck() > STALE_AFTER_SECONDS);

  async start(): Promise<void> {
    this.startClock();
    try {
      await this.bridge.listen(STATUS_EVENT, (payload) => this.acceptStatus(payload));
      this.acceptCatalog(await this.bridge.invoke('list_actions'));
      this.acceptStatus(await this.bridge.invoke('read_status'));
    } catch (error: unknown) {
      this.report(error);
    }
  }

  refresh(): void {
    void this.call('refresh_status');
  }

  runAction(key: string): void {
    void this.call('run_action', { key });
  }

  mergePullRequest(pullRequest: PullRequest): void {
    void this.call('merge_pull_request', {
      repository: pullRequest.repository,
      number: pullRequest.number,
    });
  }

  openLink(url: string): void {
    void this.call('open_link', { url });
  }

  quit(): void {
    void this.call('quit_app');
  }

  private async call(command: string, args: Record<string, unknown> = {}): Promise<void> {
    try {
      this.notice.set('');
      await this.bridge.invoke(command, args);
    } catch (error: unknown) {
      this.report(error);
    }
  }

  private report(error: unknown): void {
    if (error === 'not-ready') {
      return;
    }
    if (error === 'already-running') {
      this.notice.set(COPY.alreadyRunning);
      return;
    }
    this.notice.set(error instanceof Error ? COPY.desktopOnly : COPY.actionFailed);
  }

  private acceptStatus(payload: unknown): void {
    if (isWorkspaceStatus(payload)) {
      this.status.set(payload);
    }
  }

  private acceptCatalog(payload: unknown): void {
    if (isActionCatalog(payload)) {
      this.catalog.set(payload);
    }
  }

  private startClock(): void {
    const timer = setInterval(() => this.now.set(Date.now()), CLOCK_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}
