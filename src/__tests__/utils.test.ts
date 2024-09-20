import { itemResponseFunction, fisherInformation, findClosest } from '../utils';

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
