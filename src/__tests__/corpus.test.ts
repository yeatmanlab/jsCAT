import { MultiZetaStimulus, Stimulus, Zeta } from '../type';
import {
  validateZetaParams,
  ZETA_KEY_MAP,
  defaultZeta,
  fillZetaDefaults,
  convertZeta,
  checkNoDuplicateCatNames,
  filterItemsByCatParameterAvailability,
  prepareClowderCorpus,
} from '../corpus';
import _omit from 'lodash/omit';

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

describe('checkNoDuplicateCatNames', () => {
  it('should throw an error when a cat name is present in multiple zetas', () => {
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
    expect(() => checkNoDuplicateCatNames(corpus)).toThrowError(
      'The cat names Model C are present in multiple corpora.',
    );
  });

  it('should not throw an error when a cat name is not present in multiple corpora', () => {
    const items: MultiZetaStimulus[] = [
      {
        stimulus: 'Item 1',
        zetas: [
          { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
          { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
        ],
      },
      {
        stimulus: 'Item 2',
        zetas: [{ cats: ['Model B', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } }],
      },
    ];

    expect(() => checkNoDuplicateCatNames(items)).not.toThrowError();
  });

  it('should handle an empty corpus without throwing an error', () => {
    const emptyCorpus: MultiZetaStimulus[] = [];

    expect(() => checkNoDuplicateCatNames(emptyCorpus)).not.toThrowError();
  });
});

describe('filterItemsByCatParameterAvailability', () => {
  it('returns an empty "available" array when no items match the catname', () => {
    const items: MultiZetaStimulus[] = [
      {
        stimulus: 'Item 1',
        zetas: [
          { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
          { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
        ],
      },
      {
        stimulus: 'Item 2',
        zetas: [{ cats: ['Model B', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } }],
      },
    ];

    const result = filterItemsByCatParameterAvailability(items, 'Model D');

    expect(result.available).toEqual([]);
    expect(result.missing).toEqual(items);
  });

  it('returns empty missing array when all items match the catname', () => {
    const items: MultiZetaStimulus[] = [
      {
        stimulus: 'Item 1',
        zetas: [
          { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
          { cats: ['Model A'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
        ],
      },
      {
        stimulus: 'Item 2',
        zetas: [
          { cats: ['Model A', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } },
          { cats: ['Model A'], zeta: { a: 3, b: 0.9, c: 0.4, d: 0.99 } },
        ],
      },
    ];

    const result = filterItemsByCatParameterAvailability(items, 'Model A');

    expect(result.missing).toEqual([]);
    expect(result.available).toEqual(items);
  });

  it('separates items based on matching catnames', () => {
    const items: MultiZetaStimulus[] = [
      {
        stimulus: 'Item 1',
        zetas: [
          { cats: ['Model A', 'Model B'], zeta: { a: 1, b: 0.5, c: 0.2, d: 0.8 } },
          { cats: ['Model C'], zeta: { a: 2, b: 0.7, c: 0.3, d: 0.9 } },
        ],
      },
      {
        stimulus: 'Item 2',
        zetas: [{ cats: ['Model B', 'Model C'], zeta: { a: 2.5, b: 0.8, c: 0.35, d: 0.95 } }],
      },
      {
        stimulus: 'Item 3',
        zetas: [{ cats: ['Model A'], zeta: { a: 3, b: 0.9, c: 0.4, d: 0.99 } }],
      },
    ];

    const result = filterItemsByCatParameterAvailability(items, 'Model A');

    // Assert
    expect(result.available.length).toBe(2);
    expect(result.available[0].stimulus).toBe('Item 1');
    expect(result.available[1].stimulus).toBe('Item 3');
    expect(result.missing.length).toBe(1);
    expect(result.missing[0].stimulus).toBe('Item 2');
  });
});

describe('prepareClowderCorpus', () => {
  it('converts a Stimulus array to a MultiZetaStimulus array with symbolic format', () => {
    const items: Stimulus[] = [
      {
        'cat1.a': 1,
        'cat1.b': 2,
        'cat1.c': 3,
        'cat1.d': 4,
        'foo.a': 5,
        'foo.b': 6,
        'foo.c': 7,
        'foo.d': 8,
        stimulus: 'stim0',
        type: 'jspsychHtmlMultiResponse',
      },
    ];

    const result = prepareClowderCorpus(items, ['cat1', 'foo'], '.');

    expect(result).toEqual([
      {
        stimulus: 'stim0',
        type: 'jspsychHtmlMultiResponse',
        zetas: [
          {
            cats: ['cat1'],
            zeta: { a: 1, b: 2, c: 3, d: 4 },
          },
          {
            cats: ['foo'],
            zeta: { a: 5, b: 6, c: 7, d: 8 },
          },
        ],
      },
    ]);
  });

  it('converts a Stimulus array to a MultiZetaStimulus array with semantic format', () => {
    const items: Stimulus[] = [
      {
        'cat1.a': 1,
        'cat1.b': 2,
        'cat1.c': 3,
        'cat1.d': 4,
        'foo.a': 5,
        'foo.b': 6,
        'foo.c': 7,
        'foo.d': 8,
        stimulus: 'stim0',
        type: 'jspsychHtmlMultiResponse',
      },
    ];

    const result = prepareClowderCorpus(items, ['cat1', 'foo'], '.', 'semantic');

    expect(result).toEqual([
      {
        stimulus: 'stim0',
        type: 'jspsychHtmlMultiResponse',
        zetas: [
          {
            cats: ['cat1'],
            zeta: { discrimination: 1, difficulty: 2, guessing: 3, slipping: 4 },
          },
          {
            cats: ['foo'],
            zeta: { discrimination: 5, difficulty: 6, guessing: 7, slipping: 8 },
          },
        ],
      },
    ]);
  });

  it('handles cases with different delimiters', () => {
    const items: Stimulus[] = [
      {
        cat1_a: 1,
        cat1_b: 2,
        foo_a: 5,
        foo_b: 6,
        stimulus: 'stim1',
        type: 'jspsychHtmlMultiResponse',
      },
    ];

    const result = prepareClowderCorpus(items, ['cat1', 'foo'], '_', 'symbolic');

    expect(result).toEqual([
      {
        stimulus: 'stim1',
        type: 'jspsychHtmlMultiResponse',
        zetas: [
          {
            cats: ['cat1'],
            zeta: { a: 1, b: 2 },
          },
          {
            cats: ['foo'],
            zeta: { a: 5, b: 6 },
          },
        ],
      },
    ]);
  });
});
