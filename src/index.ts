import {minimize_Powell} from "optimization-js";
import { cloneDeep } from "lodash";

export type Zeta = { a: number, b: number, c: number, d: number };

export interface Stimulus {
    difficulty: number;
    [key: string]: any;
}

export const fisherInformation = (theta: number, zeta: Zeta) => {
    const p = itemResponseFunction(zeta, theta)
    const q = 1-p
    return Math.pow(zeta.a, 2) * (q / p) * ((p - zeta.c) / Math.pow(1- zeta.c, 2))
}

export const itemResponseFunction = (zeta: Zeta, theta: number) => {
    return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
}

export const findClosest = (arr: Array<Stimulus>, target: number) => {
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
}

export const getClosest =  (arr: Array<Stimulus>, val1:number, val2: number, target: number) => {
    if (target - arr[val1].difficulty >= arr[val2].difficulty - target)
        return val2;
    else
        return val1;
}

export const estimateAbilityMLE = (answers: Array<number>, zetas: Array<Zeta>, min_theta: number, max_theta: number) => {
    const theta0 = [0];
    const solution = minimize_Powell(negLikelihood, theta0);

    let theta = solution.argument[0];
    if (theta > max_theta) {
        theta = max_theta;
    } else if (theta < min_theta) {
        theta = min_theta;
    }
    return theta;

    function likelihood(theta: number) {
        return zetas.reduce((acc: number, zeta: Zeta, i: number) => {
            let irf = itemResponseFunction(zeta, theta);
            return answers[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
        }, 0);
    }

    function negLikelihood(thetaArray: Array<number>) {
        return -likelihood(thetaArray[0])
    }
}

export const normal = (mean: number, stdDev: number) => {
    let distribution = [];
    for (let i = -4; i <= 4; i += 0.1) {
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

export const estimateAbilityEAP = (answers:  Array<number>, zetas: Array<Zeta>) => {
    let num = 0;
    let nf = 0;
    const ABILITY_PRIOR = normal(0,1);
    for (let i = 0; i < ABILITY_PRIOR.length; i++) {
        let theta = ABILITY_PRIOR[i][0];
        let probability = ABILITY_PRIOR[i][1];
        let like = likelihood(theta);
        num += theta * like * probability;
        nf += like * probability;
    }
    return num / nf;
    function likelihood(theta: number) {
        return zetas.reduce((acc, zeta, i) => {
            let irf = itemResponseFunction(zeta, theta);
            return answers[i] === 1 ? acc * irf : acc * (1 - irf);
        }, 1);
    }
}
/**
 * return a random integer between min and max
 * @param min - The minimum of the random number range (include)
 * @param max - The maximum of the random number range (include)
 * @returns {number} - random integer within the range
 */
export const randomInteger = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * find the next available item from an input array of stimuli based on a selection method
 * @param stimuli {Array<Stimulus>} - an array of stimulus
 * @param theta {number} - the theta estimate, default theta = 0
 * @param method {string} - the method of item selection, e.g. "MI", "random", "closest", default method = 'MI'
 * @param deepCopy {boolean} - default deepCopy = true
 * @returns {nextStimulus: Stimulus,
            remainingStimuli: Array<Stimulus> }
 */
export const findNextItem = (stimuli: Array<Stimulus>, theta = 0, method = 'MI', deepCopy = true) => {
    method = method.toLowerCase();
    const validMethod: Array<string> = ['mi', 'random', 'closest'];
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
    if (method === 'mi'){
        const stimuliAddFisher = arr.map((element) => ({fisherInformation: fisherInformation(theta,
                {a: 1, b: element.difficulty, c: 0.5, d: 1}), ...element}));
        stimuliAddFisher.sort((a,b) => b.fisherInformation - a.fisherInformation);
        return {
            nextStimulus: stimuliAddFisher[0],
            remainingStimuli: stimuliAddFisher.slice(1)
        };
    } else if (method == 'random') {
        let index: number;
        if (arr.length < 5){
            index =  Math.floor(arr.length / 2);
        } else {
            index = Math.floor(arr.length / 2) + randomInteger(-2, 2);
        }
        return {
            nextStimulus: arr[index],
            remainingStimuli: arr.splice(index, 1)
        };
    } else if (method == 'closest') {
        //findClosest requires arr is sorted by difficulty
        const index = findClosest(arr, theta + 0.481);
        return {
            nextStimulus: arr[index],
            remainingStimuli: arr.splice(index, 1)
        };
    }
}