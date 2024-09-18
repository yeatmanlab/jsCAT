import { Clowder, ClowderInput } from '../clowder';
import { MultiZetaStimulus, Zeta, ZetaCatMap } from '../type';
import { defaultZeta } from '../utils';

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

  test('should initialize with provided cats and corpora', () => {
    expect(Object.keys(clowder['cats'])).toContain('cat1');
    expect(clowder.remainingItems).toHaveLength(2);
    expect(clowder.corpus).toHaveLength(1);
  });

  test('should validate cat names', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'invalidCat',
      });
    }).toThrow('Invalid Cat name');
  });

  // test('should update ability estimates', () => {
  //   clowder.updateAbilityEstimates(['cat1'], createStimulus('1'), [0]);
  //   const cat1 = clowder['cats']['cat1'];
  //   expect(cat1.theta).toBeGreaterThanOrEqual(0); // Since we mock, assume the result is logical.
  // });

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

  test('should throw error if previousItems and previousAnswers have mismatched lengths', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        items: createMultiZetaStimulus('1', [createZetaCatMap(['cat1']), createZetaCatMap(['cat2'])]),
        answers: [1, 0], // Mismatched length
      });
    }).toThrow('Previous items and answers must have the same length.');
  });
});
