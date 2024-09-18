/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bs from 'binary-search';
import { MultiZetaStimulus, Stimulus, Zeta, ZetaSymbolic } from './type';
import _intersection from 'lodash/intersection';
import _invert from 'lodash/invert';
import _mapKeys from 'lodash/mapKeys';

export const zetaKeyMap = {
  a: 'discrimination',
  b: 'difficulty',
  c: 'guessing',
  d: 'slipping',
};

export const defaultZeta = (desiredFormat: 'symbolic' | 'semantic' = 'symbolic'): Zeta => {
  const defaultZeta: Zeta = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
  };

  return convertZeta(defaultZeta, desiredFormat);
};

export const validateZetaParams = (zeta: Zeta, requireAll = false): void => {
  if (zeta.a !== undefined && zeta.discrimination !== undefined) {
    throw new Error('This item has both an `a` key and `discrimination` key. Please provide only one.');
  }

  if (zeta.b !== undefined && zeta.difficulty !== undefined) {
    throw new Error('This item has both a `b` key and `difficulty` key. Please provide only one.');
  }

  if (zeta.c !== undefined && zeta.guessing !== undefined) {
    throw new Error('This item has both a `c` key and `guessing` key. Please provide only one.');
  }

  if (zeta.d !== undefined && zeta.slipping !== undefined) {
    throw new Error('This item has both a `d` key and `slipping` key. Please provide only one.');
  }

  if (requireAll) {
    if (zeta.a === undefined && zeta.discrimination === undefined) {
      throw new Error('This item is missing an `a` or `discrimination` key.');
    }

    if (zeta.b === undefined && zeta.difficulty === undefined) {
      throw new Error('This item is missing a `b` or `difficulty` key.');
    }

    if (zeta.c === undefined && zeta.guessing === undefined) {
      throw new Error('This item is missing a `c` or `guessing` key.');
    }

    if (zeta.d === undefined && zeta.slipping === undefined) {
      throw new Error('This item is missing a `d` or `slipping` key.');
    }
  }
};

export const fillZetaDefaults = (zeta: Zeta, desiredFormat: 'symbolic' | 'semantic' = 'symbolic'): Zeta => {
  return {
    ...defaultZeta(desiredFormat),
    ...convertZeta(zeta, desiredFormat),
  };
};

export const convertZeta = (zeta: Zeta, desiredFormat: 'symbolic' | 'semantic'): Zeta => {
  if (!['symbolic', 'semantic'].includes(desiredFormat)) {
    throw new Error(`Invalid desired format. Expected 'symbolic' or'semantic'. Received ${desiredFormat} instead.`);
  }

  return _mapKeys(zeta, (value, key) => {
    if (desiredFormat === 'symbolic') {
      const inverseMap = _invert(zetaKeyMap);
      if (key in inverseMap) {
        return inverseMap[key];
      } else {
        return key;
      }
    } else {
      if (key in zetaKeyMap) {
        return zetaKeyMap[key as keyof typeof zetaKeyMap];
      } else {
        return key;
      }
    }
  });
};

/**
 * calculates the probability that someone with a given ability level theta will answer correctly an item. Uses the 4 parameters logistic model
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} the probability
 */
export const itemResponseFunction = (theta: number, zeta: Zeta) => {
  const _zeta = fillZetaDefaults(zeta, 'symbolic') as ZetaSymbolic;
  return _zeta.c + (_zeta.d - _zeta.c) / (1 + Math.exp(-_zeta.a * (theta - _zeta.b)));
};

/**
 * a 3PL Fisher information function
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} - the expected value of the observed information
 */
export const fisherInformation = (theta: number, zeta: Zeta) => {
  const _zeta = fillZetaDefaults(zeta, 'symbolic') as ZetaSymbolic;
  const p = itemResponseFunction(theta, _zeta);
  const q = 1 - p;
  return Math.pow(_zeta.a, 2) * (q / p) * (Math.pow(p - _zeta.c, 2) / Math.pow(1 - _zeta.c, 2));
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
 * @param stimuli Array<Stimulus> - an array of stimuli sorted by difficulty
 * @param target number - ability estimate
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

export const validateCorpora = (corpus: MultiZetaStimulus[]): void => {
  const zetaCatMapsArray = corpus.map((item) => item.zetas);
  for (const zetaCatMaps of zetaCatMapsArray) {
    const intersection = _intersection(zetaCatMaps);
    if (intersection.length > 0) {
      throw new Error(`The cat names ${intersection.join(', ')} are present in multiple corpora.`);
    }
  }
};
