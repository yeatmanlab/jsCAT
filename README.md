[![Test and lint](https://github.com/yeatmanlab/jsCAT/actions/workflows/ci.yml/badge.svg)](https://github.com/yeatmanlab/jsCAT/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/yeatmanlab/jsCAT/badge.svg?branch=main)](https://coveralls.io/github/yeatmanlab/jsCAT?branch=main)
[![npm version](https://badge.fury.io/js/@bdelab%2Fjscat.svg)](https://badge.fury.io/js/@bdelab%2Fjscat)

# jsCAT: Computer Adaptive Testing in JavaScript

A library to support IRT-based computer adaptive testing in JavaScript

## Installation

You can install jsCAT from npm with

```bash
npm i @bdelab/jscat
```

## Usage

```js
// import jsCAT
import { Cat, normal } from '@bdelab/jscat';

// declare prior if you choose to use EAP method
const currentPrior = normal();

// create a Cat object 
const cat = new CAT({method: 'MLE', itemSelect: 'MFI', nStartItems: 0, theta: 0, minTheta: -6, maxTheta: 6, prior: currentPrior})

// option 1 to input stimuli:
const zeta = {[{discrimination: 1, difficulty: 0, guessing: 0, slipping: 1}, {discrimination: 1, difficulty: 0.5, guessing: 0, slipping: 1}]}

// option 2 to input stimuli:
const zeta = {[{a: 1, b: 0, c: 0, d: 1}, {a: 1, b: 0.5, c: 0, d: 1}]}

const answer = {[1, 0]}

// update the abilitiy estimate by adding test items 
cat.updateAbilityEstimate(zeta, answer);

const currentTheta = cat.theta;

const currentSeMeasurement = cat.seMeasurement;

const numItems = cat.nItems;

// find the next available item from an input array of stimuli based on a selection method

const stimuli = [{  discrimination: 1, difficulty: -2, guessing: 0, slipping: 1, item = "item1" },{ discrimination: 1, difficulty: 3, guessing: 0, slipping: 1, item = "item2" }];

const nextItem = cat.findNextItem(stimuli, 'MFI');
```

## Early Stopping Criteria Combinations

To clarify the available combinations for early stopping, here’s a breakdown of the options you can use:

### 1. Logical Operations

You can combine multiple stopping criteria using one of the following logical operations:

- **`and`**: All conditions need to be met to trigger early stopping.
- **`or`**: Any one condition being met will trigger early stopping.
- **`only`**: Only a specific condition is considered (you need to specify the cat to evaluate).

### 2. Stopping Criteria Classes

There are different types of stopping criteria you can configure:

- **`StopAfterNItems`**: Stops the process after a specified number of items.
- **`StopOnSEMeasurementPlateau`**: Stops if the standard error (SE) of measurement remains stable (within a defined tolerance) for a specified number of items.
- **`StopIfSEMeasurementBelowThreshold`**: Stops if the SE measurement drops below a set threshold.

### How Combinations Work

You can mix and match these criteria with different logical operations, giving you a range of configurations for early stopping. For example:

- Using **`and`** with both `StopAfterNItems` and `StopIfSEMeasurementBelowThreshold` means stopping will only occur if both conditions are satisfied.
- Using **`or`** with `StopOnSEMeasurementPlateau` and `StopAfterNItems` allows early stopping if either condition is met.

If you need more details or a specific example documented, feel free to ask!


## Validation

### Validation of theta estimate and theta standard error

Reference software: mirt (Chalmers, 2012)
![img.png](validation/plots/jsCAT_validation_1.png)

### Validation of MFI algorithm 

Reference software: catR (Magis et al., 2017)
![img_1.png](validation/plots/jsCAT_validation_2.png)

## References

- Chalmers, R. P. (2012). mirt: A multidimensional item response theory package for the R environment. Journal of Statistical Software.

- Magis, D., & Barrada, J. R. (2017). Computerized adaptive testing with R: Recent updates of the package catR. Journal of Statistical Software, 76, 1-19.

- Lucas Duailibe, irt-js, (2019), GitHub repository, https://github.com/geekie/irt-js

## License

jsCAT is distributed under the [ISC license](LICENSE).
