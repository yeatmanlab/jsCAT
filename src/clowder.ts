import { Cat, CatInput } from './index';
import { MultiZetaStimulus, Stimulus, Zeta, ZetaCatMap } from './type';
import _cloneDeep from 'lodash/cloneDeep';
import _isEqual from 'lodash/isEqual';
import _mapValues from 'lodash/mapValues';
import _unzip from 'lodash/unzip';
import _zip from 'lodash/zip';
import { filterItemsByCatParameterAvailability, checkNoDuplicateCatNames } from './utils';

export interface ClowderInput {
  // An object containing Cat configurations for each Cat instance.
  cats: {
    [name: string]: CatInput;
  };
  // An object containing arrays of stimuli for each corpus.
  corpus: MultiZetaStimulus[];
}

export class Clowder {
  private cats: { [name: string]: Cat };
  private _corpus: MultiZetaStimulus[];
  public remainingItems: MultiZetaStimulus[];
  public seenItems: Stimulus[];

  /**
   * Create a Clowder object.
   * @param {ClowderInput} input - An object containing arrays of Cat configurations and corpora.
   */
  constructor({ cats, corpus }: ClowderInput) {
    // TODO: Need to pass in numItemsRequired so that we know when to stop providing new items.
    this.cats = _mapValues(cats, (catInput) => new Cat(catInput));
    this.seenItems = [];
    checkNoDuplicateCatNames(corpus);
    this._corpus = corpus;
    this.remainingItems = _cloneDeep(corpus);
  }

  private _validateCatName(catName: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.cats, catName)) {
      throw new Error(`Invalid Cat name. Expected one of ${Object.keys(this.cats).join(', ')}. Received ${catName}.`);
    }
  }

  public get corpus() {
    return this._corpus;
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
   * based on the remaining stimuli and `catToSelect`.
   *
   * @param {Object} input - The parameters for updating the Cat instance and selecting the next stimulus.
   * @param {string} input.catToSelect - The Cat instance to use for selecting the next stimulus.
   * @param {string | string[]} [input.catsToUpdate=[]] - A single Cat or array of Cats for which to update ability estimates.
   * @param {Stimulus[]} [input.items=[]] - An array of previously presented stimuli.
   * @param {(0 | 1) | (0 | 1)[]} [input.answers=[]] - An array of answers (0 or 1) corresponding to `items`.
   * @param {string} [input.method] - Optional method for updating ability estimates (if applicable).
   * @param {string} [input.itemSelect] - Optional item selection method (if applicable).
   *
   * @returns {Stimulus | undefined} - The next stimulus to present, or `undefined` if no further validated stimuli are available.
   *
   * @throws {Error} If `items` and `answers` lengths do not match.
   * @throws {Error} If any `items` are not found in the Clowder's corpora (validated or unvalidated).
   *
   * The function operates in several steps:
   * 1. Validates the `catToSelect` and `catsToUpdate`.
   * 2. Ensures `items` and `answers` arrays are properly formatted.
   * 3. Updates the internal list of seen items.
   * 4. Updates the ability estimates for the `catsToUpdate`.
   * 5. Selects the next stimulus for `catToSelect`, considering validated and unvalidated stimuli.
   */
  public updateCatAndGetNextItem({
    catToSelect,
    catsToUpdate = [],
    items = [],
    answers = [],
    method,
    itemSelect,
  }: {
    catToSelect: string;
    catsToUpdate?: string | string[];
    items?: MultiZetaStimulus | MultiZetaStimulus[];
    answers?: (0 | 1) | (0 | 1)[];
    method?: string;
    itemSelect?: string;
  }): Stimulus | undefined {
    // Validate all cat names
    this._validateCatName(catToSelect);
    catsToUpdate = Array.isArray(catsToUpdate) ? catsToUpdate : [catsToUpdate];
    catsToUpdate.forEach((cat) => {
      this._validateCatName(cat);
    });

    // Convert items and answers to arrays
    items = Array.isArray(items) ? items : [items];
    answers = Array.isArray(answers) ? answers : [answers];

    // Ensure that the lengths of items and answers match
    if (items.length !== answers.length) {
      throw new Error('Previous items and answers must have the same length.');
    }

    // Update the seenItems with the provided previous items
    this.seenItems.push(...items);

    // Remove the seenItems from the remainingItems
    this.remainingItems = this.remainingItems.filter((stim) => !items.includes(stim));

    const itemsAndAnswers = _zip(items, answers) as [Stimulus, 0 | 1][];

    // Update the ability estimate for all cats
    for (const catName of catsToUpdate) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const itemsAndAnswersForCat = itemsAndAnswers.filter(([stim, _answer]) => {
        const allCats = stim.zetas.reduce((acc: string[], { cats }: { cats: string }) => {
          return [...acc, ...cats];
        }, []);
        return allCats.includes(catName);
      });

      const zetasAndAnswersForCat = itemsAndAnswersForCat.map(([stim, _answer]) => {
        const { zetas } = stim;
        const zetaForCat = zetas.find((zeta: ZetaCatMap) => zeta.cats.includes(catName));
        return [zetaForCat.zeta, _answer];
      });

      // Extract the cat to update ability estimate
      const [zetas, answers] = _unzip(zetasAndAnswersForCat);
      this.cats[catName].updateAbilityEstimate(zetas, answers, method);
    }

    // Now, we need to dynamically calculate the stimuli available for selection by `catToSelect`.
    // We inspect the remaining items and find ones that have zeta parameters for `catToSelect`

    const { available, missing } = filterItemsByCatParameterAvailability(this.remainingItems, catToSelect);

    // The cat expects an array of Stimulus objects, with the zeta parameters
    // spread at the top-level of each Stimulus object. So we need to convert
    // the MultiZetaStimulus array to an array of Stimulus objects.
    const availableCatInput = available.map((item) => {
      const { zetas, ...rest } = item;
      const zetasForCat = zetas.find((zeta: ZetaCatMap) => zeta.cats.includes(catToSelect));
      return {
        ...(zetasForCat?.zeta ?? {}),
        ...rest,
      };
    });

    // Use the catForSelect to determine the next stimulus
    const cat = this.cats[catToSelect];
    const { nextStimulus } = cat.findNextItem(availableCatInput, itemSelect);

    // Again `nextStimulus` will be a Stimulus object, or `undefined` if no further validated stimuli are available.
    // We need to convert the Stimulus object back to a MultiZetaStimulus object to return to the user.
    const returnStimulus: MultiZetaStimulus | undefined = available.find((stim) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { zetas, ...rest } = stim;
      return _isEqual(rest, nextStimulus);
    });

    // Added some logic to mix in the unvalidated stimuli if needed.
    if (missing.length === 0) {
      // If there are no more unvalidated stimuli, we only have validated items left.
      // Use the Cat to find the next item. The Cat may return undefined if all validated items have been seen.
      return returnStimulus;
    } else if (available.length === 0) {
      // In this case, there are no more validated items left. Choose an unvalidated item at random.
      return missing[Math.floor(Math.random() * missing.length)];
    } else {
      // In this case, there are both validated and unvalidated items left.
      // We need to randomly insert unvalidated items
      const numRemaining = {
        available: available.length,
        missing: missing.length,
      };
      const random = Math.random();

      if (random < numRemaining.missing / (numRemaining.available + numRemaining.missing)) {
        return missing[Math.floor(Math.random() * missing.length)];
      } else {
        return returnStimulus;
      }
    }
  }
}
