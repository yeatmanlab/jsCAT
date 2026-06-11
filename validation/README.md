# Validation

jsCAT validates its psychometric algorithms against independent reference implementations in R ([catR](https://cran.r-project.org/package=catR) and [mirt](https://cran.r-project.org/package=mirt)). Validation happens at two levels.

## 1. Automated golden tests (run on every CI build)

`src/__tests__/golden.test.ts` scores a committed fixture set (50-item bank × 100 simulated examinees) with every ability estimator and asserts two things:

1. **Characterization**: estimates exactly reproduce the committed baseline (`expected-jscat.csv`). This catches unintended numerical changes from refactors.
2. **External reference**: estimates agree with catR within tolerance (`expected-r-reference.csv`). This catches algorithmic errors. These tests skip automatically if the reference file has not been generated yet.

### Regenerating fixtures

The fixture inputs (item bank, responses) are generated deterministically from a fixed seed:

```bash
npm run fixtures:generate          # writes src/__tests__/__fixtures__/golden/
Rscript validation/generate-r-reference.R   # writes expected-r-reference.csv (requires R + catR)
```

Regenerate `expected-jscat.csv` **only** when you intentionally change an algorithm's numerical behavior, and explain why in your PR. Regenerate `expected-r-reference.csv` whenever the fixture inputs change or a new estimator is added.

### Adding a new estimator to the golden tests

When you add an estimator (see CONTRIBUTING.md), extend three places:

1. `scripts/generate-golden-fixtures.js` — add a column for the new estimator to `expected-jscat.csv`
2. `validation/generate-r-reference.R` — add the corresponding catR/mirt scoring call (e.g., `method = "WL"` in `thetaEst` for WLE)
3. `src/__tests__/golden.test.ts` — add the column to the comparison lists

## 2. Exploratory validation (manual, per release or per new algorithm)

`analysis/jsCAT-validation.Rmd` is the original simulation-based comparison of jsCAT against mirt and catR, producing the plots in `plots/` that are shown in the README. Run it when adding a new algorithm or preparing a release:

1. Install R (≥ 4.0) with `mirt`, `catR`, `tidyverse`
2. Build jsCAT: `npm run build`
3. Knit `analysis/jsCAT-validation.Rmd` from the `analysis/` directory

The `simulation/` directory contains the Node scripts the Rmd shells out to.

## Why both levels?

The golden tests are the enforcement mechanism: they run on every PR, require no R at test time, and fail loudly if an estimator drifts from the reference. The Rmd is the exploration mechanism: it covers adaptive item-selection trajectories and produces human-readable plots, but nothing fails automatically if it rots. A plot is documentation; a test is a guarantee.
