export interface FeatureExplanationRow {
  readonly label: string;
  readonly value: string;
}

export type StatTheme = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

export interface StatCardData {
  readonly label: string;
  readonly value: number | string;
  readonly isCurrency?: boolean;
  readonly icon: string;
  readonly theme?: StatTheme;
  readonly useFeatureDisplay?: boolean;
  readonly showInfo?: boolean;
  readonly explanation?: readonly FeatureExplanationRow[];
  readonly explanationTitle?: string;
}
