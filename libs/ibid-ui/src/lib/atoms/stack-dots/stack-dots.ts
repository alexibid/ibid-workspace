import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stack-dots',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="a-stack-dots" role="tablist" aria-label="Suggestions">
      @for (dot of dots; track $index) {
        <button
          type="button"
          class="a-stack-dots__dot"
          [class.a-stack-dots__dot--active]="$index === activeIndex"
          role="tab"
          [attr.aria-selected]="$index === activeIndex"
          [attr.aria-label]="'Suggestion ' + ($index + 1)"
          (click)="dotClicked.emit($index)"
        ></button>
      }
    </div>
  `,
  styleUrl: './stack-dots.scss',
})
export class StackDotsComponent {
  @Input({ required: true }) count!: number;
  @Input() activeIndex = 0;

  @Output() readonly dotClicked = new EventEmitter<number>();

  protected get dots(): readonly unknown[] {
    return Array.from({ length: this.count });
  }
}
