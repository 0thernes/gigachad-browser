# T-005 — Sharded sink writer (10k-directory shards + tar/WebDataset)

**Column:** Backlog | **Priority:** High | **Estimate:** M (1–3 days)

## Context

The PoC sink writes one PNG per seed into a single flat directory. At 1M images
this produces a 1-million-file directory that most filesystems handle poorly
(slow `ls`, inode pressure). The production sink shards output into sub-directories
of 10,000 files each and optionally bundles them into tar archives in WebDataset
format for training pipelines.

Per `docs/ARCHITECTURE.md` Stage 5: "PNG files ... sharded into directories of 10k
to keep filesystems sane" and "tar archives of 10k images (WebDataset-compatible)."

## Acceptance Criteria

- [ ] `poc/sink.py` implements `ShardedFileSink` and `TarShardSink`.
- [ ] `ShardedFileSink`: writes `{shard_dir}/{shard_index:04d}/{seed:016x}.png`,
      where `shard_index = seed_ordinal // 10_000`. No directory has more than
      10,000 files.
- [ ] `TarShardSink`: bundles each 10k group into `shard_{index:04d}.tar` (no
      compression — WebDataset reads uncompressed tars at max I/O speed).
- [ ] Shard boundaries are deterministic: given the same seed range, both sink
      types produce the same file layout on any machine.
- [ ] A 30,000-image test run (seeds 0–29,999) produces exactly 3 shards with
      the correct file distribution.
- [ ] Existing `glyph_engine.py` `--out` flag is wired to `ShardedFileSink` by
      default once this is merged (or a `--sink` flag selects between flat/sharded/tar).

## Definition of Done

- `pytest -q tests` green including shard-layout correctness test.
- `docs/ARCHITECTURE.md` Stage 5 section updated with the shard-naming scheme.
- `README.md` mentions sharded output as the default for large runs.

## Estimate

M — straightforward implementation; the effort is in the tar streaming path
and the correctness test for boundary conditions (exact multiples of 10k, partial
last shard).

## Dependencies

T-003 (multiprocess pipeline) is the natural consumer of this sink, but T-005
can be developed and tested independently against the single-process renderer.
