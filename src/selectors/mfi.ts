/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Stimulus } from '../type';
import { fisherInformation } from '../utils';
import { fillZetaDefaults } from '../corpus';
import { ItemSelector, SelectorContext, SelectorResult } from './types';

/**
 * Maximum Fisher Information (MFI) item selection.
 *
 * @remarks
 * Selects the item with the highest Fisher information at the current theta
 * estimate. The remaining stimuli are returned sorted by difficulty so that
 * downstream selectors that require difficulty-sorted input keep working.
 *
 * Reference: Lord, F. M. (1980). Applications of item response theory to
 * practical testing problems. Erlbaum.
 */
export class MFISelector implements ItemSelector {
  /**
   * Select the stimulus with maximum Fisher information at the current theta.
   *
   * @param {Stimulus[]} stimuli - the available stimuli
   * @param {SelectorContext} context - provides the current theta estimate
   * @returns {SelectorResult} the most informative stimulus and the rest, sorted by difficulty
   */
  select(stimuli: Stimulus[], context: SelectorContext): SelectorResult {
    const filledStimuli = stimuli.map((stim) => fillZetaDefaults(stim, 'semantic'));
    const stimuliAddFisher = filledStimuli.map((element: Stimulus) => ({
      fisherInformation: fisherInformation(context.theta, fillZetaDefaults(element, 'symbolic')),
      ...element,
    }));

    stimuliAddFisher.sort((a, b) => b.fisherInformation - a.fisherInformation);
    stimuliAddFisher.forEach((stimulus: Stimulus) => {
      delete stimulus['fisherInformation'];
    });

    return {
      nextStimulus: stimuliAddFisher[0],
      remainingStimuli: stimuliAddFisher.slice(1).sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!),
    };
  }
}
