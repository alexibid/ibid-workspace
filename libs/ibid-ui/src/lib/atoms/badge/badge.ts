import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ibid-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="a-badge">{{ label }}</span>
  `,
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  @Input({ required: true }) label!: string;
}
