import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '@ibid/services';

export type SheetVariant = 'coloured' | 'outline';

const CREST_STEP = 11;

@Component({
  selector: 'camila-cut-sheet',
  standalone: true,
  templateUrl: './cut-sheet.html',
  styleUrl: './cut-sheet.scss',
})
export class CutSheetComponent {
  readonly variant = input<SheetVariant>('coloured');
  readonly title = input('');
  readonly ariaLabel = input('');

  protected readonly i18n = inject(I18nService);

  protected readonly name = computed(() => this.title() || this.i18n.translate('sheetName'));

  protected readonly crests = computed(() => [
    { id: 'a', number: '5', path: this.zigzag(30, 46, 17, 4) },
    { id: 'b', number: '5', path: this.zigzag(16, 80, 17, 4) },
    { id: 'c', number: '6', path: this.zigzag(28, 114, 17, 4) },
    { id: 'd', number: '6', path: this.zigzag(14, 148, 17, 3) },
  ]);

  protected readonly teeth = computed(() => this.teethPath(62, 200, 36, 8, 7));
  protected readonly previewTeeth = computed(() => this.teethPath(142, 70, 30, 5, 6));

  private zigzag(x: number, y: number, width: number, spikes: number): string {
    const points: string[] = [`M ${x} ${y}`];

    for (let index = 0; index < spikes; index++) {
      const top = y + index * CREST_STEP;
      points.push(`L ${x + width} ${top + CREST_STEP * 0.45}`, `L ${x} ${top + CREST_STEP}`);
    }

    return `${points.join(' ')} Z`;
  }

  private teethPath(
    x: number,
    y: number,
    width: number,
    height: number,
    count: number
  ): string {
    const step = width / count;
    const points: string[] = [`M ${x} ${y}`];

    for (let index = 0; index < count; index++) {
      points.push(`L ${x + step * (index + 0.5)} ${y + height}`, `L ${x + step * (index + 1)} ${y}`);
    }

    return points.join(' ');
  }
}
