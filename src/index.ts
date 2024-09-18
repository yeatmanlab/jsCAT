/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { minimize_Powell } from 'optimization-js';
import { cloneDeep } from 'lodash';
import { Stimulus, Zeta } from './type';
import {
  itemResponseFunction,
  fisherInformation,
  normal,
  findClosest,
  validateZetaParams,
  fillZetaDefaults,
} from './utils';
import seedrandom from 'seedrandom';

export const abilityPrior = normal();

export interface CatInput {
  method?: string;
  itemSelect?: string;
  nStartItems?: number;
  startSelect?: string;
  theta?: number;
  minTheta?: number;
  maxTheta?: number;
  prior?: number[][];
  randomSeed?: string | null;
}

export class Cat {
  public method: string;
  public itemSelect: string;
  public minTheta: number;
  public maxTheta: number;
  public prior: number[][];
  private readonly _zetas: Zeta[];
  private readonly _resps: (0 | 1)[];
  private _theta: number;
  private _seMeasurement: number;
  public nStartItems: number;
  public startSelect: string;
  private readonly _rng: ReturnType<seedrandom>;

  /**
   * Create a Cat object. This expects an single object parameter with the following keys
   * @param {{method: string, itemSelect: string, nStartItems: number, startSelect:string, theta: number, minTheta: number, maxTheta: number, prior: number[][]}=} destructuredParam
   *     method: ability estimator, e.g. MLE or EAP, default = 'MLE'
   *     itemSelect: the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
   *     nStartItems: first n trials to keep non-adaptive selection
   *     startSelect: rule to select first n trials
   *     theta: initial theta estimate
   *     minTheta: lower bound of theta
   *     maxTheta: higher bound of theta
   *     prior:  the prior distribution
   *     randomSeed: set a random seed to trace the simulation
   */

  constructor({
    method = 'MLE',
    itemSelect = 'MFI',
    nStartItems = 0,
    startSelect = 'middle',
    theta = 0,
    minTheta = -6,
    maxTheta = 6,
    prior = abilityPrior,
    randomSeed = null,
  }: CatInput = {}) {
    this.method = Cat.validateMethod(method);

    this.itemSelect = Cat.validateItemSelect(itemSelect);

    this.startSelect = Cat.validateStartSelect(startSelect);

    this.minTheta = minTheta;
    this.maxTheta = maxTheta;
    this.prior = prior;
    this._zetas = [];
    this._resps = [];
    this._theta = theta;
    this._seMeasurement = Number.MAX_VALUE;
    this.nStartItems = nStartItems;
    this._rng = randomSeed === null ? seedrandom() : seedrandom(randomSeed);
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
    this.calculateSE();
  }

  private estimateAbilityEAP() {
    let num = 0;
    let nf = 0;
    this.prior.forEach(([theta, probability]) => {
      const like = this.likelihood(theta);
      num += theta * like * probability;
      nf += like * probability;
    });

    return num / nf;
  }

  private estimateAbilityMLE() {
    const theta0 = [0];
    const solution = minimize_Powell(this.negLikelihood.bind(this), theta0);
    let theta = solution.argument[0];
    if (theta > this.maxTheta) {
      theta = this.maxTheta;
    } else if (theta < this.minTheta) {
      theta = this.minTheta;
    }
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
      arr = cloneDeep(stimuli);
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

    stimuliAddFisher.sort((a, b) => b.fisherInformation - a.fisherInformation);
    stimuliAddFisher.forEach((stimulus: Stimulus) => {
      delete stimulus['fisherInformation'];
    });
    return {
      nextStimulus: stimuliAddFisher[0],
      remainingStimuli: stimuliAddFisher.slice(1).sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!),
    };
  }

  private selectorMiddle(arr: Stimulus[]) {
    let index: number;
    if (arr.length < this.nStartItems) {
      index = Math.floor(arr.length / 2);
    } else {
      index =
        Math.floor(arr.length / 2) +
        this.randomInteger(-Math.floor(this.nStartItems / 2), Math.floor(this.nStartItems / 2));
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
    const index = findClosest(arr, this._theta + 0.481);
    const nextItem = arr[index];
    arr.splice(index, 1);
    return {
      nextStimulus: nextItem,
      remainingStimuli: arr,
    };
  }

  private selectorRandom(arr: Stimulus[]) {
    const index = Math.floor(this._rng() * arr.length);
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
