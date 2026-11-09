# ALIVE Pass 17 Report — Public-Web & Onion Swarm Resource Governor (Semaphores, Token Buckets, Population Ceiling & Kill-Switch)

**Date:** 2026-11-09  
**Pass:** 17 of 20 (Phase III — Multi-Guild Exploration Swarms)  
**Seeds Evaluated:** `19013`, `29017`, `39023`, `49031`, `59053` (`n = 5`, two-sided Student-$t$ 95% confidence intervals, $\text{df} = 4$)  
**Target Domains:** `6` (`3` Clearnet with `maxConcurrent = 2`, `3` `.onion` v3 hidden services with `maxConcurrent = 1`)  
**Hard Population Ceiling:** `maxEntities = 15`

---

## 1. Executive Summary

Pass 17 implements and evaluates deterministic resource governance for Multi-Entity Exploration Swarms in [`systems/alive-swarm-budget-governor.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-swarm-budget-governor.js), comparing four resource governance policies across 40 burst exploration steps per seed (including hot-domain concurrency bursts, child spawn requests, a `PAUSE` window at steps `20..25`, and a `KILL_SWITCH` at step `36`):

- **Full Governor vs Per-Domain-Without-KillSwitch Gain:** `+100.00 ± 0.00` (`95% CI: [+100.00, +100.00]`, `5/5` seeds)
- **Full Governor vs Global-Cap-Without-Per-Domain-Bucket Gain:** `+100.00 ± 0.00` (`95% CI: [+100.00, +100.00]`, `5/5` seeds)
- **Zero Per-Domain Concurrency or Token-Bucket Violations:** `0` violations across `5/5` seeds (`75.0 ± 1.87` concurrency violations and `26.6 ± 1.52` token overruns under `ungoverned-locust-flood`)
- **Zero Population Ceiling Breaches & Zero Kill-Switch Leaks:** `0` leaks and `15.0` peak entities across `5/5` seeds (`39.0` peak entities and `60.0 ± 2.92` kill-switch leaks under `ungoverned-locust-flood`)

---

## 2. 5-Seed Swarm Resource Governance Comparison (`40` Burst Steps / Seed)

| Governor Mode | Compliance Score (`0–100`) | Domain Concurrency Violations | Token-Bucket Overruns | Kill-Switch Leaks | Peak Population | Accepted / Deferred Requests |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ungoverned-locust-flood` | `0.00 ± 0.00` | `75.0 ± 1.87` | `26.6 ± 1.52` | `60.0 ± 2.92` | `39.0 ± 0.0` | `246.2 / 0.0` |
| `global-cap-no-per-domain-bucket` | `0.00 ± 0.00` | `57.6 ± 1.67` | `21.2 ± 0.84` | `0.0 ± 0.00` | `15.0 ± 0.0` | `186.2 / 60.0` |
| `per-domain-bucket-no-killswitch` | `0.00 ± 0.00` | `0.0 ± 0.00` | `0.0 ± 0.00` | `60.0 ± 2.92` | `15.0 ± 0.0` | `171.2 / 75.0` |
| **`full-token-bucket-swarm-governor`** | **`100.00 ± 0.00`** | **`0.0 ± 0.00`** | **`0.0 ± 0.00`** | **`0.0 ± 0.00`** | **`15.0 ± 0.0`** | **`128.6 / 117.6`** |

---

## 3. Artifacts & Verification Commands

- **System Module:** [`systems/alive-swarm-budget-governor.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-swarm-budget-governor.js)
- **Live Visualizer Section 23:** [`systems/alive-fabric-visualizer.js`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/systems/alive-fabric-visualizer.js) (`#alive-fabric-swarm-governor`, `runSwarmGovernor`)
- **Automated Tests:** [`tests/alive-swarm-budget-governor.test.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/tests/alive-swarm-budget-governor.test.cjs), [`tests/alive-fabric-visualizer.test.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/tests/alive-fabric-visualizer.test.cjs)
- **CLI Artifact Generator:** [`scripts/alive-swarm-budget-governor.cjs`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/scripts/alive-swarm-budget-governor.cjs)
- **Generated Reports:** [`docs/reports/alive-swarm-budget-governor-2026-11-09.json`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-swarm-budget-governor-2026-11-09.json), [`docs/reports/alive-swarm-budget-governor-2026-11-09.svg`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-swarm-budget-governor-2026-11-09.svg)
