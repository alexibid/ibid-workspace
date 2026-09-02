import { Component } from '@angular/core';
import {
  FeatureDisplayComponent,
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
import {
  MOCK_BALANCE_EXPLANATION,
  MOCK_EXPENSE_STAT,
  MOCK_INCOME_STAT,
  MOCK_MOVEMENTS
} from './data.page.mock';

@Component({
  selector: 'boilerplate-data-page',
  standalone: true,
  imports: [
    FeatureDisplayComponent,
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
  protected readonly incomeStat = MOCK_INCOME_STAT;
  protected readonly expenseStat = MOCK_EXPENSE_STAT;
  protected readonly featureExplanation = MOCK_BALANCE_EXPLANATION;
  protected readonly movements = MOCK_MOVEMENTS;
}
