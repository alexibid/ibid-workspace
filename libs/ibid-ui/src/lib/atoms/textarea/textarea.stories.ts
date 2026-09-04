import type { Meta, StoryObj } from '@storybook/angular';
import { TextareaComponent } from './textarea';

const meta: Meta<TextareaComponent> = {
  title: 'Atoms/Textarea',
  component: TextareaComponent,
  tags: ['autodocs'],
};
export default meta;

export const Primary: StoryObj<TextareaComponent> = {
  args: { placeholder: 'Escreve o que aconteceu hoje', rows: 3 },
};

export const Filled: StoryObj<TextareaComponent> = {
  args: { value: 'Pôs a mesa e ajudou a lavar a loiça' },
};
