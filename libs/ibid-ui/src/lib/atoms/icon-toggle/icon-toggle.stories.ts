import type { Meta, StoryObj } from '@storybook/angular';
import { IconToggleComponent } from './icon-toggle';

const meta: Meta<IconToggleComponent> = {
  title: 'Atoms/IconToggle',
  component: IconToggleComponent,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<IconToggleComponent>;

export const Default: Story = {
  args: {
    label: 'Sum',
    icon: 'sum',
    checked: false
  }
};

export const Active: Story = {
  args: {
    label: 'Sum',
    icon: 'sum',
    checked: true
  }
};

export const Disabled: Story = {
  args: {
    label: 'Sum',
    icon: 'sum',
    disabled: true
  }
};
