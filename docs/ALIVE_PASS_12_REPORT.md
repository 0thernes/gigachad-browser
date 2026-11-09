# ALIVE Pass 12 Report — Tor ControlPort Protocol, Stream-to-Circuit Observability, `NEWNYM` Identity Rotation & Path Verification

**Date:** 2026-11-09  
**Benchmark ID:** `pass-12-tor-controlport-circuit-observability-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 12 implements the Tor ControlPort protocol parser and circuit governor ([`systems/alive-tor-circuit-controller.js`](../systems/alive-tor-circuit-controller.js)), providing:

1. **ControlPort Framing & Stream-to-Circuit Attribution**: Parses `650 CIRC <id> BUILT $FP1~Guard,$FP2~Middle,$FP3~Exit PURPOSE=GENERAL` (`parseControlPortCircLine`) and binds every user stream to its verified 3-hop relay path (`100.0%` stream attribution).
2. **3-Hop Guard / Middle / Exit Path Diversity (`verifyCircuitPathDiversity`)**: Verifies that every active circuit has $\ge 3$ distinct relay fingerprints, distinct `/16` IPv4 subnets, and distinct Autonomous System Numbers (`ASN`). Any colocated/sybil circuit is immediately closed (`CLOSECIRCUIT`) and rebuilt on diverse relays.
3. **`SIGNAL NEWNYM` Clean-Slate Identity Rotation**: Marks all pre-rotation circuits dirty (`dirtyCircuitIds`) and clears active FPD circuit bindings so `0` post-`NEWNYM` streams ever reuse a pre-`NEWNYM` circuit.

## 2. Five-Seed Empirical Results (`18` Streams, `3` Sybil Injections & `2` `NEWNYM` Rotations / Seed)

| Controller | Observability Score (Mean ± SD) | Stream Attribution (%) | Sybil `/16` & ASN Rejection (%) | `NEWNYM` Cleanliness (%) | Sybil Paths Used | Dirty Circuit Reuses After `NEWNYM` |
| --- | --- | --- | --- | --- | --- | --- |
| `unmonitored-blind-socks` | `0.00 ± 0.00` | `0.0%` | `0.0%` | `33.3%` | `2.0` | `12.0` |
| `passive-controlport-observer` | `0.00 ± 0.00` | `100.0%` | `0.0%` | `33.3%` | `2.0` | `12.0` |
| `newnym-without-path-diversity` | `41.00 ± 0.00` | `100.0%` | `0.0%` | `100.0%` | `3.0` | `0.0` |
| **`full-controlport-circuit-governor`** | **`100.00 ± 0.00`** | **`100.0%`** | **`100.0%`** | **`100.0%`** | **`0.0`** | **`0.0`** |

## 3. Live Visual Telemetry Integration

- Added **Section 18 (`18 · Tor ControlPort — stream attribution, NEWNYM rotation & 3-hop path diversity (5 seeds)`)** (`#alive-fabric-tor-circuits`), the `Run Tor circuits` button, and `runTorCircuits()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-tor-circuit-controller-2026-11-09.json`](reports/alive-tor-circuit-controller-2026-11-09.json)
  - [`docs/reports/alive-tor-circuit-controller-2026-11-09.svg`](reports/alive-tor-circuit-controller-2026-11-09.svg)
