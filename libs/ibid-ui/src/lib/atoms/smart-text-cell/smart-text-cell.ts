import { Component, ElementRef, EventEmitter, Output, input, viewChild } from '@angular/core';

@Component({
  selector: 'ibid-smart-text-cell',
  standalone: true,
  template: `
    <span
      #text
      class="a-smart-text-cell"
      role="button"
      tabindex="0"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick()"
    >{{ value() }}</span>
  `,
  styleUrl: './smart-text-cell.scss'
})
export class SmartTextCellComponent {
  readonly value = input.required<string>();

  @Output() truncatedClick = new EventEmitter<void>();

  private readonly textRef = viewChild.required<ElementRef<HTMLElement>>('text');

  protected onClick(): void {
    const el = this.textRef().nativeElement;
    if (el.scrollWidth > el.clientWidth) {
      this.truncatedClick.emit();
    }
  }
}
