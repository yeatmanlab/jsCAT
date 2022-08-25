import { minimize_Powell } from 'optimization-js';
import { cloneDeep } from 'lodash';
import {Stimulus, Zeta} from './type';
import {itemResponseFunction, fisherInformation, normal} from './utils';

export const abilityPrior = normal();

export class Cat {
  public method: string;
  public itemSelect: string;
  public minTheta: number;
  public maxTheta: number;
  public prior: number[][];
  public zetas: Zeta[];
  public answers: (0|1)[];
  private _theta: number;
  private _seMeasurement: number;
  public nStartItems: number;
  public startSelect: string;
 // TO DO: add zetas, answers, and se, nItems to private
  /**
   *
   * @param method - ability estimator, e.g. MLE or EAP, default = 'MLE'
   * @param itemSelect - the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
   * @param minTheta - lower bound of theta
   * @param maxTheta - higher bound of theta
   * @param theta - initial theta estimate
   * @param prior - the prior distribution
   * @param nStartItems - first n trials to keep non-adaptive selection
   * @param startSelect - rule to select first n trials
   */
  constructor(method = 'MLE',
              itemSelect: 'MFI',
              theta = 0,
              minTheta = -4,
              maxTheta = 4,
              prior = abilityPrior,
              nStartItems = 0,
              startSelect = 'middle') {

    this.method = Cat.validateMethod(method);

    this.itemSelect = Cat.validateItemSelect(itemSelect);

    this.minTheta = minTheta;
    this.maxTheta = maxTheta;
    this.prior = prior;
    this.zetas = [];
    this.answers = [];
    this._theta = theta;
    this._seMeasurement = Infinity;
    this.nStartItems = nStartItems;
    this.startSelect = startSelect;
  }

  public get theta() {
    return this._theta;
  }

  public get seMeasurement () {
    return this._seMeasurement;
  }

  public get nItems () {
    return this.answers.length;
  }

  private static validateMethod(method: string){
    const lowerMethod = method.toLowerCase();
    const validMethods: Array<string> = ['mle', 'eap']; // TO DO: add staircase
    if (!validMethods.includes(lowerMethod)) {
      throw new Error('The abilityEstimator you provided is not in the list of valid methods');
    }
    return lowerMethod
  }

  private static validateItemSelect(itemSelect: string){
    const lowerItemSelect = itemSelect.toLowerCase();
    const validItemSelect: Array<string> = ['mfi', 'random', 'closest'];
    if (!validItemSelect.includes(lowerItemSelect)) {
      throw new Error('The itemSelector you provided is not in the list of valid methods');
    }
    return lowerItemSelect
  }

  // TO DO: add validate startSelect ("random" or "middle") in the constructor

  /**
   * use previous response patterns and item params to calculate the estimate ability based on a defined method
   * @param answer - last response pattern
   * @param zeta - last item param
   * @param method
   * @returns {number} - the estimate ability based on an estimation method
   */
  public updateAbilityEstimate(
      zeta: Zeta | Zeta[],
      answer: (0 | 1) | (0 | 1)[],
      method: string = this.method
  ) {
    method = Cat.validateMethod(method);

    zeta = Array.isArray(zeta) ? zeta : [zeta];
    this.zetas.push(...zeta);

    answer = Array.isArray(answer) ? answer : [answer];
    this.answers.push(...answer);

    if (zeta.length !== answer.length) {
      throw new Error('Unmatched length between answers and item params');
    }
    if (method === 'eap') {
      this._theta = this.estimateAbilityEAP();
    } else if (method === 'mle') {
      this._theta = this.estimateAbilityMLE();
    }
    this.calculateSE();
    return this._theta;
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
    const solution = minimize_Powell(this.negLikelihood, theta0);

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
    return this.zetas.reduce((acc, zeta, i) => {
      const irf = itemResponseFunction(theta, zeta);
      return this.answers[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
      }, 1);
  }

  /**
   * calculate the standard error of ability estimation
   */
  private calculateSE() {
    const sum = this.zetas.reduce((previousValue, zeta) =>
        previousValue + fisherInformation(this._theta, zeta), 0
    );
    this._seMeasurement = 1 / Math.sqrt(sum);
  }


  // TO DO: split conditions to small functions

  /**
   * find the next available item from an input array of stimuli based on a selection method
   * @param stimuli - an array of stimulus
   * @param deepCopy - default deepCopy = true
   * @param itemSelect -
   * @returns {nextStimulus: Stimulus,
            remainingStimuli: Array<Stimulus>}
   */
  public findNextItem(stimuli: Stimulus[], deepCopy: boolean = true, itemSelect: string = this.itemSelect) {
    let arr: Array<Stimulus>;
    let selector = Cat.validateItemSelect(itemSelect);
    if (deepCopy) {
      arr = cloneDeep(stimuli);
    } else {
      arr = stimuli;
    }
    arr.sort((a: Stimulus, b: Stimulus) => a.difficulty - b.difficulty);
    if (this.nItems <= this.nStartItems) {
      selector = this.startSelect
    }
    if (selector === 'mfi') {
      const stimuliAddFisher = arr.map((element) => ({
        fisherInformation: fisherInformation(this._theta, {a: 1, b: element.difficulty, c: 0.5, d: 1}),
        ...element,
      }));
      stimuliAddFisher.sort((a, b) => b.fisherInformation - a.fisherInformation);
      stimuliAddFisher.forEach((stimulus: Stimulus) => {
        delete stimulus['fisherInformation'];
      });
      return {
        nextStimulus: stimuliAddFisher[0],
        remainingStimuli: stimuliAddFisher.slice(1),
      };
    } else if (selector === 'middle') { // middle will only be used in startSelect
      let index: number;
      if (arr.length < this.nStartItems) {
        index = Math.floor(arr.length / 2);
      } else {
        index = Math.floor(arr.length / 2) + Cat.randomInteger(-Math.floor(this.nStartItems/2), Math.floor(this.nStartItems/2));
      }
      const nextItem = arr[index];
      arr.splice(index, 1);
      return {
        nextStimulus: nextItem,
        remainingStimuli: arr,
      };
    } else if (selector === 'closest') {
      //findClosest requires arr is sorted by difficulty
      const index = Cat.findClosest(arr, this._theta + 0.481);
      const nextItem = arr[index];
      arr.splice(index, 1);
      return {
        nextStimulus: nextItem,
        remainingStimuli: arr,
      };
    } else if (selector === 'random') {
      const index = Math.floor(Math.random() * arr.length);
      const nextItem = arr.splice(index, 1)[0];
      return {
        nextStimulus: nextItem,
        remainingStimuli: arr,
      };
    }
  }

    /**
     * return a random integer between min and max
     * @param min - The minimum of the random number range (include)
     * @param max - The maximum of the random number range (include)
     * @returns {number} - random integer within the range
     */
    private static randomInteger(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * find the item in a given array that has the difficulty closest to the target value
     * @param arr Array<Stimulus> - an array of stimulus
     * @param target number - ability estimate
     * @returns {number} the index of arr
     */
    private static findClosest(arr: Array<Stimulus>, target: number) {
      const n = arr.length;
      // Corner cases
      if (target <= arr[0].difficulty) return 0;
      if (target >= arr[n - 1].difficulty) return n - 1;
      // Doing binary search
      let i = 0,
          j = n,
          mid = 0;
      while (i < j) {
        mid = Math.ceil((i + j) / 2);
        if (arr[mid].difficulty == target) return mid;
        // If target is less than array
        // element,then search in left
        if (target < arr[mid].difficulty) {
          // If target is greater than previous
          // to mid, return closest of two
          if (mid > 0 && target > arr[mid - 1].difficulty) return Cat.getClosest(arr, mid - 1, mid, target);
          // Repeat for left half
          j = mid;
        }
        // If target is greater than mid
        else {
          if (mid < n - 1 && target < arr[mid + 1].difficulty) return Cat.getClosest(arr, mid, mid + 1, target);
          i = mid + 1; // update i
        }
      }
      // Only single element left after search
      return mid;
    }

    private static getClosest(arr: Array<Stimulus>, val1: number, val2: number, target: number) {
        if (target - arr[val1].difficulty >= arr[val2].difficulty - target) return val2;
        else return val1;
    }
}