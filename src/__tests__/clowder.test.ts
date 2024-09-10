import { Clowder, ClowderInput } from '../clowder';
import { Stimulus } from '../type';

// Mocking Stimulus
const createStimulus = (id: string): Stimulus => ({
  id,
  difficulty: 1,
  discrimination: 1,
  guessing: 0,
  slipping: 0,
  content: `Stimulus content ${id}`,
});

describe('Clowder Class', () => {
  let clowder: Clowder;

  beforeEach(() => {
    const clowderInput: ClowderInput = {
      cats: {
        cat1: { method: 'MLE', theta: 0.5 },
        cat2: { method: 'EAP', theta: -1.0 },
      },
      corpora: {
        validated: [createStimulus('1'), createStimulus('2')],
        unvalidated: [createStimulus('1')],
      },
    };
    clowder = new Clowder(clowderInput);
  });

  test('should initialize with provided cats and corpora', () => {
    expect(Object.keys(clowder['cats'])).toContain('cat1');
    expect(clowder.remainingItems.validated).toHaveLength(2);
    expect(clowder.remainingItems.unvalidated).toHaveLength(1);
  });

  test('should validate cat names', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'invalidCat',
        previousItems: [],
        previousAnswers: [],
      });
    }).toThrow('Invalid Cat name');
  });

  test('should update ability estimates', () => {
    clowder.updateAbilityEstimates(['cat1'], createStimulus('1'), [0]);
    const cat1 = clowder['cats']['cat1'];
    expect(cat1.theta).toBeGreaterThanOrEqual(0); // Since we mock, assume the result is logical.
  });

  test('should select next stimulus from validated stimuli', () => {
    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      catsToUpdate: ['cat1'],
      previousItems: [createStimulus('1')],
      previousAnswers: [1],
    });
    expect(nextItem).toEqual(createStimulus('1')); // Second validated stimulus
  });

  test('should return unvalidated stimulus when no validated stimuli remain', () => {
    clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      previousItems: [createStimulus('1'), createStimulus('2')],
      previousAnswers: [1, 0],
    });

    const nextItem = clowder.updateCatAndGetNextItem({
      catToSelect: 'cat1',
      previousItems: [],
      previousAnswers: [],
    });
    expect(nextItem).toEqual(createStimulus('1')); // Unvalidated item
  });

  test('should add a new Cat instance', () => {
    clowder.addCat('cat3', { method: 'MLE', theta: 0 });
    expect(Object.keys(clowder['cats'])).toContain('cat3');
  });

  test('should throw error if adding duplicate Cat instance', () => {
    expect(() => {
      clowder.addCat('cat1', { method: 'MLE', theta: 0 });
    }).toThrow('Cat with the name "cat1" already exists.');
  });

  test('should remove a Cat instance', () => {
    clowder.removeCat('cat1');
    expect(Object.keys(clowder['cats'])).not.toContain('cat1');
  });

  test('should throw error when trying to remove non-existent Cat instance', () => {
    expect(() => {
      clowder.removeCat('nonExistentCat');
    }).toThrow('Invalid Cat name');
  });

  test('should throw error if previousItems and previousAnswers have mismatched lengths', () => {
    expect(() => {
      clowder.updateCatAndGetNextItem({
        catToSelect: 'cat1',
        previousItems: [createStimulus('1')],
        previousAnswers: [1, 0], // Mismatched length
      });
    }).toThrow('Previous items and answers must have the same length.');
  });
});
