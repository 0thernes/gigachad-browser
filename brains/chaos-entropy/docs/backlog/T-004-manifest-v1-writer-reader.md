# T-004 — Manifest v1 writer + verifying reader

**Column:** In Review | **Priority:** High | **Estimate:** M (1–3 days)
**Status (2026-06-12):** PARTIALLY SHIPPED — seed-range manifest IO landed
directly in `poc/glyph_engine.py` (stdlib `json` only, no new deps):
- `write_manifest(path, *, engine_version, seed_start, count, stride, canvas)`
  writes a single JSON record (THROUGHPUT §5 storage inversion).
- `read_manifest(path)` reads it back.
- `--manifest PATH` CLI flag writes the manifest instead of PNGs.
- `--from-manifest PATH` CLI flag re-renders exactly from a manifest.
- `build_seeds(seed_start, count, stride)` extracted as a reusable helper.
- Round-trip tests in `tests/test_manifest.py` confirm byte-identical re-render.
Remaining from original acceptance criteria: `ManifestWriter`/`ManifestReader`
classes in a dedicated `poc/manifest.py`, `space_hash` SHA-256 verification,
`iter_seeds()` lazy generator, and the `tests/fixtures/sample.jsonl` fixture.
Those can be closed in a follow-up; the core storage-inversion capability is now
testable end-to-end.

## Context

The flagship storage model of CEAE is "seeds are the dataset". The manifest
format (`ceae-manifest/1`, JSON Lines) records `(engine_version, space_hash,
seed ranges, picks)` so that a consumer can re-materialize any subset of images
bit-for-bit without ever receiving pixel data.

Per `docs/ARCHITECTURE.md`: "a consumer refuses to render if their engine's hash
differs (prevents silent dataset drift)." The `space_hash` is SHA-256 of the
axis-table definitions; any axis change fails the hash check on old manifests.

## Acceptance Criteria

- [ ] `poc/manifest.py` implements `ManifestWriter` and `ManifestReader`.
- [ ] `ManifestWriter.write_range(start, count)` appends a JSON Lines record
      matching the schema in `docs/ARCHITECTURE.md` (schema, engine, space_hash,
      size, ranges, created, license).
- [ ] `ManifestWriter.write_picks(seeds: list[int])` appends a picks record.
- [ ] `ManifestReader.verify_engine()` raises `EngineVersionMismatch` if the
      local engine's `space_hash` does not match the manifest's recorded hash.
- [ ] `ManifestReader.iter_seeds()` yields all seeds (expanding ranges + picks)
      in manifest order, lazily.
- [ ] Round-trip test: write a manifest for seeds 0–999; fresh reader re-renders
      all 1,000 seeds; SHA-256 of each PNG matches the original render.
- [ ] `space_hash` computation is tested: modifying a glyph table entry changes
      the hash.

## Definition of Done

- `pytest -q tests` green including manifest round-trip test.
- `docs/ARCHITECTURE.md` manifest schema section confirmed accurate.
- A sample manifest for seeds 0–9 committed to `tests/fixtures/sample.jsonl`
  for documentation/smoke purposes.

## Estimate

M — the format is already fully specified; the work is the implementation and
round-trip test harness.

## Dependencies

T-002 (golden-seed digests) provides the verification fixtures useful for the
round-trip test, but T-004 can proceed independently using ad-hoc digests.
