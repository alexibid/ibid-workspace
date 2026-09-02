import type { Meta, StoryObj } from '@storybook/angular';
import { FeatureDisplayComponent } from './feature-display';

const meta: Meta<FeatureDisplayComponent> = {
  component: FeatureDisplayComponent,
  tags: ['autodocs']
};
export default meta;

export const Primary: StoryObj<FeatureDisplayComponent> = {
  args: { value: 1284.5 }
};

export const Negative: StoryObj<FeatureDisplayComponent> = {
  args: { value: -320.75 }
};
