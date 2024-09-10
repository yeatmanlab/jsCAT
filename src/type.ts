export const zetaKeyMap = {
  a: 'discrimination',
  b: 'difficulty',
  c: 'guessing',
  d: 'slipping',
};

export type ZetaImplicit = {
  a: number; // Discrimination (slope of the curve)
  b: number; // Difficulty (location of the curve)
  c: number; // Guessing (lower asymptote)
  d: number; // Slipping (upper asymptote)
};

export type ZetaExplicit = {
  discrimination: number;
  difficulty: number;
  guessing: number;
  slipping: number;
};

export type Zeta = ZetaImplicit | ZetaExplicit;

export interface Stimulus extends ZetaExplicit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
