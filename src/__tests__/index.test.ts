import { Cat } from '../index';
import { Stimulus } from '../type';

describe('Cat', () => {
    const cat1 = new Cat('MLE', 'MFI');
    it('constructs an adaptive test', () => {

        //const cat1 = new Cat('MLE', 'MFI');
        expect(cat1.method).toBe('mle');
        expect(cat1.itemSelect).toBe('mfi');
    })

    it('correctly updates ability estimate', () => {
        const theta = cat1.updateAbilityEstimate([
            { a: 2.225, b: -1.885, c: 0.21, d: 1 },
            { a: 1.174, b: -2.411, c: 0.212, d: 1 },
            { a: 2.104, b: -2.439, c: 0.192, d: 1 }
        ], [1, 0, 1]);
        expect(theta).toBeCloseTo(-1.642307, 1)
    })

    const cat2 = new Cat('MLE', 'MFI');
    it('correctly updates standard error of mean of ability estimate', () => {
        const theta = cat2.updateAbilityEstimate([
            { a: 1, b: -0.4473004, c: 0.5, d: 1 },
            { a: 1, b: 2.8692328, c: 0.5, d: 1 },
            { a: 1, b: -0.4693537, c: 0.5, d: 1 },
            { a: 1, b: -0.5758047, c: 0.5, d: 1 },
            { a: 1, b: -1.4301283, c: 0.5, d: 1 },
            { a: 1, b: -1.6072848, c: 0.5, d: 1 },
            { a: 1, b: 0.5293703, c: 0.5, d: 1 }
        ], [1, 1, 1, 1, 1, 0, 1]);
        expect(cat2.seMeasurement).toBeCloseTo(1.455, 1)
    })

    const cat3 = new Cat('MLE', 'MFI');
    const s1: Stimulus = { difficulty: 0.5, word: 'hello' };
    const s2: Stimulus = { difficulty: 3, word: 'hi' };
    const s3: Stimulus = { difficulty: -1.8, word: 'greeting' };

    it('correctly suggests the next item', () => {
        const expected = { nextStimulus: s1, remainingStimuli: [s3, s2] };
        const received = cat3.findNextItem([s1, s2, s3], 'MFI', true);
        expect(received).toEqual(expected);
    })

});