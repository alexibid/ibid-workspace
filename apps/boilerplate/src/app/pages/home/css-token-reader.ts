import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Tokens are read from the body, not from the root: a theme is a body class, so this is the
 * element where the base values and whatever the active theme overrides have both landed.
 */
@Injectable({ providedIn: 'root' })
export class CssTokenReader {
  private readonly document = inject(DOCUMENT);

  read(variable: string): string {
    const window = this.document.defaultView;
    const body = this.document.body;
    if (!window || !body) return '';
    return window.getComputedStyle(body).getPropertyValue(variable).trim();
  }
}
