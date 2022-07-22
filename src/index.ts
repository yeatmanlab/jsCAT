import {minimize_Powell} from "optimization-js";
import { cloneDeep } from "lodash";

export type Zeta = { a: number, b: number, c: number, d: number };

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
export const itemResponseFunction = (theta: number, zeta: Zeta) => {
    return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
}

/**
 * return a Gaussian distribution within a given range
 * @param mean
 * @param stdDev
 * @param min
 * @param max
 * @param stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
export const normal = (mean=0, stdDev = 1, min = -4, max = 4, stepSize = 0.1) => {
    let distribution = [];
    for (let i = min; i <= max; i += stepSize) {
        distribution.push([i, y(i)]);
    }
    return distribution;

    function y(x: number) {
        return (
            (1 / (Math.sqrt(2 * Math.PI) * stdDev)) *
            Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)))
        );
    }
}

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
export const estimateAbility = (answers:  Array<0 | 1>,
                                zetas: Array<Zeta>,
                                method = 'MLE',
                                minTheta = -4,
                                maxTheta = 4,
                                prior = [[0,0]]) => {
    method = method.toLowerCase();
    const validMethod: Array<string> = ['mle', 'eap']; // TO DO: add staircase
    if (!validMethod.includes(method)){
        throw new Error('The method you provided is not in the list of valid methods');
    }
    if (method === 'eap'){
        return estimateAbilityEAP();
    } else if (method === 'mle') {
        return estimateAbilityMLE();
    }

    function estimateAbilityEAP(){
        let num = 0;
        let nf = 0;
        for (let i = 0; i < prior.length; i++) {
            let theta = prior[i][0];
            let probability = prior[i][1];
            let like = likelihood(theta);
            num += theta * like * probability;
            nf += like * probability;
        }
        return num / nf;
    }

    function estimateAbilityMLE(){
        const theta0 = [0];
        const solution = minimize_Powell(negLikelihood, theta0);

        let theta = solution.argument[0];
        if (theta > maxTheta) {
            theta = maxTheta;
        } else if (theta < minTheta) {
            theta = minTheta;
        }
        return theta;
    }

    function negLikelihood(thetaArray: Array<number>) {
        return -likelihood(thetaArray[0])
    }

    function likelihood(theta: number) {
        return zetas.reduce((acc, zeta, i) => {
            let irf = itemResponseFunction(theta, zeta);
            return answers[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
        }, 1);
    }
}

/**
 * find the next available item from an input array of stimuli based on a selection method
 * @param stimuli - an array of stimulus
 * @param theta - the theta estimate, default theta = 0
 * @param method - the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
 * @param deepCopy - default deepCopy = true
 * @returns {nextStimulus: Stimulus,
            remainingStimuli: Array<Stimulus>}
 */
export const findNextItem = (stimuli: Array<Stimulus>,
                             theta = 0,
                             method = 'MFI',
                             deepCopy = true) => {
    method = method.toLowerCase();
    const validMethod: Array<string> = ['mfi', 'random', 'closest'];
    if (!validMethod.includes(method)){
        throw new Error('The method you provided is not in the list of valid methods');
    }
    let arr: Array<Stimulus>;
    if (deepCopy) {
        arr = cloneDeep(stimuli);
    } else {
        arr = stimuli;
    }
    arr.sort((a, b) => a.difficulty - b.difficulty);

    method = method.toLowerCase();
    if (method === 'mfi'){
        const stimuliAddFisher = arr.map((element) => ({fisherInformation: fisherInformation(theta,
                {a: 1, b: element.difficulty, c: 0.5, d: 1}), ...element}));
        stimuliAddFisher.sort((a,b) => b.fisherInformation - a.fisherInformation);
        return {
            nextStimulus: stimuliAddFisher[0],
            remainingStimuli: stimuliAddFisher.slice(1)
        };
    } else if (method === 'random') {
        let index: number;
        if (arr.length < 5){
            index =  Math.floor(arr.length / 2);
        } else {
            index = Math.floor(arr.length / 2) + randomInteger(-2, 2);
        }
        const nextItem = arr[index];
        arr.splice(index, 1);
        return {
            nextStimulus: nextItem,
            remainingStimuli: arr
        };
    } else if (method === 'closest') {
        //findClosest requires arr is sorted by difficulty
        const index = findClosest(arr, theta + 0.481);
        const nextItem = arr[index];
        arr.splice(index, 1);
        return {
            nextStimulus: nextItem,
            remainingStimuli: arr
        };
    }

    /**
     * return a random integer between min and max
     * @param min - The minimum of the random number range (include)
     * @param max - The maximum of the random number range (include)
     * @returns {number} - random integer within the range
     */
    function randomInteger(min: number, max: number){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * find the item in a given array that has the difficulty closest to the target value
     * @param arr Array<Stimulus> - an array of stimulus
     * @param target number - ability estimate
     * @returns {number} the index of arr
     */
    function findClosest(arr: Array<Stimulus>, target: number){
        let n = arr.length;
        // Corner cases
        if (target <= arr[0].difficulty)
            return 0;
        if (target >= arr[n - 1].difficulty)
            return n-1;
        // Doing binary search
        let i = 0, j = n, mid = 0;
        while (i < j) {
            mid = Math.ceil((i + j) / 2);
            if (arr[mid].difficulty == target)
                return mid;
            // If target is less than array
            // element,then search in left
            if (target < arr[mid].difficulty) {
                // If target is greater than previous
                // to mid, return closest of two
                if (mid > 0 && target > arr[mid - 1].difficulty)
                    return getClosest(arr,mid-1, mid, target);
                // Repeat for left half
                j = mid;
            }
            // If target is greater than mid
            else {
                if (mid < n - 1 && target < arr[mid + 1].difficulty)
                    return getClosest(arr,mid, mid + 1, target);
                i = mid + 1; // update i
            }
        }
        // Only single element left after search
        return mid;

        function getClosest(arr: Array<Stimulus>, val1:number, val2: number, target: number){
            if (target - arr[val1].difficulty >= arr[val2].difficulty - target)
                return val2;
            else
                return val1;
        }
    }

    /**
     * a 3PL Fisher information function
     * @param theta - ability estimate
     * @param zeta - item params
     * @returns {number} - the expected value of the observed information
     */
    function fisherInformation(theta: number, zeta: Zeta){
        const p = itemResponseFunction(theta, zeta)
        const q = 1-p
        return Math.pow(zeta.a, 2) * (q / p) * ((p - zeta.c) / Math.pow(1- zeta.c, 2))
    }
}