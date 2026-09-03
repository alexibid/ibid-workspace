import { Component, computed, signal } from '@angular/core';
import {
  CollectionHeaderComponent,
  CollectionListComponent,
  DataColumnDirective,
  DataTableComponent,
  EmptyStateComponent,
  FeatureDisplayComponent,
  HandDrawnDirective,
  IconToggleComponent,
  MetricCardComponent,
  SegmentOption,
  SmartCurrencyCellComponent,
  SmartDateCellComponent,
  SmartIconCellComponent,
  SmartMutedCaptionCellComponent,
  SmartTextCellComponent,
  SortButtonComponent,
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
    CollectionHeaderComponent,
    CollectionListComponent,
    DataColumnDirective,
    DataTableComponent,
    EmptyStateComponent,
    FeatureDisplayComponent,
    HandDrawnDirective,
    IconToggleComponent,
    MetricCardComponent,
    SmartCurrencyCellComponent,
    SmartDateCellComponent,
    SmartIconCellComponent,
    SmartMutedCaptionCellComponent,
    SmartTextCellComponent,
    SortButtonComponent,
    StatCardComponent
  ],
  templateUrl: './data.page.html',
  styleUrl: './data.page.scss'
})
export class DataPage {
  protected readonly incomeStat = MOCK_INCOME_STAT;
  protected readonly expenseStat = MOCK_EXPENSE_STAT;
  protected readonly featureExplanation = MOCK_BALANCE_EXPLANATION;
  protected readonly movements = MOCK_MOVEMENTS;

  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal('all');
  protected readonly sumEnabled = signal(false);
  protected readonly sortField = signal<'date' | 'amount'>('date');
  protected readonly sortDirection = signal<'asc' | 'desc'>('desc');

  protected readonly tabOptions: readonly SegmentOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expenses', value: 'expenses' }
  ];

  protected readonly displayedMovements = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.activeTab();
    const sortField = this.sortField();
    const sortDirection = this.sortDirection();

    const list = this.movements.filter((m) => {
      if (tab === 'income' && m.amount <= 0) return false;
      if (tab === 'expenses' && m.amount >= 0) return false;
      if (!query) return true;
      return (
        m.description.toLowerCase().includes(query) ||
        m.note.toLowerCase().includes(query)
      );
    });

    return [...list].sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      const cmp = a.amount - b.amount;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  });

  protected toggleSort(field: 'date' | 'amount'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }
}
