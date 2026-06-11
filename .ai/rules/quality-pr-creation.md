---
title: PR creation
description: Branch naming, draft mode, the algorithmic-contribution checklist, and AI disclosure.
impact: MEDIUM
scope: all
tags: process, git, prs
---

## PR creation

### Branch naming

`<prefix>/<short-description>` with prefixes: `enh/` (features), `fix/` (bug fixes), `refactor/`, `maint/`, `dep/` (dependency bumps). Example: `enh/wle-estimation`.

### Commits and titles

Imperative verb phrase, sentence-cased, no trailing period: `Add WLE ability estimator`, `Fix seeded RNG usage in Clowder item selection`. PR titles follow the same convention.

### Draft mode and checks

Open PRs as drafts. Before marking ready: `npm test && npm run lint` locally, and fill in the PR template checklist — the algorithmic checklist is mandatory for any change under `src/estimators/`, `src/selectors/`, `src/stopping.ts`, or to `itemResponseFunction`/`fisherInformation`/`logLikelihood`.

### AI disclosure

State in the PR description whether and how AI tools were used. This is not a gate — AI-assisted PRs are welcome — it tells reviewers where to spend attention: generated structure gets normal review; generated numerics get verified through the golden tests, not by trust.

### Scope discipline

One concern per PR. If you notice a small adjacent improvement (a misleading name, a missing JSDoc), fix it in the same PR rather than leaving a TODO — but split genuinely unrelated changes. A new estimator PR should contain: the estimator file, the registry entry, the export, tests, regenerated fixtures, and docs — and nothing else.

### The principle

The PR is the unit of scientific review here. A tightly-scoped PR with disclosed provenance and machine-checkable validation can be reviewed in minutes with high confidence; a sprawling one can only be skimmed and trusted.
