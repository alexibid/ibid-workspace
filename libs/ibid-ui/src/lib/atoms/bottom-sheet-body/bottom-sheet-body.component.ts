import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-sheet-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-sheet-body.component.html',
  styleUrl: './bottom-sheet-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetBodyComponent {}
