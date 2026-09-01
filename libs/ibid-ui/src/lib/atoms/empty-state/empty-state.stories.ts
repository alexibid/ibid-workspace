import type { Meta, StoryObj } from '@storybook/angular';
import { EmptyStateComponent } from './empty-state';

const meta: Meta<EmptyStateComponent> = { 
  component: EmptyStateComponent, 
  tags: ['autodocs']
};
export default meta;
export const Primary: StoryObj<EmptyStateComponent> = {
  args: {
    message: 'Nenhum dado disponível.'
  }
};
