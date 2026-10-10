import type { Container, Rule } from 'postcss';
import scssSyntax from 'postcss-scss';

export interface ClassDefinition {
  readonly name: string;
  readonly line: number;
  readonly column: number;
}

const CLASS_PATTERN = /\.(-?[_a-zA-Z][\w-]*)/g;

export function parseScssClasses(sourceText: string): readonly ClassDefinition[] {
  const definitions: ClassDefinition[] = [];

  try {
    const root = scssSyntax.parse(sourceText);
    collectFromContainer(root, [], definitions);
  } catch {
    return [];
  }

  return definitions;
}

function collectFromContainer(
  container: Container,
  parentSelectors: readonly string[],
  definitions: ClassDefinition[],
): void {
  container.each((node) => {
    if (node.type === 'rule') {
      collectFromRule(node as Rule, parentSelectors, definitions);
    } else if (node.type === 'atrule' && 'nodes' in node && node.nodes) {
      collectFromContainer(node as unknown as Container, parentSelectors, definitions);
    }
  });
}

function collectFromRule(
  rule: Rule,
  parentSelectors: readonly string[],
  definitions: ClassDefinition[],
): void {
  const resolvedSelectors = resolveSelectors(parentSelectors, splitSelectorList(rule.selector));
  const inheritedClasses = new Set(parentSelectors.flatMap(extractClassNames));
  const line = (rule.source?.start?.line ?? 1) - 1;
  const column = (rule.source?.start?.column ?? 1) - 1;

  const introducedClasses = new Set(
    resolvedSelectors.flatMap(extractClassNames).filter((name) => !inheritedClasses.has(name)),
  );
  introducedClasses.forEach((name) => definitions.push({ name, line, column }));

  collectFromContainer(rule, resolvedSelectors, definitions);
}

function splitSelectorList(selectorList: string): string[] {
  const selectors: string[] = [];
  let depth = 0;
  let current = '';

  for (const character of selectorList) {
    if (character === '(' || character === '[') depth++;
    if (character === ')' || character === ']') depth--;

    if (character === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  selectors.push(current.trim());
  return selectors.filter((selector) => selector.length > 0);
}

function resolveSelectors(
  parentSelectors: readonly string[],
  childSelectors: readonly string[],
): string[] {
  if (parentSelectors.length === 0) {
    return [...childSelectors];
  }

  return parentSelectors.flatMap((parent) =>
    childSelectors.map((child) =>
      child.includes('&') ? child.replace(/&/g, parent) : `${parent} ${child}`,
    ),
  );
}

function extractClassNames(selector: string): string[] {
  return Array.from(selector.matchAll(CLASS_PATTERN), (match) => match[1]);
}
