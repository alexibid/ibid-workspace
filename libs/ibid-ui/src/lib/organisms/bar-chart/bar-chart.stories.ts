import type { Meta, StoryObj } from '@storybook/angular';
import { BarChartComponent } from './bar-chart';
import { ChartSeries } from '../../models/chart-series.model';

const meta: Meta<BarChartComponent> = { component: BarChartComponent, tags: ['autodocs'] };
export default meta;

const gastoMensal: ChartSeries = {
  name: 'gasto mensal',
  color: 'var(--color-amber-mid)',
  points: [
    { label: 'jan', value: 380 },
    { label: 'fev', value: 420 },
    { label: 'mar', value: 510 },
    { label: 'abr', value: 340 },
    { label: 'mai', value: 460 },
    { label: 'jun', value: 430 }
  ]
};

const diaComMaisGastos: ChartSeries = {
  name: 'gasto por dia',
  color: 'var(--color-amber-mid)',
  points: [
    { label: 'seg', value: 45 },
    { label: 'ter', value: 62 },
    { label: 'qua', value: 38 },
    { label: 'qui', value: 90 },
    { label: 'sex', value: 55 },
    { label: 'sáb', value: 70 },
    { label: 'dom', value: 40 }
  ]
};

export const Vertical: StoryObj<BarChartComponent> = {
  args: {
    series: [gastoMensal],
    caption: 'gasto mensal',
    context: 'março foi o mês mais alto: 510€ — 170€ acima do mês mais baixo'
  }
};

export const Horizontal: StoryObj<BarChartComponent> = {
  args: {
    series: [diaComMaisGastos],
    orientation: 'horizontal',
    caption: 'dia com mais gastos',
    context: 'quinta é o dia mais caro da semana — quase o dobro de quarta (mín)'
  }
};

export const Mini: StoryObj<BarChartComponent> = {
  args: { series: [gastoMensal], size: 'mini' }
};

export const EmptyState: StoryObj<BarChartComponent> = {
  args: { series: [{ name: 'gasto', color: 'var(--color-amber-mid)', points: [{ label: 'jan', value: 100 }] }] }
};
