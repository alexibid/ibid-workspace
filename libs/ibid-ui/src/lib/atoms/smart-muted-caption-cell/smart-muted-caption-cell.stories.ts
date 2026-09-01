import type { Meta, StoryObj } from '@storybook/angular';
import { SmartMutedCaptionCellComponent } from './smart-muted-caption-cell';

const meta: Meta<SmartMutedCaptionCellComponent> = { component: SmartMutedCaptionCellComponent, tags: ['autodocs'] };
export default meta;

export const WithValue: StoryObj<SmartMutedCaptionCellComponent> = { args: { value: 'principal' } };
export const Empty: StoryObj<SmartMutedCaptionCellComponent> = { args: {} };
