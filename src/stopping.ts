import { Cat } from './cat';
import { CatMap } from './type';

/**
 * Interface for input parameters to EarlyStopping classes.
 */
export interface EarlyStoppingInput {
  /** Number of items to wait for before triggering early stopping */
  patience: CatMap<number>;
  /** Tolerance for standard error of measurement drop */
  tolerance: CatMap<number>;
  /** Number of items to require before stopping */
  requiredItems: CatMap<number>;
  /** Stop if the standard error of measurement drops below this level */
  seMeasurementThreshold: CatMap<number>;
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

  constructor({ patience, tolerance, requiredItems, seMeasurementThreshold }: EarlyStoppingInput) {
    this._patience = patience;
    this._tolerance = tolerance;
    this._requiredItems = requiredItems;
    this._seMeasurementThreshold = seMeasurementThreshold;
    this._seMeasurements = {};
    this._nItems = {};
    this._earlyStop = false;
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
   * Abstract method to be implemented by subclasses to update the early stopping strategy.
   * @param {CatMap<Cat>} cats - A map of cats to update.
   * @param {string} catToEvaluate - The name of the cat to evaluate for early stopping.
   */
  public abstract update(cats: CatMap<Cat>, catToEvaluate: string): void;
}

/**
 * Class implementing early stopping based on a plateau in standard error of measurement.
 */
export class StopOnSEMeasurementPlateau extends EarlyStopping {
  public update(cats: CatMap<Cat>, catToEvaluate: string) {
    super._updateCats(cats);

    const seMeasurements = this._seMeasurements[catToEvaluate];
    const patience = this._patience[catToEvaluate];
    const tolerance = this._tolerance[catToEvaluate];

    if (seMeasurements.length >= patience) {
      const mean = seMeasurements.slice(-patience).reduce((sum, se) => sum + se, 0) / patience;
      const withinTolerance = seMeasurements.slice(-patience).every((se) => Math.abs(se - mean) <= tolerance);

      if (withinTolerance) {
        this._earlyStop = true;
      }
    }
  }
}

/**
 * Class implementing early stopping after a certain number of items.
 */
export class StopAfterNItems extends EarlyStopping {
  public update(cats: CatMap<Cat>, catToEvaluate: string) {
    super._updateCats(cats);

    const requiredItems = this._requiredItems[catToEvaluate];
    const nItems = this._nItems[catToEvaluate];

    if (nItems >= requiredItems) {
      this._earlyStop = true;
    }
  }
}

/**
 * Class implementing early stopping if the standard error of measurement drops below a certain threshold.
 */
export class StopIfSEMeasurementBelowThreshold extends EarlyStopping {
  public update(cats: CatMap<Cat>, catToEvaluate: string) {
    super._updateCats(cats);

    const seMeasurements = this._seMeasurements[catToEvaluate];
    const seThreshold = this._seMeasurementThreshold[catToEvaluate];
    const patience = this._patience[catToEvaluate];
    const tolerance = this._tolerance[catToEvaluate];

    if (seMeasurements.length >= patience) {
      const withinTolerance = seMeasurements.slice(-patience).every((se) => Math.abs(se - seThreshold) <= tolerance);

      if (withinTolerance) {
        this._earlyStop = true;
      }
    }
  }
}
