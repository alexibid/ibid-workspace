import { Component, EventEmitter, Output, input } from '@angular/core';
import { IconComponent } from '../icon/icon';
export type SmartIconCellMode = 'icon' | 'checkbox';

@Component({
  selector: 'ibid-smart-icon-cell',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="a-smart-icon-cell">
      @if (mode() === 'checkbox') {
        <input
          type="checkbox"
          class="a-smart-icon-cell__checkbox"
          [checked]="checked()"
          (change)="checkedChange.emit(!checked())"
          [attr.aria-label]="ariaLabel()"
        />
      } @else {
        <ibid-icon [name]="iconName()"></ibid-icon>
      }
    </div>
  `,
  styleUrl: './smart-icon-cell.scss'
})
export class SmartIconCellComponent {
  readonly iconName = input<string>('help');
  readonly mode = input<SmartIconCellMode>('icon');
  readonly checked = input(false);
  readonly ariaLabel = input<string>('');

  @Output() checkedChange = new EventEmitter<boolean>();
}
