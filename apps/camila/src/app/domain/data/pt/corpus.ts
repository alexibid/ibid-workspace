import { BehaviourDomainId } from '@domain/models/behaviour-domain';

export interface CorpusCase {
  readonly text: string;
  readonly domains: readonly BehaviourDomainId[];
}

export const CLASSIFIER_CORPUS: readonly CorpusCase[] = [
  { text: 'Esperou pela vez dele com paciência', domains: ['comportamento'] },
  { text: 'Respirou e acalmou-se sozinho', domains: ['comportamento', 'tarefas'] },
  { text: 'Portou-se muito bem no restaurante', domains: ['comportamento'] },

  { text: 'Pôs a mesa para o jantar', domains: ['tarefas', 'familia'] },
  { text: 'Arrumou os brinquedos sem birra', domains: ['tarefas', 'comportamento'] },
  { text: 'Lavou os dentes sem eu dizer', domains: ['tarefas'] },
  { text: 'Fez a cama de manhã', domains: ['tarefas'] },

  { text: 'Fez os trabalhos de casa todos', domains: ['escola'] },
  { text: 'Estudou para o teste de matemática', domains: ['escola'] },
  { text: 'A professora elogiou a ficha dele', domains: ['escola'] },

  { text: 'Contou-me como correu o recreio', domains: ['conversas'] },
  { text: 'Perguntou porque é que chove', domains: ['conversas'] },
  { text: 'Ouviu com atenção o que expliquei', domains: ['conversas'] },

  { text: 'Deu um abraço ao irmão', domains: ['familia'] },
  { text: 'Brincou com a irmã toda a tarde', domains: ['familia'] },
  { text: 'Foi carinhoso com a avó', domains: ['familia'] },
];

export const UNDECIDED_CORPUS: readonly string[] = [
  'Correu tudo bem',
  'Dia normal',
  'Não esteve calmo',
  'Nunca lavou os dentes',
  'Hoje foi complicado',
];

export const TOKENISER_SAMPLE = 'Pôs a mesa, sozinho!';

export const TOKENISER_EXPECTED: readonly string[] = ['pos', 'a', 'mesa', 'sozinho'];

export const TWO_CLAUSE_SAMPLE = 'Pôs a mesa e leu um livro';

export const TWO_CLAUSE_EXPECTED: readonly string[] = ['pos a mesa', 'leu um livro'];

export const NEGATED_SAMPLE = 'Não lavou os dentes';

export const ENTRY_SAMPLE = 'Pôs a mesa';
