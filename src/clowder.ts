import { Cat, CatInput } from './index';
import { Stimulus, Zeta } from './type';
import _cloneDeep from 'lodash/cloneDeep';
import _mapValues from 'lodash/mapValues';
import _zip from 'lodash/zip';

interface Corpora {
  validated: Stimulus[];
  unvalidated: Stimulus[];
}

export interface ClowderInput {
  // An object containing Cat configurations for each Cat instance.
  cats: {
    [name: string]: CatInput;
  };
  // An object containing arrays of stimuli for each corpus.
  corpora: Corpora;
}

export class Clowder {
  private cats: { [name: string]: Cat };
  private corpora: Corpora;
  public remainingItems: Corpora;
  public seenItems: Stimulus[];

  /**
   * Create a Clowder object.
   * @param {ClowderInput} input - An object containing arrays of Cat configurations and corpora.
   */
  constructor({ cats, corpora }: ClowderInput) {
    this.cats = _mapValues(cats, (catInput) => new Cat(catInput));
    this.seenItems = [];
    this.corpora = corpora;
    this.remainingItems = _cloneDeep(corpora);
  }

  private _validateCatName(catName: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.cats, catName)) {
      throw new Error(`Invalid Cat name. Expected one of ${Object.keys(this.cats).join(', ')}. Received ${catName}.`);
    }
  }

  public get theta() {
    return _mapValues(this.cats, (cat) => cat.theta);
  }

  public get seMeasurement() {
    return _mapValues(this.cats, (cat) => cat.seMeasurement);
  }

  public get nItems() {
    return _mapValues(this.cats, (cat) => cat.nItems);
  }

  public get resps() {
    return _mapValues(this.cats, (cat) => cat.resps);
  }

  public get zetas() {
    return _mapValues(this.cats, (cat) => cat.zetas);
  }

  public updateAbilityEstimates(catNames: string[], zeta: Zeta | Zeta[], answer: (0 | 1) | (0 | 1)[], method?: string) {
    catNames.forEach((catName) => {
      this._validateCatName(catName);
    });
    for (const catName of catNames) {
      this.cats[catName].updateAbilityEstimate(zeta, answer, method);
    }
  }

  /**
   * Updates the ability estimates for the specified `catsToUpdate` and selects the next stimulus for the `catToSelect`.
   * This function processes previous items and answers, updates internal state, and selects the next stimulus
   * based on the current state of validated and unvalidated stimuli.
   *
   * @param {Object} params - The parameters for updating the Cat instance and selecting the next stimulus.
   * @param {string} params.catToSelect - The Cat instance to use for selecting the next stimulus.
   * @param {string | string[]} [params.catsToUpdate=[]] - A single Cat or array of Cats for which to update ability estimates.
   * @param {Stimulus[]} [params.previousItems=[]] - An array of previously presented stimuli.
   * @param {(0 | 1) | (0 | 1)[]} [params.previousAnswers=[]] - An array of answers (0 or 1) corresponding to `previousItems`.
   * @param {string} [params.method] - Optional method for updating ability estimates (if applicable).
   *
   * @returns {Stimulus | undefined} - The next stimulus to present, or `undefined` if no further validated stimuli are available.
   *
   * @throws {Error} If `previousItems` and `previousAnswers` lengths do not match.
   * @throws {Error} If any `previousItems` are not found in the Clowder's corpora (validated or unvalidated).
   *
   * The function operates in several steps:
   * 1. Validates the `catToSelect` and `catsToUpdate`.
   * 2. Ensures `previousItems` and `previousAnswers` arrays are properly formatted.
   * 3. Updates the internal list of seen items.
   * 4. Updates the ability estimates for the `catsToUpdate`.
   * 5. Selects the next stimulus for `catToSelect`, considering validated and unvalidated stimuli.
   */
  public updateCatAndGetNextItem({
    catToSelect,
    catsToUpdate = [],
    previousItems = [],
    previousAnswers = [],
    method,
  }: {
    catToSelect: string;
    catsToUpdate?: string | string[];
    previousItems: Stimulus[];
    previousAnswers: (0 | 1) | (0 | 1)[];
    method?: string;
  }): Stimulus | undefined {
    this._validateCatName(catToSelect);

    catsToUpdate = Array.isArray(catsToUpdate) ? catsToUpdate : [catsToUpdate];
    catsToUpdate.forEach((cat) => {
      this._validateCatName(cat);
    });

    previousItems = Array.isArray(previousItems) ? previousItems : [previousItems];
    previousAnswers = Array.isArray(previousAnswers) ? previousAnswers : [previousAnswers];

    if (previousItems.length !== previousAnswers.length) {
      throw new Error('Previous items and answers must have the same length.');
    }

    // Update the seenItems with the provided previous items
    this.seenItems.push(...previousItems);

    const itemsAndAnswers = _zip(previousItems, previousAnswers) as [Stimulus, 0 | 1][];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatedItemsAndAnswers = itemsAndAnswers.filter(([item, _answer]) => this.corpora.validated.includes(item));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unvalidatedItemsAndAnswers = itemsAndAnswers.filter(([item, _answer]) =>
      this.corpora.unvalidated.includes(item),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const invalidItems = itemsAndAnswers.filter(([item, _answer]) => {
      return !this.corpora.validated.includes(item) && !this.corpora.unvalidated.includes(item);
    });

    if (!invalidItems) {
      throw new Error(
        `The following previous items provided are not in this Clowder's corpora:\n${JSON.stringify(
          invalidItems,
          null,
          2,
        )} ${invalidItems}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatedStimuli = validatedItemsAndAnswers.map(([stim, _]) => stim);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unvalidatedStimuli = unvalidatedItemsAndAnswers.map(([stim, _]) => stim);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatedAnswers = validatedItemsAndAnswers.map(([_, answer]) => answer);

    // Remove previous items from the remainingItems
    this.remainingItems.validated = this.remainingItems.validated.filter((item) => !validatedStimuli.includes(item));
    this.remainingItems.unvalidated = this.remainingItems.unvalidated.filter(
      (item) => !unvalidatedStimuli.includes(item),
    );

    // Update the ability estimates for the requested Cats
    this.updateAbilityEstimates(catsToUpdate, validatedStimuli, validatedAnswers, method);

    // Use the catForSelect to determine the next stimulus
    const cat = this.cats[catToSelect];
    const { nextStimulus } = cat.findNextItem(this.remainingItems.validated);

    // Added some logic to mix in the unvalidated stimuli if needed.
    if (this.remainingItems.unvalidated.length === 0) {
      // If there are no more unvalidated stimuli, we only have validated items left.
      // Use the Cat to find the next item. The Cat may return undefined if all validated items have been seen.
      return nextStimulus;
    } else if (this.remainingItems.validated.length === 0) {
      // In this case, there are no more validated items left. Choose an unvalidated item at random.
      return this.remainingItems.unvalidated[Math.floor(Math.random() * this.remainingItems.unvalidated.length)];
    } else {
      // In this case, there are both validated and unvalidated items left.
      // We need to randomly insert unvalidated items
      const numRemaining = {
        validated: this.remainingItems.validated.length,
        unvalidated: this.remainingItems.unvalidated.length,
      };
      const random = Math.random();

      if (random < numRemaining.unvalidated / (numRemaining.validated + numRemaining.unvalidated)) {
        return this.remainingItems.unvalidated[Math.floor(Math.random() * this.remainingItems.unvalidated.length)];
      } else {
        return nextStimulus;
      }
    }
  }

  /**
   * Add a new Cat instance to the Clowder.
   * @param {string} catName - Name of the new Cat.
   * @param {CatInput} catInput - Configuration for the new Cat instance.
   * @param {Stimulus[]} stimuli - The corpus for the new Cat.
   */
  public addCat(catName: string, catInput: CatInput) {
    if (Object.prototype.hasOwnProperty.call(this.cats, catName)) {
      throw new Error(`Cat with the name "${catName}" already exists.`);
    }
    this.cats[catName] = new Cat(catInput);
  }

  /**
   * Remove a Cat instance from the Clowder.
   * @param {string} catName - The name of the Cat instance to remove.
   */
  public removeCat(catName: string) {
    this._validateCatName(catName);
    delete this.cats[catName];
  }
}
