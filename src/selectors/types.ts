import { Stimulus } from '../type';

/**
 * Everything an item selector may consult when choosing the next item.
 *
 * @remarks
 * The context is assembled by `Cat.findNextItem`. The `randomInteger` function
 * is backed by the Cat's seeded random number generator so that simulations
 * remain reproducible; selectors must use it instead of `Math.random()`.
 */
export interface SelectorContext {
  /** The current ability estimate */
  theta: number;
  /** The number of non-adaptive start items configured on the Cat */
  nStartItems: number;
  /** Seeded random integer generator: returns an integer in [min, max] (both inclusive) */
  randomInteger: (min: number, max: number) => number;
}

/** The result of an item selection. */
export interface SelectorResult {
  /** The selected stimulus, or `undefined` if the input array was empty */
  nextStimulus: Stimulus | undefined;
  /** The remaining stimuli after removing the selected one */
  remainingStimuli: Stimulus[];
}

/**
 * The interface every item selector must implement.
 *
 * @remarks
 * Implementations live in `src/selectors/`, one file per selector, and are
 * registered in `src/selectors/registry.ts`. Selectors may mutate the input
 * array; `Cat.findNextItem` deep-copies the caller's array by default before
 * dispatching. See CONTRIBUTING.md for a step-by-step guide to adding a new
 * selector.
 */
export interface ItemSelector {
  /**
   * Select the next item from the available stimuli.
   *
   * @param {Stimulus[]} stimuli - the available stimuli, with zeta defaults already filled in.
   *   Sorted by difficulty for all selectors except `mfi` (which sorts internally by
   *   Fisher information) and `fixed` (which preserves the caller's order).
   * @param {SelectorContext} context - the current Cat state relevant to selection
   * @returns {SelectorResult} the selected stimulus and the remaining stimuli
   */
  select(stimuli: Stimulus[], context: SelectorContext): SelectorResult;
}
