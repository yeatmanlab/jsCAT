/**
 * Golden fixture tests.
 *
 * These tests validate the ability estimators against committed fixture data
 * at two levels:
 *
 * 1. Characterization (always runs): jsCAT's estimates must exactly reproduce
 *    the committed baseline in expected-jscat.csv. This catches unintended
 *    numerical changes from refactors. If you change an algorithm
 *    intentionally, regenerate the baseline with
 *    `npm run fixtures:generate` and justify the change in your PR.
 *
 * 2. External reference (runs when expected-r-reference.csv is present):
 *    jsCAT's estimates must agree with the catR (R) reference implementation
 *    within tolerance. Generate the reference with
 *    `Rscript validation/generate-r-reference.R` and commit the CSV.
 *
 * See validation/README.md for the full workflow.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Cat } from '..';
import { Zeta } from '../type';

const FIXTURE_DIR = path.join(__dirname, '__fixtures__', 'golden');
const R_REFERENCE_FILE = path.join(FIXTURE_DIR, 'expected-r-reference.csv');

// Tolerances for agreement with the external (catR) reference. jsCAT and catR
// use different optimizers, so exact equality is not expected. Observed
// agreement on the initial fixture set: MLE max |diff| = 0.0036 (Powell vs.
// catR's optimizer, same objective), EAP max |diff| = 2.4e-6 (same rectangular
// quadrature). The bounds below give ~5x headroom over the observed MLE
// differences; if a new estimator legitimately needs looser bounds, document
// why in the PR rather than silently widening these.
const R_REFERENCE_MAX_ABS_DIFF = 0.02;
const R_REFERENCE_MEAN_ABS_DIFF = 0.002;

// The characterization baseline is jsCAT's own output, so agreement should be
// exact up to floating point noise across platforms.
const CHARACTERIZATION_PRECISION = 6; // decimal places

interface CsvRow {
  [key: string]: string;
}

/** Strip surrounding double quotes (R's write.csv quotes character fields and headers). */
function unquote(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}

function parseCsv(filepath: string): CsvRow[] {
  const lines = fs.readFileSync(filepath, 'utf8').trim().split('\n');
  const headers = lines[0].split(',').map(unquote);
  return lines.slice(1).map((line) => {
    const values = line.split(',').map(unquote);
    return headers.reduce<CsvRow>((row, header, i) => {
      row[header] = values[i] ?? '';
      return row;
    }, {});
  });
}

function loadFixtures() {
  const items = parseCsv(path.join(FIXTURE_DIR, 'items.csv'));
  const responses = parseCsv(path.join(FIXTURE_DIR, 'responses.csv'));

  const zetas: Zeta[] = items.map((item) => ({
    a: parseFloat(item.a),
    b: parseFloat(item.b),
    c: parseFloat(item.c),
    d: parseFloat(item.d),
  }));

  const respRows = responses.map((row) => {
    const resps = items.map((item) => parseInt(row[`i${item.item}`], 10) as 0 | 1);
    return { pid: parseInt(row.pid, 10), resps };
  });

  return { zetas, respRows };
}

function estimateAll(zetas: Zeta[], respRows: { pid: number; resps: (0 | 1)[] }[]) {
  return respRows.map(({ pid, resps }) => {
    const catMLE = new Cat({ method: 'MLE', minTheta: -6, maxTheta: 6 });
    catMLE.updateAbilityEstimate(zetas, resps);

    const catEAP = new Cat({ method: 'EAP', minTheta: -6, maxTheta: 6, priorDist: 'norm', priorPar: [0, 1] });
    catEAP.updateAbilityEstimate(zetas, resps);

    return {
      pid,
      theta_mle: catMLE.theta,
      se_mle: catMLE.seMeasurement,
      theta_eap: catEAP.theta,
      se_eap: catEAP.seMeasurement,
    };
  });
}

describe('Golden fixture tests', () => {
  const { zetas, respRows } = loadFixtures();
  const estimates = estimateAll(zetas, respRows);

  describe('characterization baseline (expected-jscat.csv)', () => {
    const baseline = parseCsv(path.join(FIXTURE_DIR, 'expected-jscat.csv'));

    it('has one baseline row per examinee', () => {
      expect(baseline.length).toBe(respRows.length);
    });

    it.each(['theta_mle', 'se_mle', 'theta_eap', 'se_eap'])('reproduces the committed %s values', (column) => {
      baseline.forEach((row, i) => {
        const actual = estimates[i][column as keyof typeof estimates[number]] as number;
        expect(actual).toBeCloseTo(parseFloat(row[column]), CHARACTERIZATION_PRECISION);
      });
    });
  });

  const describeRReference = fs.existsSync(R_REFERENCE_FILE) ? describe : describe.skip;

  describeRReference('external reference (expected-r-reference.csv, catR)', () => {
    // Note: describe bodies run during collection even when skipped, so only
    // parse the reference file when it exists.
    const reference = fs.existsSync(R_REFERENCE_FILE) ? parseCsv(R_REFERENCE_FILE) : [];

    it.each(['theta_mle', 'theta_eap'])('agrees with catR on %s within tolerance', (column) => {
      const diffs = reference.map((row, i) => {
        const actual = estimates[i][column as keyof typeof estimates[number]] as number;
        return Math.abs(actual - parseFloat(row[column]));
      });

      const maxDiff = Math.max(...diffs);
      const meanDiff = diffs.reduce((acc, d) => acc + d, 0) / diffs.length;

      expect(maxDiff).toBeLessThan(R_REFERENCE_MAX_ABS_DIFF);
      expect(meanDiff).toBeLessThan(R_REFERENCE_MEAN_ABS_DIFF);
    });
  });
});
