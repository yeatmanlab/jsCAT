import { AbilityEstimator } from './types';
import { MLEEstimator } from './mle';
import { EAPEstimator } from './eap';

/**
 * The registry of available ability estimators.
 *
 * @remarks
 * This object is the single source of truth for which estimation methods
 * exist. The `EstimationMethod` type, runtime validation, and dispatch are all
 * derived from it. To add a new estimator: create a class implementing
 * `AbilityEstimator` in its own file in `src/estimators/`, then add a single
 * entry here. Do not add dispatch logic anywhere else.
 */
export const ABILITY_ESTIMATORS = {
  mle: new MLEEstimator(),
  eap: new EAPEstimator(),
} as const;

/** The canonical (lowercase) names of all registered ability estimators. */
export type EstimationMethod = keyof typeof ABILITY_ESTIMATORS;

/**
 * An estimation method as provided by the user. Estimation methods are
 * case-insensitive, so this type offers autocomplete on the canonical names
 * while still accepting arbitrary strings (validated at runtime).
 */
export type EstimationMethodInput = EstimationMethod | (string & Record<never, never>);

/**
 * Validate a user-provided estimation method and normalize it to its canonical
 * (lowercase) name.
 *
 * @param {string} method - the user-provided estimation method (case-insensitive)
 * @returns {EstimationMethod} the canonical estimation method name
 * @throws {Error} if the method is not in the registry
 */
export const validateEstimationMethod = (method: string): EstimationMethod => {
  const lowerMethod = method.toLowerCase();
  if (!Object.keys(ABILITY_ESTIMATORS).includes(lowerMethod)) {
    throw new Error('The abilityEstimator you provided is not in the list of valid methods');
  }
  return lowerMethod as EstimationMethod;
};

/**
 * Look up the estimator instance for a validated estimation method.
 *
 * @param {EstimationMethod} method - a canonical estimation method name
 * @returns {AbilityEstimator} the registered estimator
 */
export const getEstimator = (method: EstimationMethod): AbilityEstimator => {
  return ABILITY_ESTIMATORS[method];
};
