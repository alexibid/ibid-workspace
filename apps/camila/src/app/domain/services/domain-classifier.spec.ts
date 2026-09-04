import {
  NEGATED_SAMPLE,
  TOKENISER_EXPECTED,
  TOKENISER_SAMPLE,
  TWO_CLAUSE_EXPECTED,
  TWO_CLAUSE_SAMPLE,
} from '@domain/data/pt/corpus';
import { createLearnedVocabulary } from '@domain/models/vocabulary';
import { contentWords, learn, predictDomains, splitClauses, tokenize } from './domain-classifier';

const NOW = 1_700_000_000_000;

describe('tokenize', () => {
  it('strips accents, punctuation and case', () => {
    expect(tokenize(TOKENISER_SAMPLE)).toEqual(TOKENISER_EXPECTED);
  });
});

describe('splitClauses', () => {
  it('splits on punctuation and on joining words', () => {
    expect(splitClauses(TWO_CLAUSE_SAMPLE)).toEqual(TWO_CLAUSE_EXPECTED);
  });
});

describe('contentWords', () => {
  it('drops stopwords and very short words', () => {
    expect(contentWords('Hoje ele arrumou muito na cozinha')).toEqual(['arrumou', 'cozinha']);
  });
});

describe('predictDomains', () => {
  it('reads a single clear marker', () => {
    expect(predictDomains('Lavou os dentes')).toEqual([{ domain: 'tarefas', points: 3 }]);
  });

  it('reads two domains from one sentence, strongest first', () => {
    const hits = predictDomains('Arrumou os brinquedos e esteve calmo');

    expect(hits.map((hit) => hit.domain)).toEqual(['tarefas', 'comportamento']);
  });

  it('reads nothing when nothing matches', () => {
    expect(predictDomains('Dia tranquilo por aqui')).toEqual([]);
  });

  it('scopes a negation to its own clause', () => {
    expect(predictDomains(NEGATED_SAMPLE)).toEqual([]);
    expect(predictDomains('Nao houve problemas e depois lavou os dentes')).toEqual([
      { domain: 'tarefas', points: 3 },
    ]);
  });

  it('keeps a positive construction that merely reads like a negation', () => {
    expect(predictDomains('Arrumou o quarto sem eu pedir')[0].domain).toBe('tarefas');
  });

  it('never awards more than the cap for one domain', () => {
    const hits = predictDomains('Estudou matematica e leu o livro do caderno na aula');

    expect(hits[0].points).toBeLessThanOrEqual(3);
  });

  it('accepts an empty text without throwing', () => {
    expect(predictDomains('')).toEqual([]);
  });
});

describe('learn', () => {
  it('lets a private rule outrank the shipped vocabulary', () => {
    expect(predictDomains('Tratou do Bolinhas')).toEqual([]);

    const vocabulary = learn(
      createLearnedVocabulary('child-1'),
      'Tratou do Bolinhas',
      ['familia'],
      NOW
    );

    expect(predictDomains('Tratou do Bolinhas', vocabulary.words)[0].domain).toBe('familia');
  });

  it('learns every domain the parent confirmed', () => {
    const vocabulary = learn(
      createLearnedVocabulary('child-1'),
      'Regou as plantas',
      ['tarefas', 'comportamento'],
      NOW
    );

    const domains = predictDomains('Regou as plantas', vocabulary.words).map((hit) => hit.domain);
    expect([...domains].sort()).toEqual(['comportamento', 'tarefas']);
  });

  it('learns nothing from a text with no content words', () => {
    const vocabulary = createLearnedVocabulary('child-1');

    expect(learn(vocabulary, 'e o de', ['tarefas'], NOW)).toBe(vocabulary);
  });

  it('learns nothing when no domain was confirmed', () => {
    const vocabulary = createLearnedVocabulary('child-1');

    expect(learn(vocabulary, 'Regou as plantas', [], NOW)).toBe(vocabulary);
  });
});
