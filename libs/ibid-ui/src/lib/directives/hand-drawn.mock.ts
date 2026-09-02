import { HandDrawnIntensity } from './hand-drawn.directive';

export const MOCK_CORNER_BANDS: Readonly<Record<HandDrawnIntensity, readonly [number, number]>> = {
  1: [7, 10],
  2: [12, 16],
  3: [18, 22],
  4: [24, 29],
  5: [31, 38]
};

const SAMPLES_PER_INTENSITY = 12;

export const MOCK_BAND_SAMPLES: readonly HandDrawnIntensity[] = (
  Object.keys(MOCK_CORNER_BANDS) as readonly string[]
).flatMap(key =>
  Array.from({ length: SAMPLES_PER_INTENSITY }, () => Number(key) as HandDrawnIntensity)
);
