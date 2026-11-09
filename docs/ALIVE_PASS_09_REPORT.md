# ALIVE Pass 9 Report — Sustained Performance, Failures, Recovery, Visualization Overhead & Reproducible Package Qualification

**Date:** 2026-11-09  
**Benchmark ID:** `pass-09-sustained-performance-qualification-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 9 evaluates sustained 60Hz cognitive tick latency (`p50`, `p95`, `p99` against the `16.67ms` frame budget), post-warmup ring-buffer memory growth (`HISTORY = 240`, `MAX_EVENTS = 160`), open-panel vs. hidden-panel visualizer draw overhead, adapter timeout isolation/recovery across 6 injected adapter hangs per seed, and reproducible package qualification across 5 independent seeds (`240` sustained ticks per seed).

Four runtime scheduling and telemetry regimes are evaluated:
1. **`unbounded-eager-all-lanes`**: Runs all 36 faculties synchronously every tick without phase-ordered rotating sparse lanes, ring-buffer eviction, or hidden-panel draw suppression.
2. **`unbounded-history-no-eviction`**: Uses rotating sparse lanes, but omits ring-buffer eviction and continues drawing visualizer canvases when the panel is hidden.
3. **`no-adapter-timeout-guard`**: Enforces ring-buffer bounds and hidden-panel draw suppression, but omits per-adapter deadline timeout guards so hung adapters stall the lane queue.
4. **`bounded-phase-ordered-60hz`**: Full ALIVE production architecture (`observe` $\to$ `cognition` $\to$ `planner` $\to$ `mutation` $\to$ `backend` $\to$ `diagnostic` rotating sparse lanes, bounded ring buffers, zero hidden-panel draw overhead, and per-adapter deadline timeout isolation).

## 2. Five-Seed Empirical Results

| Regime | Qualification Score (Mean ± SD) | `p50` Tick (ms) | `p95` Tick (ms) | `p99` Tick (ms) | 60Hz Budget Compliance (%) | Post-Warmup Memory Growth | Hidden Panel Draw Calls | Adapter Recovery (%) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `unbounded-eager-all-lanes` | `0.00 ± 0.00` | `29.13` | `33.24` | `33.72` | `0.0%` | `+240.0` | `2.0` | `100.0%` |
| `unbounded-history-no-eviction` | `19.00 ± 0.00` | `8.25` | `12.37` | `12.71` | `100.0%` | `+240.0` | `2.0` | `100.0%` |
| `no-adapter-timeout-guard` | `0.00 ± 0.00` | `17.90` | `18.08` | `23.51` | `36.3%` | `0.0` | `0.0` | `0.0%` |
| **`bounded-phase-ordered-60hz`** | **`100.00 ± 0.00`** | **`3.94`** | **`4.13`** | **`5.34`** | **`100.0%`** | **`0.0`** | **`0.0`** | **`100.0%`** |

### Paired Multi-Seed Comparisons (`df = 4`)
- **`bounded-phase-ordered-60hz` vs. `unbounded-eager-all-lanes` qualification gain**: `+100.00 ± 0.00` (**`5/5` seeds**).
- **`bounded-phase-ordered-60hz` vs. `no-adapter-timeout-guard` qualification gain**: `+100.00 ± 0.00` (**`5/5` seeds**).
- **`p99` Tick Latency $\le 16.67\text{ ms}$ (`5.34 ± 0.02 ms`)**: **`5/5` seeds** (`100.0%` 60Hz frame budget compliance).
- **Zero Post-Warmup Memory Ring-Buffer Growth (`0.0` entries)**: **`5/5` seeds**.
- **Zero Hidden-Panel Draw Calls (`0.0` draws while panel hidden)**: **`5/5` seeds**.

## 3. Live Visual Telemetry Integration

- Added **Section 15 (`15 · Sustained 60Hz performance, memory bounds, visualizer overhead & qualification (5 seeds)`)** (`#alive-fabric-sustained-perf`), the `Run perf` button, and `runSustainedPerf()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-sustained-performance-qualifier-2026-11-09.json`](reports/alive-sustained-performance-qualifier-2026-11-09.json)
  - [`docs/reports/alive-sustained-performance-qualifier-2026-11-09.svg`](reports/alive-sustained-performance-qualifier-2026-11-09.svg)
