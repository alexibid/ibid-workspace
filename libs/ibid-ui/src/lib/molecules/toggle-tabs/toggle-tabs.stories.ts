import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleTabsComponent } from './toggle-tabs';

const meta: Meta<ToggleTabsComponent> = {
  component: ToggleTabsComponent,
  tags: ['autodocs']
};

export default meta;
export const Primary: StoryObj<ToggleTabsComponent> = {
  args: {
    items: [
      { value: 'all', label: 'Todos' },
      { value: 'active', label: 'Ativos', badge: 5 },
      { value: 'executed', label: 'Executados' },
      { value: 'cancelled', label: 'Desistidos' }
    ],
    value: 'active',
    size: 'md'
  }
};
