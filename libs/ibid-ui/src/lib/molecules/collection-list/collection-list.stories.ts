import type { Meta, StoryObj } from '@storybook/angular';
import { CollectionListComponent } from './collection-list';

const meta: Meta<CollectionListComponent> = {
  title: 'Molecules/CollectionList',
  component: CollectionListComponent,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<CollectionListComponent>;

export const Default: Story = {
  args: {
    gap: 'xs'
  }
};
