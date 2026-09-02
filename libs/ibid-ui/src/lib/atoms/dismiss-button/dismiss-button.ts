import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AccentTone } from '../accent-icon/accent-icon';
import { IconComponent } from '../icon/icon';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  selector: 'ibid-dismiss-button',
  standalone: true,
  imports: [IconComponent, HandDrawnDirective],
  template: `
    <button
      ibidHandDrawn
      type="button"
      [class]="'a-dismiss-button a-assistant-card-dismiss--' + accent"
      aria-label="Dismiss suggestion"
      (click)="onDismiss($event)"
    >
      <ibid-icon name="close-line"></ibid-icon>
    </button>
  `,
  styleUrl: './dismiss-button.scss',
})
export class DismissButtonComponent {
  @Input() accent: AccentTone = 'coral';
  @Output() readonly dismissed = new EventEmitter<void>();

  protected onDismiss(event: MouseEvent): void {
    event.stopPropagation();
    this.dismissed.emit();
  }
}
