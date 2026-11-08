# Observability

## Philosophy

CEAE is a throughput-focused batch system. The primary observability concern is
not latency tracing or distributed spans — it is **run accounting**: knowing
exactly which seeds were rendered, at what rate, with what engine version, and
whether the output is trustworthy. A run that cannot be reproduced from its own
log is a bug.

---

## Structured log schema

All CEAE log lines are emitted as JSON objects to stderr (one JSON object per
line, no trailing commas). The structured logger is in `poc/logging_config.py`.

### Common fields (present on every line)

| Field | Type | Example | Notes |
|---|---|---|---|
| `ts` | ISO-8601 string | `"2026-06-11T14:22:01.345Z"` | UTC; millisecond precision |
| `level` | string | `"INFO"` | See levels below |
| `engine` | string | `"ceae-poc/0.1.0"` | `ENGINE_VERSION` constant |
| `event` | string | `"render_batch_complete"` | Snake-case event identifier |
| `pid` | integer | `12345` | Useful when multiple workers log to the same sink |

### Run-manifest event fields

The `run_manifest` event is the primary accountability record. It must be emitted
at the end of every render run (benchmark or output-writing mode).

| Field | Type | Example | Notes |
|---|---|---|---|
| `event` | string | `"run_manifest"` | Fixed value for this event type |
| `seed_start` | hex string | `"0x0000000000000000"` | Starting seed of this run |
| `seed_count` | integer | `1000` | Number of seeds rendered |
| `seed_end_exclusive` | hex string | `"0x00000000000003e8"` | `seed_start + seed_count` |
| `canvas_px` | integer | `256` | Canvas size |
| `duration_s` | float | `11.07` | Wall-clock duration in seconds |
| `imgs_per_sec` | float | `90.4` | Throughput |
| `avg_png_kib` | float | `18.2` | Average encoded PNG size |
| `mode` | string | `"benchmark"` or `"write"` | Whether pixels were written to disk |
| `out_dir` | string or null | `"out/"` | Output directory, null in benchmark mode |
| `space_hash` | string | `"sha256:abc123..."` | Hash of axis tables — confirms engine version integrity |

**Seeds are the dataset identity.** The `seed_start` + `seed_count` pair is the
minimal sufficient record of what was generated. Log these, not pixel paths.

### Error event fields

| Field | Type | Example |
|---|---|---|
| `event` | string | `"render_error"` |
| `seed` | hex string | `"0x00000000deadbeef"` |
| `error_type` | string | `"OSError"` |
| `message` | string | `"[Errno 28] No space left on device"` |

### Example log lines

```json
{"ts":"2026-06-11T14:22:01.345Z","level":"INFO","engine":"ceae-poc/0.1.0","event":"run_start","pid":9832,"seed_start":"0x0000000000000000","seed_count":1000,"canvas_px":256,"mode":"benchmark"}
{"ts":"2026-06-11T14:22:12.412Z","level":"INFO","engine":"ceae-poc/0.1.0","event":"run_manifest","pid":9832,"seed_start":"0x0000000000000000","seed_count":1000,"seed_end_exclusive":"0x00000000000003e8","canvas_px":256,"duration_s":11.07,"imgs_per_sec":90.4,"avg_png_kib":18.2,"mode":"benchmark","out_dir":null,"space_hash":"sha256:pending"}
```

---

## Log levels

| Level | When to use |
|---|---|
| `DEBUG` | Per-image events (seed, params, timings) — only for profiling runs, never in default CI or production |
| `INFO` | Run-lifecycle events: start, milestone checkpoints (every 10k images), completion, `run_manifest` |
| `WARNING` | Recoverable issues: a seed re-rendered after a write error; a contrast re-roll triggered; font fallback used |
| `ERROR` | A seed failed to render and was skipped; a shard write failed but the run continued |
| `CRITICAL` | The run aborted prematurely (disk full, fatal dependency error, engine version mismatch in manifest) |

Default log level in production: `INFO`. Set `CEAE_LOG_LEVEL=DEBUG` for profiling.

---

## Log file convention (`logs/` directory)

- `logs/` is tracked in git (`.gitkeep` present) but `*.log` files are gitignored.
- Naming: `logs/ceae-YYYYMMDD-HHMMSS-<seed_start_hex>.log` per run.
- Format: one JSON object per line (no trailing comma, UTF-8, LF line endings).
- Retention: keep the last 30 run logs on disk; automated purge is the caller's
  responsibility (no built-in rotation at PoC stage).
- For multiprocess runs (T-003), each worker writes to its own log file to avoid
  interleaved JSON; a merge step at the end writes the consolidated `run_manifest`.

---

## Key metrics to emit

| Metric | Why |
|---|---|
| `imgs_per_sec` per worker and aggregate | Primary throughput KPI; the 1M/day claim depends on ≥ 11.6 img/s sustained |
| `avg_png_kib` | Tracks encode efficiency; a spike indicates a render-path change |
| `duration_s` per phase (sample / raster / encode / write) | Used for bottleneck identification; match against THROUGHPUT.md budget |
| `seed_count` vs `seeds_written` | Gap = errors or skipped seeds; must be zero for a clean run |
| `contrast_rerolls` | Count of times the fg/bg contrast check triggered a re-roll; a sudden spike suggests a space-hash drift |
| `font_fallback_count` | Count of renders that used the Pillow bundled default font (no system font found) |

---

## Cross-platform run comparison

When validating cross-platform determinism (different OS, same seed range), the
`run_manifest` event provides the reconciliation key: compare `space_hash` first,
then sample 100 seeds and compare per-seed `sha256(png_bytes)`. If `space_hash`
matches but per-seed digests differ, a rendering dependency (FreeType version,
NumPy version) has diverged — engine version bump required.
