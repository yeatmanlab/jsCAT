import { Clowder } from '../Clowder';
import { Stimulus } from '../type';
import { CatInput } from '../index';

describe('Clowder', () => {
  let clowder: Clowder;

  const cat1Input: CatInput = {
    method: 'MLE',
    itemSelect: 'MFI',
  };

  const cat2Input: CatInput = {
    method: 'EAP',
    itemSelect: 'closest',
  };

  const stimuli1: Stimulus[] = [
    { difficulty: 0.5, c: 0.5, word: 'looking' },
    { difficulty: 3.5, c: 0.5, word: 'opaque' },
    { difficulty: 2, c: 0.5, word: 'right' },
    { difficulty: -2.5, c: 0.5, word: 'yes' },
    { difficulty: -1.8, c: 0.5, word: 'mom' },
  ];

  const stimuli2: Stimulus[] = [
    { difficulty: 1.0, c: 0.5, word: 'cat' },
    { difficulty: -1.0, c: 0.5, word: 'dog' },
    { difficulty: 2.0, c: 0.5, word: 'fish' },
  ];

  beforeEach(() => {
    clowder = new Clowder({
      cats: [cat1Input, cat2Input],
      corpora: [stimuli1, stimuli2],
    });
  });

  it('correctly suggests the next stimulus for each Cat', () => {
    const nextStimuli = clowder.getNextStimuli();
    expect(nextStimuli.length).toBe(2);
    expect(nextStimuli[0]).toEqual(stimuli1[0]); // Expect first stimulus for cat1
    expect(nextStimuli[1]).toEqual(stimuli2[0]); // Expect first stimulus for cat2
  });

  it('correctly manages remaining stimuli after selection', () => {
    clowder.getNextStimulus(0);
    const expectedStimulus = { difficulty: -1.8, c: 0.5, word: 'mom' };
    expect(clowder.getNextStimulus(0)).toEqual(expectedStimulus); // Adjusted expectation
  });

  it('throws an error if trying to access an invalid Cat index', () => {
    expect(() => clowder.getNextStimulus(2)).toThrow(Error);
    expect(() => clowder.getNextStimulus(-1)).toThrow(Error);
  });

  it('allows adding a new Cat and correctly suggests the next stimulus', () => {
    const newCatInput: CatInput = {
      method: 'MLE',
      itemSelect: 'random',
    };
    const newStimuli: Stimulus[] = [
      { difficulty: 1.5, c: 0.5, word: 'lion' },
      { difficulty: -0.5, c: 0.5, word: 'tiger' },
    ];

    clowder.addCat(newCatInput, newStimuli);

    const nextStimulus = clowder.getNextStimulus(2);
    expect(nextStimulus).toBeDefined();
    expect(newStimuli).toContainEqual(nextStimulus); // Use toContainEqual
  });

  it('allows removing a Cat and handles stimuli accordingly', () => {
    clowder.removeCat(1);
    expect(() => clowder.getNextStimulus(1)).toThrow(Error); // Cat2 should be removed
    expect(clowder.getNextStimuli().length).toBe(1); // Only one Cat remains
  });

  it('correctly suggests the next item (random method)', () => {
    const randomCatInput: CatInput = {
      itemSelect: 'random',
      randomSeed: 'test-seed', // Ensure seed is correctly set
    };
    const randomStimuli: Stimulus[] = stimuli1.slice(); // Copy of stimuli1 for testing
    clowder.addCat(randomCatInput, randomStimuli);

    const nextStimulus = clowder.getNextStimulus(2); // New Cat at index 2
    expect(randomStimuli).toContainEqual(nextStimulus); // Check if nextStimulus is one of the randomStimuli
  });
});
