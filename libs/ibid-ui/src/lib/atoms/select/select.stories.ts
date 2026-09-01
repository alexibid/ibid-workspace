import type { Meta, StoryObj } from '@storybook/angular';
import { SelectComponent } from './select';

const meta: Meta<SelectComponent> = { 
  component: SelectComponent, 
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'text',
      description: "Can be 'full', 'fixed', 'content', or a number (px)"
    },
    dropdownWidth: {
      control: 'text',
      description: "Can be 'match-button', 'content', or a number (px)"
    },
    dropdownPosition: {
      control: 'select',
      options: ['top-center', 'top-left', 'top-right', 'bottom-center', 'bottom-left', 'bottom-right']
    }
  }
};
export default meta;
export const Primary: StoryObj<SelectComponent> = {
  args: {
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2 with longer text' },
      { value: '3', label: 'Option 3' }
    ],
    placeholder: 'Select an option',
    size: 'content',
    dropdownWidth: 'match-button',
    dropdownPosition: 'bottom-left'
  }
};
