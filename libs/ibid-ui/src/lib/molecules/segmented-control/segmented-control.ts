import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-segmented-control">
      @for (opt of options; track opt.value) {
        <button 
          type="button"
          class="m-segmented-control__btn" 
          [class.m-segmented-control__btn--active]="value === opt.value"
          (click)="onSelect(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-control.scss'
})
export class SegmentedControlComponent {
  @Input({ required: true }) options!: SegmentOption[];
  @Input({ required: true }) value!: string;
  @Output() valueChange = new EventEmitter<string>();

  onSelect(val: string) {
    if (val !== this.value) {
      this.valueChange.emit(val);
    }
  }
}
