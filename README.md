# jsCAT: Computer Adaptive Testing in JavaScript
A library to support IRT-based computer adaptive testing in JavaScript

## Installation 
You can install jsCAT from npm with 
```bash
npm i @bdelab/jscat
```

## Usage
```JavaScript
// import jsCAT
import { Cat, prior } from '@bdelab/jscat';

// declare prior if you choose to use EAP method
const currentPrior = normal();

// create a Cat object 
cat = CAT({method: 'MLE', itemSelect: 'MFI', nStartItems: 0, theta: 0, minTheta: 4, maxTheta: 4, prior: currentPrior})

// update the abilitiy estimate by adding test items 
cat.updateAbilityEstimate(zeta, answer);

const currentTheta = cat.theta;

const currentSeMeasurement = cat.seMeasurement;

const numItems = cat.nItems;

// find the next available item from an input array of stimuli based on a selection method
const nextItem = cat.findNextItem(stimuli, 'MFI')
```

## References
Lucas Duailibe, irt-js, (2019), GitHub repository, https://github.com/geekie/irt-js

## License
