import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MenuStore } from '../../application/menu-store';
import { Problem } from '../../domain/workspace-status';
import { COPY } from '../../i18n/copy';
import { Button } from '../atoms/button';

@Component({
  selector: 'ibid-tools-problems-panel',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './problems-panel.html',
  styleUrl: './problems-panel.scss',
})
export class ProblemsPanelComponent {
  protected readonly store = inject(MenuStore);
  protected readonly copy = COPY;

  readonly problems = input.required<readonly Problem[]>();
  readonly staleSeconds = input(0);

  protected readonly count = computed(
    () => this.problems().length + (this.staleSeconds() > 0 ? 1 : 0)
  );

  protected resolve(problem: Problem): void {
    if (problem.action) {
      this.store.runAction(problem.action);
    } else if (problem.url) {
      this.store.openLink(problem.url);
    }
  }
}
