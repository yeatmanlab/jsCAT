import { Cat, CatInput } from './index';
import { MultiZetaStimulus, Stimulus, Zeta, ZetaCatMap } from './type';
import _cloneDeep from 'lodash/cloneDeep';
import _mapValues from 'lodash/mapValues';
import _unzip from 'lodash/unzip';
import _zip from 'lodash/zip';
import { validateCorpora } from './utils';

export interface ClowderInput {
  // An object containing Cat configurations for each Cat instance.
  cats: {
    [name: string]: CatInput;
  };
  // An object containing arrays of stimuli for each corpus.
  corpora: MultiZetaStimulus[];
}

export class Clowder {
  private cats: { [name: string]: Cat };
  private corpora: MultiZetaStimulus[];
  public remainingItems: MultiZetaStimulus[];
  public seenItems: Stimulus[];

  /**
   * Create a Clowder object.
   * @param {ClowderInput} input - An object containing arrays of Cat configurations and corpora.
   */
  constructor({ cats, corpora }: ClowderInput) {
    // TODO: Need to pass in numItemsRequired so that we know when to stop providing new items.
    this.cats = _mapValues(cats, (catInput) => new Cat(catInput));
    this.seenItems = [];
    validateCorpora(corpora);
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
    items: MultiZetaStimulus[];
    answers: (0 | 1) | (0 | 1)[];
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

    // TODO: Before we explicityly differentiated between validated and unvalidated stimuli.
    // Now, we need to dynamically calculate the unvalidated stimuli by looking at the remaining items
    // that do not have a zeta associated with the catToSelect.

    // TODO: These functions do not exist.
    const validatedRemainingItems = filterRemainingItemsForThisCat('validated');
    const unvalidatedRemainingItems = filterRemainingItemsForThisCat('unvalidated');
    const validatedCatInput = validatedRemainingItems.map((stim) => putStimuliInExpectedFormat);

    // Use the catForSelect to determine the next stimulus
    const cat = this.cats[catToSelect];
    const { nextStimulus } = cat.findNextItem(validatedCatInput, itemSelect);

    // Added some logic to mix in the unvalidated stimuli if needed.
    if (unvalidatedRemainingItems.length === 0) {
      // If there are no more unvalidated stimuli, we only have validated items left.
      // Use the Cat to find the next item. The Cat may return undefined if all validated items have been seen.
      return nextStimulus;
    } else if (validatedRemainingItems.length === 0) {
      // In this case, there are no more validated items left. Choose an unvalidated item at random.
      return unvalidatedRemainingItems[Math.floor(Math.random() * unvalidatedRemainingItems.length)];
    } else {
      // In this case, there are both validated and unvalidated items left.
      // We need to randomly insert unvalidated items
      const numRemaining = {
        validated: validatedRemainingItems.length,
        unvalidated: unvalidatedRemainingItems.length,
      };
      const random = Math.random();

      if (random < numRemaining.unvalidated / (numRemaining.validated + numRemaining.unvalidated)) {
        return unvalidatedRemainingItems[Math.floor(Math.random() * unvalidatedRemainingItems.length)];
      } else {
        return nextStimulus;
      }
    }
  }
}
