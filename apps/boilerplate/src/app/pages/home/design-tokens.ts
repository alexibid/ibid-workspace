export interface DesignToken {
  readonly label: string;
  readonly variable: string;
}

export interface DesignTokenGroup {
  readonly id: string;
  readonly title: string;
  readonly tokens: readonly DesignToken[];
}

export const COLOR_GROUPS: readonly DesignTokenGroup[] = [
  {
    id: 'surfaces',
    title: 'Surfaces',
    tokens: [
      { label: 'Background', variable: '--color-bg' },
      { label: 'Background 80%', variable: '--color-bg-opacity80' },
      { label: 'Surface', variable: '--color-surface' },
      { label: 'Surface hover', variable: '--color-surface-hover' },
      { label: 'Border', variable: '--color-border' },
    ],
  },
  {
    id: 'ink',
    title: 'Ink',
    tokens: [
      { label: 'Text', variable: '--color-text' },
      { label: 'Text muted', variable: '--color-text-muted' },
      { label: 'Ink', variable: '--color-ink' },
      { label: 'Primary', variable: '--color-primary' },
      { label: 'Primary hover', variable: '--color-primary-hover' },
    ],
  },
  {
    id: 'coral',
    title: 'Coral',
    tokens: [
      { label: 'Coral background', variable: '--color-coral-bg' },
      { label: 'Coral mid', variable: '--color-coral-mid' },
      { label: 'Coral text', variable: '--color-coral-text' },
    ],
  },
  {
    id: 'amber',
    title: 'Amber',
    tokens: [
      { label: 'Amber background', variable: '--color-amber-bg' },
      { label: 'Amber mid', variable: '--color-amber-mid' },
      { label: 'Amber text', variable: '--color-amber-text' },
    ],
  },
  {
    id: 'teal',
    title: 'Teal',
    tokens: [
      { label: 'Teal background', variable: '--color-teal-bg' },
      { label: 'Teal mid', variable: '--color-teal-mid' },
      { label: 'Teal text', variable: '--color-teal-text' },
    ],
  },
  {
    id: 'pink',
    title: 'Pink',
    tokens: [
      { label: 'Pink background', variable: '--color-pink-bg' },
      { label: 'Pink mid', variable: '--color-pink-mid' },
      { label: 'Pink text', variable: '--color-pink-text' },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    tokens: [
      { label: 'Success', variable: '--color-success' },
      { label: 'Danger', variable: '--color-danger' },
      { label: 'Info', variable: '--color-info' },
    ],
  },
  {
    id: 'glass',
    title: 'Glass',
    tokens: [
      { label: 'Glass', variable: '--color-glass-surface' },
      { label: 'Glass hover', variable: '--color-glass-surface-hover' },
      { label: 'Glass opaque', variable: '--color-glass-surface-opaque' },
      { label: 'Glass strong', variable: '--color-glass-surface-strong' },
    ],
  },
];

export const FONT_FAMILIES: readonly DesignToken[] = [
  { label: 'Sans', variable: '--font-sans' },
  { label: 'Brand', variable: '--font-brand' },
  { label: 'Editorial', variable: '--font-editorial' },
  { label: 'UI', variable: '--font-ui' },
  { label: 'Mono', variable: '--font-mono' },
];

export const TYPE_SCALE: readonly DesignToken[] = [
  { label: '2xs', variable: '--text-2xs' },
  { label: 'xs', variable: '--text-xs' },
  { label: 's', variable: '--text-s' },
  { label: 'caption', variable: '--text-caption' },
  { label: 'm', variable: '--text-m' },
  { label: 'body', variable: '--text-body' },
  { label: 'label', variable: '--text-label' },
  { label: 'base', variable: '--text-base' },
  { label: 'l', variable: '--text-l' },
  { label: 'xl', variable: '--text-xl' },
  { label: '2xl', variable: '--text-2xl' },
  { label: '3xl', variable: '--text-3xl' },
  { label: 'title', variable: '--text-title' },
  { label: '4xl', variable: '--text-4xl' },
  { label: 'number', variable: '--text-number' },
  { label: '5xl', variable: '--text-5xl' },
];

export const FONT_WEIGHTS: readonly DesignToken[] = [
  { label: 'Regular', variable: '--weight-regular' },
  { label: 'Medium', variable: '--weight-medium' },
  { label: 'Semibold', variable: '--weight-semibold' },
  { label: 'Bold', variable: '--weight-bold' },
];

export const LINE_HEIGHTS: readonly DesignToken[] = [
  { label: 'Tight', variable: '--leading-tight' },
  { label: 'Normal', variable: '--leading-normal' },
  { label: 'Body', variable: '--leading-body' },
];
