import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { CommonModule } from '@angular/common';
import { StatTheme } from '../../models/ui.model';

@Component({
  selector: 'app-stat-icon',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="a-stat-icon" [ngClass]="'a-stat-icon--' + theme">
      <app-icon [name]="icon" class="a-stat-icon__icon"></app-icon>
    </div>
  `,
  styleUrl: './stat-icon.scss'
})
export class StatIconComponent {
  @Input({ required: true }) icon!: string;
  @Input() theme: StatTheme = 'neutral';
}
