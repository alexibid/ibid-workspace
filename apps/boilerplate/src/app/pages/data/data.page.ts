import { Component } from '@angular/core';
import {
  CurrencyDisplayComponent,
  DataColumnDirective,
  DataTableComponent,
  MetricCardComponent,
  SmartCurrencyCellComponent,
  SmartDateCellComponent,
  SmartIconCellComponent,
  SmartMutedCaptionCellComponent,
  SmartTextCellComponent,
  StatCardComponent
} from 'ibid-ui';

interface MovementRow {
  readonly date: string;
  readonly description: string;
  readonly note: string;
  readonly amount: number;
}

@Component({
  selector: 'boilerplate-data-page',
  standalone: true,
  imports: [
    CurrencyDisplayComponent,
    DataColumnDirective,
    DataTableComponent,
    MetricCardComponent,
    SmartCurrencyCellComponent,
    SmartDateCellComponent,
    SmartIconCellComponent,
    SmartMutedCaptionCellComponent,
    SmartTextCellComponent,
    StatCardComponent
  ],
  templateUrl: './data.page.html'
})
export class DataPage {
  protected readonly incomeStat = {
    label: 'Income',
    value: 3200,
    isCurrency: true,
    icon: 'add',
    theme: 'success' as const
  };

  protected readonly expenseStat = {
    label: 'Expenses',
    value: -1840,
    isCurrency: true,
    icon: 'add',
    theme: 'danger' as const
  };

  protected readonly movements: readonly MovementRow[] = [
    { date: '2026-08-02', description: 'Lidl', note: 'Groceries', amount: -42.18 },
    { date: '2026-08-05', description: 'Salary', note: 'Monthly income', amount: 2400 },
    { date: '2026-08-11', description: 'Netflix', note: 'Subscription', amount: -13.99 }
  ];
}
