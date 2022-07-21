# jsCAT: Computer Adaptive Testing in JavaScript
A library to support IRT-based computer adaptive testing in JavaScript

## Installation 
You can install jsCAT from npm with 
```bash
npm i @bdelab/jsCAT
```

## Usage
```JavaScript
import {jsCAT} from '@bdelab/jsCAT';

// declare prior if you choose to use EAP method
const prior = jsCAT.normal();

// for each adaptive trial, you will use the following functions
const theta = estimateAbility(answers, zetas, method, minTheta, maxTheta, prior);

const nextStimulus = findNextItem(stimuli, theta, method, deepCopy);
```


## References


## License
