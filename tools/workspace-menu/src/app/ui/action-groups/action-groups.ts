import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MenuStore } from '../../application/menu-store';
import { COPY } from '../../i18n/copy';
import { EntryButton } from '../atoms/entry-button';

@Component({
  selector: 'ibid-tools-action-groups',
  imports: [EntryButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="o-columns">
      @for (group of store.catalog().groups; track group.title) {
        <section class="o-panel o-stack">
          <h2>{{ group.title }}</h2>
          <ul class="action-list">
            @for (action of group.actions; track action.key) {
              <li>
                <ibid-tools-entry-button [label]="action.label" (click)="store.runAction(action.key)" />
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styleUrl: './action-groups.scss',
})
export class ActionGroupsComponent {
  protected readonly store = inject(MenuStore);
  protected readonly copy = COPY;
}
