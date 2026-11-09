# ALIVE Pass 03 Report — Architecture Ablations Across Every Brain Family, Precision Route, Scale Stratum, Specialist Readout, AoT/ToT/GoT & Synaptic Fabric Pathway

**Date:** 2026-11-09  
**Pass:** 3 of 10 (`docs/ALIVE_TEN_PASS_ROADMAP.md`)  
**Benchmark ID:** `pass-03-architecture-ablations-v1`  
**Seeds:** `[19013, 29017, 39023, 49031, 59053]` (5 independent unsigned 32-bit seeds, two-sided Student-$t$ 95% confidence intervals, $\text{df} = 4$)

---

## 1. What Was Built & Upgraded in Pass 3

1. **Runtime Source Ablation & Per-Stream Contribution Norms (`systems/alive-neural-coupling.js`)**
   - Added `setAblatedSources(targets)` and `clearAblations()` to `AliveNeuralCoupling` (`h.aliveNeuralCoupling`), allowing any individual or grouped subset of the 24 coupled streams (`14 brains + 7 precision kernels + Ising-56 + Omega Lorenz + Omega Izhikevich`) to be diagnostically zeroed in the shared hub sensory projection `input[j]` and excluded from reward-modulated eligibility updates in `feedback()` while holding the normalization divisor $\sqrt{\max(1, \text{available})}$ invariant.
   - Added per-stream L2 contribution norms (`contributionNorm`, zeroed when `diagnosticallyAblated === true`) and `ablatedCount` to `h.aliveNeuralCoupling.snapshot()`.

2. **Full 38-Condition, 5-Seed Architecture Ablation Suite (`systems/alive-architecture-ablations.js` & `scripts/alive-architecture-ablations.cjs`)**
   - Evaluates 38 deterministic ablation conditions across five independent seeds (`[19013, 29017, 39023, 49031, 59053]`) on isolated instances of `BleedEdge25AlifeEngine`, `AotTotGotCorecursiveDecursiveEngine`, `AliveNeuralCoupling`, `AliveSpecialistFusion`, `AliveResearchPolicy`, `AliveCognitiveFaculties`, and `AliveSynapticFabric` (`liveRuntimeModified: false`):
     - **Tier 1 — 14 Brain Families + Group Ablation (15 conditions):** `brain1Asmodensius` through `brain14ThingmakerGrimoire` + `all-14-brains`.
     - **Tier 2 — 7 Precision Routes + Group Ablation (8 conditions):** `precision-f64`, `precision-i64`, `precision-u32`, `precision-fp16`, `precision-int8`, `precision-ternary`, `precision-f32` + `all-7-precision`.
     - **Tier 3 — 3 Scale Strata & 5 Specialist Fusion Readouts (8 conditions):** `micro-ising`, `omega-lorenz`, `omega-izhikevich`, plus `NMDA_sLTC_Sheet`, `Dreamer_WorldModel`, `FlyWire_Connectome`, `QGTL_Grover_Q3`, `Allostatic_AgRP` via `AliveSpecialistFusion.fuse(..., diagnosticMask)`.
     - **Tier 4 — AoT / ToT / GoT Corecursive-Decursive Reasoning Structures (4 conditions):** `AoT-contractor`, `ToT-puct-tree`, `GoT-dag-pagerank`, and `all-aot-tot-got`.
     - **Tier 5 — Synaptic Fabric & Online Plasticity Pathways (3 conditions):** `ghost-swarm-role-coupling`, `online-ranker-plasticity`, and `full-fabric-plus-plasticity` on unseen multi-domain holdout research graphs.

3. **Live Synaptic Fabric Visualizer Section 9 (`systems/alive-fabric-visualizer.js` & `systems/alive-startup-loader.js`)**
   - Added `'systems/alive-architecture-ablations.js'` to `POST_MODULES` in `systems/alive-startup-loader.js`.
   - Added a `Run ablations` button, `aliveFabricVisualizer.runAblations()`, and Section 9 (`9 · Architecture ablations — 14 brains × 7 precision × AoT/ToT/GoT × specialists`, `#alive-fabric-ablations`) rendering measured 5-seed L2 sensory/residual/margin/reward deltas across all 38 conditions directly on a 2D canvas.

---

## 2. Measured 5-Seed Ablation Results (`df = 4`)

### 2.1 Tier 1 — 14 Brain Families (`AliveNeuralCoupling`)

| Condition | Sensory $\Delta L_2$ (Mean) | Latent $\Delta L_2$ (Mean) | Motor $\Delta L_2$ (Mean) | Stream Contribution Norm | Causal Seeds |
| --- | ---: | ---: | ---: | ---: | ---: |
| `brain1Asmodensius` | `0.000684` | `0.000199` | `0.000076` | `0.02796` | `5/5` |
| `brain2Glitchling` | `0.000157` | `0.000046` | `0.000014` | `0.00640` | `5/5` |
| `brain3CqmSuperMind` | `0.001240` | `0.000362` | `0.000148` | `0.05068` | `5/5` |
| `brain4ApexHydra` | `0.002034` | `0.000593` | `0.000191` | `0.08307` | `5/5` |
| `brain5Xenomimic` | `0.001068` | `0.000311` | `0.000091` | `0.04363` | `5/5` |
| `brain6XylosManifold` | `0.000659` | `0.000192` | `0.000041` | `0.02691` | `5/5` |
| `brain7Mechalogodrom` | `0.001850` | `0.000540` | `0.000153` | `0.07557` | `5/5` |
| `brain8GlyphPantheon` | `0.000102` | `0.000030` | `0.000011` | `0.00416` | `5/5` |
| `brain9ThalerDabus` | `0.000305` | `0.000089` | `0.000029` | `0.01248` | `5/5` |
| `brain10GraphCrystal` | `0.000147` | `0.000043` | `0.000012` | `0.00598` | `5/5` |
| `brain11TsotchkeDale` | `0.000510` | `0.000149` | `0.000101` | `0.02086` | `5/5` |
| `brain12BlackHolePage` | `0.001895` | `0.000553` | `0.000109` | `0.07739` | `5/5` |
| `brain13ConsciousnessConsortium` | `0.000159` | `0.000046` | `0.000016` | `0.00650` | `5/5` |
| `brain14ThingmakerGrimoire` | `0.000124` | `0.000036` | `0.000007` | `0.00508` | `5/5` |
| **`all-14-brains` (Group)** | **`0.007472 ± 0.000119`** | **`0.002179`** | **`0.000860`** | **`0.44668`** | **`5/5`** |

### 2.2 Tier 2 — 7 Precision Routes (`BleedEdge25AlifeEngine`)

| Condition | Sensory $\Delta L_2$ (Mean) | Latent $\Delta L_2$ (Mean) | Motor $\Delta L_2$ (Mean) | Stream Contribution Norm | Causal Seeds |
| --- | ---: | ---: | ---: | ---: | ---: |
| `precision-f64` (Float64 ODE/QGT) | `0.000464` | `0.000135` | `0.000096` | `0.01900` | `5/5` |
| `precision-i64` (BigInt64 $\mathbb{Z}[\zeta_8]$) | `0.001044` | `0.000304` | `0.000081` | `0.04265` | `5/5` |
| `precision-u32` (Uint32 Binary HDC) | `0.002435` | `0.000710` | `0.000165` | `0.09947` | `5/5` |
| `precision-fp16` (Uint16 IEEE-754 FP16) | `0.001287` | `0.000375` | `0.000165` | `0.05262` | `5/5` |
| `precision-int8` (Int8 Symmetric Quant) | `0.000367` | `0.000107` | `0.000050` | `0.01502` | `5/5` |
| `precision-ternary` (2-bit BitNet b1.58) | `0.000831` | `0.000242` | `0.000055` | `0.03396` | `5/5` |
| `precision-f32` (Float32 Mamba SSM) | `0.000700` | `0.000204` | `0.000107` | `0.02863` | `5/5` |
| **`all-7-precision` (Group)** | **`0.005048 ± 0.000095`** | **`0.001472`** | **`0.000604`** | **`0.29135`** | **`5/5`** |

### 2.3 Tier 3 — 3 Scale Strata & 5 Specialist Fusion Readouts

| Condition | Tier | Primary Delta Metric (Mean) | Causal Seeds |
| --- | --- | ---: | ---: |
| `micro-ising` (56-spin Ising lattice) | Scale Stratum | `0.002191` (Sensory $\Delta L_2$) | `5/5` |
| `omega-lorenz` (3D Lorenz strange attractor) | Scale Stratum | `0.001451` (Sensory $\Delta L_2$) | `5/5` |
| `omega-izhikevich` (Izhikevich bursting neuron) | Scale Stratum | `0.001078` (Sensory $\Delta L_2$) | `5/5` |
| `NMDA_sLTC_Sheet` | Specialist Fusion | `0.001705` (Residual $\Delta L_2$) | `5/5` |
| `Dreamer_WorldModel` | Specialist Fusion | `0.000435` (Residual $\Delta L_2$) | `5/5` |
| `FlyWire_Connectome` | Specialist Fusion | `0.008979` (Residual $\Delta L_2$) | `5/5` |
| `QGTL_Grover_Q3` | Specialist Fusion | `0.001625` (Residual $\Delta L_2$) | `5/5` |
| `Allostatic_AgRP` | Specialist Fusion | `0.001620` (Residual $\Delta L_2$) | `5/5` |

### 2.4 Tier 4 — AoT / ToT / GoT Corecursive-Decursive Reasoning (`AotTotGotCorecursiveDecursiveEngine`)

| Condition | Candidate Ranking Margin Loss (Mean ± SD) | Top-1 Accuracy Drop | Causal Seeds |
| --- | ---: | ---: | ---: |
| `AoT-contractor` | `0.1997 ± 0.0044` | `0.0%` | `5/5` |
| `ToT-puct-tree` | `0.7886 ± 0.0110` | `0.0%` | `5/5` |
| `GoT-dag-pagerank` | `0.9701 ± 0.0329` | `20.0%` | `5/5` |
| **`all-aot-tot-got` (Group)** | **`1.9584 ± 0.0404` (`95% CI: [1.9082, 2.0085]`)** | **`100.0%`** | **`5/5`** |

### 2.5 Tier 5 — Synaptic Fabric & Plasticity Pathways (`AliveUnseenTaskBenchmark`)

| Condition Ablated | Unseen Holdout Reward Loss (Mean ± SD) | 95% Student-$t$ CI | Causal Seeds |
| --- | ---: | --- | ---: |
| `ghost-swarm-role-coupling` | `+6.110 ± 1.345` | `[+4.439, +7.780]` | `5/5` |
| `online-ranker-plasticity` | `+13.338 ± 1.259` | `[+11.775, +14.901]` | `5/5` |
| `full-fabric-plus-plasticity` | `+19.448 ± 0.304` | `[+19.070, +19.825]` | `5/5` |

---

## 3. Generated Artifacts & Verification

- **JSON Report:** [`docs/reports/alive-architecture-ablations-2026-11-09.json`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-architecture-ablations-2026-11-09.json)
- **SVG Plot:** [`docs/reports/alive-architecture-ablations-2026-11-09.svg`](file:///z:/%5BVibe%20Coded%20(AI)%5D/CLAUDECODE/gigachad-browser/docs/reports/alive-architecture-ablations-2026-11-09.svg)
- **Next Suggested Pass (Pass 4 of 10):** `Macro/meso/micro neural dynamics and body-curriculum co-adaptation` — closed-loop coupling between Macro 14 Regions / RIM Router, Meso 112 sLTC × SSM / Apical NMDA, Micro Moonlab Q3 / QGTL / QRNG / Eshkol / FlyWire Ising, and Body + Curriculum Stages A–F / Viscera.
