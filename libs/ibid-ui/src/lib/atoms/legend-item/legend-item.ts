import { Component, input } from '@angular/core';

@Component({
  selector: 'app-legend-item',
  standalone: true,
  template: `
    <span
      class="a-legend-item"
      [class.a-legend-item--lg]="size() === 'lg'"
      [class.a-legend-item--sm]="size() === 'sm'"
      [class]="customClass()"
    >
      <span class="a-legend-item__mark" [style.background-color]="color()"></span>
      <span class="a-legend-item__label">{{ label() }}</span>
    </span>
  `,
  styleUrl: './legend-item.scss'
})
export class LegendItemComponent {
  readonly label = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly customClass = input<string>('');
}
