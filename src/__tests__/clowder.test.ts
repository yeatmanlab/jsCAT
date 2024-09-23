import { Cat, Clowder, ClowderInput } from '..';
import { MultiZetaStimulus, Zeta, ZetaCatMap } from '../type';
import { defaultZeta } from '../corpus';
import _uniq from 'lodash/uniq';

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
        createMultiZetaStimulus('4', []),
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
          stimulus: 'Item 1',
          zetas: [
            { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
            { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
            { cats: ['Model C'], zeta: { a: 1, b: 2, c: 0.3, d: 0.9 } },
          ],
        },
        {
          stimulus: 'Item 2',
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
    }).toThrow('Invalid Cat name. Expected one of cat1, cat2. Received invalidCatName.');
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
    expect(nextItem?.id).toBe('0');
  });

  it('should select an unvalidated item if no validated items remain', () => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
      },
      corpus: [
        createMultiZetaStimulus('0', [createZetaCatMap([])]),
        createMultiZetaStimulus('1', [createZetaCatMap(['cat1'])]),
        createMultiZetaStimulus('2', [createZetaCatMap([])]),
      ],
    };
    const clowder = new Clowder(clowderInput);

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      items: [clowder.corpus[1]],
      answers: [1],
    });
    expect(nextItem).toBeDefined();
    expect(['0', '2']).toContain(nextItem?.id);
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
    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      items: clowder.remainingItems,
      answers: [1, 0, 1, 1, 0], // Exhaust all items
    });

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
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
});
