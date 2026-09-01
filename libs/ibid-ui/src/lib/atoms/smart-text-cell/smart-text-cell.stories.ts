import type { Meta, StoryObj } from '@storybook/angular';
import { SmartTextCellComponent } from './smart-text-cell';

const meta: Meta<SmartTextCellComponent> = { component: SmartTextCellComponent, tags: ['autodocs'] };
export default meta;

export const Short: StoryObj<SmartTextCellComponent> = { args: { value: 'continente' } };
export const Long: StoryObj<SmartTextCellComponent> = { args: { value: 'levantamento multibanco agência do bairro' } };
