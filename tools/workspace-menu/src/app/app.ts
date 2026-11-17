import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MenuStore } from './application/menu-store';
import { COPY } from './i18n/copy';
import { ActionGroupsComponent } from './ui/action-groups/action-groups';
import { Button } from './ui/atoms/button';
import { ProblemsPanelComponent } from './ui/problems-panel/problems-panel';
import { StatusOverviewComponent } from './ui/status-overview/status-overview';

@Component({
  selector: 'ibid-tools-root',
  imports: [Button, ProblemsPanelComponent, StatusOverviewComponent, ActionGroupsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly store = inject(MenuStore);
  protected readonly copy = COPY;
  protected readonly staleSeconds = computed(() =>
    this.store.isStale() ? this.store.secondsSinceCheck() : 0
  );

  ngOnInit(): void {
    void this.store.start();
  }
}
