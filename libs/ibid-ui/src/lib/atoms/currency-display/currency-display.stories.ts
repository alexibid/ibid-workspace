import type { Meta, StoryObj } from '@storybook/angular';
import { CurrencyDisplayComponent } from './currency-display';

const meta: Meta<CurrencyDisplayComponent> = {
  component: CurrencyDisplayComponent,
  tags: ['autodocs']
};
export default meta;

export const Primary: StoryObj<CurrencyDisplayComponent> = {
  args: { value: 1284.5 }
};

export const Negative: StoryObj<CurrencyDisplayComponent> = {
  args: { value: -320.75 }
};
