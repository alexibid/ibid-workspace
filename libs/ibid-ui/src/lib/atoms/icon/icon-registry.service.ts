import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

const ICON_ALIASES: Record<string, string> = {
  house: 'category-housing',
  car: 'category-transport',
};

@Injectable({
  providedIn: 'root'
})
export class AppIconRegistry {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private svgCache = new Map<string, Observable<SafeHtml>>();

  getIcon(name: string): Observable<SafeHtml> {
    const resolvedName = ICON_ALIASES[name] ?? name;
    const cached = this.svgCache.get(resolvedName);
    if (cached) return cached;

    const request = this.http.get(`icons/${resolvedName}.svg`, { responseType: 'text' }).pipe(
      map(svg => this.sanitizer.bypassSecurityTrustHtml(this.cleanSvg(svg))),
      catchError(() =>
        of(this.sanitizer.bypassSecurityTrustHtml('<svg width="100%" height="100%"></svg>'))
      ),
      shareReplay(1)
    );
    this.svgCache.set(resolvedName, request);
    return request;
  }

  private cleanSvg(svg: string): string {
    let cleaned = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    cleaned = cleaned.replace(/<svg/, '<svg width="100%" height="100%" fill="currentColor"');

    return cleaned;
  }
}
