import { Cat } from '../index';
import { Stimulus } from '../type';
import seedrandom from 'seedrandom';

describe('Cat', () => {
  let cat1: Cat, cat2: Cat, cat3: Cat, cat4: Cat, cat5: Cat, cat6: Cat, cat7: Cat;
  let rng = seedrandom();
  beforeEach(() => {
    cat1 = new Cat();
    cat1.updateAbilityEstimate(
      [
        { a: 2.225, b: -1.885, c: 0.21, d: 1 },
        { a: 1.174, b: -2.411, c: 0.212, d: 1 },
        { a: 2.104, b: -2.439, c: 0.192, d: 1 },
      ],
      [1, 0, 1],
    );

    cat2 = new Cat();
    cat2.updateAbilityEstimate(
      [
        { a: 1, b: -0.447, c: 0.5, d: 1 },
        { a: 1, b: 2.869, c: 0.5, d: 1 },
        { a: 1, b: -0.469, c: 0.5, d: 1 },
        { a: 1, b: -0.576, c: 0.5, d: 1 },
        { a: 1, b: -1.43, c: 0.5, d: 1 },
        { a: 1, b: -1.607, c: 0.5, d: 1 },
        { a: 1, b: 0.529, c: 0.5, d: 1 },
      ],
      [0, 1, 0, 1, 1, 1, 1],
    );
    cat3 = new Cat({ nStartItems: 0 });
    const randomSeed = 'test';
    rng = seedrandom(randomSeed);
    cat4 = new Cat({ nStartItems: 0, itemSelect: 'RANDOM', randomSeed });
    cat5 = new Cat({ nStartItems: 1, startSelect: 'miDdle' });

    cat6 = new Cat();
    cat6.updateAbilityEstimate(
      [
        { a: 1, b: -4.0, c: 0.5, d: 1 },
        { a: 1, b: -3.0, c: 0.5, d: 1 },
      ],
      [0, 0],
    );

    cat7 = new Cat({ method: 'eap' });
    cat7.updateAbilityEstimate(
      [
        { a: 1, b: -4.0, c: 0.5, d: 1 },
        { a: 1, b: -3.0, c: 0.5, d: 1 },
      ],
      [0, 0],
    );
  });

  const s1: Stimulus = { difficulty: 0.5, c: 0.5, word: 'looking' };
  const s2: Stimulus = { difficulty: 3.5, c: 0.5, word: 'opaque' };
  const s3: Stimulus = { difficulty: 2, c: 0.5, word: 'right' };
  const s4: Stimulus = { difficulty: -2.5, c: 0.5, word: 'yes' };
  const s5: Stimulus = { difficulty: -1.8, c: 0.5, word: 'mom' };
  const stimuli = [s1, s2, s3, s4, s5];

  it('constructs an adaptive test', () => {
    expect(cat1.method).toBe('mle');
    expect(cat1.itemSelect).toBe('mfi');
  });

  it('correctly updates ability estimate', () => {
    expect(cat1.theta).toBeCloseTo(-1.642307, 1);
  });

  it('correctly updates ability estimate', () => {
    expect(cat2.theta).toBeCloseTo(-1.272, 1);
  });

  it('correctly updates standard error of mean of ability estimate', () => {
    expect(cat2.seMeasurement).toBeCloseTo(1.71, 1);
  });

  it('correctly counts number of items', () => {
    expect(cat2.nItems).toEqual(7);
  });

  it('correctly updates answers', () => {
    expect(cat2.resps).toEqual([0, 1, 0, 1, 1, 1, 1]);
  });

  it('correctly updates zatas', () => {
    expect(cat2.zetas).toEqual([
      { a: 1, b: -0.447, c: 0.5, d: 1 },
      { a: 1, b: 2.869, c: 0.5, d: 1 },
      { a: 1, b: -0.469, c: 0.5, d: 1 },
      { a: 1, b: -0.576, c: 0.5, d: 1 },
      { a: 1, b: -1.43, c: 0.5, d: 1 },
      { a: 1, b: -1.607, c: 0.5, d: 1 },
      { a: 1, b: 0.529, c: 0.5, d: 1 },
    ]);
  });

  it('correctly suggests the next item (closest method)', () => {
    const expected = { nextStimulus: s5, remainingStimuli: [s4, s1, s3, s2] };
    const received = cat1.findNextItem(stimuli, 'closest');
    expect(received).toEqual(expected);
  });

  it('correctly suggests the next item (mfi method)', () => {
    const expected = { nextStimulus: s1, remainingStimuli: [s4, s5, s3, s2] };
    const received = cat3.findNextItem(stimuli, 'MFI');
    expect(received).toEqual(expected);
  });

  it('correctly suggests the next item (middle method)', () => {
    const expected = { nextStimulus: s1, remainingStimuli: [s4, s5, s3, s2] };
    const received = cat5.findNextItem(stimuli);
    expect(received).toEqual(expected);
  });

  it('correctly suggests the next item (random method)', () => {
    let received;
    const stimuliSorted = stimuli.sort((a: Stimulus, b: Stimulus) => a.difficulty - b.difficulty);
    let index = Math.floor(rng() * stimuliSorted.length);
    received = cat4.findNextItem(stimuliSorted);
    expect(received.nextStimulus).toEqual(stimuliSorted[index]);

    for (let i = 0; i < 3; i++) {
      const remainingStimuli = received.remainingStimuli;
      index = Math.floor(rng() * remainingStimuli.length);
      received = cat4.findNextItem(remainingStimuli);
      expect(received.nextStimulus).toEqual(remainingStimuli[index]);
    }
  });

  it('correctly updates ability estimate through MLE', () => {
    expect(cat6.theta).toBeCloseTo(-6.0, 1);
  });

  it('correctly updates ability estimate through EAP', () => {
    expect(cat7.theta).toBeCloseTo(0.25, 1);
  });

  it('should throw a error if zeta and answers do not have matching length', () => {
    try {
      cat7.updateAbilityEstimate(
        [
          { a: 1, b: -4.0, c: 0.5, d: 1 },
          { a: 1, b: -3.0, c: 0.5, d: 1 },
        ],
        [0, 0, 0],
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should throw a error if method is invalid', () => {
    try {
      new Cat({ method: 'coolMethod' });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    try {
      cat7.updateAbilityEstimate(
        [
          { a: 1, b: -4.0, c: 0.5, d: 1 },
          { a: 1, b: -3.0, c: 0.5, d: 1 },
        ],
        [0, 0],
        'coolMethod',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should throw a error if itemSelect is invalid', () => {
    try {
      new Cat({ itemSelect: 'coolMethod' });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    try {
      cat7.findNextItem(stimuli, 'coolMethod');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should throw a error if startSelect is invalid', () => {
    try {
      new Cat({ startSelect: 'coolMethod' });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
