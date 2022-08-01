"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEM = exports.findNextItem = exports.estimateAbility = exports.abilityPrior = exports.normal = exports.fisherInformation = exports.itemResponseFunction = void 0;
const optimization_js_1 = require("optimization-js");
const lodash_1 = require("lodash");
/**
 * calculates the probability that someone with a given ability level theta will answer correctly an item. Uses the 4 parameters logistic model
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} the probability
 */
const itemResponseFunction = (theta, zeta) => {
    return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
};
exports.itemResponseFunction = itemResponseFunction;
/**
 * a 3PL Fisher information function
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} - the expected value of the observed information
 */
const fisherInformation = (theta, zeta) => {
    const p = (0, exports.itemResponseFunction)(theta, zeta);
    const q = 1 - p;
    return Math.pow(zeta.a, 2) * (q / p) * (Math.pow(p - zeta.c, 2) / Math.pow(1 - zeta.c, 2));
};
exports.fisherInformation = fisherInformation;
/**
 * return a Gaussian distribution within a given range
 * @param mean
 * @param stdDev
 * @param min
 * @param max
 * @param stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
const normal = (mean = 0, stdDev = 1, min = -4, max = 4, stepSize = 0.1) => {
    const distribution = [];
    for (let i = min; i <= max; i += stepSize) {
        distribution.push([i, y(i)]);
    }
    return distribution;
    function y(x) {
        return (1 / (Math.sqrt(2 * Math.PI) * stdDev)) * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
    }
};
exports.normal = normal;
exports.abilityPrior = (0, exports.normal)();
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
const estimateAbility = (answers, zetas, method = 'MLE', minTheta = -4, maxTheta = 4, prior = exports.abilityPrior) => {
    method = method.toLowerCase();
    const validMethod = ['mle', 'eap']; // TO DO: add staircase
    if (!validMethod.includes(method)) {
        throw new Error('The method you provided is not in the list of valid methods');
    }
    if (method === 'eap') {
        return estimateAbilityEAP();
    }
    else if (method === 'mle') {
        return estimateAbilityMLE();
    }
    function estimateAbilityEAP() {
        let num = 0;
        let nf = 0;
        let theta, probability, like;
        prior.forEach((e) => {
            theta = e[0];
            probability = e[1];
            like = likelihood(theta);
            num += theta * like * probability;
            nf += like * probability;
        });
        return num / nf;
    }
    function estimateAbilityMLE() {
        const theta0 = [0];
        const solution = (0, optimization_js_1.minimize_Powell)(negLikelihood, theta0);
        let theta = solution.argument[0];
        if (theta > maxTheta) {
            theta = maxTheta;
        }
        else if (theta < minTheta) {
            theta = minTheta;
        }
        return theta;
    }
    function negLikelihood(thetaArray) {
        return -likelihood(thetaArray[0]);
    }
    function likelihood(theta) {
        return zetas.reduce((acc, zeta, i) => {
            const irf = (0, exports.itemResponseFunction)(theta, zeta);
            return answers[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
        }, 1);
    }
};
exports.estimateAbility = estimateAbility;
/**
 * find the next available item from an input array of stimuli based on a selection method
 * @param stimuli - an array of stimulus
 * @param theta - the theta estimate, default theta = 0
 * @param method - the method of item selection, e.g. "MFI", "random", "closest", default method = 'MFI'
 * @param deepCopy - default deepCopy = true
 * @returns {nextStimulus: Stimulus,
            remainingStimuli: Array<Stimulus>}
 */
const findNextItem = (stimuli, theta = 0, method = 'MFI', deepCopy = true) => {
    method = method.toLowerCase();
    const validMethod = ['mfi', 'random', 'closest'];
    if (!validMethod.includes(method)) {
        throw new Error('The method you provided is not in the list of valid methods');
    }
    let arr;
    if (deepCopy) {
        arr = (0, lodash_1.cloneDeep)(stimuli);
    }
    else {
        arr = stimuli;
    }
    arr.sort((a, b) => a.difficulty - b.difficulty);
    method = method.toLowerCase();
    if (method === 'mfi') {
        const stimuliAddFisher = arr.map((element) => (Object.assign({ fisherInformation: (0, exports.fisherInformation)(theta, { a: 1, b: element.difficulty, c: 0.5, d: 1 }) }, element)));
        stimuliAddFisher.sort((a, b) => b.fisherInformation - a.fisherInformation);
        stimuliAddFisher.forEach((stimulus) => {
            delete stimulus['fisherInformation'];
        });
        return {
            nextStimulus: stimuliAddFisher[0],
            remainingStimuli: stimuliAddFisher.slice(1),
        };
    }
    else if (method === 'random') {
        let index;
        if (arr.length < 5) {
            index = Math.floor(arr.length / 2);
        }
        else {
            index = Math.floor(arr.length / 2) + randomInteger(-2, 2);
        }
        const nextItem = arr[index];
        arr.splice(index, 1);
        return {
            nextStimulus: nextItem,
            remainingStimuli: arr,
        };
    }
    else if (method === 'closest') {
        //findClosest requires arr is sorted by difficulty
        const index = findClosest(arr, theta + 0.481);
        const nextItem = arr[index];
        arr.splice(index, 1);
        return {
            nextStimulus: nextItem,
            remainingStimuli: arr,
        };
    }
    /**
     * return a random integer between min and max
     * @param min - The minimum of the random number range (include)
     * @param max - The maximum of the random number range (include)
     * @returns {number} - random integer within the range
     */
    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * find the item in a given array that has the difficulty closest to the target value
     * @param arr Array<Stimulus> - an array of stimulus
     * @param target number - ability estimate
     * @returns {number} the index of arr
     */
    function findClosest(arr, target) {
        const n = arr.length;
        // Corner cases
        if (target <= arr[0].difficulty)
            return 0;
        if (target >= arr[n - 1].difficulty)
            return n - 1;
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
                    return getClosest(arr, mid - 1, mid, target);
                // Repeat for left half
                j = mid;
            }
            // If target is greater than mid
            else {
                if (mid < n - 1 && target < arr[mid + 1].difficulty)
                    return getClosest(arr, mid, mid + 1, target);
                i = mid + 1; // update i
            }
        }
        // Only single element left after search
        return mid;
        function getClosest(arr, val1, val2, target) {
            if (target - arr[val1].difficulty >= arr[val2].difficulty - target)
                return val2;
            else
                return val1;
        }
    }
};
exports.findNextItem = findNextItem;
/**
 * calculate the standard error of mean of ability estimation
 * @param theta
 * @param zetas
 */
const SEM = (theta, zetas) => {
    let sum = 0;
    zetas.forEach(function (zeta) { sum += (0, exports.fisherInformation)(theta, zeta); });
    return 1 / Math.sqrt(sum);
};
exports.SEM = SEM;
