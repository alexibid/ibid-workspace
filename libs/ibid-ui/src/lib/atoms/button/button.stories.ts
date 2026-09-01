import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button';

const meta: Meta<ButtonComponent> = { 
  component: ButtonComponent, 
  tags: ['autodocs'],
  render: (args) => ({
    props: args,
    template: `<ibid-button [variant]="variant" [type]="type">Button Text</ibid-button>`,
  }),
};
export default meta;

export const Primary: StoryObj<ButtonComponent> = {
  args: {
    variant: 'primary',
  }
};

export const Secondary: StoryObj<ButtonComponent> = {
  args: {
    variant: 'secondary',
  }
};

export const Outlined: StoryObj<ButtonComponent> = {
  args: {
    variant: 'outlined',
  }
};
