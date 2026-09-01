import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  HeaderComponent,
  HeaderNavComponent,
  IconButtonComponent,
  IconComponent,
  NavMenuComponent,
  NavMenuItem
} from 'ibid-ui';
import { I18nService } from '@ibid/services';

@Component({
  imports: [
    RouterModule,
    HeaderComponent,
    HeaderNavComponent,
    IconButtonComponent,
    IconComponent,
    NavMenuComponent
  ],
  selector: 'boilerplate-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly navOpen = signal(false);

  protected readonly navItems: readonly NavMenuItem[] = [
    { id: 'actions', type: 'link', label: 'Actions', route: '/actions', icon: 'add' },
    { id: 'inputs', type: 'link', label: 'Inputs', route: '/inputs', icon: 'search' },
    { id: 'data', type: 'link', label: 'Data', route: '/data', icon: 'table' },
    { id: 'charts', type: 'link', label: 'Charts', route: '/charts', icon: 'chart' },
    { id: 'layout', type: 'link', label: 'Layout', route: '/layout', icon: 'card' },
    { id: 'overlays', type: 'link', label: 'Overlays', route: '/overlays', icon: 'menu' }
  ];

  protected toggleNav(): void {
    this.navOpen.update(open => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }
}
