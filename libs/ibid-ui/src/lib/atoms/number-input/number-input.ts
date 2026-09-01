import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input 
      type="number" 
      [min]="min" 
      [max]="max" 
      [value]="value"
      [attr.aria-label]="ariaLabel || 'Número'"
      (change)="onChange($event)"
      class="a-number-input"
    />
  `,
  styleUrl: './number-input.scss'
})
export class NumberInputComponent {
  @Input({ required: true }) value!: number;
  @Input() min?: number;
  @Input() max?: number;
  @Input() ariaLabel?: string;
  @Output() valueChange = new EventEmitter<number>();

  onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const num = Number(input.value);
    if (!isNaN(num)) {
      this.valueChange.emit(num);
    }
  }
}
