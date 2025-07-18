import { Cat, CatInput } from './cat';
import { CatMap, MultiZetaStimulus, Stimulus, Zeta, ZetaCatMap } from './type';
import { filterItemsByCatParameterAvailability, checkNoDuplicateCatNames } from './corpus';
import _cloneDeep from 'lodash/cloneDeep';
import _differenceWith from 'lodash/differenceWith';
import _isEqual from 'lodash/isEqual';
import _mapValues from 'lodash/mapValues';
import _omit from 'lodash/omit';
import _unzip from 'lodash/unzip';
import _zip from 'lodash/zip';
import seedrandom from 'seedrandom';
import { EarlyStopping } from './stopping';

export interface ClowderInput {
  /**
   * An object containing Cat configurations for each Cat instance.
   * Keys correspond to Cat names, while values correspond to Cat configurations.
   */
  cats: CatMap<CatInput>;
  /**
   * An object containing arrays of stimuli for each corpus.
   */
  corpus: MultiZetaStimulus[];
  /**
   * A random seed for reproducibility. If not provided, a random seed will be generated.
   */
  randomSeed?: string | null;
  /**
   * An optional EarlyStopping instance to use for early stopping.
   */
  earlyStopping?: EarlyStopping;
}

/**
 * The Clowder class is responsible for managing a collection of Cat instances
 * along with a corpus of stimuli.  It maintains a list of named Cat instances
 * and a corpus where each item in the coprpus may have IRT parameters
 * corresponding to each named Cat. Clowder provides methods for updating the
 * ability estimates of each of its Cats, and selecting the next item to present
 * to the participant.
 */
export class Clowder {
  private _cats: CatMap<Cat>;
  private _corpus: MultiZetaStimulus[];
  private _remainingItems: MultiZetaStimulus[];
  private _seenItems: Stimulus[];
  private _earlyStopping?: EarlyStopping;
  private readonly _rng: ReturnType<seedrandom>;
  private _stoppingReason: string | null;

  /**
   * Create a Clowder object.
   *
   * @param {ClowderInput} input - An object containing arrays of Cat configurations and corpora.
   * @param {CatMap<CatInput>} input.cats - An object containing Cat configurations for each Cat instance.
   * @param {MultiZetaStimulus[]} input.corpus - An array of stimuli representing each corpus.
   *
   * @throws {Error} - Throws an error if any item in the corpus has duplicated IRT parameters for any Cat name.
   */
  constructor({ cats, corpus, randomSeed = null, earlyStopping }: ClowderInput) {
    // TODO: Add some imput validation to both the cats and the corpus to make sure that "unvalidated" is not used as a cat name.
    // If so, throw an error saying that "unvalidated" is a reserved name and may not be used.
    // TODO: Also add a test of this behavior.
    this._cats = {
      ..._mapValues(cats, (catInput) => new Cat(catInput)),
      unvalidated: new Cat({ itemSelect: 'random', randomSeed }), // Add 'unvalidated' cat
    };
    this._seenItems = [];
    checkNoDuplicateCatNames(corpus);
    this._corpus = corpus;
    this._remainingItems = _cloneDeep(corpus);
    this._rng = randomSeed === null ? seedrandom() : seedrandom(randomSeed);
    this._earlyStopping = earlyStopping;
    this._stoppingReason = null;
  }

  /**
   * Validate the provided Cat name against the existing Cat instances.
   * Throw an error if the Cat name is not found.
   *
   * @param {string} catName - The name of the Cat instance to validate.
   * @param {boolean} allowUnvalidated - Whether to allow the reserved 'unvalidated' name.
   *
   * @throws {Error} - Throws an error if the provided Cat name is not found among the existing Cat instances.
   */
  private _validateCatName(catName: string, allowUnvalidated = false): void {
    const allowedCats = allowUnvalidated ? this._cats : this.cats;
    if (!Object.prototype.hasOwnProperty.call(allowedCats, catName)) {
      throw new Error(`Invalid Cat name. Expected one of ${Object.keys(allowedCats).join(', ')}. Received ${catName}.`);
    }
  }

  /**
   * The named Cat instances that this Clowder manages.
   */
  public get cats() {
    return _omit(this._cats, ['unvalidated']);
  }

  /**
   * The corpus that was provided to this Clowder when it was created.
   */
  public get corpus() {
    return this._corpus;
  }

  /**
   * The subset of the input corpus that this Clowder has not yet "seen".
   */
  public get remainingItems() {
    return this._remainingItems;
  }

  /**
   * The subset of the input corpus that this Clowder has "seen" so far.
   */
  public get seenItems() {
    return this._seenItems;
  }

  /**
   * The theta estimates for each Cat instance.
   */
  public get theta() {
    return _mapValues(this.cats, (cat) => cat.theta);
  }

  /**
   * The standard error of measurement estimates for each Cat instance.
   */
  public get seMeasurement() {
    return _mapValues(this.cats, (cat) => cat.seMeasurement);
  }

  /**
   * The number of items presented to each Cat instance.
   */
  public get nItems() {
    return _mapValues(this.cats, (cat) => cat.nItems);
  }

  /**
   * The responses received by each Cat instance.
   */
  public get resps() {
    return _mapValues(this.cats, (cat) => cat.resps);
  }

  /**
   * The zeta (item parameters) received by each Cat instance.
   */
  public get zetas() {
    return _mapValues(this.cats, (cat) => cat.zetas);
  }

  /**
   * The early stopping condition in the Clowder configuration.
   */
  public get earlyStopping() {
    return this._earlyStopping;
  }

  /**
   * The stopping reason in the Clowder configuration.
   */
  public get stoppingReason() {
    return this._stoppingReason;
  }

  /**
   * Updates the ability estimates for the specified Cat instances.
   *
   * @param {string[]} catNames - The names of the Cat instances to update.
   * @param {Zeta | Zeta[]} zeta - The item parameter(s) (zeta) for the given stimuli.
   * @param {(0 | 1) | (0 | 1)[]} answer - The corresponding answer(s) (0 or 1) for the given stimuli.
   * @param {string} [method] - Optional method for updating ability estimates. If none is provided, it will use the default method for each Cat instance.
   *
   * @throws {Error} If any `catName` is not found among the existing Cat instances.
   */
  public updateAbilityEstimates(catNames: string[], zeta: Zeta | Zeta[], answer: (0 | 1) | (0 | 1)[], method?: string) {
    catNames.forEach((catName) => {
      this._validateCatName(catName, false);
    });
    for (const catName of catNames) {
      this.cats[catName].updateAbilityEstimate(zeta, answer, method);
    }
  }

  /**
   * Update the ability estimates for the specified `catsToUpdate` and select the next stimulus for the `catToSelect`.
   * This function processes previous items and answers, updates internal state, and selects the next stimulus
   * based on the remaining stimuli and `corpusToSelect`.
   *
   * @param {Object} input - The parameters for updating the Cat instance and selecting the next stimulus.
   * @param {string} input.catToSelect - The Cat instance to use for selecting the next stimulus.
   * @param {string} [input.corpusToSelectFrom] - The corpus to use for selecting the next stimulus. If not provided, `catToSelect` will be used.
   * @param {string | string[]} [input.catsToUpdate=[]] - A single Cat or array of Cats for which to update ability estimates.
   * @param {Stimulus[]} [input.items=[]] - An array of previously presented stimuli.
   * @param {(0 | 1) | (0 | 1)[]} [input.answers=[]] - An array of answers (0 or 1) corresponding to `items`.
   * @param {string} [input.method] - Optional method for updating ability estimates (if applicable).
   * @param {string} [input.itemSelect] - Optional item selection method (if applicable).
   * @param {boolean} [input.randomlySelectUnvalidated=false] - Optional flag indicating whether to randomly select an unvalidated item for `catToSelect`.
   * @param {boolean} [input.returnUndefinedOnExhaustion=true] - Optional flag indicating whether to return undefined when no validated items are available.
   *
   * @returns {Stimulus | undefined} - The next stimulus to present, or `undefined` if no further validated stimuli are available.
   *
   * @throws {Error} If `items` and `answers` lengths do not match.
   * @throws {Error} If any `items` are not found in the Clowder's corpora (validated or unvalidated).
   *
   * The function operates in several steps:
   * 1. Validate:
   *    a. Validates the `catToSelect` and `catsToUpdate`.
   *    b. Ensures `items` and `answers` arrays are properly formatted.
   * 2. Update:
   *    a. Updates the internal list of seen items.
   *    b. Updates the ability estimates for the `catsToUpdate`.
   * 3. Select:
   *    a. Selects the next item using `catToSelect`, considering only remaining items that are valid for that cat.
   *    b. If desired, randomly selects an unvalidated item for catToSelect.
   */
  public updateCatAndGetNextItem({
    catToSelect,
    corpusToSelectFrom,
    catsToUpdate = [],
    items = [],
    answers = [],
    method,
    itemSelect,
    randomlySelectUnvalidated = false,
    returnUndefinedOnExhaustion = true,
  }: {
    catToSelect: string;
    corpusToSelectFrom?: string;
    catsToUpdate?: string | string[];
    items?: MultiZetaStimulus | MultiZetaStimulus[];
    answers?: (0 | 1) | (0 | 1)[];
    method?: string;
    itemSelect?: string;
    randomlySelectUnvalidated?: boolean;
    returnUndefinedOnExhaustion?: boolean; // New parameter type
  }): Stimulus | undefined {
    //           +----------------+
    // ----------| Validate Input |----------|
    //           +----------------+
    this._validateCatName(catToSelect, true);
    const corpusToSelect = corpusToSelectFrom ?? catToSelect;
    this._validateCatName(corpusToSelect, true);
    catsToUpdate = Array.isArray(catsToUpdate) ? catsToUpdate : [catsToUpdate];
    catsToUpdate.forEach((cat) => {
      this._validateCatName(cat, false);
    });

    // Convert items and answers to arrays
    items = Array.isArray(items) ? items : [items];
    answers = Array.isArray(answers) ? answers : [answers];

    // Ensure that the lengths of items and answers match
    if (items.length !== answers.length) {
      throw new Error('Previous items and answers must have the same length.');
    }

    //           +----------------+
    // ----------|  Update Cats   |----------|
    //           +----------------+
    this._updateCats(catsToUpdate, items, answers, method);

    //           +----------------+
    // ----------| Early Stopping |----------|
    //           +----------------+
    if (this._earlyStopping) {
      this._earlyStopping.update(this.cats, catToSelect);
      if (this._earlyStopping.earlyStop) {
        this._stoppingReason = 'Early stopping';
        return undefined;
      }
    }

    //           +----------------+
    // ----------|  Select Item   |----------|
    //           +----------------+
    return this._selectNextItem(
      catToSelect,
      corpusToSelect,
      randomlySelectUnvalidated,
      returnUndefinedOnExhaustion,
      itemSelect,
    );
  }

  /**
   * Updates the ability estimates for the specified Cat instances.
   *
   * @param {string[]} catsToUpdate - The names of the Cat instances to update.
   * @param {MultiZetaStimulus[]} items - The items to update the ability estimates for.
   * @param {(0 | 1)[]} answers - The answers to the items.
   * @param {string} [method] - Optional method for updating ability estimates. If none is provided, it will use the default method for each Cat instance.
   */
  private _updateCats(catsToUpdate: string[], items: MultiZetaStimulus[], answers: (0 | 1)[], method?: string) {
    // Update the seenItems with the provided previous items
    this._seenItems.push(...items);

    // Remove the provided previous items from the remainingItems
    this._remainingItems = _differenceWith(this._remainingItems, items, _isEqual);

    // Create a new zip array of items and answers. This will be useful in
    // filtering operations below. It ensures that items and their corresponding
    // answers "stay together."
    const itemsAndAnswers = _zip(items, answers) as [Stimulus, 0 | 1][];

    // Update the ability estimate for all validated cats
    for (const catName of catsToUpdate) {
      const itemsAndAnswersForCat = itemsAndAnswers.filter(([stim]) =>
        // We are dealing with a single item in this function.  This single item
        // has an array of zeta parameters for a bunch of different Cats.  We
        // need to determine if `catName` is present in that list.  So we first
        // reduce the zetas to get all of the applicabe cat names.
        // Now that we have the subset of items that can apply to this cat,
        // retrieve only the item parameters that apply to this cat.
        stim.zetas.some((zeta: ZetaCatMap) => zeta.cats.includes(catName)),
      );

      if (itemsAndAnswersForCat.length > 0) {
        const zetasAndAnswersForCat = itemsAndAnswersForCat
          .map(([stim, _answer]) => {
            const zetaForCat: ZetaCatMap | undefined = stim.zetas.find((zeta: ZetaCatMap) =>
              zeta.cats.includes(catName),
            );
            // We already know from using filterItemsByCatParameterAvailability that
            // zetasForCat is not undefined, so we can safely use non-null assertion.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return [zetaForCat!.zeta, _answer]; // Optional chaining in case zetaForCat is undefined
          })
          .filter(([zeta]) => zeta !== undefined); // Filter out undefined zeta values

        // Unzip the zetas and answers, making sure the zetas array contains only Zeta types
        const [zetas, answers] = _unzip(zetasAndAnswersForCat) as [Zeta[], (0 | 1)[]];

        // Now call updateAbilityEstimates for this cat
        this.updateAbilityEstimates([catName], zetas, answers, method);
      }
    }
  }

  private _selectNextItem(
    catToSelect: string,
    corpusToSelect: string,
    randomlySelectUnvalidated: boolean,
    returnUndefinedOnExhaustion: boolean,
    itemSelect?: string,
  ) {
    // We inspect the remaining items and find ones that have zeta parameters for both `corpusToSelect` and `catToSelect`
    const { available: availableForCorpus, missing: missingForCorpus } = filterItemsByCatParameterAvailability(
      this._remainingItems,
      corpusToSelect,
    );
    const { available, missing: missingForCat } = filterItemsByCatParameterAvailability(
      availableForCorpus,
      catToSelect,
    );
    const missing = [...missingForCorpus, ...missingForCat];

    if (available.length === 0 && availableForCorpus.length > 0) {
      console.warn(
        `No items available for cat ${catToSelect} in corpus ${corpusToSelect}. ` +
          'This will still work but is probably not what you intended. Typically ' +
          'the corpusToSelectFrom will be a subset of the corpus for catToSelect, ' +
          "such as when a 'total' cat is selecting from a sub-domain corpus.",
      );
    }

    // Handle the 'unvalidated' cat selection
    if (corpusToSelect === 'unvalidated') {
      const unvalidatedRemainingItems = this._remainingItems.filter(
        (stim) => !stim.zetas.some((zeta: ZetaCatMap) => zeta.cats.length > 0),
      );

      if (unvalidatedRemainingItems.length === 0) {
        // If returnUndefinedOnExhaustion is false, return an item from 'missing'
        if (!returnUndefinedOnExhaustion && missing.length > 0) {
          const randInt = Math.floor(this._rng() * missing.length);
          return missing[randInt];
        }
        this._stoppingReason = 'No unvalidated items remaining';
        return undefined;
      } else {
        const randInt = Math.floor(this._rng() * unvalidatedRemainingItems.length);
        return unvalidatedRemainingItems[randInt];
      }
    }

    // The cat expects an array of Stimulus objects, with the zeta parameters
    // spread at the top-level of each Stimulus object. So we need to convert
    // the MultiZetaStimulus array to an array of Stimulus objects.
    const availableCatInput = available.map((item) => {
      const zetasForCat = item.zetas.find((zeta) => zeta.cats.includes(catToSelect));
      return {
        // We already know from using filterItemsByCatParameterAvailability that
        // zetasForCat is not undefined, so we can safely use non-null assertion.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...zetasForCat!.zeta,
        ...item,
      };
    });

    // Use the catToSelect to determine the next stimulus
    const cat = this.cats[catToSelect];
    const { nextStimulus } = cat.findNextItem(availableCatInput, itemSelect);
    const nextStimulusWithoutZeta = _omit(nextStimulus, [
      'a',
      'b',
      'c',
      'd',
      'discrimination',
      'difficulty',
      'guessing',
      'slipping',
    ]);
    // Again `nextStimulus` will be a Stimulus object, or `undefined` if no further validated stimuli are available.
    // We need to convert the Stimulus object back to a MultiZetaStimulus object to return to the user.
    const returnStimulus: MultiZetaStimulus | undefined = available.find((stim) =>
      _isEqual(
        _omit(stim, ['a', 'b', 'c', 'd', 'discrimination', 'difficulty', 'guessing', 'slipping']),
        nextStimulusWithoutZeta,
      ),
    );

    // Determine behavior based on returnUndefinedOnExhaustion
    if (available.length === 0) {
      // If returnUndefinedOnExhaustion is true and no validated items remain for the specified corpusToSelectFrom, return undefined.
      if (returnUndefinedOnExhaustion) {
        this._stoppingReason = `No validated items remaining for the requested corpus ${corpusToSelect}`;
        return undefined; // Return undefined if no validated items remain
      } else {
        // If returnUndefinedOnExhaustion is false, proceed with the fallback mechanism to select an item from other available categories.
        return missing[Math.floor(this._rng() * missing.length)];
      }
    } else if (missing.length === 0 || !randomlySelectUnvalidated) {
      return returnStimulus; // Return validated item if available
    } else {
      // Randomly decide whether to return a validated or unvalidated item
      const random = Math.random();
      const numRemaining = { available: available.length, missing: missing.length };
      return random < numRemaining.missing / (numRemaining.available + numRemaining.missing)
        ? missing[Math.floor(this._rng() * missing.length)]
        : returnStimulus;
    }
  }
}
