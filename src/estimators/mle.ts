import { AbilityEstimator, EstimationContext } from './types';
import { logLikelihood } from './log-likelihood';
import { maximizeOverTheta } from './optimize';

/**
 * Maximum Likelihood Estimation (MLE) of ability.
 *
 * @remarks
 * Maximizes the log-likelihood ln L(theta) of the observed response pattern
 * under the 4PL model. MLE is unbiased asymptotically but diverges for
 * all-correct or all-incorrect response patterns; in those cases the optimizer
 * runs toward the bound and `Cat` clamps the result to [minTheta, maxTheta].
 *
 * Reference: Lord, F. M. (1980). Applications of item response theory to
 * practical testing problems. Erlbaum.
 */
export class MLEEstimator implements AbilityEstimator {
  /**
   * Estimate ability by maximizing the log-likelihood.
   *
   * @param {EstimationContext} context - The accumulated response history
   * @returns {number} the maximum likelihood theta estimate (unclamped)
   */
  estimateAbility(context: EstimationContext): number {
    const { zetas, resps } = context;
    return maximizeOverTheta((theta) => logLikelihood(theta, zetas, resps));
  }
}
