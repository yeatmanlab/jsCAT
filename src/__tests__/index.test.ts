import { itemResponseFunction } from '../index';

describe("itemResponseFunction", () => {
    it("correctly calculates the probability", () => {
        expect(0.7234).toBeCloseTo(
            itemResponseFunction(0, { a: 1, b: -0.3, c: 0.35, d: 1 }),
            2
        );
        // Do this another two times for other test values
    });
});

