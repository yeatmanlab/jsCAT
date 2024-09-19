import { Cat } from '..';
import { Clowder, ClowderInput } from '../clowder';
import { MultiZetaStimulus, Zeta, ZetaCatMap } from '../type';
import { defaultZeta } from '../utils';

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

  // test('should select next stimulus from validated stimuli', () => {
  //   const nextItem = clowder.updateCatAndGetNextItem({
  //     catToSelect: 'cat1',
  //     catsToUpdate: ['cat1'],
  //     previousItems: [createStimulus('1')],
  //     previousAnswers: [1],
  //   });
  //   expect(nextItem).toEqual(createStimulus('1')); // Second validated stimulus
  // });

  // test('should return unvalidated stimulus when no validated stimuli remain', () => {
  //   clowder.updateCatAndGetNextItem({
  //     catToSelect: 'cat1',
  //     previousItems: [createStimulus('1'), createStimulus('2')],
  //     previousAnswers: [1, 0],
  //   });

  //   const nextItem = clowder.updateCatAndGetNextItem({
  //     catToSelect: 'cat1',
  //     previousItems: [],
  //     previousAnswers: [],
  //   });
  //   expect(nextItem).toEqual(createStimulus('1')); // Unvalidated item
  // });

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
});
