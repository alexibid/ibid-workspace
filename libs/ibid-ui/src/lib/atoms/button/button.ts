import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="'a-button a-button--' + variant" 
      (click)="onClick.emit($event)"
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
  @Output() onClick = new EventEmitter<MouseEvent>();
}
