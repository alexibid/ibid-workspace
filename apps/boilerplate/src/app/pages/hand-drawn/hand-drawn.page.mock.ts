import { StatCardData } from 'ibid-ui';

export const MOCK_HAND_DRAWN_INCOME: StatCardData = {
  label: 'Income',
  value: 3450,
  isCurrency: true,
  useFeatureDisplay: true,
  icon: 'add',
  theme: 'success'
};

export const MOCK_HAND_DRAWN_EXPENSES: StatCardData = {
  label: 'Expenses',
  value: -1840,
  isCurrency: true,
  icon: 'close',
  theme: 'danger'
};

export const MOCK_HAND_DRAWN_SAVINGS: StatCardData = {
  label: 'Savings Rate',
  value: '42%',
  icon: 'bank'
};
