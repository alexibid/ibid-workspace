import type { Meta, StoryObj } from '@storybook/angular';
import { DataTableComponent } from './data-table';

const meta: Meta<DataTableComponent<unknown>> = {
  component: DataTableComponent,
  tags: ['autodocs']
};
export default meta;

export const Primary: StoryObj<DataTableComponent<unknown>> = {};
