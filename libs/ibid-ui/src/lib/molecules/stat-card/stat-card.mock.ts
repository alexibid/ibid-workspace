import { StatCardData } from '../../models/ui.model';

export const MOCK_STAT_CURRENCY: StatCardData = {
  label: 'Income',
  value: 3200,
  isCurrency: true,
  icon: 'add',
  theme: 'success'
};

export const MOCK_STAT_PLAIN: StatCardData = {
  label: 'Count',
  value: '42 items',
  isCurrency: false,
  icon: 'add'
};

export const MOCK_STAT_FEATURED: StatCardData = {
  ...MOCK_STAT_CURRENCY,
  useFeatureDisplay: true,
  showInfo: true
};
