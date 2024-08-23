import { Cat } from '@bdelab/jscat';
import store from "store2";
import { answerRobot, corpusAll } from "./corpus";

function getStimulus(cat, itemSelect) {
  const corpus = store.session("corpusAll");
  // const corpusType = checkRealPseudoFake(corpus);
  const itemSuggestion = cat.findNextItem(corpus.corpus, itemSelect);
  store.session.set("nextStimulus", itemSuggestion.nextStimulus);
  corpus.corpus = itemSuggestion.remainingStimuli;
  store.session.set("corpusAll", corpus);
};

async function simulatorResponse(student, itemSelect, testLength, iteration) {
  const cat = new Cat({
    method: 'MLE',
    itemSelect: itemSelect,
    nStartItems: 1,
  });

  store.session.set("corpusAll", corpusAll);
  const resp = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < testLength; i++) {
    getStimulus(cat, itemSelect);

    const nextStimulus = store.session("nextStimulus");

    const response = student[nextStimulus.stimulus];
    cat.updateAbilityEstimate({
      a: nextStimulus.a,
      b: nextStimulus.difficulty,
      c: nextStimulus.c,
      d: nextStimulus.d,
    }, response);
    resp.push({
      pid: student.pid,
      trialNumTotal: i + 1,
      thetaEstimate: cat.theta,
      thetaSE: cat.seMeasurement,
      item: nextStimulus.stimulus,
      variant: itemSelect,
      iteration: iteration + 1,
    });
  }
  return resp;
}

async function simulatorMatrix(respMatrix, itemSelect, testLength, iteration) {
  const simulationResults = [];
  for (let i = 0; i < respMatrix.length; i++) {
    if (i % 25 === 0) {
      // console.log("number of people", i);
    }
    simulationResults.push(
      ...await simulatorResponse(respMatrix[i], itemSelect, testLength, iteration)
    );
  }
  return simulationResults;
}

async function shuffleAnswerRobot(resp, iterations) {
  // console.log("simulation start");
  const simulationResults = [];
  for (let i = 0; i < iterations; i++) {
    store.session.set(corpusAll, "corpusAll");
    const list1 = await simulatorMatrix(resp, "mfi", 55, i);
    store.session.set(corpusAll, "corpusAll");
    // console.log(store.session("corpusAll"));
    const list2 = await simulatorMatrix(resp, "random", 55, i);

    simulationResults.push(...list1);
    simulationResults.push(...list2);
  }
  // console.log("simulation complete");
  return simulationResults;
}

function convertListToCSV(list) {
  const keys = Object.keys(list[0]);
  const header = keys.join(',') + '\n';
  const rows = list.map(obj => keys.map(key => obj[key]).join(',')).join('\n');
  return header + rows;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const csvContent = await convertListToCSV(await shuffleAnswerRobot(answerRobot, 1));

// export const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
