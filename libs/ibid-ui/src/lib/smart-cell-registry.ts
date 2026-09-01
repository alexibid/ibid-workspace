import { Type } from '@angular/core';
import { SmartDataType } from './models/smart-cell.model';
import { SmartDateCellComponent } from './atoms/smart-date-cell/smart-date-cell';
import { SmartCurrencyCellComponent } from './atoms/smart-currency-cell/smart-currency-cell';
import { SmartBudgetCellComponent } from './atoms/smart-budget-cell/smart-budget-cell';
import { SmartIconCellComponent } from './atoms/smart-icon-cell/smart-icon-cell';
import { SmartTextCellComponent } from './atoms/smart-text-cell/smart-text-cell';
import { SmartMutedCaptionCellComponent } from './atoms/smart-muted-caption-cell/smart-muted-caption-cell';

const SMART_CELL_COMPONENTS: Record<SmartDataType, Type<unknown>> = {
  date: SmartDateCellComponent,
  currency: SmartCurrencyCellComponent,
  category: SmartBudgetCellComponent,
  icon: SmartIconCellComponent,
  text: SmartTextCellComponent,
  mutedCaption: SmartMutedCaptionCellComponent
};

export function resolveSmartCellComponent(dataType: SmartDataType): Type<unknown> {
  return SMART_CELL_COMPONENTS[dataType];
}
