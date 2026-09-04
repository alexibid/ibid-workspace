import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

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
