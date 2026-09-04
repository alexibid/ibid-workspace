import { BEHAVIOUR_DOMAINS } from '@domain/models/behaviour-domain';
import { Rule } from '@domain/models/rule';

export const BOOTSTRAP_THRESHOLDS: readonly number[] = [3, 8, 15, 25];

export const BOOTSTRAP_RULES: readonly Rule[] = BEHAVIOUR_DOMAINS.flatMap((domain) =>
  BOOTSTRAP_THRESHOLDS.map((threshold) => ({ domain, threshold }))
);
