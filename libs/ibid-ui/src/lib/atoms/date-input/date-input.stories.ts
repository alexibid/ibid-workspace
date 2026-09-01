import type { Meta, StoryObj } from '@storybook/angular';
import { DateInputComponent } from './date-input';

const meta: Meta<DateInputComponent> = { component: DateInputComponent, tags: ['autodocs'] };
export default meta;
export const SingleDate: StoryObj<DateInputComponent> = {
  args: {
    isRange: false,
    value: '2026-08-07'
  }
};

export const DateRange: StoryObj<DateInputComponent> = {
  args: {
    isRange: true,
    startDate: '2026-08-01',
    endDate: '2026-08-07'
  }
};
