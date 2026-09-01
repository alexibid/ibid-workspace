import type { Meta, StoryObj } from '@storybook/angular';
import { ChartMarkerDotComponent } from './chart-marker-dot';

const meta: Meta<ChartMarkerDotComponent> = { component: ChartMarkerDotComponent, tags: ['autodocs'] };
export default meta;

export const Default: StoryObj<ChartMarkerDotComponent> = { args: {} };
export const First: StoryObj<ChartMarkerDotComponent> = { args: { role: 'first' } };
export const Last: StoryObj<ChartMarkerDotComponent> = { args: { role: 'last' } };
export const Max: StoryObj<ChartMarkerDotComponent> = { args: { role: 'max' } };
export const Min: StoryObj<ChartMarkerDotComponent> = { args: { role: 'min' } };
export const Active: StoryObj<ChartMarkerDotComponent> = { args: { role: 'last', active: true } };
