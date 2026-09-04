export type BoxDecor = 'face' | 'grin' | 'none';

export interface ModelBox {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly hue: string;
  readonly decor: BoxDecor;
}

export interface ModelSpike {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly size: number;
  readonly hue: string;
}

export interface ModelPrism {
  readonly id: string;
  readonly profile: readonly (readonly [number, number])[];
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly hue: string;
  readonly edge: string;
}

export interface PaperModel {
  readonly id: string;
  readonly nameKey: string;
  readonly span: number;
  readonly boxes: readonly ModelBox[];
  readonly prisms: readonly ModelPrism[];
  readonly spikes: readonly ModelSpike[];
}

const BODY_GREEN = '#93a672';
const JAW_WHITE = '#f2f0e4';
const CREST_RED = '#c8402c';

export const BOX_DINO: PaperModel = {
  id: 'box-dino',
  nameKey: 'modelDino',
  span: 150,
  prisms: [],
  boxes: [
    { id: 'head', x: 0, y: -26, z: 0, width: 62, height: 54, depth: 48, hue: BODY_GREEN, decor: 'face' },
    { id: 'jaw', x: 0, y: 8, z: 7, width: 58, height: 16, depth: 40, hue: JAW_WHITE, decor: 'grin' },
    { id: 'body', x: 0, y: 26, z: -6, width: 40, height: 34, depth: 36, hue: BODY_GREEN, decor: 'none' },
    { id: 'leg-left', x: -13, y: 54, z: 2, width: 15, height: 26, depth: 20, hue: BODY_GREEN, decor: 'none' },
    { id: 'leg-right', x: 13, y: 54, z: 2, width: 15, height: 26, depth: 20, hue: BODY_GREEN, decor: 'none' },
    { id: 'arm-left', x: -26, y: 20, z: 12, width: 9, height: 15, depth: 9, hue: BODY_GREEN, decor: 'none' },
    { id: 'arm-right', x: 26, y: 20, z: 12, width: 9, height: 15, depth: 9, hue: BODY_GREEN, decor: 'none' },
    { id: 'tail', x: 0, y: 30, z: -38, width: 22, height: 18, depth: 34, hue: BODY_GREEN, decor: 'none' },
  ],
  spikes: [
    { id: 'spike-a', x: -18, y: -55, z: 0, size: 15, hue: CREST_RED },
    { id: 'spike-b', x: 0, y: -58, z: 0, size: 18, hue: CREST_RED },
    { id: 'spike-c', x: 18, y: -55, z: 0, size: 15, hue: CREST_RED },
  ],
};

const PET_BODY: readonly (readonly [number, number])[] = [
  [4, 96],
  [40, 78],
  [72, 62],
  [100, 48],
  [124, 34],
  [142, 20],
  [166, 14],
  [194, 26],
  [198, 40],
  [172, 44],
  [156, 52],
  [140, 64],
  [118, 78],
  [92, 88],
  [60, 92],
  [28, 96],
];

const PET_LEG: readonly (readonly [number, number])[] = [
  [104, 74],
  [130, 70],
  [134, 108],
  [152, 128],
  [152, 140],
  [108, 140],
  [114, 108],
  [98, 88],
];

const PET_ARM: readonly (readonly [number, number])[] = [
  [148, 54],
  [164, 50],
  [172, 66],
  [162, 74],
  [152, 68],
  [154, 60],
];

const PET_PALE = '#c3cf94';
const PET_SHADE = '#a8b578';
const PET_EDGE = '#8d6a37';

export const PAPER_PET: PaperModel = {
  id: 'paper-pet',
  nameKey: 'modelPet',
  span: 210,
  boxes: [],
  spikes: [],
  prisms: [
    { id: 'leg-far', profile: PET_LEG, depth: 12, x: -100, y: -75, z: -24, hue: PET_SHADE, edge: PET_EDGE },
    { id: 'body', profile: PET_BODY, depth: 42, x: -100, y: -75, z: 0, hue: PET_PALE, edge: PET_EDGE },
    { id: 'arm', profile: PET_ARM, depth: 9, x: -100, y: -75, z: 27, hue: PET_SHADE, edge: PET_EDGE },
    { id: 'leg-near', profile: PET_LEG, depth: 12, x: -100, y: -75, z: 27, hue: PET_PALE, edge: PET_EDGE },
  ],
};

export const PAPER_MODELS: readonly PaperModel[] = [PAPER_PET, BOX_DINO];
