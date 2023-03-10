import bs from 'binary-search';
import { Stimulus, Zeta } from './type';

/**
 * calculates the probability that someone with a given ability level theta will answer correctly an item. Uses the 4 parameters logistic model
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} the probability
 */
export const itemResponseFunction = (theta: number, zeta: Zeta) => {
  return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
};

/**
 * a 3PL Fisher information function
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} - the expected value of the observed information
 */
export const fisherInformation = (theta: number, zeta: Zeta) => {
  const p = itemResponseFunction(theta, zeta);
  const q = 1 - p;
  return Math.pow(zeta.a, 2) * (q / p) * (Math.pow(p - zeta.c, 2) / Math.pow(1 - zeta.c, 2));
};

/**
 * return a Gaussian distribution within a given range
 * @param mean
 * @param stdDev
 * @param min
 * @param max
 * @param stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
export const normal = (mean = 0, stdDev = 1, min = -4, max = 4, stepSize = 0.1) => {
  const distribution = [];
  for (let i = min; i <= max; i += stepSize) {
    distribution.push([i, y(i)]);
  }
  return distribution;

  function y(x: number) {
    return (1 / (Math.sqrt(2 * Math.PI) * stdDev)) * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
  }
};

/**
 * find the item in a given array that has the difficulty closest to the target value
 *
 * @remarks
 * The input array of stimuli must be sorted by difficulty.
 *
 * @param arr Array<Stimulus> - an array of stimuli sorted by difficulty
 * @param target number - ability estimate
 * @returns {number} the index of arr
 */
export const findClosest = (arr: Array<Stimulus>, target: number) => {
  // Let's consider the edge cases first
  if (target <= arr[0].difficulty) {
    return 0;
  } else if (target >= arr[arr.length - 1].difficulty) {
    return arr.length - 1;
  }

  const comparitor = (element: Stimulus, needle: number) => {
    return element.difficulty - needle;
  };
  const indexOfTarget = bs(arr, target, comparitor);

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
    const lowDiff = Math.abs(arr[lowIndex].difficulty - target);
    const highDiff = Math.abs(arr[highIndex].difficulty - target);

    if (lowDiff < highDiff) {
      return lowIndex;
    } else {
      return highIndex;
    }
  }
};
