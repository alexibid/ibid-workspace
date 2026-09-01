import type { Meta, StoryObj } from '@storybook/angular';
import { SmartBudgetCellComponent } from './smart-budget-cell';

const meta: Meta<SmartBudgetCellComponent> = { component: SmartBudgetCellComponent, tags: ['autodocs'] };
export default meta;

export const Teal: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Groceries', categoryColor: '#10b981' } };
export const Amber: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Online', categoryColor: '#f59e0b' } };
export const Pink: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Income', categoryColor: '#22c55e' } };
export const Coral: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Entertainment', categoryColor: '#ef4444' } };
export const Uncategorized: StoryObj<SmartBudgetCellComponent> = { args: {} };
export const Selectable: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Groceries', categoryColor: '#10b981', showChevron: true } };
export const AssignedToProject: StoryObj<SmartBudgetCellComponent> = { args: { categoryId: 'Groceries', categoryColor: '#10b981', projectName: 'Férias Algarve 2026', showChevron: true } };
