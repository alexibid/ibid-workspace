import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class AppTranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, fallback?: string): string {
    if (!key) return '';
    return this.i18n.translate(key, fallback);
  }
}
