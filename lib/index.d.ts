export declare type Zeta = {
    a: number;
    b: number;
    c: number;
    d: number;
};
export interface Stimulus {
    difficulty: number;
    [key: string]: any;
}
/**
 * calculates the probability that someone with a given ability level theta will answer correctly an item. Uses the 4 parameters logistic model
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} the probability
 */
export declare const itemResponseFunction: (theta: number, zeta: Zeta) => number;
/**
 * a 3PL Fisher information function
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} - the expected value of the observed information
 */
export declare const fisherInformation: (theta: number, zeta: Zeta) => number;
/**
 * return a Gaussian distribution within a given range
 * @param mean
 * @param stdDev
 * @param min
 * @param max
 * @param stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
export declare const normal: (mean?: number, stdDev?: number, min?: number, max?: number, stepSize?: number) => number[][];
export declare const abilityPrior: number[][];
/**
 * use an input estimate method to calculate the estimate ability based on previous response patterns and item params
 * @param answers - response patterns
 * @param zetas - item params
 * @param method - ability estimator, e.g. MLE or EAP, default = 'MLE'
 * @param minTheta - lower bound of theta
 * @param maxTheta - higher bound of theta
 * @param prior - the prior distribution
 * @returns {number} - the estimate ability based on an estimation method
 */
export declare const estimateAbility: (answers: Array<0 | 1>, zetas: Array<Zeta>, method?: string, minTheta?: number, maxTheta?: number, prior?: number[][]) => any;
/**
 * find the next available item from an input array of stimuli based on a selection method
 * @param stimuli - an array of stimulus
 * @param theta - the theta estimate, default theta = 0
 * @param method - the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
 * @param deepCopy - default deepCopy = true
 * @returns {nextStimulus: Stimulus,
            remainingStimuli: Array<Stimulus>}
 */
export declare const findNextItem: (stimuli: Stimulus[], theta?: number, method?: string, deepCopy?: boolean) => {
    nextStimulus: Stimulus;
    remainingStimuli: Stimulus[];
} | undefined;
/**
 * calculate the standard error of mean of ability estimation
 * @param theta
 * @param zetas
 */
export declare const SEM: (theta: number, zetas: Array<Zeta>) => number;
