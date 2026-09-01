import { Component, Output, EventEmitter, input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="a-icon-button"
      [attr.aria-label]="ariaLabel() || title() || null"
      [attr.title]="title() || ariaLabel() || null"
      [disabled]="disabled()"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './icon-button.scss'
})
export class IconButtonComponent {
  readonly ariaLabel = input<string | null>(null);
  readonly title = input<string | null>(null);
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  @Output() readonly onClick = new EventEmitter<MouseEvent>();
}
