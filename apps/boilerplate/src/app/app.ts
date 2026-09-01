import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  HeaderComponent,
  HeaderNavComponent,
  IconButtonComponent,
  IconComponent
} from 'ibid-ui';
import { I18nService } from '@ibid/services';

@Component({
  imports: [
    RouterModule,
    HeaderComponent,
    HeaderNavComponent,
    IconButtonComponent,
    IconComponent
  ],
  selector: 'boilerplate-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly navOpen = signal(false);

  protected toggleNav(): void {
    this.navOpen.update(open => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }
}
