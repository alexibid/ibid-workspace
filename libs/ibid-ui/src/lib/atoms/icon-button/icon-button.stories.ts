import type { Meta, StoryObj } from '@storybook/angular';
import { IconButtonComponent } from './icon-button';

const meta: Meta<IconButtonComponent> = {
  component: IconButtonComponent,
  tags: ['autodocs'],
  render: (args) => ({
    props: args,
    template: `
      <ibid-icon-button [ariaLabel]="ariaLabel" style="width: 42px; height: 42px;">
        <span style="font-size: 20px;">★</span>
      </ibid-icon-button>
    `,
  }),
};
export default meta;

export const Default: StoryObj<IconButtonComponent> = {
  args: {
    ariaLabel: 'Icon action'
  }
};
