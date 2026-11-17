import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ibid-tools-entry-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button class="entry-button" type="button" [disabled]="disabled()">{{ label() }}</button>`,
  styleUrl: './entry-button.scss',
})
export class EntryButton {
  readonly label = input.required<string>();
  readonly disabled = input(false);
}
