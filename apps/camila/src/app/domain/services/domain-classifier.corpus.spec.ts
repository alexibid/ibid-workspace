import { CLASSIFIER_CORPUS, UNDECIDED_CORPUS } from '@domain/data/pt/corpus';
import { predictDomains } from './domain-classifier';

describe('the shipped vocabulary over the reference corpus', () => {
  for (const example of CLASSIFIER_CORPUS) {
    it(`reads "${example.text}" as ${example.domains.join(' + ')}`, () => {
      const domains = predictDomains(example.text).map((hit) => hit.domain);

      expect([...domains].sort()).toEqual([...example.domains].sort());
    });

    it(`leads "${example.text}" with ${example.domains[0]}`, () => {
      expect(predictDomains(example.text)[0].domain).toBe(example.domains[0]);
    });
  }

  for (const text of UNDECIDED_CORPUS) {
    it(`reads nothing into "${text}"`, () => {
      expect(predictDomains(text)).toEqual([]);
    });
  }
});
