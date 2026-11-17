import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ibid-tools-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    class="button"
    type="button"
    [class.button--quiet]="look() === 'quiet'"
    [disabled]="disabled()"
  ><ng-content /></button>`,
  styleUrl: './button.scss',
})
export class Button {
  readonly look = input<'solid' | 'quiet'>('solid');
  readonly disabled = input(false);
}
