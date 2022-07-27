import { itemResponseFunction } from '../index';
import { estimateAbility } from '../index';
import { findNextItem } from '../index';
import { Stimulus } from '../index';

describe('itemResponseFunction', () => {
  it('correctly calculates the probability', () => {
    expect(0.7234).toBeCloseTo(itemResponseFunction(0, { a: 1, b: -0.3, c: 0.35, d: 1 }), 2);

    expect(0.5).toBeCloseTo(itemResponseFunction(0, { a: 1, b: 0, c: 0, d: 1 }), 2);

    expect(0.625).toBeCloseTo(itemResponseFunction(0, { a: 0.5, b: 0, c: 0.25, d: 1 }), 2);
  });
});

describe('estimateAbility', () => {
  it('correctly estimates the ability', () => {
    expect(-1.642307).toBeCloseTo(
      estimateAbility(
        [1, 0, 1],
        [
          { a: 2.225, b: -1.885, c: 0.21, d: 1 },
          { a: 1.174, b: -2.411, c: 0.212, d: 1 },
          { a: 2.104, b: -2.439, c: 0.192, d: 1 },
        ],
        'MLE',
      ),
      2,
    );
    /*
        expect(0.1635256).toBeCloseTo(
            estimateAbility([1, 1, 1],
                [{a: 2.225, b: -1.885, c: 0.210, d: 1},
                    {a: 1.174, b: -2.411, c: 0.212, d: 1},
                    {a: 2.104, b: -2.439, c: 0.192, d: 1}],
                'EAP'),
            2
        );
         */
  });
});

const s1: Stimulus = { difficulty: 0.5, word: 'hello' };
const s2: Stimulus = { difficulty: 3, word: 'hi' };
const s3: Stimulus = { difficulty: -1.8, word: 'greeting' };

describe('findNextItem', () => {
  it('correctly suggests the next item', () => {
    const expected = { nextStimulus: s1, remainingStimuli: [s3, s2] };
    const received = findNextItem([s1, s2, s3], 0, 'MFI', true);
    expect(received).toEqual(expected);
  });
});
