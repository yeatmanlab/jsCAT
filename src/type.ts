export type ZetaSymbolic = {
  // Symbolic parameter names
  a: number; // Discrimination (slope of the curve)
  b: number; // Difficulty (location of the curve)
  c: number; // Guessing (lower asymptote)
  d: number; // Slipping (upper asymptote)
};

export interface Zeta {
  // Symbolic parameter names
  a?: number; // Discrimination (slope of the curve)
  b?: number; // Difficulty (location of the curve)
  c?: number; // Guessing (lower asymptote)
  d?: number; // Slipping (upper asymptote)
  // Semantic parameter names
  discrimination?: number;
  difficulty?: number;
  guessing?: number;
  slipping?: number;
}

export interface Stimulus extends Zeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type ZetaCatMap = {
  cats: string[];
  zeta: Zeta;
};

export interface MultiZetaStimulus {
  zetas: ZetaCatMap[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
