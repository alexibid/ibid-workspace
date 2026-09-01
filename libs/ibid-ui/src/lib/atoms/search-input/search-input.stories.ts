import type { Meta, StoryObj } from '@storybook/angular';
import { SearchInputComponent } from './search-input';

const meta: Meta<SearchInputComponent> = { component: SearchInputComponent, tags: ['autodocs'] };
export default meta;

export const Empty: StoryObj<SearchInputComponent> = { args: { placeholder: 'Pesquisar descrição, tag...' } };
export const Filled: StoryObj<SearchInputComponent> = { args: { value: 'continente', clearLabel: 'Limpar pesquisa' } };
