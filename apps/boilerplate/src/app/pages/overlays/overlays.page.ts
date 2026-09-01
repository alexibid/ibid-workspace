import { Component, signal } from '@angular/core';
import { BottomSheetDialogComponent, ButtonComponent, ScrimComponent } from 'ibid-ui';

@Component({
  selector: 'boilerplate-overlays-page',
  standalone: true,
  imports: [BottomSheetDialogComponent, ButtonComponent, ScrimComponent],
  templateUrl: './overlays.page.html'
})
export class OverlaysPage {
  protected readonly scrimOpen = signal(false);
  protected readonly sheetOpen = signal(false);

  protected openScrim(): void {
    this.scrimOpen.set(true);
  }

  protected closeScrim(): void {
    this.scrimOpen.set(false);
  }

  protected openSheet(): void {
    this.sheetOpen.set(true);
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
  }
}
