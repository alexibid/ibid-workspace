import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-bottom-sheet-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './bottom-sheet-header.component.html',
  styleUrl: './bottom-sheet-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetHeaderComponent {
  @Input() iconName?: string;
  @Input() showClose = true;
  @Output() readonly closeClicked = new EventEmitter<void>();
}
