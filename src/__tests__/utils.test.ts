import { Stimulus, Zeta } from '../type';
import {
  itemResponseFunction,
  fisherInformation,
  findClosest,
  validateZetaParams,
  ZETA_KEY_MAP,
  defaultZeta,
  fillZetaDefaults,
  convertZeta,
} from '../utils';
import _omit from 'lodash/omit';

describe('itemResponseFunction', () => {
  it('correctly calculates the probability', () => {
    expect(itemResponseFunction(0, { a: 1, b: -0.3, c: 0.35, d: 1 })).toBeCloseTo(0.7234, 2);
    expect(itemResponseFunction(0, { a: 1, b: 0, c: 0, d: 1 })).toBeCloseTo(0.5, 2);
    expect(itemResponseFunction(0, { a: 0.5, b: 0, c: 0.25, d: 1 })).toBeCloseTo(0.625, 2);
  });
});

describe('fisherInformation', () => {
  it('correctly calculates the information', () => {
    expect(fisherInformation(0, { a: 1.53, b: -0.5, c: 0.5, d: 1 })).toBeCloseTo(0.206, 2);
    expect(fisherInformation(2.35, { a: 1, b: 2, c: 0.3, d: 1 })).toBeCloseTo(0.1401, 2);
  });
});

describe('findClosest', () => {
  const stimuli = [
    { difficulty: 1, discrimination: 1, guessing: 0.25, slipping: 0.75 },
    { difficulty: 4, discrimination: 1, guessing: 0.25, slipping: 0.75 },
    { difficulty: 10, discrimination: 1, guessing: 0.25, slipping: 0.75 },
    { difficulty: 11, discrimination: 1, guessing: 0.25, slipping: 0.75 },
  ];

  it('correctly selects the first item if appropriate', () => {
    expect(findClosest(stimuli, 0)).toBe(0);
  });

  it('correctly selects the last item if appropriate', () => {
    expect(findClosest(stimuli, 1000)).toBe(3);
  });

  it('correctly selects a middle item if it equals exactly', () => {
    expect(findClosest(stimuli, 10)).toBe(2);
  });

  it('correctly selects the one item closest to the target if less than', () => {
    const stimuliWithDecimal = [
      { difficulty: 1.1, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 4.2, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 10.3, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 11.4, discrimination: 1, guessing: 0.25, slipping: 0.75 },
    ];
    expect(findClosest(stimuliWithDecimal, 5.1)).toBe(1);
  });

  it('correctly selects the one item closest to the target if greater than', () => {
    const stimuliWithDecimal = [
      { difficulty: 1.1, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 4.2, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 10.3, discrimination: 1, guessing: 0.25, slipping: 0.75 },
      { difficulty: 11.4, discrimination: 1, guessing: 0.25, slipping: 0.75 },
    ];
    expect(findClosest(stimuliWithDecimal, 9.1)).toBe(2);
  });
});

describe('validateZetaParams', () => {
  it('throws an error when providing both a and discrimination', () => {
    expect(() => validateZetaParams({ a: 1, discrimination: 1 })).toThrow(
      'This item has both an `a` key and `discrimination` key. Please provide only one.',
    );
  });

  it('throws an error when providing both b and difficulty', () => {
    expect(() => validateZetaParams({ b: 1, difficulty: 1 })).toThrow(
      'This item has both a `b` key and `difficulty` key. Please provide only one.',
    );
  });

  it('throws an error when providing both c and guessing', () => {
    expect(() => validateZetaParams({ c: 1, guessing: 1 })).toThrow(
      'This item has both a `c` key and `guessing` key. Please provide only one.',
    );
  });

  it('throws an error when providing both d and slipping', () => {
    expect(() => validateZetaParams({ d: 1, slipping: 1 })).toThrow(
      'This item has both a `d` key and `slipping` key. Please provide only one.',
    );
  });

  it('throws an error when requiring all keys and missing one', () => {
    for (const key of ['a', 'b', 'c', 'd'] as (keyof typeof ZETA_KEY_MAP)[]) {
      const semanticKey = ZETA_KEY_MAP[key];
      const zeta = _omit(defaultZeta('symbolic'), [key]);

      expect(() => validateZetaParams(zeta, true)).toThrow(
        `This item is missing the key \`${String(key)}\` or \`${semanticKey}\`.`,
      );
    }
  });
});

describe('fillZetaDefaults', () => {
  it('fills in default values for missing keys', () => {
    const zeta: Zeta = {
      difficulty: 1,
      guessing: 0.5,
    };

    const filledZeta = fillZetaDefaults(zeta, 'semantic');

    expect(filledZeta).toEqual({
      discrimination: 1,
      difficulty: 1,
      guessing: 0.5,
      slipping: 1,
    });
  });

  it('does not modify the input object when no missing keys', () => {
    const zeta: Zeta = {
      a: 5,
      b: 5,
      c: 5,
      d: 5,
    };

    const filledZeta = fillZetaDefaults(zeta, 'symbolic');

    expect(filledZeta).toEqual(zeta);
  });

  it('converts to semantic format when desired', () => {
    const zeta: Zeta = {
      a: 5,
      b: 5,
    };

    const filledZeta = fillZetaDefaults(zeta, 'semantic');

    expect(filledZeta).toEqual({
      difficulty: 5,
      discrimination: 5,
      guessing: 0,
      slipping: 1,
    });
  });

  it('converts to symbolic format when desired', () => {
    const zeta: Zeta = {
      difficulty: 5,
      discrimination: 5,
    };

    const filledZeta = fillZetaDefaults(zeta, 'symbolic');

    expect(filledZeta).toEqual({
      a: 5,
      b: 5,
      c: 0,
      d: 1,
    });
  });
});

describe('convertZeta', () => {
  it('converts from symbolic format to semantic format', () => {
    const zeta: Zeta = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };

    const convertedZeta = convertZeta(zeta, 'semantic');

    expect(convertedZeta).toEqual({
      discrimination: 1,
      difficulty: 2,
      guessing: 3,
      slipping: 4,
    });
  });

  it('converts from semantic format to symbolic format', () => {
    const zeta: Zeta = {
      discrimination: 1,
      difficulty: 2,
      guessing: 3,
      slipping: 4,
    };

    const convertedZeta = convertZeta(zeta, 'symbolic');

    expect(convertedZeta).toEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it('throws an error when converting from an unsupported format', () => {
    const zeta: Zeta = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };

    expect(() => convertZeta(zeta, 'unsupported' as 'symbolic')).toThrow(
      "Invalid desired format. Expected 'symbolic' or'semantic'. Received unsupported instead.",
    );
  });

  it('does not modify other keys when converting', () => {
    const zeta: Stimulus = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      key1: 5,
      key2: 6,
      key3: 7,
      key4: 8,
    };

    const convertedZeta = convertZeta(zeta, 'semantic');

    expect(convertedZeta).toEqual({
      discrimination: 1,
      difficulty: 2,
      guessing: 3,
      slipping: 4,
      key1: 5,
      key2: 6,
      key3: 7,
      key4: 8,
    });
  });

  it('converts only existing keys', () => {
    const zeta: Zeta = {
      a: 1,
      b: 2,
    };

    const convertedZeta = convertZeta(zeta, 'semantic');

    expect(convertedZeta).toEqual({
      discrimination: 1,
      difficulty: 2,
    });
  });
});

// TODO: Write tests for validateCorpus and filterItemsByCatParameterAvailability
