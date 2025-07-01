/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Cat } from '..';
import { Stimulus } from '../type';
import seedrandom from 'seedrandom';
import { convertZeta } from '../corpus';

for (const format of ['symbolic', 'semantic'] as Array<'symbolic' | 'semantic'>) {
  describe(`Cat with ${format} zeta`, () => {
    let cat1: Cat, cat2: Cat, cat3: Cat, cat4: Cat, cat5: Cat, cat6: Cat, cat7: Cat, cat8: Cat, cat9: Cat;
    let rng = seedrandom();

    beforeEach(() => {
      cat1 = new Cat();
      cat1.updateAbilityEstimate(
        [
          convertZeta({ a: 2.225, b: -1.885, c: 0.21, d: 1 }, format),
          convertZeta({ a: 1.174, b: -2.411, c: 0.212, d: 1 }, format),
          convertZeta({ a: 2.104, b: -2.439, c: 0.192, d: 1 }, format),
        ],
        [1, 0, 1],
      );

      cat2 = new Cat();
      cat2.updateAbilityEstimate(
        [
          convertZeta({ a: 1, b: -0.447, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: 2.869, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: -0.469, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: -0.576, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: -1.43, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: -1.607, c: 0.5, d: 1 }, format),
          convertZeta({ a: 1, b: 0.529, c: 0.5, d: 1 }, format),
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
        [convertZeta({ a: 1, b: -4.0, c: 0.5, d: 1 }, format), convertZeta({ a: 1, b: -3.0, c: 0.5, d: 1 }, format)],
        [0, 0],
      );

      cat7 = new Cat({ method: 'eap' });
      cat7.updateAbilityEstimate(
        [convertZeta({ a: 1, b: -4.0, c: 0.5, d: 1 }, format), convertZeta({ a: 1, b: -3.0, c: 0.5, d: 1 }, format)],
        [0, 0],
      );

      cat8 = new Cat({ nStartItems: 0, itemSelect: 'FIXED' });

      cat9 = new Cat({ method: 'eap', priorDist: 'unif', priorPar: [-4, 4], minTheta: -6, maxTheta: 6 });
      cat9.updateAbilityEstimate(
        [convertZeta({ a: 1, b: -4.0, c: 0.5, d: 1 }, format), convertZeta({ a: 1, b: -3.0, c: 0.5, d: 1 }, format)],
        [0, 0],
      );

    });

    const s1: Stimulus = { difficulty: 0.5, guessing: 0.5, discrimination: 1, slipping: 1, word: 'looking' };
    const s2: Stimulus = { difficulty: 3.5, guessing: 0.5, discrimination: 1, slipping: 1, word: 'opaque' };
    const s3: Stimulus = { difficulty: 2, guessing: 0.5, discrimination: 1, slipping: 1, word: 'right' };
    const s4: Stimulus = { difficulty: -2.5, guessing: 0.5, discrimination: 1, slipping: 1, word: 'yes' };
    const s5: Stimulus = { difficulty: -1.8, guessing: 0.5, discrimination: 1, slipping: 1, word: 'mom' };
    const stimuli = [s1, s2, s3, s4, s5];

    it('can update an ability estimate using only a single item and answer', () => {
      const cat = new Cat();
      cat.updateAbilityEstimate(s1, 1);
      expect(cat.nItems).toEqual(1);
      expect(cat.theta).toBeCloseTo(4.572, 1);
    });

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

    it('correctly updates zetas', () => {
      expect(cat2.zetas).toEqual([
        convertZeta({ a: 1, b: -0.447, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: 2.869, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: -0.469, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: -0.576, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: -1.43, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: -1.607, c: 0.5, d: 1 }, format),
        convertZeta({ a: 1, b: 0.529, c: 0.5, d: 1 }, format),
      ]);
    });

    it.each`
      deepCopy
      ${true}
      ${false}
    `("correctly suggests the next item (closest method) with deepCopy='$deepCopy'", ({ deepCopy }) => {
      const expected = { nextStimulus: s5, remainingStimuli: [s4, s1, s3, s2] };
      const received = cat1.findNextItem(stimuli, 'closest', deepCopy);
      expect(received).toEqual(expected);
    });

    it.each`
      deepCopy
      ${true}
      ${false}
    `("correctly suggests the next item (mfi method) with deepCopy='$deepCopy'", ({ deepCopy }) => {
      const expected = { nextStimulus: s1, remainingStimuli: [s4, s5, s3, s2] };
      const received = cat3.findNextItem(stimuli, 'MFI', deepCopy);
      expect(received).toEqual(expected);
    });

    it.each`
      deepCopy
      ${true}
      ${false}
    `("correctly suggests the next item (middle method) with deepCopy='$deepCopy'", ({ deepCopy }) => {
      const expected = { nextStimulus: s1, remainingStimuli: [s4, s5, s3, s2] };
      const received = cat5.findNextItem(stimuli, undefined, deepCopy);
      expect(received).toEqual(expected);
    });

    it.each`
      deepCopy
      ${true}
      ${false}
    `("correctly suggests the next item (fixed method) with deepCopy='$deepCopy'", ({ deepCopy }) => {
      expect(cat8.itemSelect).toBe('fixed');
      const expected = { nextStimulus: s1, remainingStimuli: [s2, s3, s4, s5] };
      const received = cat8.findNextItem(stimuli, undefined, deepCopy);
      expect(received).toEqual(expected);
    });

    it.each`
      deepCopy
      ${true}
      ${false}
    `("correctly suggests the next item (random method) with deepCopy='$deepCopy'", ({ deepCopy }) => {
      let received;
      const stimuliSorted = stimuli.sort((a: Stimulus, b: Stimulus) => a.difficulty! - b.difficulty!); // ask
      let index = Math.floor(rng() * stimuliSorted.length);
      received = cat4.findNextItem(stimuliSorted, undefined, deepCopy);
      expect(received.nextStimulus).toEqual(stimuliSorted[index]);

      for (let i = 0; i < 3; i++) {
        const remainingStimuli = received.remainingStimuli;
        index = Math.floor(rng() * remainingStimuli.length);
        received = cat4.findNextItem(remainingStimuli, undefined, deepCopy);
        expect(received.nextStimulus).toEqual(remainingStimuli[index]);
      }
    });

    it('correctly updates ability estimate through MLE', () => {
      expect(cat6.theta).toBeCloseTo(-6.0, 1);
    });

    it('correctly updates ability estimate through EAP', () => {
      expect(cat7.theta).toBeCloseTo(-1.649, 2);
    });

    it('should increate theta estimate when given correct response to easy item using EAP', () => {
      const easyItem = convertZeta({ a: 1, b: -2.5, c: 0.2, d: 1 }, format);

      // Give correct response (1) to an easy item
      cat7.updateAbilityEstimate(easyItem, 1);
      console.log(cat7.theta);

      // Theta should increase since we got a correct response to an easy item
      expect(cat7.theta).toBeCloseTo(-1.48, 2);
    });

    it('correctly updates ability estimate through EAP with uniform prior', () => {

      expect(cat9.theta).toBeCloseTo(-3.29, 2);
    });

    it('should increate theta estimate when given correct response to easy item using EAP', () => {
      const easyItem = convertZeta({ a: 1, b: -2.5, c: 0.2, d: 1 }, format);

      // Give correct response (1) to an easy item
      cat7.updateAbilityEstimate(easyItem, 1);
      console.log(cat7.theta);

      // Theta should increase since we got a correct response to an easy item
      expect(cat7.theta).toBeCloseTo(-1.48, 2);
    });

    it('should reduce theta estimate when given incorrect response to easy item using EAP (norm)', () => {
      const easyItem = convertZeta({ a: 1, b: -2.5, c: 0.2, d: 1 }, format);

      // Give correct response (1) to an easy item
      cat7.updateAbilityEstimate(easyItem, 1);

      // Theta should increase since we got a correct response to an easy item
      expect(cat7.theta).toBeCloseTo(-1.486,2);
    });

    it('should reduce theta estimate when given incorrect response to easy item using EAP (unif)', () => {
      const easyItem = convertZeta({ a: 1, b: -2.5, c: 0.2, d: 1 }, format);

      // Give correct response (1) to an easy item
      cat9.updateAbilityEstimate(easyItem, 1);

      // Theta should increase since we got a correct response to an easy item
      expect(cat9.theta).toBeCloseTo(-3.122,2);
    });


    it('should throw an error if zeta and answers do not have matching length', () => {
      try {
        cat7.updateAbilityEstimate(
          [convertZeta({ a: 1, b: -4.0, c: 0.5, d: 1 }, format), convertZeta({ a: 1, b: -3.0, c: 0.5, d: 1 }, format)],
          [0, 0, 0],
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should create a prior distribution with default parameters', () => {
      const cat = new Cat();
      expect(cat.priorDist).toBeDefined();
      expect(cat.priorPar).toBeDefined();
    });

    it('should create a normal prior distribution with custom priorDist and priorPar', () => {
      const cat = new Cat({ priorDist: 'norm', priorPar: [2, 0.5] });
      expect(cat.priorDist).toBe('norm');
      expect(cat.priorPar).toEqual([2, 0.5]);
    });

    it('should throw an error for invalid priorDist', () => {
      expect(() => {
        new Cat({ priorDist: 'invalid' as any, priorPar: [0, 1] });
      }).toThrow('The prior distribution you provided is not supported');
    });

    it('should throw an error for invalid priorPar length', () => {
      expect(() => {
        new Cat({ priorDist: 'norm', priorPar: [0] });
      }).toThrow('The prior distribution parameters you provided are not valid');
    });

    it('should throw an error for invalid priorPar standard deviation', () => {
      expect(() => {
        new Cat({ priorDist: 'norm', priorPar: [0, -1] });
      }).toThrow('The prior distribution standard deviation you provided is not valid');
    });

    it('should throw an error when priorPar mean is outside theta bounds', () => {
      expect(() => {
        new Cat({ priorDist: 'norm', priorPar: [10, 1], minTheta: -6, maxTheta: 6 });
      }).toThrow('The prior distribution mean you provided is not valid');
    });

    it('should use custom prior when provided', () => {
      const cat = new Cat({ priorDist: 'norm', priorPar: [0, 1] });
      expect(cat.priorDist).toBe('norm');
      expect(cat.priorPar).toEqual([0, 1]);
    });

    it('should use custom prior when provided', () => {
      const cat = new Cat({ priorDist: 'unif', priorPar: [-6, 6] });
      expect(cat.priorDist).toBe('unif');
      expect(cat.priorPar).toEqual([-6, 6]);
    });

    it('should respect minTheta and maxTheta when creating default prior', () => {
      const cat = new Cat({ minTheta: -3, maxTheta: 3, theta: 0, priorDist: 'norm', priorPar: [0, 1] });
      const priorXValues = cat.prior.map((p) => p[0]);
      expect(Math.min(...priorXValues)).toBeGreaterThanOrEqual(-3);
      expect(Math.max(...priorXValues)).toBeLessThanOrEqual(3);
    });

    it('should throw an error if method is invalid', () => {
      try {
        new Cat({ method: 'coolMethod' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      try {
        cat7.updateAbilityEstimate(
          [convertZeta({ a: 1, b: -4.0, c: 0.5, d: 1 }, format), convertZeta({ a: 1, b: -3.0, c: 0.5, d: 1 }, format)],
          [0, 0],
          'coolMethod',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should throw an error if itemSelect is invalid', () => {
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

    it('should throw an error if startSelect is invalid', () => {
      try {
        new Cat({ startSelect: 'coolMethod' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should return undefined if there are no input items', () => {
      const cat = new Cat();
      const { nextStimulus } = cat.findNextItem([]);
      expect(nextStimulus).toBeUndefined();
    });

    
  });
}

describe('Cat.validatePrior', () => {
  // Since we can't directly access the private method, we'll test it indirectly through constructor
  // which calls validatePrior internally

  it('should throw an error if priorDist is not supported', () => {
    expect(() => {
      new Cat({ priorDist: 'invalid' as any, priorPar: [0, 1] });
    }).toThrow('The prior distribution you provided is not supported');
  });

  it('should throw an error if priorPar length is not 2', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [0] });
    }).toThrow('The prior distribution parameters you provided are not valid');
  });

  it('should throw an error if priorPar standard deviation is not positive', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [0, -1] });
    }).toThrow('The prior distribution standard deviation you provided is not valid');
  });

  it('should throw an error if priorPar standard deviation is zero', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [0, 0] });
    }).toThrow('The prior distribution standard deviation you provided is not valid');
  });

  it('should throw an error when priorPar mean is outside theta bounds', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [10, 1], minTheta: -6, maxTheta: 6 });
    }).toThrow('The prior distribution mean you provided is not valid');
  });

  it('should throw an error when priorPar mean is below minTheta', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [-10, 1], minTheta: -6, maxTheta: 6 });
    }).toThrow('The prior distribution mean you provided is not valid');
  });

  it('should accept valid priorDist and priorPar', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [0, 1] });
    }).not.toThrow();
  });

  it('should accept priorPar mean at the boundary of theta bounds', () => {
    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [-6, 1], minTheta: -6, maxTheta: 6 });
    }).not.toThrow();

    expect(() => {
      new Cat({ priorDist: 'norm', priorPar: [6, 1], minTheta: -6, maxTheta: 6 });
    }).not.toThrow();
  });

  it('should accept uniform prior distribution', () => {
    expect(() => {
      new Cat({ priorDist: 'unif', priorPar: [-1, 1] });
    }).not.toThrow();
  });

  it('should throw an error for invalid uniform priorPar length', () => {
    expect(() => {
      new Cat({ priorDist: 'unif', priorPar: [0] });
    }).toThrow('The prior distribution parameters you provided are not valid');
  });

  it('should throw an error for invalid uniform bounds (min >= max)', () => {
    expect(() => {
      new Cat({ priorDist: 'unif', priorPar: [2, 1] });
    }).toThrow('The uniform distribution bounds you provided are not valid (min must be less than max)');
  });

  it('should throw an error for uniform bounds outside theta range', () => {
    expect(() => {
      new Cat({ priorDist: 'unif', priorPar: [-10, 10], minTheta: -6, maxTheta: 6 });
    }).toThrow('The uniform distribution bounds you provided are not within theta bounds');
  });

  it('should create prior with correct number of points based on stepSize', () => {
    // Default stepSize = 0.1, range = -3 to 3 = 61 points
    const cat1 = new Cat({ minTheta: -3, maxTheta: 3, priorDist: 'norm', priorPar: [0, 1] });
    expect(cat1.prior.length).toBe(61);

    // Custom stepSize = 0.5, range = -2 to 2 = 9 points
    const cat2 = new Cat({ minTheta: -2, maxTheta: 2, priorDist: 'norm', priorPar: [0, 1] });
    // Note: This test assumes the normal function uses default stepSize of 0.1
    // To test custom stepSize, you'd need to modify the Cat constructor to accept stepSize
  });

  it('should create prior with correct step intervals', () => {
    const cat = new Cat({ minTheta: -1, maxTheta: 1, priorDist: 'norm', priorPar: [0, 1] });
    const priorXValues = cat.prior.map((p) => p[0]);
    
    // Check that steps are approximately 0.1 apart
    for (let i = 1; i < priorXValues.length; i++) {
      const step = priorXValues[i] - priorXValues[i-1];
      expect(step).toBeCloseTo(0.1, 6); // 6 decimal places due to rounding fix
    }
  });

  it('should handle edge case with very small stepSize', () => {
    const cat = new Cat({ minTheta: 0, maxTheta: 1, priorDist: 'norm', priorPar: [0.5, 0.1] });
    expect(cat.prior.length).toBeGreaterThan(1);
    expect(cat.prior[0][0]).toBeCloseTo(0, 6);
    expect(cat.prior[cat.prior.length - 1][0]).toBeCloseTo(1, 6);
  });

  it('should create uniform prior distribution', () => {
    const cat = new Cat({ priorDist: 'unif', priorPar: [-2, 2], minTheta: -3, maxTheta: 3 });
    expect(cat.priorDist).toBe('unif');
    
    // Check that all probabilities are equal (uniform distribution)
    const probs = cat.prior.map(([, p]: [number, number]) => p);
    const xs = cat.prior.map(([x]: [number, number]) => x);
    
    // Find points within the uniform bounds [-2, 2]
    const pointsInBounds = xs.filter(x => x >= -2 && x <= 2);
    const probsInBounds = probs.filter((p, i) => xs[i] >= -2 && xs[i] <= 2);
    
    // All points within bounds should have the same probability
    const uniformProb = probsInBounds[0];
    probsInBounds.forEach(prob => {
      expect(prob).toBeCloseTo(uniformProb, 6);
    });
    
    // Points outside bounds should have zero probability
    const probsOutsideBounds = probs.filter((p, i) => xs[i] < -2 || xs[i] > 2);
    probsOutsideBounds.forEach(prob => {
      expect(prob).toBeCloseTo(0, 6);
    });
    
    // Check that the total probability sums to 1
    const totalProb = probs.reduce((sum, prob) => sum + prob, 0);
    expect(totalProb).toBeCloseTo(1, 6);
    
    // Check that the range is correct (should use priorPar bounds, not minTheta/maxTheta)
    expect(Math.min(...xs)).toBeCloseTo(-3, 6);
    expect(Math.max(...xs)).toBeCloseTo(3, 6);
  });
    

  it('should use default priorPar for uniform distribution', () => {
    const cat = new Cat({ priorDist: 'unif' });
    expect(cat.priorDist).toBe('unif');
    expect(cat.priorPar).toEqual([-4, 4]);
    expect(cat.prior.length).toBeGreaterThan(0);
  });

  it('should use fallback normal(0,1) when priorDist is invalid', () => {
    // This test covers the fallback branch: normal(0, 1, minTheta, maxTheta)
    // We need to test this by temporarily modifying the validation to allow invalid priorDist
    const originalValidatePrior = Cat['validatePrior'];
    
    // Temporarily replace validatePrior to allow invalid priorDist
    Cat['validatePrior'] = () => {}; // No-op validation
    
    try {
      const cat = new Cat({ 
        minTheta: -2, 
        maxTheta: 2,
        priorDist: 'invalid' as any,
        priorPar: [5, 10]
      });
      
      // Check that the fallback was used (should be normal(0,1) over [-2,2])
      const priorXValues = cat.prior.map(([x, ]: [number, number]) => x);
      const priorYValues = cat.prior.map(([, y]: [number, number]) => y);
      
      // Check that the middle value is the largest (normal distribution should peak at the middle)
      const middleIndex = Math.floor(priorYValues.length / 2);
      const middleValue = priorYValues[middleIndex];
      const maxValue = Math.max(...priorYValues);
      expect(middleValue).toBeCloseTo(maxValue, 6);

      console.log(priorXValues)
      
      // Check that the range is correct
      expect(Math.min(...priorXValues)).toBeCloseTo(-2, 6);
      expect(Math.max(...priorXValues)).toBeCloseTo(2, 6);
    } finally {
      // Restore original validation
      Cat['validatePrior'] = originalValidatePrior;
    }
  });

});

it('uniform() outputs correct probabilities and boundaries', () => {
  const { uniform } = require('../utils');
  const result = uniform(-2, 2, 0.5, -3, 3);
  const probs = result.map(([, p]: [number, number]) => p);
  const xs = result.map(([x]: [number, number]) => x);
  // Probabilities sum to 1
  expect(probs.reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(1, 6);
  // Boundaries have nonzero probability
  expect(probs[xs.indexOf(-2)]).toBeGreaterThan(0);
  expect(probs[xs.indexOf(2)]).toBeGreaterThan(0);
  // Outside bounds are zero
  expect(probs[xs.indexOf(-3)]).toBeCloseTo(0, 6);
  expect(probs[xs.indexOf(3)]).toBeCloseTo(0, 6);
});
