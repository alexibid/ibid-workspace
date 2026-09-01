import type { Meta, StoryObj } from '@storybook/angular';
import { SmartDateCellComponent } from './smart-date-cell';

const meta: Meta<SmartDateCellComponent> = { component: SmartDateCellComponent, tags: ['autodocs'] };
export default meta;

export const Normal: StoryObj<SmartDateCellComponent> = { args: { value: '2026-08-02' } };
export const YearBoundary: StoryObj<SmartDateCellComponent> = { args: { value: '2026-01-01', previousValue: '2025-12-31' } };
