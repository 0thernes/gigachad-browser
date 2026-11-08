# T-002 — Golden-seed digest test (MVP CI gate)

**Column:** Ready | **Priority:** High | **Estimate:** S (< 1 day)

## Context

`tests/test_determinism.py` already proves same-seed → same-bytes *within* a
single environment. What it does not catch is a **dependency-version drift**
event: a Pillow upgrade that silently changes bicubic rotation resampling, or a
NumPy update that shifts the Gaussian noise distribution, would produce different
bytes for existing seeds without any code change.

The golden-seed digest test pins SHA-256 of 100 canonical seeds' PNG output
in-repo. If a Pillow or NumPy upgrade changes any digest, CI fails — forcing a
deliberate engine version bump, not a silent dataset corruption.

Per `docs/ROADMAP.md` Phase 1: "Golden-seed digest test: SHA-256 of 100
canonical seeds' PNGs pinned in-repo to catch dependency drift."

## Acceptance Criteria

- [ ] `tests/test_golden_digests.py` renders 100 canonical seeds (e.g., 0–99)
      at 96px and asserts `hashlib.sha256(png_bytes).hexdigest()` matches a
      pinned fixture file.
- [ ] The fixture file `tests/fixtures/golden_digests.json` is committed to
      the repo with a comment explaining it must only be updated intentionally
      via `python scripts/regenerate_golden_digests.py`.
- [ ] A `scripts/regenerate_golden_digests.py` helper script generates and
      overwrites the fixture (for use when a deliberate engine version bump
      is made).
- [ ] CI runs `pytest tests/test_golden_digests.py` and fails on digest mismatch.
- [ ] `CONTRIBUTING.md` updated with a note that Pillow/NumPy upgrades require
      running the regeneration script + bumping `ENGINE_VERSION`.

## Definition of Done

- `pytest -q tests` green including the new golden-digest test.
- CI fails with a clear message when a test digest is modified.
- Fixture regeneration script documented in `CONTRIBUTING.md`.

## Estimate

S — implementation is straightforward; the main work is generating the initial
fixture set and wiring the CI step.

## Dependencies

None (self-contained; uses the existing `poc/glyph_engine.py`).
