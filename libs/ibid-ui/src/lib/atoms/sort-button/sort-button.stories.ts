import type { Meta, StoryObj } from '@storybook/angular';
import { SortButtonComponent } from './sort-button';

const meta: Meta<SortButtonComponent> = {
  title: 'Atoms/SortButton',
  component: SortButtonComponent,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<SortButtonComponent>;

export const Default: Story = {
  args: {
    label: 'Date',
    active: false,
    direction: 'desc'
  }
};

export const ActiveDescending: Story = {
  args: {
    label: 'Amount',
    active: true,
    direction: 'desc'
  }
};

export const ActiveAscending: Story = {
  args: {
    label: 'Amount',
    active: true,
    direction: 'asc'
  }
};
