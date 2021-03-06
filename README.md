# jsCAT: Computer Adaptive Testing in JavaScript
A library to support IRT-based computer adaptive testing in JavaScript

## Installation 
You can install jsCAT from npm with 
```bash
npm i @bdelab/jscat
```

## Usage
```JavaScript
import {jsCAT} from '@bdelab/jscat';

// declare prior if you choose to use EAP method
const prior = jsCAT.normal();

// for each adaptive trial, you will use the following functions
const theta = jsCAT.estimateAbility(answers, zetas, method, minTheta, maxTheta, prior);

const nextStimulus = jsCAT.findNextItem(stimuli, theta, method, deepCopy);
```

## References
Lucas Duailibe, irt-js, (2019), GitHub repository, https://github.com/geekie/irt-js

## License
