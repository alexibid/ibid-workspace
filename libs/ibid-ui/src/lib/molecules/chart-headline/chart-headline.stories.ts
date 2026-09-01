import type { Meta, StoryObj } from '@storybook/angular';
import { ChartHeadlineComponent } from './chart-headline';

const meta: Meta<ChartHeadlineComponent> = { component: ChartHeadlineComponent, tags: ['autodocs'] };
export default meta;

export const Default: StoryObj<ChartHeadlineComponent> = {
  args: {
    caption: 'saldo atual',
    value: 12480,
    context: 'a subir desde o mín de 8 200€ este mês'
  }
};
