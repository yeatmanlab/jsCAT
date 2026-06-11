import { minimize_Powell } from 'optimization-js';

/**
 * The starting point for the one-dimensional theta search.
 *
 * @remarks
 * TODO: Consider seeding the search with the current theta estimate instead of
 * a fixed start. Powell's method is a local optimizer, and 3PL/4PL likelihoods
 * can be multimodal; a fixed start at 0 is the historical behavior.
 */
export const THETA_SEARCH_START = 0;

/**
 * Maximize a one-dimensional objective function over theta.
 *
 * @remarks
 * Shared optimizer scaffolding for estimators that maximize an objective
 * (e.g., the log-likelihood for MLE, or a penalized log-likelihood for WLE).
 * Internally negates the objective and runs Powell's method, which searches
 * unbounded; `Cat` clamps the result to [minTheta, maxTheta] afterward.
 *
 * @param {(theta: number) => number} objective - the function of theta to maximize
 * @returns {number} the theta value that maximizes the objective
 */
export const maximizeOverTheta = (objective: (theta: number) => number): number => {
  const solution = minimize_Powell((thetaArray: number[]) => -objective(thetaArray[0]), [THETA_SEARCH_START]);
  return solution.argument[0];
};
