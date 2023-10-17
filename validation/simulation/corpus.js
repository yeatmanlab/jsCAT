/* Load corpus */
// Word corpus imports
// import dataValidatedURL from "./resp/theoretical.item.bank.csv";
// import simulationResp from "../data/resp_sample_with_pid.csv";

import dataValidatedURL from "./resp/posthoc.item.bank.csv";
import simulationResp from "../data/resp_posthoc_with_pid.csv";
import Papa from "papaparse";

const readCSV = (url) =>
  new Promise((resolve) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function (results) {
        const csv_stimuli = results.data;
        resolve(csv_stimuli);
      },
    });
  });
// addAsset :: (k, Promise a) -> Promise (k, a)
const addAsset = ([name, assetPromise]) =>
  assetPromise.then((asset) => [name, asset]);

// loadAll :: {k: Promise a} -> Promise {k: a}
const loadAll = (assets) =>
  Promise.all(Object.entries(assets).map(addAsset)).then(Object.fromEntries);

const csvPromises = {
  validated: readCSV(dataValidatedURL),
  answerRobot: readCSV(simulationResp),
};

const csvAssets = await loadAll(csvPromises);

const transformCSV = (csvInput) => csvInput.reduce((accum, row) => {
  const newRow = {
    stimulus: row.item,
    a: row.a,
    difficulty: row.b,
    c: row.c,
    d: row.d,
  };
  accum.push(newRow);
  return accum;
}, []);

const csvTransformed = {
  validated: transformCSV(csvAssets.validated),
};

export const corpusAll = {
  name: "corpusAll",
  corpus: csvTransformed.validated,
};

export const { answerRobot } = csvAssets;
// console.log(corpusAll.corpus);
