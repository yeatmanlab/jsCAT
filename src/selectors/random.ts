import { Stimulus } from '../type';
import { ItemSelector, SelectorContext, SelectorResult } from './types';

/**
 * Random item selection.
 *
 * @remarks
 * Selects a uniformly random item using the Cat's seeded random number
 * generator (via `context.randomInteger`), so simulations with a fixed
 * `randomSeed` are reproducible.
 */
export class RandomSelector implements ItemSelector {
  /**
   * Select a uniformly random stimulus.
   *
   * @param {Stimulus[]} stimuli - the available stimuli
   * @param {SelectorContext} context - provides the seeded random integer generator
   * @returns {SelectorResult} the selected stimulus and the remaining stimuli
   */
  select(stimuli: Stimulus[], context: SelectorContext): SelectorResult {
    const index = context.randomInteger(0, stimuli.length - 1);
    const nextItem = stimuli.splice(index, 1)[0];
    return {
      nextStimulus: nextItem,
      remainingStimuli: stimuli,
    };
  }
}
