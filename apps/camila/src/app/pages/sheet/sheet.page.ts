import { Component, inject, signal } from '@angular/core';
import { I18nService } from '@ibid/services';
import { CutSheetComponent, SheetVariant } from '@ui/organisms/cut-sheet/cut-sheet';

interface SheetSlide {
  readonly variant: SheetVariant;
  readonly labelKey: string;
}

@Component({
  selector: 'camila-sheet-page',
  standalone: true,
  imports: [CutSheetComponent],
  templateUrl: './sheet.page.html',
  styleUrl: './sheet.page.scss',
})
export class SheetPage {
  protected readonly i18n = inject(I18nService);
  protected readonly current = signal(0);

  protected readonly slides: readonly SheetSlide[] = [
    { variant: 'coloured', labelKey: 'sheetColoured' },
    { variant: 'outline', labelKey: 'sheetOutline' },
  ];

  protected show(index: number): void {
    this.current.set(index);
  }
}
