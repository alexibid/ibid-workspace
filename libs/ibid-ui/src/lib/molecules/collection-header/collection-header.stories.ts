import type { Meta, StoryObj } from '@storybook/angular';
import { CollectionHeaderComponent } from './collection-header';

const meta: Meta<CollectionHeaderComponent> = {
  title: 'Molecules/CollectionHeader',
  component: CollectionHeaderComponent,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<CollectionHeaderComponent>;

export const Default: Story = {
  args: {
    title: 'Transactions',
    showTitle: true,
    showSearch: true,
    searchPlaceholder: 'Search transactions...',
    clearLabel: 'Clear',
    showTabs: true,
    activeTab: 'all',
    tabOptions: [
      { label: 'All', value: 'all' },
      { label: 'Income', value: 'income' },
      { label: 'Expenses', value: 'expenses' }
    ]
  }
};

export const Compact: Story = {
  args: {
    showTitle: false,
    showSearch: true,
    searchPlaceholder: 'Filter...',
    compact: true
  }
};
