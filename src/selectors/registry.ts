import { ItemSelector } from './types';
import { MFISelector } from './mfi';
import { ClosestSelector } from './closest';
import { RandomSelector } from './random';
import { FixedSelector } from './fixed';
import { MiddleSelector } from './middle';

/**
 * The registry of available item selectors.
 *
 * @remarks
 * This object is the single source of truth for which selectors exist. The
 * selector method types, runtime validation, and dispatch are all derived from
 * it (together with the `ITEM_SELECT_METHODS` / `START_SELECT_METHODS`
 * allowlists below). To add a new selector: create a class implementing
 * `ItemSelector` in its own file in `src/selectors/`, add an entry here, and
 * add its name to the appropriate allowlist(s). Do not add dispatch logic
 * anywhere else.
 */
export const SELECTORS = {
  mfi: new MFISelector(),
  closest: new ClosestSelector(),
  random: new RandomSelector(),
  fixed: new FixedSelector(),
  middle: new MiddleSelector(),
} as const;

/** Selectors that are valid as the adaptive `itemSelect` rule. */
export const ITEM_SELECT_METHODS = ['mfi', 'random', 'closest', 'fixed'] as const;

/** Selectors that are valid as the non-adaptive `startSelect` rule for the first `nStartItems` trials. */
export const START_SELECT_METHODS = ['random', 'middle', 'fixed'] as const;

/** The canonical (lowercase) names of all registered selectors. */
export type SelectorMethod = keyof typeof SELECTORS;

/** The canonical names of selectors valid as the adaptive `itemSelect` rule. */
export type ItemSelectMethod = typeof ITEM_SELECT_METHODS[number];

/** The canonical names of selectors valid as the `startSelect` rule. */
export type StartSelectMethod = typeof START_SELECT_METHODS[number];

/**
 * An item selection method as provided by the user. Selector names are
 * case-insensitive, so this type offers autocomplete on the canonical names
 * while still accepting arbitrary strings (validated at runtime).
 */
export type ItemSelectMethodInput = ItemSelectMethod | (string & Record<never, never>);

/** A start selection method as provided by the user. See `ItemSelectMethodInput`. */
export type StartSelectMethodInput = StartSelectMethod | (string & Record<never, never>);

/**
 * Validate a user-provided item selection method and normalize it to its
 * canonical (lowercase) name.
 *
 * @param {string} itemSelect - the user-provided item selection method (case-insensitive)
 * @returns {ItemSelectMethod} the canonical item selection method name
 * @throws {Error} if the method is not a valid adaptive item selector
 */
export const validateItemSelect = (itemSelect: string): ItemSelectMethod => {
  const lowerItemSelect = itemSelect.toLowerCase();
  if (!(ITEM_SELECT_METHODS as readonly string[]).includes(lowerItemSelect)) {
    throw new Error('The itemSelector you provided is not in the list of valid methods');
  }
  return lowerItemSelect as ItemSelectMethod;
};

/**
 * Validate a user-provided start selection method and normalize it to its
 * canonical (lowercase) name.
 *
 * @param {string} startSelect - the user-provided start selection method (case-insensitive)
 * @returns {StartSelectMethod} the canonical start selection method name
 * @throws {Error} if the method is not a valid start selector
 */
export const validateStartSelect = (startSelect: string): StartSelectMethod => {
  const lowerStartSelect = startSelect.toLowerCase();
  if (!(START_SELECT_METHODS as readonly string[]).includes(lowerStartSelect)) {
    throw new Error('The startSelect you provided is not in the list of valid methods');
  }
  return lowerStartSelect as StartSelectMethod;
};

/**
 * Look up the selector instance for a validated selector method.
 *
 * @param {SelectorMethod} method - a canonical selector method name
 * @returns {ItemSelector} the registered selector
 */
export const getSelector = (method: SelectorMethod): ItemSelector => {
  return SELECTORS[method];
};
