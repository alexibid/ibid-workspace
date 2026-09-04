import { BehaviourDomainId } from '@domain/models/behaviour-domain';

export interface DomainPool {
  readonly domain: BehaviourDomainId;
  readonly count: number;
  readonly sentences: readonly string[];
}

export const POOLS: readonly DomainPool[] = [
  {
    domain: 'tarefas',
    count: 22,
    sentences: [
      'Pôs a mesa para o jantar',
      'Arrumou os brinquedos sem birra',
      'Lavou os dentes sem eu dizer',
      'Levou o lixo sem reclamar',
      'Fez a cama de manhã',
      'Vestiu-se sozinho',
      'Comeu a sopa toda',
      'Tomou banho sem discutir',
    ],
  },
  {
    domain: 'escola',
    count: 14,
    sentences: [
      'Fez os trabalhos de casa todos',
      'Estudou para o teste de matemática',
      'Leu um livro inteiro esta tarde',
      'A professora elogiou a ficha dele',
      'Leu em voz alta na aula',
    ],
  },
  {
    domain: 'familia',
    count: 11,
    sentences: [
      'Deu um abraço ao irmão',
      'Brincou com a irmã toda a tarde',
      'Foi carinhoso com a avó',
      'Partilhou o lanche com o primo',
    ],
  },
  {
    domain: 'comportamento',
    count: 7,
    sentences: [
      'Esperou pela vez dele com paciência',
      'Respirou e acalmou-se sozinho',
      'Portou-se muito bem no restaurante',
    ],
  },
  {
    domain: 'conversas',
    count: 4,
    sentences: [
      'Contou-me como correu o recreio',
      'Perguntou porque é que chove',
      'Ouviu com atenção o que expliquei',
    ],
  },
];

export const PENDING_SENTENCE = 'Tratou do Bolinhas';

export const CLAUSE_JOINER = ' e ';
