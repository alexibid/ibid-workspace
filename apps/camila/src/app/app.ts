import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { I18nService } from '@ibid/services';
import { HeaderComponent } from 'ibid-ui';

const NAV_OFFSET_PROPERTY = '--header-nav-offset';
const HEADER_SHELL_SELECTOR = '.o-header-shell';
const DIARY_ROUTE = '/diario';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'camila-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(I18nService);

  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly headerHost = viewChild.required('headerHost', { read: ElementRef });
  private readonly resizes = this.createObserver();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly onDiary = computed(() => this.url().startsWith(DIARY_ROUTE));

  protected readonly profileLabel = computed(() =>
    this.i18n.translate(this.onDiary() ? 'profileToChild' : 'profileToParent')
  );

  protected readonly languageCode = computed(() => this.i18n.currentLang().toUpperCase());

  ngAfterViewInit(): void {
    this.publishHeaderHeight();
    this.resizes?.observe(this.resolveShell());
  }

  ngOnDestroy(): void {
    this.resizes?.disconnect();
  }

  protected toggleProfile(): void {
    void this.router.navigateByUrl(this.onDiary() ? '/' : DIARY_ROUTE);
  }

  protected toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  private createObserver(): ResizeObserver | undefined {
    const view = this.document.defaultView;
    if (!view?.ResizeObserver) return undefined;
    return new view.ResizeObserver(() => this.publishHeaderHeight());
  }

  private resolveShell(): HTMLElement {
    const host = this.headerHost().nativeElement as HTMLElement;
    return host.querySelector<HTMLElement>(HEADER_SHELL_SELECTOR) ?? host;
  }

  private publishHeaderHeight(): void {
    const height = this.resolveShell().getBoundingClientRect().height;
    if (height > 0) {
      this.document.documentElement.style.setProperty(
        NAV_OFFSET_PROPERTY,
        `${Math.round(height)}px`
      );
    }
  }
}
