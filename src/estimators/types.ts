import { Zeta } from '../type';

/**
 * Everything an ability estimator may consult when producing a theta estimate.
 *
 * @remarks
 * The context is assembled by `Cat.updateAbilityEstimate` from the accumulated
 * response history. Estimators must treat it as read-only.
 */
export interface EstimationContext {
  /** Item parameters (zetas) for all administered items, in administration order */
  zetas: Zeta[];
  /** Responses to the administered items (1 = correct, 0 = incorrect), aligned with `zetas` */
  resps: (0 | 1)[];
  /** Lower bound of theta. `Cat` clamps the returned estimate to [minTheta, maxTheta]. */
  minTheta: number;
  /** Upper bound of theta. `Cat` clamps the returned estimate to [minTheta, maxTheta]. */
  maxTheta: number;
  /**
   * Quantized prior distribution as [theta, probability] pairs.
   * Populated only when the Cat was constructed with a Bayesian estimator (e.g., EAP);
   * empty array otherwise.
   */
  prior: [number, number][];
}

/**
 * The interface every ability estimator must implement.
 *
 * @remarks
 * Implementations live in `src/estimators/`, one file per estimator, and are
 * registered in `src/estimators/registry.ts`. See CONTRIBUTING.md for a
 * step-by-step guide to adding a new estimator.
 */
export interface AbilityEstimator {
  /**
   * Estimate the examinee's ability (theta) from the response history.
   *
   * @param {EstimationContext} context - The accumulated response history and configuration
   * @returns {number} the theta estimate (unclamped; `Cat` applies the [minTheta, maxTheta] bounds)
   */
  estimateAbility(context: EstimationContext): number;
}
