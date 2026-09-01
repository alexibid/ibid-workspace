import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ibid-smart-muted-caption-cell',
  standalone: true,
  template: `<span class="a-smart-muted-caption-cell">{{ display() }}</span>`,
  styleUrl: './smart-muted-caption-cell.scss'
})
export class SmartMutedCaptionCellComponent {
  readonly value = input<string | undefined>(undefined);

  protected readonly display = computed(() => {
    const value = this.value();
    return value && value.trim() ? value : '—';
  });
}
