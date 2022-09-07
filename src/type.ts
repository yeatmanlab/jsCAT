export type Zeta = { a: number; b: number; c: number; d: number };

export interface Stimulus {
  difficulty: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
