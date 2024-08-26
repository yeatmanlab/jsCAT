import { Cat, CatInput } from './index';
import { Stimulus } from './type';

/**
 * Explanation:
 *   ClowderInput: Defines the input parameters for the Clowder class, including configurations for multiple Cat instances and corresponding corpora.
 *   Clowder class:
 *   constructor: Initializes the Clowder with multiple Cat instances and their respective corpora.
 *   getNextStimulus: Retrieves the next stimulus for a specific Cat instance.
 *   getNextStimuli: Retrieves the next stimuli for all Cat instances.
 *   addCat: Adds a new Cat instance to the Clowder.
 *   removeCat: Removes a Cat instance from the Clowder.
 */

export interface ClowderInput {
  cats: CatInput[]; // Array of Cat configurations
  corpora: Stimulus[][]; // Array of stimuli arrays, one for each Cat
}

export class Clowder {
  private cats: Cat[];
  private corpora: Stimulus[][];

  /**
   * Create a Clowder object.
   * @param {ClowderInput} input - An object containing arrays of Cat configurations and corpora.
   */
  constructor({ cats, corpora }: ClowderInput) {
    if (cats.length !== corpora.length) {
      throw new Error('The number of Cat instances must match the number of corpora');
    }

    // Initialize Cats and corresponding corpora
    this.cats = cats.map((catInput) => new Cat(catInput));
    this.corpora = corpora;
  }

  /**
   * Get the next stimulus for a specific Cat instance.
   * @param {number} catIndex - The index of the Cat instance to select the next stimulus for.
   * @returns {Stimulus | null} The next stimulus, or null if no more stimuli are available.
   */
  public getNextStimulus(catIndex: number): Stimulus | null {
    if (catIndex < 0 || catIndex >= this.cats.length) {
      throw new Error('Invalid Cat index');
    }

    const cat = this.cats[catIndex];
    const stimuli = this.corpora[catIndex];

    if (stimuli.length === 0) {
      return null; // No more stimuli available for this Cat
    }

    const { nextStimulus, remainingStimuli } = cat.findNextItem(stimuli);
    this.corpora[catIndex] = remainingStimuli; // Update the corpus for this Cat

    return nextStimulus;
  }

  /**
   * Get the next stimuli for all Cat instances.
   * @returns {Stimulus[]} An array of next stimuli for each Cat.
   */
  public getNextStimuli(): Stimulus[] {
    return this.cats
      .map((_, index) => this.getNextStimulus(index))
      .filter((stimulus): stimulus is Stimulus => stimulus !== null);
  }

  /**
   * Add a new Cat instance to the Clowder.
   * @param {CatInput} catInput - Configuration for the new Cat instance.
   * @param {Stimulus[]} stimuli - The corpus for the new Cat.
   */
  public addCat(catInput: CatInput, stimuli: Stimulus[]) {
    this.cats.push(new Cat(catInput));
    this.corpora.push(stimuli);
  }

  /**
   * Remove a Cat instance from the Clowder.
   * @param {number} catIndex - The index of the Cat instance to remove.
   */
  public removeCat(catIndex: number) {
    if (catIndex < 0 || catIndex >= this.cats.length) {
      throw new Error('Invalid Cat index');
    }

    this.cats.splice(catIndex, 1);
    this.corpora.splice(catIndex, 1);
  }
}
