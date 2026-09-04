import type { Meta, StoryObj } from '@storybook/angular';
import { CutSheetComponent } from './cut-sheet';

const meta: Meta<CutSheetComponent> = {
  title: 'Organisms/Cut Sheet',
  component: CutSheetComponent,
  tags: ['autodocs'],
};
export default meta;

export const Coloured: StoryObj<CutSheetComponent> = { args: { variant: 'coloured' } };
export const ToColourIn: StoryObj<CutSheetComponent> = { args: { variant: 'outline' } };
