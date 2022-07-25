import { itemResponseFunction } from '../index';
import { estimateAbility } from '../index';

describe("itemResponseFunction", () => {
    it("correctly calculates the probability", () => {
        expect(0.7234).toBeCloseTo(
            itemResponseFunction(0, { a: 1, b: -0.3, c: 0.35, d: 1 }),
            2
        );

        expect(0.50).toBeCloseTo(
            itemResponseFunction(0, { a: 1, b: 0, c: 0, d: 1 }),
            2
        );

        expect(0.625).toBeCloseTo(
            itemResponseFunction(0, { a: 0.5, b: 0, c: 0.25, d: 1 }),
            2
        );
        // Do this another two times for other test values
    });
});

describe("estimateAbility", () => {
    it("correctly estimates the ability", () => {
        expect(-1.642307).toBeCloseTo(
            estimateAbility([1, 0, 1],
                [{a: 2.225, b: -1.885, c: 0.210, d: 1},
                    {a: 1.174, b: -2.411, c: 0.212, d: 1},
                    {a: 2.104, b: -2.439, c: 0.192, d: 1}],
                'MLE'),
            2
        );

        expect(0.1635256).toBeCloseTo(
            estimateAbility([1, 1, 1],
                [{a: 2.225, b: -1.885, c: 0.210, d: 1},
                    {a: 1.174, b: -2.411, c: 0.212, d: 1},
                    {a: 2.104, b: -2.439, c: 0.192, d: 1}],
                'EAP'),
            2
        );
    });
});