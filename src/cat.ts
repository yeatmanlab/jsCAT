/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { minimize_Powell } from 'optimization-js';
import { Stimulus, Zeta } from './type';
import { itemResponseFunction, fisherInformation, normal, uniform } from './utils';
import { validateZetaParams, fillZetaDefaults, ensureZetaNumericValues } from './corpus';
import seedrandom from 'seedrandom';
import _clamp from 'lodash/clamp';
import _cloneDeep from 'lodash/cloneDeep';

export interface CatInput {
  method?: string;
  itemSelect?: string;
  nStartItems?: number;
  startSelect?: string;
  theta?: number;
  minTheta?: number;
  maxTheta?: number;
  priorDist?: string;
  priorPar?: number[];
  randomSeed?: string | null;
  randomesque?: number;
}

export class Cat {
  public method: string;
  public itemSelect: string;
  public minTheta: number;
  public maxTheta: number;
  public priorDist: string;
  public priorPar: number[];
  public randomesque: number;
  private readonly _zetas: Zeta[];
  private readonly _resps: (0 | 1)[];
  private _theta: number;
  private _seMeasurement: number;
  public nStartItems: number;
  public startSelect: string;
  private readonly _rng: ReturnType<seedrandom>;
  private _prior: [number, number][];

  /**
   * Create a Cat object. This expects an single object parameter with the following keys
   * @param {{method: string, itemSelect: string, nStartItems: number, startSelect:string, theta: number, minTheta: number, maxTheta: number, priorDist: string, priorPar: number[], randomSeed: string|null, randomesque: number}=} destructuredParam
   *     method: ability estimator, e.g. MLE or EAP, default = 'MLE'
   *     itemSelect: the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
   *     nStartItems: first n trials to keep non-adaptive selection
   *     startSelect: rule to select first n trials
   *     theta: initial theta estimate
   *     minTheta: lower bound of theta
   *     maxTheta: higher bound of theta
   *     priorDist: the prior distribution type (only applies to EAP estimator)
   *     priorPar: the prior distribution parameters (only applies to EAP estimator)
   *     randomSeed: set a random seed to trace the simulation
   *     randomesque: number of top items to randomly select from in MFI/closest (default = 1, i.e. always pick the best)
   */

  constructor({
    method = 'MLE',
    itemSelect = 'MFI',
    nStartItems = 0,
    startSelect = 'middle',
    theta = 0,
    minTheta = -6,
    maxTheta = 6,
    priorDist = 'norm', // only applies to EAP estimator
    priorPar = priorDist === 'unif' ? [-4, 4] : [0, 1], // only applies to EAP estimator
    randomSeed = null,
    randomesque = 1,
  }: CatInput = {}) {
    this.method = Cat.validateMethod(method);

    this.itemSelect = Cat.validateItemSelect(itemSelect);

    this.startSelect = Cat.validateStartSelect(startSelect);

    this.minTheta = minTheta;
    this.maxTheta = maxTheta;
    this.priorDist = priorDist;
    this.priorPar = priorPar;
    this._zetas = [];
    this._resps = [];
    this._theta = theta;
    this._seMeasurement = Number.MAX_VALUE;
    this.nStartItems = nStartItems;
    this.randomesque = Math.max(1, Math.round(randomesque));
    this._rng = randomSeed === null ? seedrandom() : seedrandom(randomSeed);
    this._prior = this.method === 'eap' ? Cat.validatePrior(priorDist, priorPar, minTheta, maxTheta) : [];
  }

  public get theta() {
    return this._theta;
  }

  public get seMeasurement() {
    return this._seMeasurement;
  }

  /**
   * Return the number of items that have been observed so far.
   */
  public get nItems() {
    return this._resps.length;
  }

  public get resps() {
    return this._resps;
  }

  public get zetas() {
    return this._zetas;
  }

  public get prior() {
    return this._prior;
  }

  private static validatePrior(priorDist: string, priorPar: number[], minTheta: number, maxTheta: number) {
    if (priorDist === 'norm') {
      if (priorPar.length !== 2) {
        throw new Error(`The prior distribution parameters should be an array of two numbers. Received ${priorPar}.`);
      }
      const [mean, sd] = priorPar;
      if (sd <= 0) {
        throw new Error(`Expected a positive prior distribution standard deviation. Received ${sd}`);
      }
      if (mean < minTheta || mean > maxTheta) {
        throw new Error(
          `Expected the prior distribution mean to be between the min and max theta. Received mean: ${mean}, min: ${minTheta}, max: ${maxTheta}`,
        );
      }
      return normal(mean, sd, minTheta, maxTheta);
    } else if (priorDist === 'unif') {
      if (priorPar.length !== 2) {
        throw new Error(`The prior distribution parameters should be an array of two numbers. Received ${priorPar}.`);
      }
      const [minSupport, maxSupport] = priorPar;
      if (minSupport >= maxSupport) {
        throw new Error(
          `The uniform distribution bounds you provided are not valid (min must be less than max). Received min: ${minSupport} and max: ${maxSupport}`,
        );
      }
      if (minSupport < minTheta || maxSupport > maxTheta) {
        throw new Error(
          `The uniform distribution bounds you provided are not within theta bounds. Received minTheta: ${minTheta}, minSupport: ${minSupport}, maxSupport: ${maxSupport}, maxTheta: ${maxTheta}.`,
        );
      }
      return uniform(minSupport, maxSupport, 0.1, minTheta, maxTheta);
    }
    throw new Error(`priorDist must be "unif" or "norm." Received ${priorDist} instead.`);
  }

  private static validateMethod(method: string) {
    const lowerMethod = method.toLowerCase();
    const validMethods: Array<string> = ['mle', 'eap']; // TO DO: add staircase
    if (!validMethods.includes(lowerMethod)) {
      throw new Error('The abilityEstimator you provided is not in the list of valid methods');
    }
    return lowerMethod;
  }

  private static validateItemSelect(itemSelect: string) {
    const lowerItemSelect = itemSelect.toLowerCase();
    const validItemSelect: Array<string> = ['mfi', 'random', 'closest', 'fixed'];
    if (!validItemSelect.includes(lowerItemSelect)) {
      throw new Error('The itemSelector you provided is not in the list of valid methods');
    }
    return lowerItemSelect;
  }

  private static validateStartSelect(startSelect: string) {
    const lowerStartSelect = startSelect.toLowerCase();
    const validStartSelect: Array<string> = ['random', 'middle', 'fixed']; // TO DO: add staircase
    if (!validStartSelect.includes(lowerStartSelect)) {
      throw new Error('The startSelect you provided is not in the list of valid methods');
    }
    return lowerStartSelect;
  }

  /**
   * use previous response patterns and item params to calculate the estimate ability based on a defined method
   * @param zeta - last item param
   * @param answer - last response pattern
   * @param method
   */
  public updateAbilityEstimate(zeta: Zeta | Zeta[], answer: (0 | 1) | (0 | 1)[], method: string = this.method) {
    method = Cat.validateMethod(method);

    zeta = Array.isArray(zeta) ? zeta : [zeta];
    answer = Array.isArray(answer) ? answer : [answer];

    // Ensure zeta parameters are numbers to prevent string concatenation issues
    zeta = zeta.map((z) => ensureZetaNumericValues(z));
    zeta.forEach((z) => validateZetaParams(z, true));

    if (zeta.length !== answer.length) {
      throw new Error('Unmatched length between answers and item params');
    }
    this._zetas.push(...zeta);
    this._resps.push(...answer);

    if (method === 'eap') {
      this._theta = this.estimateAbilityEAP();
    } else if (method === 'mle') {
      this._theta = this.estimateAbilityMLE();
    }
    this._theta = _clamp(this._theta, this.minTheta, this.maxTheta);
    this.calculateSE();
  }

  private estimateAbilityEAP() {
    let num = 0;
    let nf = 0;
    this._prior.forEach(([theta, probability]) => {
      const like = Math.exp(this.likelihood(theta)); // Convert back to probability
      num += theta * like * probability;
      nf += like * probability;
    });

    return num / nf;
  }

  private estimateAbilityMLE() {
    const theta0 = [0];
    const solution = minimize_Powell(this.negLikelihood.bind(this), theta0);
    const theta = solution.argument[0];
    return theta;
  }

  private negLikelihood(thetaArray: Array<number>) {
    return -this.likelihood(thetaArray[0]);
  }

  private likelihood(theta: number) {
    return this._zetas.reduce((acc, zeta, i) => {
      const irf = itemResponseFunction(theta, zeta);
      return this._resps[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
    }, 1);
  }

  /**
   * calculate the standard error of ability estimation
   */
  private calculateSE() {
    const sum = this._zetas.reduce((previousValue, zeta) => previousValue + fisherInformation(this._theta, zeta), 0);
    this._seMeasurement = 1 / Math.sqrt(sum);
  }

  /**
   * find the next available item from an input array of stimuli based on a selection method
   *
   * remainingStimuli is sorted by fisher information to reduce the computation complexity for future item selection
   * @param stimuli - an array of stimulus
   * @param itemSelect - the item selection method
   * @param deepCopy - default deepCopy = true
   * @returns {nextStimulus: Stimulus, remainingStimuli: Array<Stimulus>}
   */
  public findNextItem(stimuli: Stimulus[], itemSelect: string = this.itemSelect, deepCopy = true) {
    let arr: Array<Stimulus>;
    let selector = Cat.validateItemSelect(itemSelect);
    if (deepCopy) {
      arr = _cloneDeep(stimuli);
    } else {
      arr = stimuli;
    }

    arr = arr.map((stim) => fillZetaDefaults(stim, 'semantic'));

    if (this.nItems < this.nStartItems) {
      selector = this.startSelect;
    }
    if (selector !== 'mfi' && selector !== 'fixed') {
      // for mfi, we sort the arr by fisher information in the private function to select the best item,
      // and then sort by difficulty to return the remainingStimuli
      // for fixed, we want to keep the corpus order as input
      arr.sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!);
    }

    if (selector === 'middle') {
      // middle will only be used in startSelect
      return this.selectorMiddle(arr);
    } else if (selector === 'closest') {
      return this.selectorClosest(arr);
    } else if (selector === 'random') {
      return this.selectorRandom(arr);
    } else if (selector === 'fixed') {
      return this.selectorFixed(arr);
    } else {
      return this.selectorMFI(arr);
    }
  }

  private selectorMFI(inputStimuli: Stimulus[]) {
    const stimuli = inputStimuli.map((stim) => fillZetaDefaults(stim, 'semantic'));
    const stimuliAddFisher = stimuli.map((element: Stimulus) => ({
      fisherInformation: fisherInformation(this._theta, fillZetaDefaults(element, 'symbolic')),
      ...element,
    }));

    if (stimuliAddFisher.length === 0) {
      return { nextStimulus: undefined as unknown as Stimulus, remainingStimuli: [] as Stimulus[] };
    }

    stimuliAddFisher.sort((a, b) => b.fisherInformation - a.fisherInformation);

    // Randomesque: pick randomly from the top-K items by Fisher information
    const nrIt = Math.min(this.randomesque, stimuliAddFisher.length);
    const threshold = stimuliAddFisher[nrIt - 1].fisherInformation;
    const topK = stimuliAddFisher.filter((s) => s.fisherInformation >= threshold);
    const pickIndex = this.randomInteger(0, topK.length - 1);
    const picked = topK[pickIndex];

    const remaining = stimuliAddFisher.filter((s) => s !== picked);
    remaining.forEach((stimulus: Stimulus) => {
      delete stimulus['fisherInformation'];
    });
    delete (picked as Stimulus)['fisherInformation'];

    return {
      nextStimulus: picked as Stimulus,
      remainingStimuli: remaining.sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!),
    };
  }

  private selectorMiddle(arr: Stimulus[]) {
    let index: number;
    index = Math.floor(arr.length / 2);

    if (arr.length >= this.nStartItems) {
      index += this.randomInteger(-Math.floor(this.nStartItems / 2), Math.floor(this.nStartItems / 2));
    }

    const nextItem = arr[index];
    arr.splice(index, 1);
    return {
      nextStimulus: nextItem,
      remainingStimuli: arr,
    };
  }

  private selectorClosest(arr: Stimulus[]) {
    //findClosest requires arr is sorted by difficulty
    if (arr.length === 0) {
      return { nextStimulus: undefined as unknown as Stimulus, remainingStimuli: [] as Stimulus[] };
    }
    // Compute distances from target for randomesque support
    const target = this._theta + 0.481;
    const distances = arr.map((s, i) => ({ index: i, dist: Math.abs(s.difficulty! - target) }));
    distances.sort((a, b) => a.dist - b.dist);

    const nrIt = Math.min(this.randomesque, distances.length);
    const threshold = distances[nrIt - 1].dist;
    const topK = distances.filter((d) => d.dist <= threshold);
    const pick = topK[this.randomInteger(0, topK.length - 1)];

    const nextItem = arr[pick.index];
    arr.splice(pick.index, 1);
    return {
      nextStimulus: nextItem,
      remainingStimuli: arr,
    };
  }

  private selectorRandom(arr: Stimulus[]) {
    const index = this.randomInteger(0, arr.length - 1);
    const nextItem = arr.splice(index, 1)[0];
    return {
      nextStimulus: nextItem,
      remainingStimuli: arr,
    };
  }

  /**
   * Picks the next item in line from the given list of stimuli.
   * It grabs the first item from the list, removes it, and then returns it along with the rest of the list.
   *
   * @param arr - The list of stimuli to choose from.
   * @returns {Object} - An object with the next item and the updated list.
   * @returns {Stimulus} return.nextStimulus - The item that was picked from the list.
   * @returns {Stimulus[]} return.remainingStimuli - The list of what's left after picking the item.
   */
  private selectorFixed(arr: Stimulus[]) {
    const nextItem = arr.shift();
    return {
      nextStimulus: nextItem,
      remainingStimuli: arr,
    };
  }

  /**
   * return a random integer between min and max
   * @param min - The minimum of the random number range (include)
   * @param max - The maximum of the random number range (include)
   * @returns {number} - random integer within the range
   */
  private randomInteger(min: number, max: number) {
    return Math.floor(this._rng() * (max - min + 1)) + min;
  }
}
