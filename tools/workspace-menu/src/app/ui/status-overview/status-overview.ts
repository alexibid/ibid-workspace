import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MenuStore } from '../../application/menu-store';
import { PipelineRun, WorkspaceStatus } from '../../domain/workspace-status';
import { COPY } from '../../i18n/copy';
import { Button } from '../atoms/button';

const USD = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'USD' });

@Component({
  selector: 'ibid-tools-status-overview',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-overview.html',
  styleUrl: './status-overview.scss',
})
export class StatusOverviewComponent {
  protected readonly store = inject(MenuStore);
  protected readonly copy = COPY;

  readonly status = input.required<WorkspaceStatus>();

  protected money(amount: number): string {
    return USD.format(amount);
  }

  protected runState(run: PipelineRun): string {
    if (run.status !== 'completed') {
      return run.status === 'in_progress' ? COPY.runStates.running : COPY.runStates.queued;
    }
    const states: Record<string, string> = COPY.runStates;
    return states[run.conclusion] ?? run.conclusion;
  }

  protected runTone(run: PipelineRun): string {
    if (run.status !== 'completed') {
      return 'running';
    }
    return run.conclusion === 'failure' ? 'failed' : 'done';
  }
}
