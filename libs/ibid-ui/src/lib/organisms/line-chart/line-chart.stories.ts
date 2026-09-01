import type { Meta, StoryObj } from '@storybook/angular';
import { LineChartComponent } from './line-chart';
import { ChartSeries } from '../../models/chart-series.model';

const meta: Meta<LineChartComponent> = { component: LineChartComponent, tags: ['autodocs'] };
export default meta;

const receita: ChartSeries = {
  name: 'receita',
  color: 'var(--color-teal-mid)',
  points: [
    { label: 'seg', value: 1200 },
    { label: 'ter', value: 1240 },
    { label: 'qua', value: 1260 },
    { label: 'qui', value: 1300 },
    { label: 'sex', value: 1320 },
    { label: 'sáb', value: 1350 },
    { label: 'dom', value: 1400 }
  ]
};

const despesa: ChartSeries = {
  name: 'despesa',
  color: 'var(--color-coral-mid)',
  points: [
    { label: 'seg', value: 820 },
    { label: 'ter', value: 790 },
    { label: 'qua', value: 860 },
    { label: 'qui', value: 800 },
    { label: 'sex', value: 870 },
    { label: 'sáb', value: 830 },
    { label: 'dom', value: 900 }
  ]
};

const saldo: ChartSeries = {
  name: 'saldo',
  color: 'var(--color-amber-mid)',
  points: [
    { label: 'seg', value: 8200 },
    { label: 'ter', value: 8450 },
    { label: 'qua', value: 8100 },
    { label: 'qui', value: 8600 },
    { label: 'sex', value: 8300 },
    { label: 'sáb', value: 8700 },
    { label: 'dom', value: 8480 }
  ]
};

export const Default: StoryObj<LineChartComponent> = {
  args: {
    series: [receita, despesa, saldo],
    caption: 'saldo atual',
    context: 'a subir esta semana'
  }
};

export const Mini: StoryObj<LineChartComponent> = {
  args: { series: [saldo], size: 'mini' }
};

export const EmptyState: StoryObj<LineChartComponent> = {
  args: { series: [{ name: 'saldo', color: 'var(--color-amber-mid)', points: [{ label: 'jan', value: 100 }] }] }
};
