import { Cat } from './cat';
import { CatMap } from './type';
import _uniq from 'lodash/uniq';

/**
 * Interface for input parameters to EarlyStopping classes.
 */
export interface EarlyStoppingInput {
  /** Number of items to wait for before triggering early stopping */
  patience?: CatMap<number>;
  /** Tolerance for standard error of measurement drop */
  tolerance?: CatMap<number>;
  /** Number of items to require before stopping */
  requiredItems?: CatMap<number>;
  /** Stop if the standard error of measurement drops below this level */
  seMeasurementThreshold?: CatMap<number>;
  /** The logical operation to use to evaluate multiple stopping conditions */
  logicalOperation?: 'and' | 'or' | 'AND' | 'OR';
}

/**
 * Abstract class for early stopping strategies.
 */
export abstract class EarlyStopping {
  protected _earlyStop: boolean;
  protected _patience: CatMap<number>;
  protected _tolerance: CatMap<number>;
  protected _requiredItems: CatMap<number>;
  protected _seMeasurementThreshold: CatMap<number>;
  protected _nItems: CatMap<number>;
  protected _seMeasurements: CatMap<number[]>;
  protected _logicalOperation: 'and' | 'or';

  constructor({
    patience = {},
    tolerance = {},
    requiredItems = {},
    seMeasurementThreshold = {},
    logicalOperation = 'or',
  }: EarlyStoppingInput) {
    // TODO: Add some input validation here
    // logicalOperation.toLowerCase() should be 'and' or 'or'
    this._patience = patience;
    this._tolerance = tolerance;
    this._requiredItems = requiredItems;
    this._seMeasurementThreshold = seMeasurementThreshold;
    this._seMeasurements = {};
    this._nItems = {};
    this._earlyStop = false;
    this._logicalOperation = logicalOperation.toLowerCase() as 'and' | 'or';
  }

  public get evaluationCats() {
    return _uniq([
      ...Object.keys(this._patience),
      ...Object.keys(this._tolerance),
      ...Object.keys(this._requiredItems),
      ...Object.keys(this._seMeasurementThreshold),
    ]);
  }

  public get patience() {
    return this._patience;
  }

  public get tolerance() {
    return this._tolerance;
  }

  public get requiredItems() {
    return this._requiredItems;
  }

  public get seMeasurementThreshold() {
    return this._seMeasurementThreshold;
  }

  public get earlyStop() {
    return this._earlyStop;
  }

  public get nItems() {
    return this._nItems;
  }

  public get seMeasurements() {
    return this._seMeasurements;
  }

  public get logicalOperation() {
    return this._logicalOperation;
  }

  /**
   * Update the internal state of the early stopping strategy based on the provided cats.
   * @param {CatMap<Cat>}cats - A map of cats to update.
   */
  protected _updateCats(cats: CatMap<Cat>) {
    for (const catName in cats) {
      const cat = cats[catName];
      const nItems = cat.nItems;
      const seMeasurement = cat.seMeasurement;

      if (nItems > (this._nItems[catName] ?? 0)) {
        this._nItems[catName] = nItems;
        this._seMeasurements[catName] = [...(this._seMeasurements[catName] ?? []), seMeasurement];
      }
    }
  }

  /**
   * Abstract method to be implemented by subclasses to evaluate a single stopping condition.
   * @param {string} catToEvaluate - The name of the cat to evaluate for early stopping.
   */
  protected abstract _evaluateStoppingCondition(catToEvaluate: string): boolean;

  /**
   * Abstract method to be implemented by subclasses to update the early stopping strategy.
   * @param {CatMap<Cat>} cats - A map of cats to update.
   */
  public update(cats: CatMap<Cat>): void {
    this._updateCats(cats);

    const conditions: boolean[] = this.evaluationCats.map((catName) => this._evaluateStoppingCondition(catName));

    if (this._logicalOperation === 'and') {
      this._earlyStop = conditions.every(Boolean);
    } else {
      this._earlyStop = conditions.some(Boolean);
    }
  }
}

/**
 * Class implementing early stopping based on a plateau in standard error of measurement.
 */
export class StopOnSEMeasurementPlateau extends EarlyStopping {
  protected _evaluateStoppingCondition(catToEvaluate: string) {
    const seMeasurements = this._seMeasurements[catToEvaluate];

    // Use MAX_SAFE_INTEGER and MAX_VALUE to prevent early stopping if the `catToEvaluate` is missing from the cats map.
    const patience = this._patience[catToEvaluate];
    const tolerance = this._tolerance[catToEvaluate];

    let earlyStop = false;

    if (seMeasurements.length >= patience) {
      const mean = seMeasurements.slice(-patience).reduce((sum, se) => sum + se, 0) / patience;
      const withinTolerance = seMeasurements.slice(-patience).every((se) => Math.abs(se - mean) <= tolerance);

      if (withinTolerance) {
        earlyStop = true;
      }
    }

    return earlyStop;
  }
}

/**
 * Class implementing early stopping after a certain number of items.
 */
export class StopAfterNItems extends EarlyStopping {
  protected _evaluateStoppingCondition(catToEvaluate: string) {
    const requiredItems = this._requiredItems[catToEvaluate];
    const nItems = this._nItems[catToEvaluate] ?? 0;

    let earlyStop = false;

    if (nItems >= requiredItems) {
      earlyStop = true;
    }

    return earlyStop;
  }
}

/**
 * Class implementing early stopping if the standard error of measurement drops below a certain threshold.
 */
export class StopIfSEMeasurementBelowThreshold extends EarlyStopping {
  protected _evaluateStoppingCondition(catToEvaluate: string) {
    const seMeasurements = this._seMeasurements[catToEvaluate] ?? [];
    const seThreshold = this._seMeasurementThreshold[catToEvaluate] ?? 0;
    const patience = this._patience[catToEvaluate] ?? 1;
    const tolerance = this._tolerance[catToEvaluate] ?? 0;

    let earlyStop = false;

    if (seMeasurements.length >= patience) {
      const withinTolerance = seMeasurements.slice(-patience).every((se) => se - seThreshold <= tolerance);

      if (withinTolerance) {
        earlyStop = true;
      }
    }

    return earlyStop;
  }
}
