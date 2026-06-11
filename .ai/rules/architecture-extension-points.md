---
title: Algorithm extension points
description: Estimators, item selectors, and stopping criteria are added through their registries and interfaces — never by adding dispatch logic to Cat or Clowder.
impact: CRITICAL
scope: all
tags: architecture, estimators, selectors, registry
---

## Algorithm extension points

jsCAT's algorithms are pluggable. Each algorithm family has an interface, a directory, and a registry that serves as the single source of truth for the family's type union, runtime validation, and dispatch. Adding an algorithm means adding a file and one registry entry — existing code, especially `Cat`, does not change.

| Family | Interface | Directory | Registry |
|--------|-----------|-----------|----------|
| Ability estimators | `AbilityEstimator` | `src/estimators/` | `src/estimators/registry.ts` (`ABILITY_ESTIMATORS`) |
| Item selectors | `ItemSelector` | `src/selectors/` | `src/selectors/registry.ts` (`SELECTORS` + allowlists) |
| Stopping criteria | `EarlyStopping` (abstract class) | `src/stopping.ts` | exported subclasses |

### Incorrect

```typescript
// Adding an estimator by editing Cat's dispatch — every new algorithm
// makes the most safety-critical file in the library grow
// src/cat.ts
if (method === 'eap') {
  this._theta = this.estimateAbilityEAP();
} else if (method === 'mle') {
  this._theta = this.estimateAbilityMLE();
} else if (method === 'wle') {              // ❌ new branch in Cat
  this._theta = this.estimateAbilityWLE();  // ❌ new private method in Cat
}

// ❌ and separately maintaining the validation list by hand
const validMethods: Array<string> = ['mle', 'eap', 'wle'];
```

### Correct

```typescript
// 1. New file: src/estimators/wle.ts
export class WLEEstimator implements AbilityEstimator {
  estimateAbility(context: EstimationContext): number { /* ... */ }
}

// 2. One entry in src/estimators/registry.ts
export const ABILITY_ESTIMATORS = {
  mle: new MLEEstimator(),
  eap: new EAPEstimator(),
  wle: new WLEEstimator(), // ← the only edit to existing code
} as const;

// 3. Re-export from src/estimators/index.ts
```

The `EstimationMethod` type, `validateEstimationMethod`, and `Cat`'s dispatch all derive from the registry object automatically.

### The principle

`Cat` orchestrates; it does not implement algorithms. When dispatch lives in one registry, a reviewer of an algorithmic PR reads exactly one new file plus one-line diffs — there is no opportunity to silently alter MLE while adding WLE. This is what makes AI-generated algorithm contributions reviewable: the blast radius of a new estimator is structurally confined.
