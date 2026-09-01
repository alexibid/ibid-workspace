import type { Meta, StoryObj } from '@storybook/angular';
import { SmartIconCellComponent } from './smart-icon-cell';

const meta: Meta<SmartIconCellComponent> = { component: SmartIconCellComponent, tags: ['autodocs'] };
export default meta;

export const Icon: StoryObj<SmartIconCellComponent> = { args: { iconName: 'home' } };
export const CheckboxUnchecked: StoryObj<SmartIconCellComponent> = { args: { mode: 'checkbox', checked: false } };
export const CheckboxChecked: StoryObj<SmartIconCellComponent> = { args: { mode: 'checkbox', checked: true } };
