---
title: TypeScript strictness
description: Strict mode conventions — literal unions derived from registries, no `as any`, narrow escape hatches.
impact: HIGH
scope: all
tags: typescript, types
---

## TypeScript strictness

The package compiles with `strict: true`. Work with the type system, not around it.

### Literal unions derive from the registries

Method names are typed as unions derived from the registry objects — never as free-standing string lists that can drift from the implementation:

```typescript
// ✅ src/estimators/registry.ts — the object is the source of truth
export const ABILITY_ESTIMATORS = { mle: ..., eap: ... } as const;
export type EstimationMethod = keyof typeof ABILITY_ESTIMATORS;

// ❌ a hand-maintained list that can disagree with the registry
const validMethods: Array<string> = ['mle', 'eap'];
```

Public inputs use the `Input` variants (e.g., `EstimationMethodInput`), which add `(string & Record<never, never>)` so editors autocomplete the canonical names while arbitrary-case strings ('MLE', 'miDdle') keep compiling and are normalized at runtime. Don't narrow public inputs to the bare unions — that's a breaking change for JS consumers and case-variant callers.

### No `as any`

Use `as const` for literal types, generics for reusable helpers, and `// eslint-disable-next-line @typescript-eslint/no-non-null-assertion` scoped to a single line where a value is guaranteed by a prior check (the codebase uses `difficulty!` after `fillZetaDefaults`). If a third-party module lacks types, add a minimal `.d.ts` (see `src/optimization-js.d.ts`) rather than casting call sites.

### Interfaces over structural drift

New estimators/selectors implement the published interfaces (`AbilityEstimator`, `ItemSelector`). Don't add untyped extra parameters to `estimateAbility`/`select` — extend `EstimationContext`/`SelectorContext` instead, with optional fields and JSDoc, so all implementations stay call-compatible.

### The principle

In a library consumed by both TS and JS users, types are API documentation that the compiler enforces. Deriving them from runtime objects means the docs cannot lie; an AI or human contributor who invents a method name gets a compile error instead of a silent fallthrough.
