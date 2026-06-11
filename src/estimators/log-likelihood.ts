import { Zeta } from '../type';
import { itemResponseFunction } from '../utils';

/**
 * Compute the log-likelihood of a response pattern at a given ability level.
 *
 * @remarks
 * This is the shared likelihood used by all likelihood-based estimators
 * (MLE, EAP, and future additions such as WLE/MAP). It assumes local
 * independence: the log-likelihood is the sum of per-item log probabilities
 * under the 4PL item response function.
 *
 * @param {number} theta - ability estimate at which to evaluate the likelihood
 * @param {Zeta[]} zetas - item parameters for the administered items
 * @param {(0 | 1)[]} resps - responses aligned with `zetas` (1 = correct, 0 = incorrect)
 * @returns {number} the log-likelihood ln L(theta)
 */
export const logLikelihood = (theta: number, zetas: Zeta[], resps: (0 | 1)[]): number => {
  return zetas.reduce((acc, zeta, i) => {
    const probability = itemResponseFunction(theta, zeta);
    return acc + (resps[i] === 1 ? Math.log(probability) : Math.log(1 - probability));
  }, 0);
};
