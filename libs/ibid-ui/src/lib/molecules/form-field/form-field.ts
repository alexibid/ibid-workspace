import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ibid-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="m-form-field">
      @if (label) {
        <span class="m-form-field__label">{{ label }}</span>
      }
      <div class="m-form-field__control">
        <ng-content></ng-content>
      </div>
    </label>
  `,
  styleUrl: './form-field.scss'
})
export class FormFieldComponent {
  @Input() label = '';
}
