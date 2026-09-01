import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button';

@Component({
  selector: 'app-bottom-sheet-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, IconButtonComponent],
  host: { class: 'm-bottom-sheet-dialog' },
  templateUrl: './bottom-sheet-dialog.html',
  styleUrl: './bottom-sheet-dialog.scss'
})
export class BottomSheetDialogComponent {
  @Input() showFooter = true;
  @Input() showHeader = true;
  @Input() showHandle = true;
  @Input() showClose = true;
  @Input() iconName?: string;
  @Output() readonly closeClicked = new EventEmitter<void>();
}
