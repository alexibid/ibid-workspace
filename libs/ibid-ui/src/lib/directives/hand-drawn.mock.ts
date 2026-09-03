import { HandDrawnIntensity } from './hand-drawn.directive';

export const MOCK_CORNER_BANDS: Readonly<Record<HandDrawnIntensity, readonly [number, number]>> = {
  1: [10, 14],
  2: [15, 20],
  3: [21, 26],
  4: [27, 34],
  5: [35, 46]
};

const SAMPLES_PER_INTENSITY = 12;

export const MOCK_BAND_SAMPLES: readonly HandDrawnIntensity[] = (
  Object.keys(MOCK_CORNER_BANDS) as readonly string[]
).flatMap(key =>
  Array.from({ length: SAMPLES_PER_INTENSITY }, () => Number(key) as HandDrawnIntensity)
);
