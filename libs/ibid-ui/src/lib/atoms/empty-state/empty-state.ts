import { IconComponent } from '../icon/icon';
import { Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="a-empty-state">
      <app-icon name="info" class="a-empty-state__icon"></app-icon>
      <div class="a-empty-state__message">{{ message() }}</div>
    </div>
  `,
  styleUrl: './empty-state.scss'
})
export class EmptyStateComponent {
  readonly message = input<string>('No data available');
}
