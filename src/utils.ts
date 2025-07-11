/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bs from 'binary-search';
import { Stimulus, Zeta, ZetaSymbolic } from './type';
import { fillZetaDefaults } from './corpus';
import _range from 'lodash/range';

/**
 * Calculates the probability that someone with a given ability level theta will
 * answer correctly an item. Uses the 4 parameters logistic model
 *
 * @param {number} theta - ability estimate
 * @param {Zeta} zeta - item params
 * @returns {number} the probability
 */
export const itemResponseFunction = (theta: number, zeta: Zeta) => {
  const _zeta = fillZetaDefaults(zeta, 'symbolic') as ZetaSymbolic;
  return _zeta.c + (_zeta.d - _zeta.c) / (1 + Math.exp(-_zeta.a * (theta - _zeta.b)));
};

/**
 * A 3PL Fisher information function
 *
 * @param {number} theta - ability estimate
 * @param {Zeta} zeta - item params
 * @returns {number} - the expected value of the observed information
 */
export const fisherInformation = (theta: number, zeta: Zeta) => {
  const _zeta = fillZetaDefaults(zeta, 'symbolic') as ZetaSymbolic;
  const p = itemResponseFunction(theta, _zeta);
  const q = 1 - p;
  return Math.pow(_zeta.a, 2) * (q / p) * (Math.pow(p - _zeta.c, 2) / Math.pow(1 - _zeta.c, 2));
};

/**
 * Return a Gaussian distribution within a given range
 *
 * @param {number} mean
 * @param {number} stdDev
 * @param {number} min
 * @param {number} max
 * @param {number} stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
export const normal = (mean = 0, stdDev = 1, min = -4, max = 4, stepSize = 0.1): Array<[number, number]> => {
  const x = _range(min, max + stepSize, stepSize);

  function y(x: number) {
    return (1 / (Math.sqrt(2 * Math.PI) * stdDev)) * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
  }

  return x.map((x) => [Math.round(x * 1000000) / 1000000, y(x)]);
};

/**
 * Return a uniform distribution within a given range
 *
 * @param {number} min - lower bound of the uniform distribution
 * @param {number} max - upper bound of the uniform distribution
 * @param {number} stepSize - the quantization (step size) of the internal table, default = 0.1
 * @param {number} fullMin - full range minimum (defaults to min)
 * @param {number} fullMax - full range maximum (defaults to max)
 * @returns {Array<[number, number]>} - a uniform distribution
 */

export const uniform = (
  min = -4, max = 4, stepSize = 0.1,
  fullMin?: number, fullMax?: number
): Array<[number, number]> => {
  const actualMin = fullMin ?? min;
  const actualMax = fullMax ?? max;

  // Create the grid with rounding
  const x = _range(actualMin, actualMax + stepSize / 2, stepSize).map(n =>
    _round(n, 6)
  );
  
  const support = x.filter(theta => theta >= min && theta <= max);
  const probabilityMass = 1 / support.length;

  return x.map(theta => [
    theta,
    theta >= min && theta <= max ? probabilityMass : 0
  ]);
};

/**
 * Find the item in a given array that has the difficulty closest to the target value
 *
 * @remarks
 * The input array of stimuli must be sorted by difficulty.
 *
 * @param {Stimulus[]} inputStimuli - an array of stimuli sorted by difficulty
 * @param {number} target - ability estimate
 * @returns {number} the index of stimuli
 */
export const findClosest = (inputStimuli: Array<Stimulus>, target: number) => {
  const stimuli = inputStimuli.map((stim) => fillZetaDefaults(stim, 'semantic'));
  // Let's consider the edge cases first
  if (target <= stimuli[0].difficulty!) {
    return 0;
  } else if (target >= stimuli[stimuli.length - 1].difficulty!) {
    return stimuli.length - 1;
  }

  const comparitor = (element: Stimulus, needle: number) => {
    return element.difficulty! - needle;
  };
  const indexOfTarget = bs(stimuli, target, comparitor);

  if (indexOfTarget >= 0) {
    // `bs` returns a positive integer index if it found an exact match.
    return indexOfTarget;
  } else {
    // If the value is not in the array, then -(index + 1) is returned, where
    // index is where the value should be inserted into the array to maintain
    // sorted order. Thus, the target is between the values at
    const lowIndex = -2 - indexOfTarget;
    const highIndex = -1 - indexOfTarget;

    // So we simply compare the differences between the target and the high and
    // low values, respectively
    const lowDiff = Math.abs(stimuli[lowIndex].difficulty! - target);
    const highDiff = Math.abs(stimuli[highIndex].difficulty! - target);

    if (lowDiff < highDiff) {
      return lowIndex;
    } else {
      return highIndex;
    }
  }
};
