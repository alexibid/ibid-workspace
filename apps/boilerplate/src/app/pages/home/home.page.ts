import { Component, computed, inject } from '@angular/core';
import { I18nService, ThemeService } from '@ibid/services';
import { BadgeComponent } from 'ibid-ui';
import { CssTokenReader } from './css-token-reader';
import {
  COLOR_GROUPS,
  DesignToken,
  DesignTokenGroup,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  TYPE_SCALE
} from './design-tokens';
import { ResolvedToken, ResolvedTokenGroup } from './resolved-token';

/**
 * Reports every colour and typography token. The lists are read again on each theme change,
 * because a theme redefines the very custom properties this page shows.
 */
@Component({
  selector: 'boilerplate-home-page',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly i18n = inject(I18nService);
  private readonly themes = inject(ThemeService);
  private readonly reader = inject(CssTokenReader);

  protected readonly palette = computed<readonly ResolvedTokenGroup[]>(() =>
    this.underTheme(() => COLOR_GROUPS.map(group => this.resolveGroup(group)))
  );
  protected readonly families = computed(() => this.underTheme(() => this.resolve(FONT_FAMILIES)));
  protected readonly scale = computed(() => this.underTheme(() => this.resolve(TYPE_SCALE)));
  protected readonly weights = computed(() => this.underTheme(() => this.resolve(FONT_WEIGHTS)));
  protected readonly leadings = computed(() => this.underTheme(() => this.resolve(LINE_HEIGHTS)));

  private underTheme<T>(resolve: () => T): T {
    this.themes.theme();
    return resolve();
  }

  private resolveGroup(group: DesignTokenGroup): ResolvedTokenGroup {
    return { id: group.id, title: group.title, tokens: this.resolve(group.tokens) };
  }

  private resolve(tokens: readonly DesignToken[]): readonly ResolvedToken[] {
    return tokens.map(token => ({
      ...token,
      value: this.reader.read(token.variable),
      reference: `var(${token.variable})`
    }));
  }
}
