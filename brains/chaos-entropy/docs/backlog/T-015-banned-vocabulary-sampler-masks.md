# T-015 — Constraint-set "banned vocabulary" sampler masks

**Column:** Backlog
**Priority:** Medium
**Estimate:** M

## Context

In 0thernes's adversarial prompting practice (see [docs/AESTHETIC-LINEAGE.md](../AESTHETIC-LINEAGE.md),
Section 2.3), Technique T2 is **negative-constraint stacking**: entire visual vocabularies
are banned from the prompt — no right angles, squares, pillars, spirals, Fibonacci
sequence forms, golden-ratio proportions, waves, linearity. This starves the diffusion
model of its highest-probability compositional defaults.

The analogous mechanism in this engine is a **named sampler mask**: a constraint set that
restricts which regions of the parameter space are reachable from a given seed, without
post-render rejection, so the determinism contract is preserved.

## Problem

Currently the sampler draws uniformly across all axis tables. There is no way to express
"generate images from this subset of the space that excludes geometric-primacy
orientations" without writing custom axis-table overrides by hand. The mechanism should
be a first-class, named, versioned artifact.

## Proposed solution

Define a **mask schema** — a JSON document that specifies exclusion rules per axis:

```json
{
  "schema": "ceae-mask/1",
  "id": "geometric_primacy_ban",
  "description": "Excludes cardinal-angle rotations and high-regularity rectilinear glyphs — analog of T2 negative-constraint stacking.",
  "axes": {
    "rotation": {"exclude_values": [0, 90, 180, 270]},
    "glyph": {"exclude_tags": ["rectilinear", "right-angle"]},
    "font": {"exclude_tags": ["geometric-sans"]}
  }
}
```

The sampler, on startup, loads the mask and builds a filtered view of each axis table.
Seeded draws index into the filtered view, so the same seed with a different mask
produces a different image — mask identity must be recorded in the manifest alongside
`space_hash`.

### Named built-in masks (initial set)

| Mask ID | Description | Analog |
|---|---|---|
| `geometric_primacy_ban` | Exclude cardinal rotations, rectilinear glyphs | T2: no right angles, no squares |
| `fibonacci_ban` | Exclude glyph/font combos that produce spiral/wave visual artefacts | T2: no spirals, no Fibonacci |
| `full_entropy` | No restrictions (default) | Prompts 1–3, 5 |
| `full_order` | Invert: restrict to cardinal rotations, geometric-sans fonts, neutral HSV | Prompt 4 inverse dual |

## Acceptance criteria

- [ ] Mask schema `ceae-mask/1` defined and documented in `docs/ARCHITECTURE.md`.
- [ ] `sample(seed, mask=None)` accepts an optional loaded mask object.
- [ ] Default (`mask=None`) reproduces current behavior exactly for all test seeds.
- [ ] At least two built-in masks (`geometric_primacy_ban`, `full_order`) implemented
      and tested.
- [ ] Manifest format records `mask_id` and `mask_hash` when a non-default mask is used.
- [ ] CLI flag `--mask <id>` wired to sampler.
- [ ] AESTHETIC-LINEAGE.md Section 2.3 updated to reference the implemented mechanism.

## Notes

Masks are **axis-table filters**, not post-render rejection. A rejected image still costs
a full render budget; a filtered seed space costs nothing beyond the initial table build.
This distinction matters at throughput scale — 1M+ images/day means even a 5% rejection
rate wastes ~50k render cycles.

The mask ID must be stable across engine versions (it is a human-readable key, not an
implementation detail). Changing a mask's filter rules requires a new ID, not an update
to the old one, to preserve the manifest's reproducibility guarantee.
