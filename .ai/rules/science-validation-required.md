---
title: Scientific validation required
description: Every new or changed psychometric algorithm must ship a literature reference, analytic unit tests, and golden fixture tests against an independent reference implementation (catR/mirt) that run in CI.
impact: CRITICAL
scope: all
tags: validation, golden-tests, psychometrics
---

## Scientific validation required

jsCAT scores real assessments. An algorithm that "looks right" and passes structural tests can still be numerically wrong. Every PR that adds or changes an estimator, selector, information function, or likelihood must carry three kinds of evidence, and the evidence must be executable — a validation plot in the README is documentation, not proof.

### Required evidence

1. **Literature reference** in the class JSDoc (`@remarks` + Reference line: author, year, journal), plus documented model scope — which IRT models (1PL/2PL/3PL/4PL) the implementation is exact for and what happens outside that scope.
2. **Analytic unit tests**: at least one closed-form case with the derivation in a comment (e.g., a single Rasch item answered correctly gives WLE θ = ln 3 ≈ 1.0986).
3. **Golden fixture tests**: regenerate `src/__tests__/__fixtures__/golden/` via `npm run fixtures:generate`, regenerate the independent reference via `Rscript validation/generate-r-reference.R` (catR), and extend `src/__tests__/golden.test.ts` with the new columns. The committed CSVs make the validation run in CI on every future PR, with no R at test time.

### Incorrect

```typescript
// ❌ New estimator validated only by a plot generated once and committed as a PNG
// ❌ Tests that assert structure, not values:
it('estimates ability', () => {
  cat.updateAbilityEstimate(zetas, resps);
  expect(typeof cat.theta).toBe('number');   // passes for any wrong answer
});
// ❌ Changing the characterization baseline (expected-jscat.csv) without
//    explaining the numerical change in the PR description
```

### Correct

```typescript
// Analytic test with derivation
it('correctly updates ability estimate through WLE', () => {
  // Single Rasch item (a=1, b=0), correct response.
  // WLE score equation: (1−σ) + 0.5·(1−2σ) = 0 ⟹ σ = 0.75 ⟹ θ = logit(0.75) = ln 3
  const cat = new Cat({ method: 'WLE' });
  cat.updateAbilityEstimate({ a: 1, b: 0, c: 0, d: 1 }, 1);
  expect(cat.theta).toBeCloseTo(Math.log(3), 2);
});
```

Plus regenerated golden fixtures with the catR `method = "WL"` reference column, asserted within the tolerances defined in `golden.test.ts`.

### The principle

This is how SciPy-class projects stay correct: reference values from an independent implementation, committed to the repo, asserted on every CI run. A reviewer cannot referee numerical code by reading it — but a passing golden test against catR cannot be faked by plausible-looking code, human- or AI-written. Validation that doesn't run automatically will silently rot the first time someone touches the algorithm.
