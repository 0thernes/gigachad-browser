# Changelog (`CHANGELOG.md`)

All notable architectural, mathematical, and security milestones for **GIGACHAD BROWSER** are documented in this file.

## [Unreleased] — 2026-11-09 · Architecture ablations pass 3

- Extended [`systems/alive-neural-coupling.js`](systems/alive-neural-coupling.js) with runtime source ablation (`setAblatedSources`, `clearAblations`), `ablatedCount`, `diagnosticallyAblated` flags, and per-stream L2 `contributionNorm` telemetry across all 24 coupled streams (`14 brains + 7 precision routes + Ising-56 + Omega Lorenz + Omega Izhikevich`).
- Added the 38-condition, 5-seed architecture ablation suite ([`systems/alive-architecture-ablations.js`](systems/alive-architecture-ablations.js), [`scripts/alive-architecture-ablations.cjs`](scripts/alive-architecture-ablations.cjs)) verifying non-zero causal impact on 5/5 seeds across all 14 brain families, 7 precision routes, 3 scale strata, 5 specialist fusion readouts, AoT/ToT/GoT reasoning components, and Synaptic Fabric pathways.
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 9 (`#alive-fabric-ablations`, `Run ablations` button, and `runAblations()`) and added `systems/alive-architecture-ablations.js` to [`systems/alive-startup-loader.js`](systems/alive-startup-loader.js).
- Added [Pass 3 report](docs/ALIVE_PASS_03_REPORT.md), [JSON report](docs/reports/alive-architecture-ablations-2026-11-09.json), [SVG chart](docs/reports/alive-architecture-ablations-2026-11-09.svg) and unit tests (`tests/alive-architecture-ablations.test.cjs`, `tests/alive-neural-coupling.test.cjs`, `tests/alive-fabric-visualizer.test.cjs`).

## [Unreleased] — 2026-11-09 · Unseen research/navigation benchmark & colony lenses pass 2

- Added the five-seed unseen research and navigation task benchmark ([`systems/alive-unseen-task-benchmark.js`](systems/alive-unseen-task-benchmark.js), [`scripts/alive-unseen-task-benchmark.cjs`](scripts/alive-unseen-task-benchmark.cjs)) comparing `heuristic`, `frozen`, `learning` and `fabric-coupled` controllers on disjoint multi-domain holdout and retention task graphs using the production `AliveResearchPolicy`, `AliveCognitiveFaculties` and `AliveSynapticFabric` modules.
- Extended [`systems/alive-synaptic-fabric.js`](systems/alive-synaptic-fabric.js) with runtime node/edge ablation controls (`setAblation`, `clearAblations`) and per-creature specialized role lenses (`COLONY_LENSES`, `creatureLenses`).
- Extended [`systems/alive-fabric-visualizer.js`](systems/alive-fabric-visualizer.js) with Section 8 (`#alive-fabric-benchmark` and `Run benchmark` control) plotting 5-seed unseen holdout reward + 95% Student-$t$ CIs, target concept recall, trap avoidance, and colony role lens activations.
- Added [Pass 2 report](docs/ALIVE_PASS_02_REPORT.md), [JSON report](docs/reports/alive-unseen-task-benchmark-2026-11-09.json), [SVG chart](docs/reports/alive-unseen-task-benchmark-2026-11-09.svg) and unit tests (`tests/alive-unseen-task-benchmark.test.cjs`).

## [Unreleased] — 2026-11-09 · Continuous cognition pass 1

- Added six coordinated capabilities for a total of 36, shared source-grounded Ghost research/writing, explicit memory/metacognition evidence, idempotent acknowledged DOM Warp, and independent five-training-seed diagnostics.
- Repaired permanently omitted expert, connectome, projection, attention, memory-readout and gradient lanes using bounded rotating sparse computation. Added actual coverage counters and all-fourteen-brain/seven-precision causal wiring checks.
- Added docked Brain evidence with source receipts, actual task timelines, notebook text, tensor statistics and numeric histories. Corrected Fabric event identity, simultaneous-concurrency measurement, elapsed-time rates and hidden-panel sampling.
- Integrated exact committed trainer bytes/private epoch/timeout with primary-policy startup persistence and independent two-process verification. This is a bounded component contract, not full-model continuity.
- Added the [pass report](docs/ALIVE_PASS_01_REPORT.md), [research review](docs/ALIVE_CONTINUOUS_RESEARCH_2026-11-09.md), [learning measurements](docs/ALIVE_LEARNING_FIVE_SEED.md) and [ten-pass roadmap](docs/ALIVE_TEN_PASS_ROADMAP.md).

## [Unreleased] — 2026-11-09 · Synaptic Fabric

### Added
- **Synaptic Fabric (`systems/alive-synaptic-fabric.js`)**: a plastic coupling graph between every ALIVE faculty, including brain observers, body actions, ghost faculties and diagnostics. When a faculty produces new evidence, the faculties it feeds become due earlier (excitation), within refractory limits. Hebbian credit strengthens an edge when the excited faculty's next outcome is new and weakens it when that outcome blocks or fails. A per-faculty utility moving average scales cadence between 0.5× and 2×. Navigation, storage, language-model and diagnostic faculties keep their own pacing. Weights persist to `localStorage` with readback verification. The fabric observes the runtime event stream; it never invokes adapters or bypasses readiness, lanes, Pause, backoff or manual-only status. See [`docs/ALIVE_SYNAPTIC_FABRIC.md`](docs/ALIVE_SYNAPTIC_FABRIC.md).
- **Synaptic Fabric visualizer (`systems/alive-fabric-visualizer.js`)**: a live analytics panel that draws only data, opened from the **Fabric** button in the ALIVE bar. It shows the coupling graph, a 60 s concurrency raster, a 24-stream brain/precision gate heatmap, a utility/cadence table, runtime/learning/plasticity time series, neural-substrate sparklines and a ghost-faculty/creature/fabric log.
- Tests: `tests/alive-synaptic-fabric.test.cjs` (10) and `tests/alive-fabric-visualizer.test.cjs` (4).

## [4.0.0-OMEGA] — 2026-11-08

### Added
- **14-Brain Multiverse Pantheon Federation (`systems/ported-multiverse-brains.js`):**
  - Full line-for-line fork-port and 60Hz online learning integration of `Asmodensius v40`, `Glitchling Resilience`, `CQM SuperMind`, `Apex Hydra 11-Organ`, `Xenomimic Schrödinger`, `Xylos 48-Foci Manifold`, `Mechalogodrom 10-Shell Titan`, `Glyph Pantheon 25K`, `Stephen Thaler DABUS + 9 Constitutive Markers + 4 Honest Ablations`, `GraphMind C. elegans + GOAP`, `Tsotchke Diffusion (Dale 80/20 E:I + STP + DDIM)`, `Kerr-Newman Black Hole Horizon + Page Curve`, `10-Researcher Consciousness Consortium`, and `Thingmaker Voxel Morphogenesis + GRIMOIRE Arcane GoT`.
- **7-Tier Heterogeneous Precision Tensor Arena (`Heterogeneous7TierPrecisionArena`):**
  - Replaced single-type `Float32Array` storage with a `131,072`-byte (`128 KB`) contiguous multi-precision `ArrayBuffer` spanning `Float64Array`, `BigInt64Array`/`BigUint64Array` (`Q32.32` & 1,024-bit `HDC`), `Int32Array`/`Uint32Array` (`Q16.16` & `CSR`), `Uint16Array` (`FP16`/`BF16`), `Int8Array` (Stochastic-Rounded `Q8_0`), `Uint8Array` (BitNet `b1.58` Ternary), and `Float32Array` + Zig/C WebAssembly.
- **25-Pass × 10-Iteration (`250` Pass Executions / `500`-Point) Forensic Auditor (`systems/forensic-25-pass-10-iteration-auditor.js`):**
  - Automated verification suite (`npm run audit:25x10`) achieving `500/500` (`100.00%`).
- **Fortune 100 GitHub Governance & Documentation Suite:**
  - Added root `ARCHITECTURE.md`, `BIBLE.md`, `GLOSSARY.md`, `INDEX.md`, `KANBAN.md`, `ISSUES.md`, `LICENSE` (Proprietary Download-and-Use-Only), `CITATION.cff`, `AUTHORS.md`, `CODEOWNERS`, and `VERSION`.

### Fixed
- **Glitchling `bestSiteFrac` Selectable-Site Metric (`ISS-01`):** Fixed `brains/glitchling/glitchling.ts` and live engine to filter by even-parity accessible sites (`access[k] === 1`) after `backwards` motor mirroring.
- **Glitchling `brain-viz/data.js` Real Flaw Events (`ISS-02`):** Restored all **189 real flaw events** (`motor_reversal`, `misfire`, `sensor_shuffle`, `motor_wiring`) from `results/activations_allflaws_seed1.json`.
- **CQM-Xylos Forensic Audits (`#104, #106, #107, #108, #120, #121, #179, #181, #185, #187`):** Wired online plasticity, exact tangent-map Lyapunov $\lambda_1$, Gödel fixed-point contraction, Bi-Poo STDP, stochastic Int8 rounding, unitary `Float64Array` Schrödinger evolution, residual calibration, and `FP16` fast-weight overlays.
