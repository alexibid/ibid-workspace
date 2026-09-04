import { HandDrawnIntensity } from './hand-drawn.directive';

export const MOCK_CORNER_BANDS: Readonly<Record<HandDrawnIntensity, readonly [number, number]>> = {
  1: [0.040, 0.055],
  2: [0.065, 0.085],
  3: [0.095, 0.120],
  4: [0.125, 0.155],
  5: [0.160, 0.200]
};

const SAMPLES_PER_INTENSITY = 12;

export const MOCK_BAND_SAMPLES: readonly HandDrawnIntensity[] = (
  Object.keys(MOCK_CORNER_BANDS) as readonly string[]
).flatMap(key =>
  Array.from({ length: SAMPLES_PER_INTENSITY }, () => Number(key) as HandDrawnIntensity)
);

