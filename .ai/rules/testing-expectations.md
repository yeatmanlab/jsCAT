---
title: Testing expectations
description: Three tiers of tests for psychometric code — analytic, golden, and behavioral — with explicit numeric tolerances.
impact: HIGH
scope: all
tags: testing, tolerances, golden-tests
---

## Testing expectations

### The three tiers

1. **Analytic tests** — closed-form cases with the derivation in a comment. The strongest evidence: no reference software needed, exact expected value known.
2. **Golden tests** — `src/__tests__/golden.test.ts` compares every estimator against (a) a committed characterization baseline (exact reproduction) and (b) an independent catR reference (within tolerance). New estimators must be wired in; see `validation/README.md`.
3. **Behavioral/property tests** — invariants that hold regardless of exact values: estimates respect `[minTheta, maxTheta]`; `seMeasurement` is finite and positive after informative items; symbolic (`a,b,c,d`) and semantic (`discrimination,difficulty,...`) parameter formats produce identical results (the existing test suites loop over both formats — keep that pattern); WLE is less extreme than MLE for extreme response patterns; etc.

### Numeric assertions use explicit tolerances

```typescript
// ✅ tolerance is visible and justified
expect(cat.theta).toBeCloseTo(Math.log(3), 2);
expect(maxDiff).toBeLessThan(R_REFERENCE_MAX_ABS_DIFF); // named constant with comment

// ❌ snapshot of floating point output — breaks on any platform/optimizer noise,
//    and a careless `--update` silently rewrites the expected science
expect(cat.theta).toMatchSnapshot();

// ❌ structure-only assertion — passes for any wrong number
expect(typeof cat.theta).toBe('number');
```

### Test data conventions

- Fixtures live in `src/__tests__/__fixtures__/` (excluded from test discovery by jest config).
- Fixture generation is deterministic: fixed seeds via `seedrandom`, generation scripts committed (`scripts/generate-golden-fixtures.js`).
- Don't hand-edit generated fixture CSVs; regenerate them.

### When behavior intentionally changes

Regenerating `expected-jscat.csv` is allowed only with an intentional, explained algorithm change. The PR description must state which values moved and why; the catR reference comparison must still pass.

### The principle

Tests for scientific code answer two different questions: "is it right?" (analytic + golden) and "did it change?" (characterization). Keep both. A test suite that only checks shapes and types will happily certify an estimator that's off by a sign.
