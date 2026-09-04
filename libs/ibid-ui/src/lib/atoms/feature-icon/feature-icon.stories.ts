import type { Meta, StoryObj } from '@storybook/angular';
import { FeatureIconComponent } from './feature-icon';

const meta: Meta<FeatureIconComponent> = {
  component: FeatureIconComponent,
  tags: ['autodocs']
};

export default meta;
export const Primary: StoryObj<FeatureIconComponent> = {
  args: {
    name: 'shopping_bag',
    color: '#8b5cf6',
    size: 'md',
    variant: 'glass'
  }
};

export const PastelVariants: StoryObj<FeatureIconComponent> = {
  args: {
    name: 'savings',
    color: '#10b981',
    size: 'lg',
    variant: 'pastel'
  }
};
