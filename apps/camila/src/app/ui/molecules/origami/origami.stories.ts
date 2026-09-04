import type { Meta, StoryObj } from '@storybook/angular';
import { OrigamiComponent } from './origami';

const meta: Meta<OrigamiComponent> = {
  title: 'Molecules/Origami',
  component: OrigamiComponent,
  tags: ['autodocs'],
};
export default meta;

export const Folded: StoryObj<OrigamiComponent> = { args: { domain: 'tarefas', stage: 0 } };
export const Half: StoryObj<OrigamiComponent> = { args: { domain: 'tarefas', stage: 2 } };
export const Complete: StoryObj<OrigamiComponent> = { args: { domain: 'tarefas', stage: 4 } };
export const Bird: StoryObj<OrigamiComponent> = { args: { domain: 'conversas', stage: 3 } };
export const Heart: StoryObj<OrigamiComponent> = { args: { domain: 'familia', stage: 4 } };
