# ALIVE Pass 8 Report — Browser Tools, Navigation, Developer Workflows & Transport Fault Recovery

**Date:** 2026-11-09  
**Benchmark ID:** `pass-08-browser-fault-recovery-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 8 evaluates browser navigation, developer workflows, transport fault recovery, stale-tab WebContents session recovery, and idempotent `Warp DOM` mutations across 5 independent seeds on a 16-task representative multi-site workflow suite (`arxiv-portal`, `mdn-dev-docs`, `github-repo`, `pubmed-eutils`) with 14 deterministic injected faults per seed:

- `ERR_NAME_NOT_RESOLVED` (transient DNS resolution failure)
- `HTTP_503_SERVICE_UNAVAILABLE` (upstream overload, including persistent primary outage requiring mirror failover)
- `HTTP_429_RATE_LIMITED` (with `Retry-After` header)
- `ERR_CONNECTION_TIMED_OUT` (socket timeout)
- `STALE_TAB_DISCONNECTED` (tab lifecycle / WebContents crash requiring session rehydration)
- `DUPLICATE_WARP_DOM_MUTATION` (replayed DOM mutation dispatches testing `warpTokenSha256` idempotence)

Four controllers are evaluated:
1. **`unbuffered-naive-nav`**: Direct navigation without retry, backoff, circuit breaker, or idempotent DOM mutation guards.
2. **`retry-without-backoff`**: Retries immediately up to 3 times without respecting `Retry-After`, mirror failover, or idempotent DOM tokens.
3. **`circuit-breaker-only`**: Per-origin circuit breaker + `Retry-After` compliance, but without alternate-mirror `Portal Jump` failover, stale-tab rehydration, or idempotent `Warp DOM` tokens.
4. **`full-fault-tolerant-navigator`**: Full ALIVE browser workflow engine combining `Retry-After` compliance, per-origin circuit breakers with `Portal Jump / Concept Drive` mirror failover, stale-tab WebContents rehydration, and `warpTokenSha256` idempotent `Warp DOM` token deduplication.

## 2. Five-Seed Empirical Results

| Controller | Reliability Score (Mean ± SD) | Workflow Completion (%) | Fault Recovery (%) | Duplicate DOM Mutations | Wasted Retry Requests | Unhandled Tab Crashes | Rate-Limit Violations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `unbuffered-naive-nav` | `0.00 ± 0.00` | `12.5%` | `0.0%` | `6.0` | `0.0` | `2.0` | `0.0` |
| `retry-without-backoff` | `0.00 ± 0.00` | `43.8%` | `35.7%` | `6.0` | `17.0` | `2.0` | `4.0` |
| `circuit-breaker-only` | `10.86 ± 0.00` | `56.3%` | `50.0%` | `6.0` | `2.0` | `2.0` | `0.0` |
| **`full-fault-tolerant-navigator`** | **`100.00 ± 0.00`** | **`100.0%`** | **`100.0%`** | **`0.0`** | **`0.0`** | **`0.0`** | **`0.0`** |

### Paired Multi-Seed Comparisons (`df = 4`)
- **`full-fault-tolerant-navigator` vs. `circuit-breaker-only` reliability gain**: `+89.14 ± 0.00` (**`5/5` seeds**).
- **`full-fault-tolerant-navigator` vs. `unbuffered-naive-nav` reliability gain**: `+100.00 ± 0.00` (**`5/5` seeds**).
- **Exact `100.0%` Workflow Completion & `100.0%` Fault Recovery**: **`5/5` seeds**.
- **Zero Duplicate `Warp DOM` Mutations (`0.0`)**: **`5/5` seeds**.

## 3. Live Visual Telemetry Integration

- Added **Section 14 (`14 · Browser tools, navigation, developer workflows & fault recovery (5 seeds)`)** (`#alive-fabric-fault-recovery`), the `Run fault recovery` button, and `runFaultRecovery()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-browser-fault-recovery-2026-11-09.json`](reports/alive-browser-fault-recovery-2026-11-09.json)
  - [`docs/reports/alive-browser-fault-recovery-2026-11-09.svg`](reports/alive-browser-fault-recovery-2026-11-09.svg)
