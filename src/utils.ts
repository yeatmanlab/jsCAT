/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bs from 'binary-search';
import { MultiZetaStimulus, Stimulus, Zeta, ZetaSymbolic } from './type';
import _flatten from 'lodash/flatten';
import _invert from 'lodash/invert';
import _mapKeys from 'lodash/mapKeys';
import _union from 'lodash/union';
import _uniq from 'lodash/uniq';

// TODO: Document this
/**
 * A constant map from the symbolic item parameter names to their semantic
 * counterparts.
 */
export const ZETA_KEY_MAP = {
  a: 'discrimination',
  b: 'difficulty',
  c: 'guessing',
  d: 'slipping',
};

/**
 * Return default item parameters (i.e., zeta)
 *
 * @param {'symbolic' | 'semantic'} desiredFormat - The desired format for the output zeta object.
 * @returns {Zeta} the default zeta object in the specified format.
 */
export const defaultZeta = (desiredFormat: 'symbolic' | 'semantic' = 'symbolic'): Zeta => {
  const defaultZeta: Zeta = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
  };

  return convertZeta(defaultZeta, desiredFormat);
};

/**
 * Validates the item (a.k.a. zeta) parameters, prohibiting redundant keys and
 * optionally requiring all parameters.
 *
 * @param {Zeta} zeta - The zeta parameters to validate.
 * @param {boolean} requireAll - If `true`, ensures that all required keys are present. Default is `false`.
 *
 * @throws {Error} Will throw an error if any of the validation rules are violated.
 */
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
      throw new Error('This item is missing the key `a` or `discrimination`.');
    }

    if (zeta.b === undefined && zeta.difficulty === undefined) {
      throw new Error('This item is missing the key `b` or `difficulty`.');
    }

    if (zeta.c === undefined && zeta.guessing === undefined) {
      throw new Error('This item is missing the key `c` or `guessing`.');
    }

    if (zeta.d === undefined && zeta.slipping === undefined) {
      throw new Error('This item is missing the key `d` or `slipping`.');
    }
  }
};

/**
 * Fills in default zeta parameters for any missing keys in the provided zeta object.
 *
 * @remarks
 * This function merges the provided zeta object with the default zeta object, converting
 * the keys to the desired format if specified. If no desired format is provided, the
 * keys will remain in their original format.
 *
 * @param {Zeta} zeta - The zeta parameters to fill in defaults for.
 * @param {'symbolic' | 'semantic'} desiredFormat - The desired format for the output zeta object. Default is 'symbolic'.
 *
 * @returns A new zeta object with default values filled in for any missing keys,
 *   and converted to the desired format if specified.
 */
export const fillZetaDefaults = (zeta: Zeta, desiredFormat: 'symbolic' | 'semantic' = 'symbolic'): Zeta => {
  return {
    ...defaultZeta(desiredFormat),
    ...convertZeta(zeta, desiredFormat),
  };
};

/**
 * Converts zeta parameters between symbolic and semantic formats.
 *
 * @remarks
 * This function takes a zeta object and a desired format as input. It converts
 * the keys of the zeta object from their current format to the desired format.
 * If the desired format is 'symbolic', the function maps the keys to their
 * symbolic counterparts using the `ZETA_KEY_MAP`. If the desired format is
 * 'semantic', the function maps the keys to their semantic counterparts using
 * the inverse of `ZETA_KEY_MAP`.
 *
 * @param {Zeta} zeta - The zeta parameters to convert.
 * @param {'symbolic' | 'semantic'} desiredFormat - The desired format for the output zeta object. Must be either 'symbolic' or 'semantic'.
 *
 * @throws {Error} - Will throw an error if the desired format is not 'symbolic' or 'semantic'.
 *
 * @returns {Zeta} A new zeta object with keys converted to the desired format.
 */
export const convertZeta = (zeta: Zeta, desiredFormat: 'symbolic' | 'semantic'): Zeta => {
  if (!['symbolic', 'semantic'].includes(desiredFormat)) {
    throw new Error(`Invalid desired format. Expected 'symbolic' or'semantic'. Received ${desiredFormat} instead.`);
  }

  return _mapKeys(zeta, (value, key) => {
    if (desiredFormat === 'symbolic') {
      const inverseMap = _invert(ZETA_KEY_MAP);
      if (key in inverseMap) {
        return inverseMap[key];
      } else {
        return key;
      }
    } else {
      if (key in ZETA_KEY_MAP) {
        return ZETA_KEY_MAP[key as keyof typeof ZETA_KEY_MAP];
      } else {
        return key;
      }
    }
  });
};

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

/**
 * Validates a corpus of multi-zeta stimuli to ensure that no cat names are
 * duplicated.
 *
 * @remarks
 * This function takes an array of `MultiZetaStimulus` objects, where each
 * object represents an item containing item parameters (zetas) associated with
 * different CAT models. The function checks for any duplicate cat names across
 * each item's array of zeta values. It throws an error if any are found.
 *
 * @param {MultiZetaStimulus[]} corpus - An array of `MultiZetaStimulus` objects representing the corpora to validate.
 *
 * @throws {Error} - Throws an error if any duplicate cat names are found across the corpora.
 */
export const checkNoDuplicateCatNames = (corpus: MultiZetaStimulus[]): void => {
  const zetaCatMapsArray = corpus.map((item) => item.zetas);
  for (const zetaCatMaps of zetaCatMapsArray) {
    const cats = zetaCatMaps.map(({ cats }) => cats);

    // Check to see if there are any duplicate names by comparing the union
    // (which removed duplicates) to the flattened array.
    const union = _union(...cats);
    const flattened = _flatten(cats);

    if (union.length !== flattened.length) {
      // If there are duplicates, remove the first occurence of each cat name in
      // the union array from the flattened array. The remaining items in the
      // flattened array should contain the duplicated cat names.
      for (const cat of union) {
        const idx = flattened.findIndex((c) => c === cat);
        if (idx >= 0) {
          flattened.splice(idx, 1);
        }
      }

      throw new Error(`The cat names ${_uniq(flattened).join(', ')} are present in multiple corpora.`);
    }
  }
};

/**
 * Filters a list of multi-zeta stimuli based on the availability of model parameters for a specific CAT.
 *
 * This function takes an array of `MultiZetaStimulus` objects and a `catName` as input. It then filters
 * the items based on whether the specified CAT model parameter is present in the item's zeta values.
 * The function returns an object containing two arrays: `available` and `missing`. The `available` array
 * contains items where the specified CAT model parameter is present, while the `missing` array contains
 * items where the parameter is not present.
 *
 * @param {MultiZetaStimulus[]} items - An array of `MultiZetaStimulus` objects representing the stimuli to filter.
 * @param {string} catName - The name of the CAT model parameter to check for.
 *
 * @returns An object with two arrays: `available` and `missing`.
 *
 * @example
 * ```typescript
 * const items: MultiZetaStimulus[] = [
 *   {
 *     stimulus: 'Item 1',
 *     zetas: [
 *       { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
 *       { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
 *     ],
 *   },
 *   {
 *     stimulus: 'Item 2',
 *     zetas: [
 *       { cats: ['Model B', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } },
 *     ],
 *   },
 * ];
 *
 * const result = filterItemsByCatParameterAvailability(items, 'Model A');
 * console.log(result.available);
 * // Output: [
 * //   {
 * //     stimulus: 'Item 1',
 * //     zetas: [
 * //       { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
 * //       { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
 * //     ],
 * //   },
 * // ]
 * console.log(result.missing);
 * // Output: [
 * //   {
 * //     stimulus: 'Item 2',
 * //     zetas: [
 * //       { cats: ['Model B', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } },
 * //     ],
 * //   },
 * // ]
 * ```
 */
export const filterItemsByCatParameterAvailability = (items: MultiZetaStimulus[], catName: string) => {
  const paramsExist = items.filter((item) => item.zetas.some((zetaCatMap) => zetaCatMap.cats.includes(catName)));
  const paramsMissing = items.filter((item) => !item.zetas.some((zetaCatMap) => zetaCatMap.cats.includes(catName)));

  return {
    available: paramsExist,
    missing: paramsMissing,
  };
};
