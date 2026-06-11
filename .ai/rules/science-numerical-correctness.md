---
title: Numerical correctness conventions
description: Likelihood, optimization, and randomness conventions that keep estimates correct and simulations reproducible.
impact: HIGH
scope: all
tags: numerics, likelihood, rng, optimization
---

## Numerical correctness conventions

### Likelihoods live in log space, computed once

All likelihood-based estimators use `logLikelihood` from `src/estimators/log-likelihood.ts`. Do not reimplement it per estimator, and do not work with raw likelihood products (they underflow beyond a few dozen items).

```typescript
// ❌ Incorrect: private likelihood with a nonzero reduce seed (returns ln L + 1)
private likelihood(theta: number) {
  return this._zetas.reduce((acc, zeta, i) => /* ... */, 1);
}

// ✅ Correct: the shared helper, seeded at 0
import { logLikelihood } from './log-likelihood';
```

### Optimization goes through the shared scaffold

Estimators that maximize an objective use `maximizeOverTheta` from `src/estimators/optimize.ts`. It owns the optimizer choice (Powell), the start value, and the negation convention. Powell searches unbounded; `Cat` clamps the result to `[minTheta, maxTheta]` afterward — document, don't duplicate, this behavior. Guard objectives against domain errors (e.g., `Math.log` of a non-positive information sum).

### Randomness is always seeded

Every random draw goes through the Cat/Clowder seeded RNG (`this._rng` or the `randomInteger` provided in `SelectorContext`). `Math.random()` is forbidden in `src/` — it silently breaks the reproducibility that `randomSeed` promises to simulation users.

```typescript
// ❌ Incorrect
const random = Math.random();

// ✅ Correct
const random = this._rng();
```

### Model scope is explicit

jsCAT accepts 4PL parameters (a, b, c, d) everywhere. If an algorithm's theory only covers a subset (e.g., a bias correction exact for 1PL/2PL but approximate under 3PL/4PL), say so in the JSDoc and validate at least the exact scope against the R reference.

### Magic constants get derivations

Numerical constants carry a comment deriving them (see `CLOSEST_SELECTION_OFFSET` in `src/selectors/closest.ts`: 0.481 = ln((1+√5)/2), the information-maximizing offset for c = 0.5). An underived constant is unreviewable.

### The principle

Numerical bugs don't throw — they return plausible wrong numbers. Conventions that centralize the likelihood, the optimizer, and the RNG mean there is exactly one place for each class of bug to live, and the golden tests watch that place.
