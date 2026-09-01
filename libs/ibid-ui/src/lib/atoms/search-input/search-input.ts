import { IconComponent } from '../icon/icon';
import { Component, EventEmitter, Output, input, signal } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="a-search-input">
      <input
        type="text"
        class="a-search-input__field"
        [attr.aria-label]="placeholder() || 'Search'"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="isFocused.set(true)"
        (blur)="isFocused.set(false)"
      />
      @if (value() || isFocused()) {
        <button
          type="button"
          class="a-search-input__clear"
          [attr.aria-label]="clearLabel()"
          (mousedown)="clear($event)"
          (click)="clear($event)"
        >
          <app-icon name="close"></app-icon>
        </button>
      } @else {
        <app-icon name="search" class="a-search-input__icon"></app-icon>
      }
    </div>
  `,
  styleUrl: './search-input.scss'
})
export class SearchInputComponent {
  readonly value = input('');
  readonly placeholder = input('');
  readonly clearLabel = input('');

  readonly isFocused = signal(false);

  @Output() valueChange = new EventEmitter<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit('');
  }
}
