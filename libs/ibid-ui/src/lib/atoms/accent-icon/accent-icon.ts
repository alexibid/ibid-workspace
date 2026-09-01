import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon';
export type AccentTone = 'coral' | 'amber' | 'teal' | 'pink';

@Component({
  selector: 'ibid-accent-icon',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div [class]="'a-accent-icon a-assistant-card-icon--' + accent">
      <ibid-icon [name]="svgIcon"></ibid-icon>
    </div>
  `,
  styleUrl: './accent-icon.scss',
})
export class AccentIconComponent {
  @Input({ required: true }) svgIcon!: string;
  @Input() accent: AccentTone = 'coral';
}
