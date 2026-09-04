import type { Meta, StoryObj } from '@storybook/angular';
import { ChipComponent } from './chip';

const meta: Meta<ChipComponent> = {
  title: 'Atoms/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
};
export default meta;

export const Primary: StoryObj<ChipComponent> = { args: { label: 'Casa' } };

export const Selected: StoryObj<ChipComponent> = { args: { label: 'Casa', selected: true } };

export const WithIcon: StoryObj<ChipComponent> = { args: { label: 'Casa', icon: 'house' } };
