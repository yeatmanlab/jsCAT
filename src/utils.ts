import {Stimulus, Zeta} from "./type";
/**
 * calculates the probability that someone with a given ability level theta will answer correctly an item. Uses the 4 parameters logistic model
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} the probability
 */
export const itemResponseFunction = (theta: number, zeta: Zeta) => {
    return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
};

/**
 * a 3PL Fisher information function
 * @param theta - ability estimate
 * @param zeta - item params
 * @returns {number} - the expected value of the observed information
 */
export const fisherInformation = (theta: number, zeta: Zeta) => {
    const p = itemResponseFunction(theta, zeta);
    const q = 1 - p;
    return Math.pow(zeta.a, 2) * (q / p) * (Math.pow(p - zeta.c, 2) / Math.pow(1 - zeta.c, 2));
};

/**
 * return a Gaussian distribution within a given range
 * @param mean
 * @param stdDev
 * @param min
 * @param max
 * @param stepSize - the quantization (step size) of the internal table, default = 0.1
 * @returns {Array<[number, number]>} - a normal distribution
 */
export const normal = (mean = 0, stdDev = 1, min = -4, max = 4, stepSize = 0.1) => {
    const distribution = [];
    for (let i = min; i <= max; i += stepSize) {
        distribution.push([i, y(i)]);
    }
    return distribution;

    function y(x: number) {
        return (1 / (Math.sqrt(2 * Math.PI) * stdDev)) * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
    }
};

/**
 * find the item in a given array that has the difficulty closest to the target value
 * @param arr Array<Stimulus> - an array of stimulus
 * @param target number - ability estimate
 * @returns {number} the index of arr
 */
export const findClosest = (arr: Array<Stimulus>, target: number) => {
    const n = arr.length;
    // Corner cases
    if (target <= arr[0].difficulty) return 0;
    if (target >= arr[n - 1].difficulty) return n - 1;
    // Doing binary search
    let i = 0,
        j = n,
        mid = 0;
    while (i < j) {
        mid = Math.ceil((i + j) / 2);
        if (arr[mid].difficulty == target) return mid;
        // If target is less than array
        // element,then search in left
        if (target < arr[mid].difficulty) {
            // If target is greater than previous
            // to mid, return closest of two
            if (mid > 0 && target > arr[mid - 1].difficulty) return getClosest(arr, mid - 1, mid, target);
            // Repeat for left half
            j = mid;
        }
        // If target is greater than mid
        else {
            if (mid < n - 1 && target < arr[mid + 1].difficulty) return getClosest(arr, mid, mid + 1, target);
            i = mid + 1; // update i
        }
    }
    // Only single element left after sear
    return mid;
}

const getClosest = (arr: Array<Stimulus>, val1: number, val2: number, target: number) => {
    if (target - arr[val1].difficulty >= arr[val2].difficulty - target) return val2;
    else return val1;
}
