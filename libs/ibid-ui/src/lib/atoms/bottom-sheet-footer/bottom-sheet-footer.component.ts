import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ibid-bottom-sheet-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-sheet-footer.component.html',
  styleUrl: './bottom-sheet-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetFooterComponent {}
