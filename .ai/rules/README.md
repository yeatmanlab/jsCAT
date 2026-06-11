# jsCAT Engineering Rules

Modular, enforceable engineering rules for jsCAT. Rules are both human-readable (for contributors to browse) and machine-readable (for AI coding tools to consume automatically). jsCAT is a psychometrics library used in live assessments, so the rules weight scientific correctness above all else.

## Rules index

| Rule | Impact | Description |
|------|--------|-------------|
| [architecture-extension-points](architecture-extension-points.md) | CRITICAL | Estimators, selectors, and stopping rules are added via registries/interfaces, never by editing `Cat` dispatch |
| [science-validation-required](science-validation-required.md) | CRITICAL | Every new or changed algorithm ships a literature reference, analytic tests, and golden fixtures vs. catR/mirt |
| [science-numerical-correctness](science-numerical-correctness.md) | HIGH | Log-space likelihoods, seeded RNG only, optimizer conventions, documented model scope |
| [testing-expectations](testing-expectations.md) | HIGH | Three test tiers (analytic, golden, behavioral); explicit tolerances; never snapshot floats |
| [quality-typescript-strictness](quality-typescript-strictness.md) | HIGH | Literal unions over raw strings, no `as any`, strict mode conventions |
| [quality-api-stability](quality-api-stability.md) | MEDIUM | Public API is semver-bound; both zeta formats keep working; case-insensitive method names |
| [quality-pr-creation](quality-pr-creation.md) | MEDIUM | Branch naming, draft PRs, the algorithmic checklist, AI disclosure |

## Impact levels

- **CRITICAL**: Violations risk shipping incorrect ability estimates to real assessments. Must always be followed.
- **HIGH**: Violations cause architectural inconsistency or undermine the validation safety net.
- **MEDIUM**: Best practices for consistency. Follow for new code.

## How AI tools discover these rules

- **Claude Code / Cowork**: `CLAUDE.md` at the repo root (symlink to `AGENTS.md`).
- **Cursor / Copilot and others**: `AGENTS.md` at the repo root.

Both point here. Each rule is self-contained with incorrect/correct examples.

## Contributing a rule

Add or update rules in the same PR that introduces or changes the pattern they describe. Keep the set small (under ~10 rules); prune rather than accumulate.
