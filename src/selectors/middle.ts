import { Stimulus } from '../type';
import { ItemSelector, SelectorContext, SelectorResult } from './types';

/**
 * Middle-difficulty item selection.
 *
 * @remarks
 * Selects an item near the middle of the difficulty-sorted stimuli, jittered
 * by up to ±nStartItems/2 positions using the seeded random number generator.
 * This selector is only valid as a `startSelect` rule (for the first
 * `nStartItems` trials), not as an adaptive `itemSelect` rule.
 */
export class MiddleSelector implements ItemSelector {
  /**
   * Select a stimulus near the middle of the difficulty-sorted list.
   *
   * @param {Stimulus[]} stimuli - the available stimuli, sorted by difficulty
   * @param {SelectorContext} context - provides nStartItems and the seeded random integer generator
   * @returns {SelectorResult} the selected stimulus and the remaining stimuli
   */
  select(stimuli: Stimulus[], context: SelectorContext): SelectorResult {
    let index = Math.floor(stimuli.length / 2);

    if (stimuli.length >= context.nStartItems) {
      index += context.randomInteger(-Math.floor(context.nStartItems / 2), Math.floor(context.nStartItems / 2));
    }

    const nextItem = stimuli[index];
    stimuli.splice(index, 1);
    return {
      nextStimulus: nextItem,
      remainingStimuli: stimuli,
    };
  }
}
