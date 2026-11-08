# Spec — implementable hooks

| Hook | Note |
| --- | --- |
| Markers | `bootstrap`, `glory`, `reentrant` |
| Code | `src/sim/thaler-sentience.ts`, `super-mind.ts`, `gedanken-death.ts` |
| Tests | `tests/thaler-sentience.test.ts` |
| Offline sweep | `bun run thaler:sweep` (when restored from CQM stash) |

Determinism: seeded Rng only; no Math.random in sim proof paths.
