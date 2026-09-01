import type { Meta, StoryObj } from '@storybook/angular';
import { LegendItemComponent } from './legend-item';

const meta: Meta<LegendItemComponent> = { component: LegendItemComponent, tags: ['autodocs'] };
export default meta;
export const Primary: StoryObj<LegendItemComponent> = {
  args: {
    label: 'Alimentação',
    color: '#5DCAA5',
  },
};
