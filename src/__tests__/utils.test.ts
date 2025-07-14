import { itemResponseFunction, fisherInformation, findClosest, normal, uniform } from '../utils';

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

describe('normal', () => {
  it('should create a normal distribution with default parameters', () => {
    const dist = normal();
    expect(dist.length).toBeGreaterThan(0);
    expect(dist[0].length).toBe(2); // Each point should have x and y coordinates

    // Find the peak of the distribution
    const maxY = Math.max(...dist.map((p) => p[1]));
    const peakPoint = dist.find((p) => p[1] === maxY);

    // With default parameters (mean=0), the peak should be at x=0
    expect(peakPoint && peakPoint[0]).toBeCloseTo(0, 1);

    // Default range should be [-4, 4]
    expect(dist[0][0]).toBeCloseTo(-4, 1);
    expect(dist[dist.length - 1][0]).toBeCloseTo(4, 1);
  });

  it('should create a normal distribution with custom mean and standard deviation', () => {
    const mean = 2;
    const stdDev = 0.5;
    const dist = normal(mean, stdDev);

    // Find the peak of the distribution
    const maxY = Math.max(...dist.map((p) => p[1]));
    const peakPoint = dist.find((p) => p[1] === maxY);

    // Peak should be at x = mean
    expect(peakPoint && peakPoint[0]).toBeCloseTo(mean, 1);

    // With smaller stdDev, peak should be higher than default
    expect(maxY).toBeGreaterThan(0.4); // Normal peak with stdDev=1 is ~0.4
  });

  it('should respect custom min and max range', () => {
    const min = -2;
    const max = 2;
    const dist = normal(0, 1, min, max);

    // Check range bounds
    expect(dist[0][0]).toBeCloseTo(min, 1);
    expect(dist[dist.length - 1][0]).toBeCloseTo(max, 1);
  });

  it('should use custom step size', () => {
    const stepSize = 0.5;
    const dist = normal(0, 1, -4, 4, stepSize);

    // Check step size between consecutive points
    for (let i = 1; i < dist.length; i++) {
      expect(dist[i][0] - dist[i - 1][0]).toBeCloseTo(stepSize, 3);
    }
  });

  it('should create a symmetric distribution around mean', () => {
    const mean = 1;
    const dist = normal(mean, 1, -3, 5); // Asymmetric range but should still be symmetric around mean

    // Find points equidistant from mean and compare their y-values
    const tolerance = 0.001;
    dist.forEach((point) => {
      const oppositePoint = dist.find((p) => Math.abs(p[0] - (mean + (mean - point[0]))) < tolerance);
      if (oppositePoint) {
        expect(point[1]).toBeCloseTo(oppositePoint[1], 5);
      }
    });
  });
});

describe('uniform', () => {
  it('outputs correct probabilities and boundaries', () => {
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

  it('probabilities are uniform within support', () => {
    const result = uniform(-1, 1, 0.5, -2, 2);
    const probsInSupport = result.filter(([x]) => x >= -1 && x <= 1).map(([, p]) => p);

    // All probabilities in support should be equal
    const firstProb = probsInSupport[0];
    probsInSupport.forEach((p) => {
      expect(p).toBeCloseTo(firstProb, 6);
    });
  });

  it(`it should use the first two values as the fullmin and fullmax if they are not provided`, () => {
    const result = uniform(-1, 1, 0.5);
    const probs = result.map(([, p]: [number, number]) => p);
    const xs = result.map(([x]: [number, number]) => x);
    expect(probs.reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(1, 6);
    expect(xs[0]).toBeCloseTo(-1, 6);
  });
});
