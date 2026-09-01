import { Component, ChangeDetectionStrategy, Output, EventEmitter, input } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { IconButtonComponent } from '../icon-button/icon-button';

@Component({
  selector: 'ibid-fab',
  standalone: true,
  imports: [IconButtonComponent, IconComponent],
  templateUrl: './fab.html',
  styleUrl: './fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FabComponent {
  readonly badgeCount = input<number>(0);
  @Output() readonly clicked = new EventEmitter<void>();
}
