import { AbilityEstimator, EstimationContext } from './types';
import { logLikelihood } from './log-likelihood';

/**
 * Expected A Posteriori (EAP) estimation of ability.
 *
 * @remarks
 * Computes the mean of the posterior distribution of theta over a quantized
 * prior (`context.prior`), where the posterior is proportional to
 * L(theta) * prior(theta). The prior is constructed and validated by `Cat`
 * from the `priorDist` and `priorPar` constructor options.
 *
 * Reference: Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of
 * ability in a microcomputer environment. Applied Psychological Measurement,
 * 6(4), 431-444.
 */
export class EAPEstimator implements AbilityEstimator {
  /**
   * Estimate ability as the posterior mean over the quantized prior.
   *
   * @param {EstimationContext} context - The accumulated response history and prior
   * @returns {number} the EAP theta estimate (unclamped)
   */
  estimateAbility(context: EstimationContext): number {
    const { zetas, resps, prior } = context;
    let numerator = 0;
    let normalizingFactor = 0;

    for (const [theta, probability] of prior) {
      const likelihood = Math.exp(logLikelihood(theta, zetas, resps));
      numerator += theta * likelihood * probability;
      normalizingFactor += likelihood * probability;
    }

    return numerator / normalizingFactor;
  }
}
