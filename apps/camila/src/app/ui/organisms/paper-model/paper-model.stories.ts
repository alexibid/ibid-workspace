import type { Meta, StoryObj } from '@storybook/angular';
import { BOX_DINO } from '@domain/data/paper-models';
import { PaperModelComponent } from './paper-model';

const meta: Meta<PaperModelComponent> = {
  title: 'Organisms/Paper Model',
  component: PaperModelComponent,
  tags: ['autodocs'],
};
export default meta;

export const Dino: StoryObj<PaperModelComponent> = {
  args: { model: BOX_DINO, ariaLabel: 'a paper model' },
};
