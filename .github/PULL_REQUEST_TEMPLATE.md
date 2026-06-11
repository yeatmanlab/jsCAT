## Summary

<!-- What does this PR do, and why? -->

## Checklist (all PRs)

- [ ] Tests added/updated at the right level for the change
- [ ] `npm test` and `npm run lint` pass locally
- [ ] AI assistance disclosed below (if any)

## Checklist (PRs that add or change a psychometric algorithm)

- [ ] Literature reference cited in the class JSDoc
- [ ] Documented model scope (1PL/2PL/3PL/4PL; exact vs. approximate)
- [ ] Analytic unit test(s) for closed-form cases, with derivation in a comment
- [ ] Algorithm registered via the registry (`src/estimators/registry.ts` / `src/selectors/registry.ts`) — no new dispatch logic elsewhere
- [ ] Golden fixtures regenerated (`npm run fixtures:generate`) and R reference regenerated (`Rscript validation/generate-r-reference.R`)
- [ ] Golden tests pass against the independent R reference
- [ ] If existing numerical behavior changed: justification included below

## AI assistance disclosure

<!-- e.g., "Implementation and tests generated with Claude Code; validation design and review by me." Write "None" if not applicable. -->

## Validation evidence

<!-- For algorithmic changes: link the golden test run, and optionally attach the validation plot from the exploratory Rmd. -->
