import { FeatureExplanationRow, StatCardData } from 'ibid-ui';

export interface MovementRow {
  readonly date: string;
  readonly description: string;
  readonly note: string;
  readonly amount: number;
}

export const MOCK_INCOME_STAT: StatCardData = {
  label: 'Income',
  value: 3200,
  isCurrency: true,
  useFeatureDisplay: true,
  showInfo: true,
  explanationTitle: 'Income breakdown',
  explanation: [
    { label: 'Base salary', value: '2,800.00 €' },
    { label: 'Bonus / Extras', value: '400.00 €' }
  ],
  icon: 'add',
  theme: 'success'
};

export const MOCK_EXPENSE_STAT: StatCardData = {
  label: 'Expenses',
  value: -1840,
  isCurrency: true,
  icon: 'add',
  theme: 'danger'
};

export const MOCK_BALANCE_EXPLANATION: readonly FeatureExplanationRow[] = [
  { label: 'Total balance', value: '1,284.50 €' },
  { label: 'Available budget', value: '963.75 €' },
  { label: 'Reserved for goals', value: '320.75 €' }
];

export const MOCK_MOVEMENTS: readonly MovementRow[] = [
  { date: '2026-08-02', description: 'Lidl', note: 'Groceries', amount: -42.18 },
  { date: '2026-08-05', description: 'Salary', note: 'Monthly income', amount: 2400 },
  { date: '2026-08-11', description: 'Netflix', note: 'Subscription', amount: -13.99 }
];
