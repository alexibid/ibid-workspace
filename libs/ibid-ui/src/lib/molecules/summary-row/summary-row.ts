import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ibid-summary-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="m-summary-row">
      <span class="m-summary-row__label">{{ label }}</span>
      <span class="m-summary-row__value" [ngClass]="valueClass">
        <ng-content></ng-content>
      </span>
    </div>
  `,
  styleUrl: './summary-row.scss'
})
export class SummaryRowComponent {
  @Input({ required: true }) label!: string;
  @Input() valueClass = '';
}
