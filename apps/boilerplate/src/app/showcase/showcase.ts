import { Component, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  CurrencyDisplayComponent,
  DateInputComponent,
  DividerComponent,
  EmptyStateComponent,
  FormFieldComponent,
  IconButtonComponent,
  IconComponent,
  LegendItemComponent,
  MetricCardComponent,
  NumberInputComponent,
  ProgressRowComponent,
  BarChartComponent,
  BottomSheetDialogComponent,
  ChartHeadlineComponent,
  ChartLegendComponent,
  LineChartComponent,
  ScrimComponent,
  SearchInputComponent,
  SmartCurrencyCellComponent,
  SmartDateCellComponent,
  SmartIconCellComponent,
  SmartMutedCaptionCellComponent,
  SmartTextCellComponent,
  SegmentedControlComponent,
  SelectComponent,
  StackDotsComponent,
  StatCardComponent,
  StatIconComponent,
  SummaryRowComponent,
  ViewMoreLinkComponent
} from 'ibid-ui';
import { I18nService } from '@ibid/services';

@Component({
  selector: 'boilerplate-showcase',
  standalone: true,
  imports: [
    BarChartComponent,
  BottomSheetDialogComponent, ChartHeadlineComponent, ChartLegendComponent, LineChartComponent,
    SmartCurrencyCellComponent, SmartDateCellComponent, SmartIconCellComponent,
    SmartMutedCaptionCellComponent, SmartTextCellComponent,
    ButtonComponent, CardComponent, CurrencyDisplayComponent, DateInputComponent,
    DividerComponent, EmptyStateComponent, FormFieldComponent, IconButtonComponent,
    IconComponent, LegendItemComponent, MetricCardComponent, NumberInputComponent,
    ProgressRowComponent, ScrimComponent, SearchInputComponent, SegmentedControlComponent,
    SelectComponent, StackDotsComponent, StatCardComponent, StatIconComponent,
    SummaryRowComponent, ViewMoreLinkComponent
  ],
  templateUrl: './showcase.html',
  styleUrl: './showcase.scss'
})
export class Showcase {
  protected readonly i18n = inject(I18nService);

  protected readonly searchTerm = signal('');
  protected readonly quantity = signal(3);
  protected readonly chosenDate = signal('2026-09-01');
  protected readonly chosenOption = signal('monthly');
  protected readonly segment = signal('all');
  protected readonly scrimOpen = signal(false);
  protected readonly sheetOpen = signal(false);

  protected readonly spendingSeries = [
    {
      name: 'Spending',
      color: '#2c6a4d',
      type: 'bar' as const,
      points: [
        { label: 'May', value: 820 },
        { label: 'Jun', value: 1140 },
        { label: 'Jul', value: 960 },
        { label: 'Aug', value: 1320 }
      ]
    }
  ];

  protected readonly balanceSeries = [
    {
      name: 'Balance',
      color: '#333f8f',
      type: 'line' as const,
      fillArea: true,
      points: [
        { label: 'May', value: 2400 },
        { label: 'Jun', value: 2180 },
        { label: 'Jul', value: 2620 },
        { label: 'Aug', value: 2310 }
      ]
    }
  ];

  protected readonly legendEntries = [
    { label: 'Essentials', color: '#2c6a4d' },
    { label: 'Lifestyle', color: '#8a5712' }
  ];

  protected readonly tableRows = [
    { date: '2026-08-02', description: 'Lidl', amount: -42.18, note: 'Groceries' },
    { date: '2026-08-05', description: 'Salary', amount: 2400, note: 'Monthly income' },
    { date: '2026-08-11', description: 'Netflix', amount: -13.99, note: 'Subscription' }
  ];

  protected readonly incomeStat = { label: 'Income', value: 3200, isCurrency: true, icon: 'add', theme: 'success' as const };
  protected readonly expenseStat = { label: 'Expenses', value: -1840, isCurrency: true, icon: 'add', theme: 'danger' as const };

  protected readonly selectOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  protected readonly segments = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' }
  ];

  protected openScrim(): void {
    this.scrimOpen.set(true);
  }

  protected closeScrim(): void {
    this.scrimOpen.set(false);
  }

  protected openSheet(): void {
    this.sheetOpen.set(true);
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
  }
}
