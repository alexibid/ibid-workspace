import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { I18nService, ThemeService } from '@ibid/services';
import {
  HeaderComponent,
  HeaderNavComponent,
  IconButtonComponent,
  IconComponent,
  NavMenuComponent,
  NavMenuItem,
  SelectComponent,
  SelectOption,
} from 'ibid-ui';

const NAV_OFFSET_PROPERTY = '--header-nav-offset';

@Component({
  imports: [
    RouterModule,
    HeaderComponent,
    HeaderNavComponent,
    IconButtonComponent,
    IconComponent,
    NavMenuComponent,
    SelectComponent,
  ],
  selector: 'boilerplate-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly themes = inject(ThemeService);
  protected readonly navOpen = signal(false);

  protected readonly languageCode = computed(() => this.i18n.currentLang().toUpperCase());

  protected readonly themeOptions: SelectOption[] = this.themes.themes.map((theme) => ({
    value: theme.id,
    label: theme.label,
  }));

  protected readonly navItems: readonly NavMenuItem[] = [
    { id: 'home', type: 'link', label: 'Home', route: '/', icon: 'grid', exact: true },
    { id: 'actions', type: 'link', label: 'Actions', route: '/actions', icon: 'add' },
    { id: 'inputs', type: 'link', label: 'Inputs', route: '/inputs', icon: 'search' },
    { id: 'data', type: 'link', label: 'Data', route: '/data', icon: 'database' },
    { id: 'charts', type: 'link', label: 'Charts', route: '/charts', icon: 'show_chart' },
    { id: 'layout', type: 'link', label: 'Layout', route: '/layout', icon: 'list-rows' },
    { id: 'overlays', type: 'link', label: 'Overlays', route: '/overlays', icon: 'menu' },
    { id: 'hand-drawn', type: 'link', label: 'Hand-Drawn', route: '/hand-drawn', icon: 'categories' },
  ];

  private readonly headerHost = viewChild.required('headerHost', { read: ElementRef });
  private readonly document = inject(DOCUMENT);
  private readonly resizes = this.createObserver();

  ngAfterViewInit(): void {
    this.publishHeaderHeight();
    const shell = this.headerHost().nativeElement.querySelector('.o-header-shell') ?? this.headerHost().nativeElement;
    this.resizes?.observe(shell);
  }

  ngOnDestroy(): void {
    this.resizes?.disconnect();
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  protected selectTheme(id: string): void {
    this.themes.select(id);
  }

  private createObserver(): ResizeObserver | undefined {
    const view = this.document.defaultView;
    if (!view?.ResizeObserver) return undefined;
    return new view.ResizeObserver(() => this.publishHeaderHeight());
  }

  private publishHeaderHeight(): void {
    const el = this.headerHost().nativeElement;
    const shell = (el.querySelector('.o-header-shell') as HTMLElement | null) ?? el;
    const height = shell.getBoundingClientRect().height;
    if (height > 0) {
      this.document.documentElement.style.setProperty(NAV_OFFSET_PROPERTY, `${Math.round(height)}px`);
    }
  }
}
