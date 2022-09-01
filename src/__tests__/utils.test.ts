import { itemResponseFunction, fisherInformation } from '../utils';

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