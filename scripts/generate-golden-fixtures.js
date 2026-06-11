'use strict';
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Deterministically generate the golden fixture set used by
 * src/__tests__/golden.test.ts.
 *
 * This script writes four files to src/__tests__/__fixtures__/golden/:
 *
 *   - items.csv          : a 50-item bank (a, b, c, d parameters)
 *   - responses.csv      : simulated responses for 100 examinees
 *   - true-thetas.csv    : the generating thetas (documentation/sanity only)
 *   - expected-jscat.csv : jsCAT's own MLE and EAP estimates (characterization
 *                          baseline — regenerate ONLY when an intentional
 *                          algorithm change is made, and explain why in the PR)
 *
 * The item bank and responses are generated with a fixed seed, so re-running
 * this script always produces identical items.csv / responses.csv /
 * true-thetas.csv. The external reference file (expected-r-reference.csv) is
 * generated separately from the same inputs by validation/generate-r-reference.R.
 *
 * Usage:
 *   npm run build && node scripts/generate-golden-fixtures.js
 */

const fs = require('fs');
const path = require('path');
const seedrandom = require('seedrandom');
const { Cat } = require('../lib/index.js');

const SEED = 'jscat-golden-v1';
const N_ITEMS = 50;
const N_PEOPLE = 100;
const MIN_THETA = -6;
const MAX_THETA = 6;

// Estimates are written rounded to this many decimal places. Cross-platform
// floating point noise (different libm / V8 builds) perturbs the optimizer
// path at the ~1e-9 level; rounding to 8 decimals makes regeneration
// byte-stable across machines while staying far above the golden test's
// comparison tolerance (1e-6).
const BASELINE_DECIMALS = 8;

const FIXTURE_DIR = path.join(__dirname, '..', 'src', '__tests__', '__fixtures__', 'golden');

const rng = seedrandom(SEED);

/** Standard normal draw via the Box-Muller transform, using the seeded rng. */
function randomNormal() {
  let u = 0;
  let v = 0;
  // Avoid log(0)
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** The 4PL item response function (kept inline so this script is standalone). */
function itemResponseFunction(theta, { a, b, c, d }) {
  return c + (d - c) / (1 + Math.exp(-a * (theta - b)));
}

function round(x, digits) {
  const factor = Math.pow(10, digits);
  return Math.round(x * factor) / factor;
}

// ---------------------------------------------------------------------------
// 1. Item bank: difficulties evenly spaced in [-3, 3], discriminations in
//    [0.8, 2.2], every fifth item with a nonzero guessing parameter so the
//    bank exercises the 3PL code path.
// ---------------------------------------------------------------------------
const items = [];
for (let i = 0; i < N_ITEMS; i++) {
  items.push({
    item: i + 1,
    a: round(0.8 + 1.4 * rng(), 3),
    b: round(-3 + (6 * i) / (N_ITEMS - 1), 3),
    c: i % 5 === 0 ? 0.15 : 0,
    d: 1,
  });
}

// ---------------------------------------------------------------------------
// 2. Examinees: thetas drawn from N(0, 1.5), truncated to [-4, 4].
// ---------------------------------------------------------------------------
const people = [];
for (let p = 0; p < N_PEOPLE; p++) {
  const theta = Math.max(-4, Math.min(4, 1.5 * randomNormal()));
  people.push({ pid: p + 1, theta: round(theta, 4) });
}

// ---------------------------------------------------------------------------
// 3. Responses: Bernoulli draws from the 4PL response probability.
// ---------------------------------------------------------------------------
const responses = people.map(({ pid, theta }) => {
  const resps = items.map((item) => (rng() < itemResponseFunction(theta, item) ? 1 : 0));
  return { pid, resps };
});

// ---------------------------------------------------------------------------
// 4. jsCAT estimates (characterization baseline).
// ---------------------------------------------------------------------------
const expected = responses.map(({ pid, resps }) => {
  const zetas = items.map(({ a, b, c, d }) => ({ a, b, c, d }));

  const catMLE = new Cat({ method: 'MLE', minTheta: MIN_THETA, maxTheta: MAX_THETA });
  catMLE.updateAbilityEstimate(zetas, resps);

  const catEAP = new Cat({
    method: 'EAP',
    minTheta: MIN_THETA,
    maxTheta: MAX_THETA,
    priorDist: 'norm',
    priorPar: [0, 1],
  });
  catEAP.updateAbilityEstimate(zetas, resps);

  return {
    pid,
    theta_mle: round(catMLE.theta, BASELINE_DECIMALS),
    se_mle: round(catMLE.seMeasurement, BASELINE_DECIMALS),
    theta_eap: round(catEAP.theta, BASELINE_DECIMALS),
    se_eap: round(catEAP.seMeasurement, BASELINE_DECIMALS),
  };
});

// ---------------------------------------------------------------------------
// 5. Write fixtures.
// ---------------------------------------------------------------------------
fs.mkdirSync(FIXTURE_DIR, { recursive: true });

const itemsCsv = ['item,a,b,c,d', ...items.map((i) => `${i.item},${i.a},${i.b},${i.c},${i.d}`)].join('\n');
fs.writeFileSync(path.join(FIXTURE_DIR, 'items.csv'), itemsCsv + '\n');

const respHeader = ['pid', ...items.map((i) => `i${i.item}`)].join(',');
const respCsv = [respHeader, ...responses.map(({ pid, resps }) => [pid, ...resps].join(','))].join('\n');
fs.writeFileSync(path.join(FIXTURE_DIR, 'responses.csv'), respCsv + '\n');

const thetaCsv = ['pid,theta', ...people.map(({ pid, theta }) => `${pid},${theta}`)].join('\n');
fs.writeFileSync(path.join(FIXTURE_DIR, 'true-thetas.csv'), thetaCsv + '\n');

const expectedCsv = [
  'pid,theta_mle,se_mle,theta_eap,se_eap',
  ...expected.map((r) => `${r.pid},${r.theta_mle},${r.se_mle},${r.theta_eap},${r.se_eap}`),
].join('\n');
fs.writeFileSync(path.join(FIXTURE_DIR, 'expected-jscat.csv'), expectedCsv + '\n');

const provenance = {
  seed: SEED,
  nItems: N_ITEMS,
  nPeople: N_PEOPLE,
  thetaBounds: [MIN_THETA, MAX_THETA],
  generator: 'scripts/generate-golden-fixtures.js',
  generatedAt: new Date().toISOString(),
  jscatVersion: require('../package.json').version,
  note:
    'expected-jscat.csv is a characterization baseline generated by jsCAT itself. ' +
    'expected-r-reference.csv (if present) is the independent reference generated by ' +
    'validation/generate-r-reference.R using the catR package.',
};
fs.writeFileSync(path.join(FIXTURE_DIR, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n');

console.log(`Wrote golden fixtures for ${N_PEOPLE} examinees x ${N_ITEMS} items to ${FIXTURE_DIR}`);
