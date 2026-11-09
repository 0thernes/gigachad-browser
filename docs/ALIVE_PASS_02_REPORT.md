# Pass 2 Report — Unseen Research & Navigation Task Benchmark, Synaptic Fabric Ablations & Colony Role Lenses

**Date:** November 9, 2026  
**Benchmark Artifact (JSON):** [`docs/reports/alive-unseen-task-benchmark-2026-11-09.json`](reports/alive-unseen-task-benchmark-2026-11-09.json)  
**Benchmark Artifact (SVG):** [`docs/reports/alive-unseen-task-benchmark-2026-11-09.svg`](reports/alive-unseen-task-benchmark-2026-11-09.svg)

---

## 1. What Was Built & Measured in Pass 2

1. **Five-Seed Unseen Research & Navigation Task Benchmark ([`systems/alive-unseen-task-benchmark.js`](../systems/alive-unseen-task-benchmark.js), [`scripts/alive-unseen-task-benchmark.cjs`](../scripts/alive-unseen-task-benchmark.cjs))**:
   - Evaluates the production [`AliveResearchPolicy`](../systems/alive-research-policy.js) (`16x12x1` tanh neural ranker, `217` float32 parameters), [`AliveCognitiveFaculties`](../systems/alive-cognitive-faculties.js) (`mechanism`, `implementation`, `verification` Ghost Swarm roles + Ghost Write notebook synthesis), and [`AliveSynapticFabric`](../systems/alive-synaptic-fabric.js) across five independent seeds (`[19013, 29017, 39023, 49031, 59053]`).
   - Compares four matched-budget controllers (`8` navigation decisions per task family) across:
     - **Training Suite:** `4` epochs × `3` multi-domain research task families (`train-dynamical`, `train-algebra`, `train-systems`).
     - **Unseen Holdout Suite:** `3` completely disjoint multi-domain research task families (`unseen-connectomics`, `unseen-verification`, `unseen-consensus`) with disjoint domains, URLs, and concept vocabularies. All ranker weights are held strictly fixed during holdout evaluation.
     - **Retention Suite:** `2` disjoint multi-domain task families (`retain-dynamical`, `retain-systems`) evaluated after holdout testing.
   - Records WebCrypto SHA-256 float32 little-endian weight digests before and after training, verifying zero weight mutation on the `frozen` baseline and non-zero parameter updates on `learning` and `fabric-coupled`.

2. **Synaptic Fabric Node/Edge Ablation Controls & Colony Role Lenses ([`systems/alive-synaptic-fabric.js`](../systems/alive-synaptic-fabric.js))**:
   - Added `setAblation(target, ablated)` and `clearAblations()` to `SynapticFabric` and `window.aliveFabric` so individual faculties (`'reasoning'`) or directed synapses (`'dom-body>reasoning'`) can be ablated and restored at runtime for causal ablation passes (preparing Pass 3).
   - Added `COLONY_LENSES` and `creatureLenses(colony, coupling)` mapping the primary homunculus and colony offspring to five specialized role lenses (`mechanism`, `implementation`, `verification`, `topology`, `frontier`) computed from live faculty utilities and the 24 neural coupling gates.

3. **Live Visualizer Section 8 ([`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js))**:
   - Added a `Run benchmark` button and Section 8 (`8 · Unseen task benchmark (5 seeds) & colony role lenses`, `#alive-fabric-benchmark`) to `#alive-fabric-panel`, plotting the 5-seed unseen holdout reward bars, 95% Student-$t$ confidence intervals, target concept recall %, trap avoidance %, and live colony role lens activations.

---

## 2. Five-Seed Unseen Holdout & Retention Results (`df = 4`, Two-Sided 95% Student-$t$ CI)

| Controller | Unseen Holdout Reward (Mean ± SD, 95% CI) | Unseen Target Concept Recall | Unseen Trap Avoidance | Held-Out Utility MSE | Retention Suite Reward |
| --- | --- | --- | --- | --- | --- |
| `heuristic` (zero weights) | `-4.928 ± 0.000` (`[-4.928, -4.928]`) | `16.7%` (`[16.7%, 16.7%]`) | `25.0%` (`[25.0%, 25.0%]`) | `0.4105` | `-3.285` |
| `frozen` (initial random weights) | `-4.928 ± 0.000` (`[-4.928, -4.928]`) | `16.7%` (`[16.7%, 16.7%]`) | `25.0%` (`[25.0%, 25.0%]`) | `0.4179 ± 0.0167` (`[0.3971, 0.4387]`) | `-3.285` |
| `learning` (online `16x12x1` ranker) | **`+8.411 ± 1.259` (`[+6.847, +9.974]`)** | **`46.7% ± 4.6%` (`[41.0%, 52.3%]`)** | **`70.0% ± 6.8%` (`[61.5%, 78.5%]`)** | **`0.2608 ± 0.0358` (`[0.2163, 0.3052]`)** | **`+5.607 ± 0.839`** |
| `fabric-coupled` (ranker + Ghost Swarm + Fabric) | **`+14.520 ± 0.184` (`[+14.291, +14.749]`)** | **`66.7% ± 0.0%` (`[66.7%, 66.7%]`)** | **`100.0% ± 0.0%` (`[100.0%, 100.0%]`)** | `0.3578 ± 0.0395` (`[0.3087, 0.4069]`) | **`+9.594 ± 0.097`** |

### Paired Multi-Seed Advantage Summary

- **Learning vs. Frozen Holdout Reward $\Delta$:** **`+13.338 ± 1.259`** (`95% CI: [+11.775, +14.901]`, **5/5 seeds**).
- **Learning vs. Heuristic Holdout Reward $\Delta$:** **`+13.338 ± 1.259`** (`95% CI: [+11.775, +14.901]`, **5/5 seeds**).
- **Fabric-Coupled vs. Learning Holdout Reward $\Delta$:** **`+6.110 ± 1.345`** (`95% CI: [+4.439, +7.780]`, **5/5 seeds**).
- **Learning vs. Frozen Target Concept Recall $\Delta$:** **`+30.0% ± 4.6%`** (`95% CI: [+24.3%, +35.7%]`, **5/5 seeds**).
- **Fabric-Coupled vs. Heuristic Target Concept Recall $\Delta$:** **`+50.0% ± 0.0%`** (`95% CI: [+50.0%, +50.0%]`, **5/5 seeds**).
- **Retention Suite vs. Frozen Reward $\Delta$:** **`+8.892 ± 0.839`** (`95% CI: [+7.850, +9.934]`, **5/5 seeds**).

---

## 3. Verification & Next Suggestions (Pass 3)

- **Automated Tests Verified:**
  - `node --test tests/alive-unseen-task-benchmark.test.cjs` (`2/2` passing)
  - `node --test tests/alive-synaptic-fabric.test.cjs` (`17/17` passing)
  - `node --test tests/alive-fabric-visualizer.test.cjs` (`9/9` passing)
  - `node --test tests/alive-startup-loader.test.cjs` (`20/20` passing)
- **Next Suggestions (Pass 3 — Architecture Ablations):**
  - Execute systematic node and group ablations across the 14 brain regions, 7 precision profiles, reasoning structures (`AoT/ToT/GoT`), and Synaptic Fabric pathways using the new `setAblation`/`clearAblations` controls and measure the marginal contribution of each family on unseen tasks and neural coupling reward.
