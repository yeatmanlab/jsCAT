import { Stimulus } from '../type';
import { findClosest } from '../utils';
import { ItemSelector, SelectorContext, SelectorResult } from './types';

/**
 * The offset added to theta when selecting the item with the closest difficulty.
 *
 * @remarks
 * For a 3PL item, Fisher information is maximized when the item difficulty is
 * b = theta + ln((1 + sqrt(1 + 8c)) / 2) / a. With guessing c = 0.5 and
 * discrimination a = 1, the offset is ln((1 + sqrt(5)) / 2) ≈ 0.481.
 *
 * Reference: Birnbaum, A. (1968). Some latent trait models. In F. M. Lord &
 * M. R. Novick (Eds.), Statistical theories of mental test scores. Addison-Wesley.
 */
export const CLOSEST_SELECTION_OFFSET = 0.481;

/**
 * Closest-difficulty item selection.
 *
 * @remarks
 * Selects the item whose difficulty is closest to theta + 0.481 (see
 * `CLOSEST_SELECTION_OFFSET`). Requires the input stimuli to be sorted by
 * difficulty; `Cat.findNextItem` guarantees this.
 */
export class ClosestSelector implements ItemSelector {
  /**
   * Select the stimulus with difficulty closest to the offset theta.
   *
   * @param {Stimulus[]} stimuli - the available stimuli, sorted by difficulty
   * @param {SelectorContext} context - provides the current theta estimate
   * @returns {SelectorResult} the closest stimulus and the remaining stimuli
   */
  select(stimuli: Stimulus[], context: SelectorContext): SelectorResult {
    const index = findClosest(stimuli, context.theta + CLOSEST_SELECTION_OFFSET);
    const nextItem = stimuli[index];
    stimuli.splice(index, 1);
    return {
      nextStimulus: nextItem,
      remainingStimuli: stimuli,
    };
  }
}
