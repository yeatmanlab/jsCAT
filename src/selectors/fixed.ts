import { Stimulus } from '../type';
import { ItemSelector, SelectorResult } from './types';

/**
 * Fixed-order item selection.
 *
 * @remarks
 * Picks the next item in line from the given list of stimuli, preserving the
 * caller's corpus order. Grabs the first item from the list, removes it, and
 * returns it along with the rest of the list.
 */
export class FixedSelector implements ItemSelector {
  /**
   * Select the first stimulus in the list.
   *
   * @param {Stimulus[]} stimuli - the available stimuli, in corpus order
   * @returns {SelectorResult} the first stimulus and the remaining stimuli
   */
  select(stimuli: Stimulus[]): SelectorResult {
    const nextItem = stimuli.shift();
    return {
      nextStimulus: nextItem,
      remainingStimuli: stimuli,
    };
  }
}
