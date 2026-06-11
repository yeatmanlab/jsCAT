# jsCAT Development Guide for AI Agents

You are working in jsCAT, a TypeScript library for IRT-based computer adaptive testing used in production assessments of real students (the ROAR platform). Scientific correctness outranks everything else: a plausible-but-wrong estimator silently corrupts children's scores.

## Do

- Add algorithms through the extension points, never by editing dispatch logic (see [architecture-extension-points](.ai/rules/architecture-extension-points.md)):
  - Ability estimators: implement `AbilityEstimator`, register in `src/estimators/registry.ts`
  - Item selectors: implement `ItemSelector`, register in `src/selectors/registry.ts`
  - Stopping criteria: subclass `EarlyStopping` in `src/stopping.ts`
- Ship validation with every algorithm: literature reference in JSDoc, analytic unit tests with derivations, regenerated golden fixtures vs. the catR reference (see [science-validation-required](.ai/rules/science-validation-required.md))
- Use the shared numerics: `logLikelihood`, `maximizeOverTheta`, the seeded RNG (see [science-numerical-correctness](.ai/rules/science-numerical-correctness.md))
- Support both zeta formats (symbolic `a,b,c,d` and semantic `discrimination,difficulty,guessing,slipping`) in any code touching item parameters
- Write numeric assertions with explicit tolerances (see [testing-expectations](.ai/rules/testing-expectations.md))
- Follow the tutorial in [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) when adding an estimator — it walks through the complete change

## Don't

- Never add `if/else` method dispatch to `Cat` or hand-maintained `validMethods` arrays — the registries are the single source of truth
- Never use `Math.random()` in `src/` — use the seeded RNG (`this._rng` / `SelectorContext.randomInteger`)
- Never reimplement the likelihood, IRF, or Fisher information per estimator — import the shared functions
- Never use `as any` or snapshot-test floating point values
- Never change existing error message strings, default parameter values, or numerical behavior without flagging it as a breaking/behavioral change (see [quality-api-stability](.ai/rules/quality-api-stability.md))
- Never hand-edit generated fixture CSVs in `src/__tests__/__fixtures__/golden/` — regenerate them
- Never present a validation plot as sufficient evidence — wire the comparison into the golden tests so it runs in CI

## Commands

```bash
npm test                   # Jest unit + golden tests
npm run lint               # ESLint
npm run build              # tsc → lib/
npm run fixtures:generate  # regenerate golden fixtures (build + script)
Rscript validation/generate-r-reference.R  # regenerate catR reference (requires R)
```

## Project structure

```
src/
  cat.ts          # Cat: orchestrates estimation + item selection (do not add algorithms here)
  clowder.ts      # Clowder: multiple Cats over a shared corpus
  corpus.ts       # Zeta validation + symbolic/semantic conversion
  estimators/     # AbilityEstimator implementations + registry
  selectors/      # ItemSelector implementations + registry
  stopping.ts     # EarlyStopping abstract class + subclasses
  utils.ts        # itemResponseFunction, fisherInformation, distributions
  __tests__/      # Jest tests; __fixtures__/golden/ holds generated fixtures
scripts/          # fixture generation
validation/       # R reference generation + exploratory Rmd (see validation/README.md)
.ai/rules/        # the full rule set — read before nontrivial changes
```

## Boundaries

### Ask first

- Adding dependencies
- Changing anything exported from `src/index.ts` (public API)
- Changing default parameter values or error message strings
- Regenerating the characterization baseline (`expected-jscat.csv`)

### Never do

- Skip the validation requirements for algorithmic changes
- Bypass the registries with new dispatch logic
- Commit edits to generated fixtures without regenerating them from the scripts

## When stuck

- The reference implementation for "how to add an estimator" is the tutorial in `.github/CONTRIBUTING.md`
- The golden test workflow is documented in `validation/README.md`
- Open a draft PR with notes rather than guessing about psychometric intent
