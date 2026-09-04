import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button';
import { IconComponent } from '../../atoms/icon/icon';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  selector: 'ibid-bottom-sheet-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, IconButtonComponent],
  hostDirectives: [HandDrawnDirective],
  host: { class: 'm-bottom-sheet-dialog' },
  templateUrl: './bottom-sheet-dialog.html',
  styleUrl: './bottom-sheet-dialog.scss',
})
export class BottomSheetDialogComponent implements OnInit {
  private readonly handDrawn = inject(HandDrawnDirective, { self: true, optional: true });

  @Input() showFooter = true;
  @Input() showHeader = true;
  @Input() showHandle = true;
  @Input() showClose = true;
  @Input() iconName?: string;
  @Output() readonly closeClicked = new EventEmitter<void>();

  ngOnInit(): void {
    this.handDrawn?.setConfiguration({ intensity: 4, edges: ['top', 'left', 'right'] });
  }
}
