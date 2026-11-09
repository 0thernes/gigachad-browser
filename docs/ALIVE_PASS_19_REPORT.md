# ALIVE Pass 19 Report — 5-Seed Multi-Guild Swarm Exploration Benchmark Across Clearnet + `.onion` Topologies

**Date:** 2026-11-09  
**Pass:** 19 of 20 (Phase III — Multi-Guild Exploration Swarms)  
**Seeds Evaluated:** `19013`, `29017`, `39023`, `49031`, `59053` (`n = 5`, two-sided Student-$t$ 95% confidence intervals, $\text{df} = 4$)  
**Web Graph Topology:** `36` multi-hop nodes (`24` corroborated truth chains across depths `1..4`, `6` low-yield noise pages, `6` adversarial honeypot disinformation pages) across `6` First-Party Domains (`3` Clearnet + `3` RFC 7686 v3 `.onion`)

---

## 1. Executive Summary

Pass 19 evaluates four end-to-end exploration topologies across 5 seeds in [`systems/alive-swarm-wild-foraging-benchmark.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-swarm-wild-foraging-benchmark.js):

- **Stigmergic Tor Hybrid Synergy Swarm vs Centralized FIFO Queue Gain:** `+60.25 ± 0.00` (`95% CI: [+60.25, +60.25]`, `5/5` seeds)
- **Stigmergic Tor Hybrid Synergy Swarm vs Solitary Agent Gain:** `+28.13 ± 0.00` (`95% CI: [+28.13, +28.13]`, `5/5` seeds)
- **Stigmergic Tor Hybrid Synergy Swarm vs Uncoordinated Flock Gain:** `+100.00 ± 0.00` (`95% CI: [+100.00, +100.00]`, `5/5` seeds)
- **Exact 100% Corroborated Discovery & 0 Honeypots:** `100.0%` discovery of all 24 deep clearnet + `.onion` truth nodes, `100.0%` `.onion` FPD circuit isolation, `0` rate-limit `429` throttles, and `0` honeypot contaminations on `5/5` seeds

---

## 2. 5-Seed Wild Clearnet + `.onion` Foraging Comparison (`36` Nodes / Seed)

| Exploration Topology | Wild Foraging Score (`0–100`) | Corroborated Discovery (%) | `.onion` Circuit Isolation (%) | Verified Claims / 100 Reqs | `429` Throttled Reqs | Honeypot Contaminations |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `uncoordinated-flock-15` | `0.00 ± 0.00` | `50.0 ± 0.0%` | `0.0 ± 0.0%` | `13.33 ± 0.00` | `54.0 ± 0.0` | `6.0 ± 0.0` |
| `centralized-fifo-queue-15` | `39.75 ± 0.00` | `75.0 ± 0.0%` | `0.0 ± 0.0%` | `69.23 ± 0.00` | `0.0 ± 0.0` | `3.0 ± 0.0` |
| `solitary-single-agent` | `71.88 ± 0.00` | `37.5 ± 0.0%` | `100.0 ± 0.0%` | `100.00 ± 0.00` | `0.0 ± 0.0` | `0.0 ± 0.0` |
| **`stigmergic-tor-hybrid-synergy-swarm`** | **`100.00 ± 0.00`** | **`100.0 ± 0.0%`** | **`100.0 ± 0.0%`** | **`66.67 ± 0.00`** | **`0.0 ± 0.0`** | **`0.0 ± 0.0`** |

---

## 3. Artifacts & Verification Commands

- **System Module:** [`systems/alive-swarm-wild-foraging-benchmark.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-swarm-wild-foraging-benchmark.js)
- **Live Visualizer Section 25:** [`systems/alive-fabric-visualizer.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-fabric-visualizer.js) (`#alive-fabric-swarm-foraging`, `runSwarmForaging`)
- **Automated Tests:** [`tests/alive-swarm-wild-foraging-benchmark.test.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/tests/alive-swarm-wild-foraging-benchmark.test.cjs), [`tests/alive-fabric-visualizer.test.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/tests/alive-fabric-visualizer.test.cjs)
- **CLI Artifact Generator:** [`scripts/alive-swarm-wild-foraging-benchmark.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/scripts/alive-swarm-wild-foraging-benchmark.cjs)
- **Generated Reports:** [`docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.json`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.json), [`docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.svg`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-swarm-wild-foraging-benchmark-2026-11-09.svg)
