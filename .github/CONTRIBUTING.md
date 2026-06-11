# Contributing to jsCAT

Thank you for contributing! jsCAT is a research software project: it implements psychometric algorithms whose correctness matters for real assessments of real students. This guide explains how to set up a development environment, how the codebase is organized, and — most importantly — what we require before merging a new algorithm.

AI-assisted contributions are welcome (many of our best PRs are AI-generated). See [AI-assisted contributions](#ai-assisted-contributions) for the disclosure policy, and note that the requirements below are designed so that a reviewer can verify correctness without trusting the author or the tool that produced the code.

## Development setup

```bash
git clone https://github.com/yeatmanlab/jsCAT.git
cd jsCAT
nvm use          # respects .nvmrc
npm ci
npm test         # Jest unit + golden tests
npm run lint     # ESLint
npm run build    # tsc → lib/
```

Optional, for regenerating validation references: R ≥ 4.0 with the `catR` package (and `mirt` + `tidyverse` for the exploratory Rmd in `validation/`).

## Architecture overview

```
src/
  cat.ts            # Cat class: orchestrates estimation + item selection
  clowder.ts        # Clowder: manages multiple Cats over a shared corpus
  corpus.ts         # Zeta (item parameter) validation and format conversion
  estimators/       # Ability estimators (MLE, EAP, ...) — registry pattern
  selectors/        # Item selectors (MFI, closest, random, fixed, middle) — registry pattern
  stopping.ts       # Early-stopping criteria — abstract base class pattern
  utils.ts          # IRF, Fisher information, distributions
  type.ts           # Zeta, Stimulus, and related types
```

The key design rule: **algorithms are added by creating new files, not by editing existing ones.** Estimators implement the `AbilityEstimator` interface and are registered in `src/estimators/registry.ts`. Selectors implement `ItemSelector` and are registered in `src/selectors/registry.ts`. Stopping criteria subclass `EarlyStopping` in `src/stopping.ts`. The `Cat` class dispatches through the registries and should not need changes when you add an algorithm.

## Tutorial: adding a new ability estimator

Suppose you want to add WLE (Warm's weighted likelihood estimation). The complete change is:

**1. Create `src/estimators/wle.ts`** implementing the interface:

```typescript
import { AbilityEstimator, EstimationContext } from './types';
import { logLikelihood } from './log-likelihood';
import { maximizeOverTheta } from './optimize';
import { fisherInformation } from '../utils';

/**
 * Weighted Likelihood Estimation (WLE) of ability.
 *
 * @remarks
 * Document the math, the IRT models it is exact for, and any approximations.
 *
 * Reference: Warm, T. A. (1989). Weighted likelihood estimation of ability in
 * item response theory. Psychometrika, 54(3), 427-450.
 */
export class WLEEstimator implements AbilityEstimator {
  estimateAbility(context: EstimationContext): number {
    const { zetas, resps } = context;
    return maximizeOverTheta((theta) => {
      const totalInfo = zetas.reduce((sum, zeta) => sum + fisherInformation(theta, zeta), 0);
      if (totalInfo <= 0) return logLikelihood(theta, zetas, resps);
      return logLikelihood(theta, zetas, resps) + 0.5 * Math.log(totalInfo);
    });
  }
}
```

**2. Register it** in `src/estimators/registry.ts`:

```typescript
export const ABILITY_ESTIMATORS = {
  mle: new MLEEstimator(),
  eap: new EAPEstimator(),
  wle: new WLEEstimator(),  // ← the only edit to existing code
} as const;
```

The `EstimationMethod` type, runtime validation, `Cat` dispatch, and error messages all update automatically. Export the class from `src/estimators/index.ts`.

**3. Add unit tests** in `src/__tests__/cat.test.ts` (or a new file). At minimum:

- An **analytic test**: a case with a closed-form answer (e.g., one Rasch item answered correctly gives a WLE of ln 3 — show the derivation in a comment).
- A **behavioral test**: a property the estimator must satisfy (e.g., |WLE| < |MLE| for extreme response patterns).
- A **bounds test**: estimates respect `minTheta`/`maxTheta` and produce finite `seMeasurement`.

**4. Wire it into the golden tests** (see `validation/README.md`):

- Add the estimator to `scripts/generate-golden-fixtures.js` and run `npm run fixtures:generate`.
- Add the corresponding reference call to `validation/generate-r-reference.R` (catR's `thetaEst` supports `method = "WL"`) and run it with `Rscript`.
- Add the new columns to `src/__tests__/golden.test.ts`.
- Commit the regenerated CSVs. The PR must show the golden test passing against the independent R reference.

**5. Document it**: update the README's method list and add the validation plot if you ran the exploratory Rmd.

Adding an item selector or stopping criterion follows the same shape — implement the interface (`src/selectors/types.ts`) or subclass `EarlyStopping` (`src/stopping.ts`), register, test.

## Requirements for algorithmic PRs

Every PR that adds or changes a psychometric algorithm must include:

1. **A literature reference** for the method, cited in the class JSDoc (author, year, journal).
2. **Documented scope**: which IRT models (1PL/2PL/3PL/4PL) the implementation is exact for, and what happens outside that scope.
3. **Analytic unit tests** for closed-form cases, with the derivation in a comment.
4. **Golden test coverage**: committed fixtures showing agreement with an independent reference implementation (catR or mirt), passing in CI. A validation plot alone is not sufficient — plots rot, tests don't.
5. **No new dispatch logic** outside the registries.

PRs that change existing numerical behavior must regenerate the characterization baseline (`npm run fixtures:generate`) and justify the change in the PR description.

## AI-assisted contributions

We welcome PRs drafted with AI coding tools. Two requirements:

1. **Disclose it** in the PR description (tool and rough extent, e.g., "implementation and tests generated with Claude, validation design by me").
2. **The validation evidence must be machine-checkable.** Reviewers will not line-by-line trust generated numerical code; they will trust a passing golden test against committed catR/mirt reference values, because that cannot be pattern-matched into existence.

If you are using an AI agent in this repo, point it at `CLAUDE.md` / `AGENTS.md` and the rules in `.ai/rules/` — they encode everything on this page in machine-readable form.

## Style and process

- TypeScript strict mode; no `as any`; prefer the literal-union types exported from the registries over raw strings.
- All public functions get JSDoc with `@param`/`@returns`; algorithm classes additionally get `@remarks` with the math and a reference.
- Prettier and ESLint are enforced in CI: `npm run lint && npm run format`.
- Branch naming: `enh/`, `fix/`, `refactor/`, `maint/`, `dep/` prefixes (e.g., `enh/wle-estimation`).
- Open PRs in draft mode; mark ready for review once CI is green.
- Run `npm test && npm run lint` locally before pushing.

## Questions

Open a [GitHub issue](https://github.com/yeatmanlab/jsCAT/issues) — including for questions about whether an algorithmic idea fits the library before you build it. We'd rather discuss the design first.
