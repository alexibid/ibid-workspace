import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-button',
  standalone: true,
  imports: [CommonModule, HandDrawnDirective],
  template: `
    <button
      [ibidHandDrawn]="3"
      [class]="'a-button a-button--' + variant"
      (click)="clicked.emit($event)"
      [type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.scss'
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'highlight' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() ariaLabel?: string;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
