import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  afterRenderEffect,
  input,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'ibid-textarea',
  standalone: true,
  template: `
    <textarea
      #field
      class="a-textarea__field"
      [attr.aria-label]="ariaLabel()"
      [placeholder]="placeholder()"
      [rows]="rows()"
      (input)="onInput($event)"
    ></textarea>
  `,
  host: { class: 'a-textarea' },
  styleUrl: './textarea.scss',
})
export class TextareaComponent {
  readonly value = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly rows = input(3);

  @Output() valueChange = new EventEmitter<string>();

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  constructor() {
    afterRenderEffect(() => {
      const element = this.field().nativeElement;
      const next = this.value();
      if (element.value !== next) element.value = next;
    });
  }

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
