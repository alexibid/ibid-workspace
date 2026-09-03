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
  { date: '2026-08-01', description: 'Tech Corp Salary', note: 'Monthly payroll', amount: 3200.0 },
  { date: '2026-08-02', description: 'Lidl Supermarket', note: 'Weekly groceries', amount: -68.45 },
  { date: '2026-08-03', description: 'Metro Monthly Pass', note: 'Public transit', amount: -40.0 },
  { date: '2026-08-04', description: 'Galp Electric Charging', note: 'EV charging', amount: -24.8 },
  { date: '2026-08-05', description: 'Spotify Premium', note: 'Family plan subscription', amount: -14.99 },
  { date: '2026-08-06', description: 'Gym Membership', note: 'Monthly fee', amount: -45.0 },
  { date: '2026-08-07', description: 'Pharmacy Central', note: 'Vitamins & skincare', amount: -28.3 },
  { date: '2026-08-08', description: 'Freelance Design', note: 'Design system consultation', amount: 650.0 },
  { date: '2026-08-10', description: 'IKEA Furnishings', note: 'Desk accessories', amount: -112.5 },
  { date: '2026-08-11', description: 'Netflix 4K', note: 'Streaming service', amount: -15.99 },
  { date: '2026-08-13', description: 'Continente Groceries', note: 'Fresh produce & pantry', amount: -84.2 },
  { date: '2026-08-15', description: 'Electricity & Gas', note: 'Utility bill', amount: -76.4 },
  { date: '2026-08-16', description: 'Internet Fiber', note: 'Home broadband', amount: -38.9 },
  { date: '2026-08-18', description: 'Dinner with Friends', note: 'Restaurant & dessert', amount: -52.0 },
  { date: '2026-08-20', description: 'Amazon Europe', note: 'Ergonomic mouse & cables', amount: -64.9 },
  { date: '2026-08-22', description: 'Dividend Payout', note: 'Index fund ETF distribution', amount: 145.2 },
  { date: '2026-08-24', description: 'Cinema & Snacks', note: 'Movie tickets', amount: -21.5 },
  { date: '2026-08-26', description: 'Bookstore Bertrand', note: 'Architecture books', amount: -34.0 },
  { date: '2026-08-28', description: 'Organic Bakery', note: 'Sourdough bread & coffee', amount: -16.8 },
  { date: '2026-08-30', description: 'Condo Fee', note: 'Monthly maintenance reserve', amount: -85.0 }
];
