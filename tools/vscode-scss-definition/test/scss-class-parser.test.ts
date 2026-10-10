import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseScssClasses } from '../src/scss-class-parser';

const namesOf = (source: string): string[] => parseScssClasses(source).map((d) => d.name);

test('resolves BEM elements and modifiers nested with &', () => {
  const source = `.card {\n  &__title {\n    &--large { color: red; }\n  }\n  &--active {}\n}`;
  assert.deepEqual(namesOf(source).sort(), [
    'card',
    'card--active',
    'card__title',
    'card__title--large',
  ]);
});

test('reports the line of the nested rule', () => {
  const found = parseScssClasses(`.a {\n  &__b {}\n}`).find((d) => d.name === 'a__b');
  assert.equal(found?.line, 1);
});

test('handles comma lists, descendants and parent combinations', () => {
  const source = `.a, .b { .c { &.d {} } }`;
  assert.deepEqual(namesOf(source).sort(), ['a', 'b', 'c', 'd']);
});

test('handles scss features: @media, @include, // comments, interpolation', () => {
  const source = `// note\n.a { @include foo; @media (min-width: 1px) { &__b {} } #{$x} { color: red } }`;
  assert.ok(namesOf(source).includes('a__b'));
});

test('returns nothing for invalid input', () => {
  assert.deepEqual(namesOf('.a { '), []);
});
