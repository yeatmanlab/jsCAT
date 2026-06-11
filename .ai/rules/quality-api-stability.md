---
title: Public API stability
description: The npm package is semver-bound; preserve both zeta formats, case-insensitive method names, and existing error messages.
impact: MEDIUM
scope: all
tags: api, semver, compatibility
---

## Public API stability

`@bdelab/jscat` is consumed by ROAR assessments in production and by external users. Everything exported from `src/index.ts` is public API and changes to it are semver events.

### Invariants to preserve

- **Both zeta formats work everywhere**: symbolic (`a, b, c, d`) and semantic (`discrimination, difficulty, guessing, slipping`) item parameters are interchangeable inputs. New code must handle both (use `fillZetaDefaults` / `convertZeta`); tests loop over both formats.
- **Method names are case-insensitive**: `'MLE'`, `'mle'`, and `'Mle'` are all valid and normalize to lowercase. Constructor inputs stay loosely typed (`EstimationMethodInput`) for this reason.
- **Error messages are contract**: existing throw messages (e.g., `'The abilityEstimator you provided is not in the list of valid methods'`) are asserted by downstream tests. Don't reword them casually.
- **Getters keep returning live state**: `theta`, `seMeasurement`, `nItems`, `resps`, `zetas`, `prior` on `Cat`; the corresponding aggregates on `Clowder`.
- **Mutation semantics of `findNextItem`**: `deepCopy = true` by default; `deepCopy = false` is documented to mutate the caller's array. Don't change either default.

### Changes that require a major version

Removing or renaming exports, narrowing accepted input types, changing default parameter values (`minTheta`, `maxTheta`, prior defaults, `startSelect`), or changing numerical behavior of an existing estimator (also see `science-validation-required.md` — baseline regeneration plus justification).

### Changes that are minor

Adding estimators/selectors/stopping criteria via the registries, adding optional fields to context interfaces, adding new exports.

### The principle

Assessment results must be comparable across time. A silent change to a default prior or an estimator's behavior changes children's scores between sessions of the same study. Additive evolution through the registries is cheap; behavioral change is expensive and must be deliberate, versioned, and announced.
