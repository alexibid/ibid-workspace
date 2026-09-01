import type { Meta, StoryObj } from '@storybook/angular';
import { ChartBarSegmentComponent } from './chart-bar-segment';

const meta: Meta<ChartBarSegmentComponent> = { component: ChartBarSegmentComponent, tags: ['autodocs'] };
export default meta;

export const Vertical: StoryObj<ChartBarSegmentComponent> = {
  render: () => ({
    template: `
      <div style="width:200px; height:120px; display:flex; align-items:flex-end;">
        <ibid-chart-bar-segment [percentage]="62" />
      </div>
    `
  })
};

export const Horizontal: StoryObj<ChartBarSegmentComponent> = {
  render: () => ({
    template: `
      <div style="width:200px; height:24px; display:flex; align-items:flex-start;">
        <ibid-chart-bar-segment [percentage]="62" orientation="horizontal" />
      </div>
    `
  })
};

export const Max: StoryObj<ChartBarSegmentComponent> = {
  render: () => ({
    template: `
      <div style="width:200px; height:120px; display:flex; align-items:flex-end;">
        <ibid-chart-bar-segment [percentage]="100" role="max" />
      </div>
    `
  })
};

export const Min: StoryObj<ChartBarSegmentComponent> = {
  render: () => ({
    template: `
      <div style="width:200px; height:120px; display:flex; align-items:flex-end;">
        <ibid-chart-bar-segment [percentage]="20" role="min" />
      </div>
    `
  })
};
