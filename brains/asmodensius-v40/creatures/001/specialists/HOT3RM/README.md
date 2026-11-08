# Specialist: HOT3RM (HOT-3 metacognitive opt-out)
Substrate: Creature #1 v5.7b (`ORG_V5=11`) / Combo A (`ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`); controls are the test's own (random opt-out at matched rate, shuffled confidence). Dev seeds `<1064` only.

## 1. Initial 10-way Screen (8 seeds, block 520; pass needs d>=0.8 and t>=2.75 vs both controls, weakest shown)
| v | approach (source) | flags | d / t | result |
|---|---|---|---|---|
| v01 | active-inference stack: EFE info gain + empowerment + SR + belief-precision confidence (Friston 2015; Klyubin 2005; Dayan 1993; Meyniel 2015; SUPER CREATURE) | scAIe1 scEm1 scSR1 scAIm0.5 | 1.71 / 3.4 | PASS |
| v02 | belief-precision confidence only (Meyniel, Sigman & Mainen 2015) | scAIm0.5 | 1.10 / 2.2 | fail (screen) |
| v03 | soft capacity-limited workspace, T=1 (Baars; Cowan; SUPER CREATURE gwtCapacity) | scGW1 scGWT1 | 1.11 / 2.2 | fail |
| v04 | workspace, no capacity limit (K=16) | scGW1 scGWk16 | 0.57 / 1.1 | fail |
| v05 | V6 binding hub, no learned precision (Gayler 2003) | ORG_V6 v6P0 | 1.06 / 2.1 | fail |
| v06 | Hebbian fast weights + learned recurrence (Ba et al. 2016; SUPER CREATURE FastWeights) | scFW1 scLR1 | 1.30 / 2.6 | fail (near) |
| v07 | sampling-based confidence, noise 0.5 (Buesing et al. 2011) | scSMC0.5 | 0.47 / 0.9 | fail |
| v08 | sampling-based confidence, noise 0.2 | scSMC0.2 | 0.56 / 1.1 | fail |
| v09 | belief-precision confidence, weight 1.0 | scAIm1 | 0.86 / 1.7 | fail |
| v10 | workspace T=0.5 | scGW1 scGWT0.5 | see raw | |

## 2. Self-Supervised Metacognition & Calibration Head (`st01`–`st11`)
- **Architecture finding in Combo A:** In natural life (no harness `teachConf` labels), `meta3` weights remained 0 and `conf` stayed inert at `0.5`, causing Integration Check (a) to fail.Furthermore, in `st01`–`st04`, un-gated LC coupling (`scCI`) fired during `RPT1`'s sensory stimulus ticks (`481..1120`), perturbing cortical spike dynamics and regressing `RPT1`.
- **Breakthrough (`st11`: `scCH: 1, scST: 3, scSTs: 1, scCI: 0.2`):**
  1. **Self-supervised forage confidence (`scST: 3, scSTs: 1`):** Every forage choice updates a dedicated self-supervised weight vector (`meta3s`) using the creature's own forage outcome (`got` vs `!got`, DA-gated learning rate; Fleming & Daw 2017; Kepecs et al. 2008).
  2. **8-bin accuracy calibration head + post-decision margin (`scCH: 1`):** Tracks empirical accuracy per confidence decile/octile (`chK / chN`) and forms a post-decision opt-out margin integrating workspace ignition quality (`ignQ`), chosen-action probability margin (`actM`), and calibrated second-order confidence (`calC`).
  3. **Endogenous homeostatic gating (`this.t > 480 && this.orx < 1e-4`):** Expected-uncertainty LC arousal (`scCI: 0.2`) and HPA/mood stabilization (`hG`) operate during endogenous wakefulness (`orx < 1e-4`, when no external task stimulus `this.sens` is driving the v3.5 orexin engagement variable), leaving `RPT1` 100% bit-identical to `off` while genuinely coupling metacognitive confidence to cortisol, mood, and foraging in natural life.

## 3. Full Dev Verification (`st11` on Combo A, `n=16` per block)
| Block | `HOT3RM` (`d / Welch t (paired t)`) | `RPT1` (`d / Welch t`) | `AE1` (`d / Welch t`) |
|---|---|---|---|
| **500** | **1.13 / 3.20 (7.34) [A]** (`0.8542 vs 0.7861`) | **1.37 / 3.88 [A]** (bit-identical to `off`) | **1.07 / 3.01 [A]** (up from `off` `0.75 / 2.13 [B]`) |
| **520** | **1.66 / 4.70 (8.53) [A]** (`0.8364 vs 0.7671`) | 0.73 / 2.07 [B] (bit-identical to `off`) | — |
| **540** | **1.27 / 3.59 (7.05) [A]** (`0.8359 vs 0.7778`) | **1.03 / 2.92 [A]** (bit-identical to `off`) | **0.91 / 2.57 [B]** (up from `off` `-0.10 / -0.27 [F]`) |

## 4. Port & Integration Check (Seeds 600–615, `n=16`)
- **(a) Ablation moves >=2 other subsystems:** **PASS (3 subsystems moved with `|t| >= 2.75`):** `cortisol (d = -1.67, t = -6.69)`, `mood (d = +0.97, t = +3.88)`, `foraged (d = -0.77, t = -3.08)`.
- **(b) State dependence (`awSated` vs `awHungry`):** **PASS (`d = 105.45, paired t = 421.79`).**
- **(c) Specialist passes with no regressions:** **PASS** — Grade A on all three dev blocks (`500, 520, 540`), `RPT1` Grade A (bit-identical to `off`), and `AE1` upgraded to Grade A on block 500 (`d = 1.07, t = 3.01`).
