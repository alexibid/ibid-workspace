import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  contentChildren,
  inject,
  input
} from '@angular/core';

export type DataColumnAlign = 'start' | 'end';

@Directive({
  selector: '[ibidDataColumn]',
  standalone: true
})
export class DataColumnDirective {
  readonly label = input.required<string>({ alias: 'ibidDataColumn' });
  readonly align = input<DataColumnAlign>('start');
  readonly template = inject(TemplateRef);
}

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTableComponent<TRow> {
  readonly rows = input.required<readonly TRow[]>();
  readonly caption = input('');
  readonly emptyMessage = input('No rows to show');

  protected readonly columns = contentChildren(DataColumnDirective);
}
