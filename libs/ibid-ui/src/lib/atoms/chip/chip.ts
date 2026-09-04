import { Component, EventEmitter, Output, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'ibid-chip',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="a-chip__control"
      [class.a-chip__control--selected]="selected()"
      [attr.aria-pressed]="selected()"
      (click)="selectedChange.emit(!selected())"
    >
      @if (icon()) {
        <ibid-icon class="a-chip__icon" [name]="icon()"></ibid-icon>
      }
      <span class="a-chip__label">{{ label() }}</span>
    </button>
  `,
  host: { class: 'a-chip' },
  styleUrl: './chip.scss',
})
export class ChipComponent {
  readonly label = input('');
  readonly icon = input('');
  readonly selected = input(false);

  @Output() selectedChange = new EventEmitter<boolean>();
}
