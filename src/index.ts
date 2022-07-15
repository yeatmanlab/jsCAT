import {minimize_Powell} from "optimization-js";

export type Zeta = { a: number, b: number, c: number, d: number };

export const fisherInformation = (theta: number, zeta: Zeta) => {
    const p = itemResponseFunction(zeta, theta)
    const q = 1-p
    return Math.pow(zeta.a, 2) * (q / p) * ((p - zeta.c) / Math.pow(1- zeta.c, 2))
}

export const itemResponseFunction = (zeta: Zeta, theta: number) => {
    return zeta.c + (zeta.d - zeta.c) / (1 + Math.exp(-zeta.a * (theta - zeta.b)));
}

export const findClosest = (arr: Array<object>, target: number) => {
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

export const getClosest =  (arr: Array<object>, val1:number, val2: number, target: number) => {
    if (target - arr[val1].difficulty >= arr[val2].difficulty - target)
        return val2;
    else
        return val1;
}

export const estimateAbilityMLE = (answers: Array<number>, zetas: Array<Zeta>, min_theta: number, max_theta: number) => {
    let max_like = -Infinity;
    let theta0 = [0];

    const solution = minimize_Powell(negLikelihood, theta0)
    // for (let theta = min_theta; theta <= max_theta; theta += learning_rate) {
    //   let like = likelihood(theta);
    //   if (like > max_like){
    //     max_like = like;
    //     res_theta = theta;
    //   }
    // }

    let theta = solution.argument[0];
    if (theta > max_theta) {
        theta = max_theta;
    } else if (theta < min_theta) {
        theta = min_theta;
    }
    return theta;

    function likelihood(theta: number) {
        return zetas.reduce((acc: number, zeta: Zeta, i: number) => {
            let irf = itemResponseFunction(theta, zeta);
            return answers[i] === 1 ? acc + Math.log(irf) : acc + Math.log(1 - irf);
        }, 0);
    }

    function negLikelihood(thetaArray) {
        return -likelihood(thetaArray[0])
    }
}

export const normal = (mean: number, stdDev: number) => {
    let distr = [];
    for (let i = -4; i <= 4; i += 0.1) {
        distr.push([i, y(i)]);
    }
    return distr;

    function y(x) {
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
            let irf = itemResponseFunction(theta, zeta);
            return answers[i] === 1 ? acc * irf : acc * (1 - irf);
        }, 1);
    }
}