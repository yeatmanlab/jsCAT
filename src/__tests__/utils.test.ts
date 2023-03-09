import { itemResponseFunction, fisherInformation, findClosest } from '../utils';

describe('itemResponseFunction', () => {
  it('correctly calculates the probability', () => {
    expect(0.7234).toBeCloseTo(itemResponseFunction(0, { a: 1, b: -0.3, c: 0.35, d: 1 }), 2);

    expect(0.5).toBeCloseTo(itemResponseFunction(0, { a: 1, b: 0, c: 0, d: 1 }), 2);

    expect(0.625).toBeCloseTo(itemResponseFunction(0, { a: 0.5, b: 0, c: 0.25, d: 1 }), 2);
  });
});

describe('fisherInformation', () => {
  it('correctly calculates the information', () => {
    expect(0.206).toBeCloseTo(fisherInformation(0, { a: 1.53, b: -0.5, c: 0.5, d: 1 }), 2);

    expect(0.1401).toBeCloseTo(fisherInformation(2.35, { a: 1, b: 2, c: 0.3, d: 1 }), 2);
  });
});

describe('findClosest', () => {
  it('correctly selects the first item if appropriate', () => {
    expect(0).toBe(findClosest([{ difficulty: 1 }, { difficulty: 4 }, { difficulty: 10 }, { difficulty: 11 }], 0));
  });
  it('correctly selects the last item if appropriate', () => {
    expect(3).toBe(findClosest([{ difficulty: 1 }, { difficulty: 4 }, { difficulty: 10 }, { difficulty: 11 }], 1000));
  });
  it('correctly selects a middle item if it equals exactly', () => {
    expect(2).toBe(findClosest([{ difficulty: 1 }, { difficulty: 4 }, { difficulty: 10 }, { difficulty: 11 }], 10));
  });
  it('correctly selects the one item closest to the target if less than', () => {
    expect(1).toBe(
      findClosest([{ difficulty: 1.1 }, { difficulty: 4.2 }, { difficulty: 10.3 }, { difficulty: 11.4 }], 5.1),
    );
  });
  it('correctly selects the one item closest to the target if greater than', () => {
    expect(2).toBe(
      findClosest([{ difficulty: 1.1 }, { difficulty: 4.2 }, { difficulty: 10.3 }, { difficulty: 11.4 }], 9.1),
    );
  });
});
