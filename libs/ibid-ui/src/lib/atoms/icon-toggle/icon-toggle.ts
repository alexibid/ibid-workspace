import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'ibid-icon-toggle',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './icon-toggle.html',
  styleUrl: './icon-toggle.scss'
})
export class IconToggleComponent {
  @Input() checked = false;
  @Input() label = '';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() ariaLabel?: string;

  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
