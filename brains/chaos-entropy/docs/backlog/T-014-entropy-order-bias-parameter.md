# T-014 — Entropy ↔ Order bias parameter

**Column:** Backlog
**Priority:** Medium
**Estimate:** M

## Context

The artist practice that anchors this engine (see [docs/AESTHETIC-LINEAGE.md](../AESTHETIC-LINEAGE.md))
spans a deliberate dual: maximum entropic imagery (decentralized, formless, pattern-free)
and its inverse (maximum geometric order, no noise, perfect structure). The current
engine exposes `noise` level as a proxy for this spectrum, but a dedicated scalar
parameter would make the axis explicit and sweepable.

## Problem

A caller wanting to generate a batch biased toward the "order" pole must manually
restrict axis ranges (low noise, cardinal rotations, neutral color palette). There is no
single parameter that expresses position on the entropy-order spectrum, and no built-in
sweep mode.

## Proposed solution

Add an `entropy_order_bias` scalar parameter in `[0.0, 1.0]`:

- `0.0` — maximum order: noise locked to level 0, rotation quantized to {0, 90, 180,
  270}°, color sampling biased toward pure-hue/neutral HSV regions, glyph selection
  restricted to high-regularity codepoints (configurable list).
- `1.0` — maximum entropy: noise at max level, rotation fully uniform across 360 steps,
  HSV full lattice unconstrained.
- Intermediate values linearly interpolate the axis sub-ranges.

The parameter must be part of the seeded-sampler contract (i.e., it is a caller-supplied
hyperparameter, not drawn from the seed, so it does not change the seed→params mapping
for existing seeds — no engine version bump when the parameter is added with a default of
0.5 that reproduces the current unconstrained behavior).

## Acceptance criteria

- [ ] `entropy_order_bias` accepted by `sample(seed, bias)` in Python PoC and Rust core.
- [ ] Default value `0.5` reproduces output identical to the current unconstrained
      sampler for all existing test seeds (determinism regression test extended).
- [ ] CLI flag `--bias <float>` wired through to sampler.
- [ ] Manifest format records `entropy_order_bias` when non-default.
- [ ] At least one unit test per pole (0.0, 1.0) asserting the constrained axis ranges.
- [ ] AESTHETIC-LINEAGE.md updated to reference the implemented parameter.

## Notes

The `0.0` (order) pole corresponds directly to 0thernes's Prompt 4: "Maximum structure
Maximum Solids Maximum Order infinite stability … Not hallucinating. No noise. No blurry."
The `1.0` (entropy) pole corresponds to Prompts 1–3 and 5. Both poles should produce
valid, deterministic output — neither is a degenerate case.
