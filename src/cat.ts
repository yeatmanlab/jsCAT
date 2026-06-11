import { Stimulus, Zeta } from './type';
import { fisherInformation, normal, uniform } from './utils';
import { validateZetaParams, fillZetaDefaults, ensureZetaNumericValues } from './corpus';
import { EstimationMethod, EstimationMethodInput, getEstimator, validateEstimationMethod } from './estimators';
import {
  ItemSelectMethod,
  ItemSelectMethodInput,
  SelectorContext,
  SelectorMethod,
  StartSelectMethod,
  StartSelectMethodInput,
  getSelector,
  validateItemSelect,
  validateStartSelect,
} from './selectors';
import seedrandom from 'seedrandom';
import _clamp from 'lodash/clamp';
import _cloneDeep from 'lodash/cloneDeep';

export interface CatInput {
  method?: EstimationMethodInput;
  itemSelect?: ItemSelectMethodInput;
  nStartItems?: number;
  startSelect?: StartSelectMethodInput;
  theta?: number;
  minTheta?: number;
  maxTheta?: number;
  priorDist?: string;
  priorPar?: number[];
  randomSeed?: string | null;
}

export class Cat {
  public method: EstimationMethod;
  public itemSelect: ItemSelectMethod;
  public minTheta: number;
  public maxTheta: number;
  public priorDist: string;
  public priorPar: number[];
  private readonly _zetas: Zeta[];
  private readonly _resps: (0 | 1)[];
  private _theta: number;
  private _seMeasurement: number;
  public nStartItems: number;
  public startSelect: StartSelectMethod;
  private readonly _rng: ReturnType<seedrandom>;
  private _prior: [number, number][];

  /**
   * Create a Cat object. This expects an single object parameter with the following keys
   * @param {{method: string, itemSelect: string, nStartItems: number, startSelect:string, theta: number, minTheta: number, maxTheta: number, priorDist: string, priorPar: number[]}=} destructuredParam
   *     method: ability estimator, e.g. MLE or EAP, default = 'MLE' (see src/estimators/registry.ts for the full list)
   *     itemSelect: the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
   *     nStartItems: first n trials to keep non-adaptive selection
   *     startSelect: rule to select first n trials
   *     theta: initial theta estimate
   *     minTheta: lower bound of theta
   *     maxTheta: higher bound of theta
   *     priorDist: the prior distribution type (only applies to EAP estimator)
   *     priorPar: the prior distribution parameters (only applies to EAP estimator)
   *     randomSeed: set a random seed to trace the simulation
   */

  constructor({
    method = 'mle',
    itemSelect = 'mfi',
    nStartItems = 0,
    startSelect = 'middle',
    theta = 0,
    minTheta = -6,
    maxTheta = 6,
    priorDist = 'norm', // only applies to EAP estimator
    priorPar = priorDist === 'unif' ? [-4, 4] : [0, 1], // only applies to EAP estimator
    randomSeed = null,
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

  private static validateMethod(method: string): EstimationMethod {
    return validateEstimationMethod(method);
  }

  private static validateItemSelect(itemSelect: string): ItemSelectMethod {
    return validateItemSelect(itemSelect);
  }

  private static validateStartSelect(startSelect: string): StartSelectMethod {
    return validateStartSelect(startSelect);
  }

  /**
   * use previous response patterns and item params to calculate the estimate ability based on a defined method
   * @param zeta - last item param
   * @param answer - last response pattern
   * @param method - the estimation method to use; defaults to the Cat's configured method
   */
  public updateAbilityEstimate(
    zeta: Zeta | Zeta[],
    answer: (0 | 1) | (0 | 1)[],
    method: EstimationMethodInput = this.method,
  ) {
    const validatedMethod = Cat.validateMethod(method);

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

    // All estimators are dispatched through the registry. To add a new
    // estimator, see src/estimators/registry.ts — no changes are needed here.
    this._theta = getEstimator(validatedMethod).estimateAbility({
      zetas: this._zetas,
      resps: this._resps,
      minTheta: this.minTheta,
      maxTheta: this.maxTheta,
      prior: this._prior,
    });

    this._theta = _clamp(this._theta, this.minTheta, this.maxTheta);
    this.calculateSE();
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
  public findNextItem(stimuli: Stimulus[], itemSelect: ItemSelectMethodInput = this.itemSelect, deepCopy = true) {
    let arr: Array<Stimulus>;
    let selector: SelectorMethod = Cat.validateItemSelect(itemSelect);
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      arr.sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!);
    }

    // All selectors are dispatched through the registry. To add a new
    // selector, see src/selectors/registry.ts — no changes are needed here.
    const context: SelectorContext = {
      theta: this._theta,
      nStartItems: this.nStartItems,
      randomInteger: this.randomInteger.bind(this),
    };
    return getSelector(selector).select(arr, context);
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
