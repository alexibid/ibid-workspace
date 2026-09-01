import type { Meta, StoryObj } from '@storybook/angular';
import { SmartCurrencyCellComponent } from './smart-currency-cell';

const meta: Meta<SmartCurrencyCellComponent> = { component: SmartCurrencyCellComponent, tags: ['autodocs'] };
export default meta;

export const Expense: StoryObj<SmartCurrencyCellComponent> = { args: { value: -84.2, balance: 1200 } };
export const Income: StoryObj<SmartCurrencyCellComponent> = { args: { value: 2150, balance: 1242.3 } };
export const Secondary: StoryObj<SmartCurrencyCellComponent> = { args: { value: 12480, variant: 'secondary' } };
export const NonInteractive: StoryObj<SmartCurrencyCellComponent> = { args: { value: -84.2, interactive: false } };
