import { Component, ViewEncapsulation, input, output } from '@angular/core';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-scrim',
  standalone: true,
  template: `
    <button
      type="button"
      class="a-scrim"
      [class.a-scrim--dimmed]="dimmed()"
      [attr.aria-label]="dismissLabel()"
      (click)="dismissed.emit()"
      (keydown.escape)="dismissed.emit()"
    ></button>
  `,
  styleUrl: './scrim.scss'
})
export class ScrimComponent {
  readonly dismissLabel = input('Close');
  readonly dimmed = input(true);
  readonly dismissed = output<void>();
}
