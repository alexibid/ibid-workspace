export type StatTheme = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

export interface StatCardData {
  readonly label: string;
  readonly value: number | string;
  readonly isCurrency?: boolean;
  readonly icon: string;
  readonly theme?: StatTheme;
}
