import type { Meta, StoryObj } from '@storybook/angular';
import { SearchableSelectComponent } from './searchable-select';

const meta: Meta<SearchableSelectComponent> = {
  component: SearchableSelectComponent,
  tags: ['autodocs']
};

export default meta;

export const Primary: StoryObj<SearchableSelectComponent> = {
  args: {
    value: 'supermarket',
    label: 'Supermercado',
    color: '#10b981',
    options: [
      { value: 'supermarket', label: 'Supermercado', color: '#10b981' },
      { value: 'restaurants', label: 'Restaurantes', color: '#f59e0b' },
      { value: 'transport', label: 'Transportes', color: '#3b82f6' }
    ],
    groups: [
      {
        title: 'Projetos',
        mode: 'checkbox',
        options: [
          { value: 'p1', label: 'Férias de Verão', selected: false },
          { value: 'p2', label: 'Remodelação Casa', selected: true }
        ]
      }
    ],
    showCreateOption: true,
    createOptionLabel: '+ Nova Categoria...'
  }
};
