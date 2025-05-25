import { Cat, Clowder, ClowderInput } from '..';
import { MultiZetaStimulus, Zeta, ZetaCatMap } from '../type';
import { defaultZeta } from '../corpus';
import _uniq from 'lodash/uniq';
import { StopAfterNItems, StopIfSEMeasurementBelowThreshold, StopOnSEMeasurementPlateau } from '../stopping';

const createStimulus = (id: string) => ({
  ...defaultZeta(),
  id,
  content: `Stimulus content ${id}`,
});

const createMultiZetaStimulus = (id: string, zetas: ZetaCatMap[]): MultiZetaStimulus => ({
  id,
  content: `Multi-Zeta Stimulus content ${id}`,
  zetas,
});

const createZetaCatMap = (catNames: string[], zeta: Zeta = defaultZeta()): ZetaCatMap => ({
  cats: catNames,
  zeta,
});

describe('Clowder Class', () => {
  let clowder: Clowder;

  beforeEach(() => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'EAP', theta: -1.0 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1']), createZetaCatMap(['cat2'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1']), createZetaCatMap(['cat2'])]),
        createMultiZetaStimulus('2', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('3', [createZetaCatMap(['cat2'])]),
        createMultiZetaStimulus('4', []), // Unvalidated item
      ],
    };
    clowder = new Clowder(clowderInput);
  });

  it('initializes with provided cats and corpora', () => {
    expect(Object.keys(clowder.cats)).toContain('cat1');
    expect(clowder.remainingItems).toHaveLength(5);
    expect(clowder.corpus).toHaveLength(5);
    expect(clowder.seenItems).toHaveLength(0);
  });

  it('throws an error when given an invalid corpus', () => {
    expect(() => {
      const corpus: MultiZetaStimulus[] = [
        {
          id: 'item1',
          content: 'Item 1',
          zetas: [
            { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
            { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
            { cats: ['Model C'], zeta: { a: 1, b: 2, c: 0.3, d: 0.9 } },
          ],
        },
        {
          id: 'item2',
          content: 'Item 2',
          zetas: [{ cats: ['Model A', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } }],
        },
      ];

      new Clowder({ cats: { cat1: {} }, corpus });
    }).toThrowError('The cat names Model C are present in multiple corpora.');
  });

  it('validates cat names', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'invalidCat',
      });
    }).toThrowError('Invalid Cat name');
  });

  it('updates ability estimates only for the named cats', () => {
    const origTheta1 = clowder.cats.cat1.theta;
    const origTheta2 = clowder.cats.cat2.theta;

    clowder.updateAbilityEstimates(['cat1'], createStimulus('1'), [0]);

    expect(clowder.cats.cat1.theta).not.toBe(origTheta1);
    expect(clowder.cats.cat2.theta).toBe(origTheta2);
  });

  it('throws an error when updating ability estimates for an invalid cat', () => {
    expect(() => clowder.updateAbilityEstimates(['invalidCatName'], createStimulus('1'), [0])).toThrowError(
      'Invalid Cat name. Expected one of cat1, cat2. Received invalidCatName.',
    );
  });

  it('should return undefined if no validated items remain and returnUndefinedOnExhaustion is true', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
      ],
    };

    const clowder = new Clowder(clowderInput);

    // Use all the validated items for cat1
    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0], clowder.corpus[1]],
      answers: [1, 1],
    });

    // Try to get another validated item for cat1 with returnUndefinedOnExhaustion set to true
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      returnUndefinedOnExhaustion: true,
    });
    expect(clowder.stoppingReason).toBe('No validated items remaining for the requested corpus cat1');
    expect(nextItem).toBeUndefined();
  });

  it('should return an item from missing if catToSelect is "unvalidated", no unvalidated items remain, and returnUndefinedOnExhaustion is false', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]), // Validated item
        createMultiZetaStimulus('1', [createZetaCatMap([])]), // Unvalidated item
        createMultiZetaStimulus('2', [createZetaCatMap(['cat1'])]), // Unvalidated item
      ],
    };

    const clowder = new Clowder(clowderInput);

    // Exhaust the unvalidated items
    clowder.updateCatAndGetNextItem({
      catToSelect: 'unvalidated',
      items: [clowder.corpus[1]],
      answers: [1],
    });

    const nDraws = 50;
    // Simulate sDraws unvalidated items being selected
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array(nDraws).fill(0)) {
      // Attempt to get another unvalidated item with returnUndefinedOnExhaustion set to false
      const nextItem = clowder.updateCatAndGetNextItem({
        catToSelect: 'unvalidated',
        returnUndefinedOnExhaustion: false,
      });

      // Should return a validated item since no unvalidated items remain
      expect(['0', '2']).toContain(nextItem?.id); // Item ID should match any of the items for cat2
    }
  });

  it.each`
    property
    ${'theta'}
    ${'seMeasurement'}
    ${'nItems'}
    ${'resps'}
    ${'zetas'}
  `("accesses the '$property' property of each cat", ({ property }) => {
    clowder.updateAbilityEstimates(['cat1'], createStimulus('1'), [0]);
    clowder.updateAbilityEstimates(['cat2'], createStimulus('1'), [1]);
    const expected = {
      cat1: clowder.cats['cat1'][property as keyof Cat],
      cat2: clowder.cats['cat2'][property as keyof Cat],
    };
    expect(clowder[property as keyof Clowder]).toEqual(expected);
  });

  it('throws an error if items and answers have mismatched lengths', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        items: createMultiZetaStimulus('1', [createZetaCatMap(['cat1']), createZetaCatMap(['cat2'])]),
        answers: [1, 0], // Mismatched length
      });
    }).toThrow('Previous items and answers must have the same length.');
  });

  it('throws an error if catToSelect is invalid', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'invalidCatName',
      });
    }).toThrow('Invalid Cat name. Expected one of cat1, cat2, unvalidated. Received invalidCatName.');
  });

  it('should allow selecting items from a different corpus than catToSelect', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('item1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('item2', [createZetaCatMap(['cat1', 'cat2'])]),
        createMultiZetaStimulus('item3', [createZetaCatMap(['cat1', 'cat2'])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    // Use cat1's ability estimate but select from cat2's item pool
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      corpusToSelectFrom: 'cat2',
    });

    // Should select an item from cat2's pool
    expect(['item2', 'item3']).toContain(nextItem?.id);
  });

  it('should validate corpusToSelectFrom parameter', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [createMultiZetaStimulus('item1', [createZetaCatMap(['cat1'])])],
    };
    const clowder = new Clowder(clowderInput);

    // Should throw when corpusToSelectFrom doesn't exist
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        corpusToSelectFrom: 'nonexistent',
      });
    }).toThrow('Invalid Cat name. Expected one of cat1, unvalidated. Received nonexistent.');
  });

  it('should use catToSelect as corpus when corpusToSelectFrom is not provided', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [createMultiZetaStimulus('item1', [createZetaCatMap(['cat1'])])],
    };
    const clowder = new Clowder(clowderInput);

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
    });

    expect(nextItem?.id).toBe('item1');
  });

  it('should show correct stopping reason when no items remain in specified corpus', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        // cat2 has no items
        createMultiZetaStimulus('item1', [createZetaCatMap(['cat1'])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      corpusToSelectFrom: 'cat2',
      returnUndefinedOnExhaustion: true,
    });

    expect(clowder.stoppingReason).toBe('No validated items remaining for the requested corpus cat2');
    expect(nextItem).toBeUndefined();
  });

  it('should allow selecting from one corpus and updating multiple cats', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'MLE', theta: 0.5 },
        cat3: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('prev_item', [createZetaCatMap(['cat1', 'cat2'])]),
        createMultiZetaStimulus('item3', [createZetaCatMap(['cat1', 'cat3'])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    // Update cat1 and cat2, but select next item from cat3
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      corpusToSelectFrom: 'cat3',
      catsToUpdate: ['cat1', 'cat2'],
      items: [clowder.corpus[0]],
      answers: [1],
    });

    expect(nextItem?.id).toBe('item3');
  });

  it('should warn when selecting from a corpus with items that lack parameters for the selecting cat', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        // Only has parameters for cat2
        createMultiZetaStimulus('item1', [createZetaCatMap(['cat2'])]),
        createMultiZetaStimulus('item2', [createZetaCatMap(['cat2'])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    // Try to select using cat1's ability estimate from cat2's corpus
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      corpusToSelectFrom: 'cat2',
      returnUndefinedOnExhaustion: false,
    });

    // Should warn about missing parameters
    expect(consoleSpy).toHaveBeenCalledWith(
      'No items available for cat cat1 in corpus cat2. ' +
        'This will still work but is probably not what you intended. Typically ' +
        'the corpusToSelectFrom will be a subset of the corpus for catToSelect, ' +
        "such as when a 'total' cat is selecting from a sub-domain corpus."
    );

    // Should still return an item since returnUndefinedOnExhaustion is false
    expect(['item1', 'item2']).toContain(nextItem?.id);

    consoleSpy.mockRestore();
  });

  it('throws an error if any of catsToUpdate is invalid', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        catsToUpdate: ['invalidCatName', 'cat2'],
      });
    }).toThrow('Invalid Cat name. Expected one of cat1, cat2. Received invalidCatName.');
  });

  it('updates seen and remaining items', () => {
    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat2',
      catsToUpdate: ['cat1', 'cat2'],
      items: [clowder.corpus[0], clowder.corpus[1], clowder.corpus[2]],
      answers: [1, 1, 1],
    });

    expect(clowder.seenItems).toHaveLength(3);
    expect(clowder.remainingItems).toHaveLength(2);
  });

  it('should select an item that has not yet been seen', () => {
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat2',
      catsToUpdate: ['cat1', 'cat2'],
      items: [clowder.corpus[0], clowder.corpus[1], clowder.corpus[2]],
      answers: [1, 1, 1],
    });

    expect([clowder.corpus[3], clowder.corpus[4]]).toContainEqual(nextItem); // Third validated stimulus
  });

  it('should select a validated item if validated items are present and randomlySelectUnvalidated is false', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'EAP', theta: -1.0 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat2'])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      randomlySelectUnvalidated: false,
    });
    expect(nextItem?.id).toMatch(/^(0|1)$/);
  });

  it('should return an item from missing if no validated items remain and returnUndefinedOnExhaustion is false', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'EAP', theta: -1.0 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat2'])]), // Validated for cat2
        createMultiZetaStimulus('1', [createZetaCatMap(['cat2'])]), // Validated for cat2
        createMultiZetaStimulus('2', [createZetaCatMap([])]), // Unvalidated
      ],
    };

    const clowder = new Clowder(clowderInput);

    // Should return an item from `missing`, which are items validated for cat2 or unvalidated
    const nDraws = 50;
    // Simulate sDraws unvalidated items being selected
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array(nDraws).fill(0)) {
      // Attempt to select an item for cat1, which has no validated items in the corpus
      const nextItem = clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        returnUndefinedOnExhaustion: false, // Ensure fallback is enabled
      });
      expect(['0', '1', '2']).toContain(nextItem?.id); // Item ID should match any of the items for cat2
    }
  });

  it('should select an unvalidated item if catToSelect is "unvalidated"', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap([])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('2', [createZetaCatMap([])]),
        createMultiZetaStimulus('3', [createZetaCatMap(['cat1'])]),
      ],
    };

    const clowder = new Clowder(clowderInput);

    const nDraws = 50;
    // Simulate sDraws unvalidated items being selected
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array(nDraws).fill(0)) {
      const nextItem = clowder.updateCatAndGetNextItem({
        catToSelect: 'unvalidated',
      });

      expect(['0', '2']).toContain(nextItem?.id);
    }
  });

  it('should not update cats with items that do not have parameters for that cat', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('2', [createZetaCatMap(['cat2'])]),
        createMultiZetaStimulus('3', [createZetaCatMap(['cat2'])]),
      ],
    };

    const clowder = new Clowder(clowderInput);

    clowder.updateCatAndGetNextItem({
      catsToUpdate: ['cat1', 'cat2'],
      items: clowder.corpus,
      answers: [1, 1, 1, 1],
      catToSelect: 'unvalidated',
    });

    expect(clowder.nItems.cat1).toBe(2);
    expect(clowder.nItems.cat2).toBe(2);
  });

  it('should not update any cats if only unvalidated items have been seen', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap([])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('2', [createZetaCatMap([])]),
        createMultiZetaStimulus('3', [createZetaCatMap(['cat1'])]),
      ],
    };

    const clowder = new Clowder(clowderInput);

    clowder.updateCatAndGetNextItem({
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0], clowder.corpus[2]],
      answers: [1, 1],
      catToSelect: 'unvalidated',
    });

    expect(clowder.nItems.cat1).toBe(0);
  });

  it('should return undefined for next item if catToSelect = "unvalidated" and no unvalidated items remain', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap([])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('2', [createZetaCatMap([])]),
        createMultiZetaStimulus('3', [createZetaCatMap(['cat1'])]),
      ],
    };

    const clowder = new Clowder(clowderInput);

    const nextItem = clowder.updateCatAndGetNextItem({
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0], clowder.corpus[2]],
      answers: [1, 1],
      catToSelect: 'unvalidated',
    });
    expect(clowder.stoppingReason).toBe('No unvalidated items remaining');
    expect(nextItem).toBeUndefined();
  });

  it('should correctly update ability estimates during the updateCatAndGetNextItem method', () => {
    const originalTheta = clowder.cats.cat1.theta;
    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0]],
      answers: [1],
    });
    expect(clowder.cats.cat1.theta).not.toBe(originalTheta);
  });

  it('should randomly choose between validated and unvalidated items if randomlySelectUnvalidated is true', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]), // Validated item
        createMultiZetaStimulus('1', [createZetaCatMap([])]), // Unvalidated item
        createMultiZetaStimulus('2', [createZetaCatMap([])]), // Unvalidated item
        createMultiZetaStimulus('3', [createZetaCatMap([])]), // Validated item
      ],
      randomSeed: 'randomSeed',
    };
    const clowder = new Clowder(clowderInput);

    const nextItems = Array(20)
      .fill('-1')
      .map(() => {
        return clowder.updateCatAndGetNextItem({
          catToSelect: 'cat1',
          randomlySelectUnvalidated: true,
        });
      });

    const itemsId = nextItems.map((item) => item?.id);

    expect(nextItems).toBeDefined();
    expect(_uniq(itemsId)).toEqual(expect.arrayContaining(['0', '1', '2', '3'])); // Could be validated or unvalidated
  });

  it('should return undefined if no more items remain', () => {
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      items: clowder.remainingItems,
      answers: [1, 0, 1, 1, 0], // Exhaust all items
    });

    expect(nextItem).toBeUndefined();
  });

  it('can receive one item and answer as an input', () => {
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      items: clowder.corpus[0],
      answers: 1,
    });
    expect(nextItem).toBeDefined();
  });

  it('can receive only one catToUpdate', () => {
    const originalTheta = clowder.cats.cat1.theta;
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: 'cat1',
      items: clowder.corpus[0],
      answers: 1,
    });
    expect(nextItem).toBeDefined();
    expect(clowder.cats.cat1.theta).not.toBe(originalTheta);
  });

  it('should update early stopping conditions based on number of items presented', () => {
    const earlyStopping = new StopOnSEMeasurementPlateau({
      patience: { cat1: 2 }, // Requires 2 items to check for plateau
      tolerance: { cat1: 0.05 }, // SE change tolerance
    });

    const clowder = new Clowder({
      cats: { cat1: { method: 'MLE', theta: 0.5 } },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
      ],
      earlyStopping,
    });

    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0]],
      answers: [1],
    });

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[1]],
      answers: [1],
    });

    expect(clowder.earlyStopping?.earlyStop).toBe(true); // Should stop after 2 items
    expect(clowder.stoppingReason).toBe('Early stopping');
    expect(nextItem).toBe(undefined); // Expect undefined after early stopping
  });
});

describe('Clowder Early Stopping', () => {
  let clowder: Clowder;

  beforeEach(() => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
      ],
    };
    clowder = new Clowder(clowderInput);
  });

  it('should trigger early stopping after required number of items', () => {
    const earlyStopping = new StopAfterNItems({
      requiredItems: { cat1: 2 }, // Stop after 2 items
    });

    clowder = new Clowder({
      cats: { cat1: { method: 'MLE', theta: 0.5 } },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]), // This item should trigger early stopping
        createMultiZetaStimulus('2', [createZetaCatMap(['cat1'])]),
      ],
      earlyStopping,
    });

    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[0]],
      answers: [1],
    });

    expect(clowder.earlyStopping?.earlyStop).toBe(false);

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[1]],
      answers: [1],
    });

    expect(clowder.earlyStopping?.earlyStop).toBe(true); // Early stop should be triggered after 2 items
    expect(nextItem).toBe(undefined); // No further items should be selected
    expect(clowder.stoppingReason).toBe('Early stopping');
  });

  it('should handle StopIfSEMeasurementBelowThreshold condition', () => {
    const earlyStopping = new StopIfSEMeasurementBelowThreshold({
      seMeasurementThreshold: { cat1: 0.2 }, // Stop if SE drops below 0.2
      patience: { cat1: 2 },
      tolerance: { cat1: 0.01 },
    });

    const zetaMap = createZetaCatMap(['cat1'], {
      a: 6,
      b: 6,
      c: 0,
      d: 1,
    });

    const corpus = [
      createMultiZetaStimulus('0', [zetaMap]),
      createMultiZetaStimulus('1', [zetaMap]),
      createMultiZetaStimulus('2', [zetaMap]), // Here the SE measurement drops below threshold
      createMultiZetaStimulus('3', [zetaMap]), // And here, early stopping should be triggered because it has been below threshold for 2 items
    ];

    clowder = new Clowder({
      cats: { cat1: { method: 'MLE', theta: 0.5 } },
      corpus,
      earlyStopping,
    });

    for (const item of corpus) {
      const nextItem = clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        catsToUpdate: ['cat1'],
        items: [item],
        answers: [1],
      });

      if (item.id === '3') {
        expect(clowder.earlyStopping?.earlyStop).toBe(true); // Should stop after SE drops below threshold
        expect(clowder.stoppingReason).toBe('Early stopping');
        expect(nextItem).toBe(undefined); // No further items should be selected
      } else {
        expect(clowder.earlyStopping?.earlyStop).toBe(false);
        expect(nextItem).toBeDefined();
      }
    }
  });
});
