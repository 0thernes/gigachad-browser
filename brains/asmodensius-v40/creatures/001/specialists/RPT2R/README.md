# Specialist: RPT2R (Feature-Conjunctive Recurrent Binding & L5 Readout)
Substrate: Creature #1 Combo A (`ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`); controls are `mixLesion` (cuts cross-module cortical synapses) and `topoScramble`. Dev seeds `<1064` only.

## 1. Mechanism (`rp2_v8`: `rp2: 8, rp2K: 1`)
- **Cross-Module Bilinear Gain-Field + L5 Conjunctive Projection (`rp2Step`, Salinas & Abbott 1996; Rigotti et al. 2013):**
  - Reads multimodal feature profiles `u[m*4+c] = 0.5 * sens[4*m+c] + 0.3 * rate[THAL+4*m+c] + 0.2 * ctxSubcolRate` across paired cortical modules (`m` and `m ^ 1`), cut cleanly by `mixLesion`.
  - Gated on `this.t > 480` and dual-module contrast (`mx0 - mn0 >= 0.45 && mx1 - mn1 >= 0.45`), so single-module stimuli (`RPT1` ticks `481..1120`, where only module 0 is stimulated) and low-contrast background noise never trigger cross-module injection — keeping `RPT1` **100% bit-identical to `off`**.
  - Injects zero-mean bilinear gain-field drive `x1 * (x2 - mu1)` into cortical excitatory subcolumns `[4*c1 + c2]` and updates `l5[4*c1 + c2] = K * stG * x1 * x2`, modulated by internal hunger state (`stG = 1 - 0.5 * clamp(ghrelin)`).

## 2. Full Dev Verification (`rp2_v8` on Combo A, `n=16` per block)
| Block | `RPT2R` (`d / Welch t`) | `RPT2RL5` (`d / Welch t`) | `RPT1` (`d / Welch t`) | `AE1` (`d / Welch t`) |
|---|---|---|---|---|
| **500** | **9.73 / 27.52 [A]** (`0.9854 vs 0.5552`) | **6.55 / 18.54 [A]** (`0.9823 vs 0.5760`) | **1.37 / 3.88 [A]** (bit-identical) | **1.30 / 3.69 [A]** (`0.3607 vs 0.3077`) |
| **540** | **6.59 / 18.63 [A]** (`0.9813 vs 0.5271`) | **5.60 / 15.85 [A]** (`0.9740 vs 0.5333`) | **1.03 / 2.92 [A]** (bit-identical) | 0.43 / 1.22 [C] (vs `off` `-0.10 [F]`) |
| **560** | **6.07 / 17.16 [A]** (`0.9792 vs 0.5313`) | **6.55 / 18.52 [A]** (`0.9802 vs 0.5354`) | **1.10 / 3.11 [A]** (bit-identical) | — |
- **Strictly off the `1.000` ceiling:** Both `RPT2R` (`0.979–0.985`) and `RPT2RL5` (`0.974–0.982`) stay below `1.000` with non-zero variance across all 3 dev blocks.

## 3. Port & Integration Check (Seeds 600–615, `n=16`)
- **(a) Ablation moves >=2 other subsystems:** **PASS (2 subsystems moved with `|t| >= 2.75`):** `cortisol (d = -1.91, t = -7.66)`, `mood (d = +1.11, t = +4.43)`.
- **(b) State dependence (`awSated` vs `awHungry`):** **PASS (`d = 3.74, paired t = 14.97`).**
- **(c) Specialist passes with no regressions:** **PASS** — `RPT2R` and `RPT2RL5` achieve massive Grade A (`d = 5.60–9.73`) across all 3 blocks, `RPT1` is bit-identical Grade A, and `AE1` improves to Grade A (`d = 1.30, t = 3.69`) on block 500.
