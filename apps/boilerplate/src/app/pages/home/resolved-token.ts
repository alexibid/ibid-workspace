import { DesignToken } from './design-tokens';

export interface ResolvedToken extends DesignToken {
  readonly value: string;
  readonly reference: string;
}

export interface ResolvedTokenGroup {
  readonly id: string;
  readonly title: string;
  readonly tokens: readonly ResolvedToken[];
}
