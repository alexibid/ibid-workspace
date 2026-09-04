import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'ibid-sort-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './sort-button.html',
  styleUrl: './sort-button.scss'
})
export class SortButtonComponent {
  @Input() label = '';
  @Input() active = false;
  @Input() direction: 'asc' | 'desc' = 'desc';

  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
