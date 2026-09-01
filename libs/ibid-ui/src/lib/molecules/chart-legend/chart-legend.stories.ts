import type { Meta, StoryObj } from '@storybook/angular';
import { ChartLegendComponent } from './chart-legend';

const meta: Meta<ChartLegendComponent> = { component: ChartLegendComponent, tags: ['autodocs'] };
export default meta;

export const Default: StoryObj<ChartLegendComponent> = {
  args: {
    entries: [
      { label: 'receita', color: 'var(--color-teal-mid)' },
      { label: 'despesa', color: 'var(--color-coral-mid)' },
      { label: 'saldo', color: 'var(--color-amber-mid)' }
    ]
  }
};
