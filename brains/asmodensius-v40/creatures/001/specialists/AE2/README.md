# Specialist: AE2 (Adaptive Kalman Body Model & Sensorimotor Contingency)
Substrate: Creature #1 Combo A (`ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`); controls are `efferenceLesion` and `fwdLesion`. Dev seeds `<1064` only.

## 1. Mechanism (`ae2_v1`: `ae2: 1, ae2K: 1`)
- **Forgetting-Factor Cauchy-Robust Kalman Body Model (Wolpert, Ghahramani & Jordan 1995; Blakemore, Wolpert & Frith 1998):**
  - Replaces the fixed-step body model with an exponentially forgetting covariance update (`bmP = bmP / 0.985 + 2e-4 * ae2K`) and a smooth Cauchy innovation weight (`wq = 1 / (1 + (inn^2 / (9 * S2))^2)`) that rejects unpredicted external pushes (`this.push`) without an oracle push flag while rapidly tracking changes in true motor gain `gTrue`.
  - Tracks sensorimotor body contingency `bmC` (fraction of observed motion explained by efference copy), modulated by internal state (`ae2St = 1 - 0.3 * clamp(ghrelin)`), and couples contingency to endogenous HPA/mood regulation (`hG`).

## 2. Full Dev Verification (`ae2_v1` on Combo A, `n=16` per block)
| Block | `AE2` (`d / Welch t`) | `PROJR` (`d / Welch t`) | `SM` (`d / Welch t`) | `AE1` (`d / Welch t`) | `RPT1` (`d / Welch t`) |
|---|---|---|---|---|---|
| **500** | **1.92 / 5.43 [A]** (`-0.0062 vs -0.2788`) | **5.13 / 14.50 [A]** (`0.8333 vs 0.5063`) | **4.62 / 13.07 [A]** (`-0.0167 vs -0.6384`) | **0.97 / 2.75 [A]** (`0.3427 vs 0.3063`) | **1.37 / 3.88 [A]** (bit-identical) |
| **540** | **1.70 / 4.81 [A]** (`-0.0058 vs -0.2680`) | **6.44 / 18.23 [A]** (`0.8198 vs 0.4833`) | **3.60 / 10.18 [A]** (`-0.0168 vs -0.6340`) | 0.59 / 1.68 [C] (vs `off` `-0.10 [F]`) | **1.03 / 2.92 [A]** (bit-identical) |
| **560** | **2.05 / 5.80 [A]** (`-0.0056 vs -0.2367`) | **5.03 / 14.22 [A]** (`0.8292 vs 0.5010`) | **5.05 / 14.28 [A]** (`-0.0174 vs -0.6571`) | — | **1.10 / 3.11 [A]** (bit-identical) |

## 3. Port & Integration Check (Seeds 600–615, `n=16`)
- **(a) Ablation moves >=2 other subsystems:** **PASS (2 subsystems moved with `|t| >= 2.75`):** `cortisol (d = -2.51, t = -10.06)`, `mood (d = +0.85, t = +3.39)`.
- **(b) State dependence (`awSated` vs `awHungry`):** **PASS (`d = 79.18, paired t = 316.72`).**
- **(c) Specialist passes with no regressions:** **PASS** — `AE2`, `PROJR`, and `SM` achieve Grade A across all 3 blocks (`500, 540, 560`), `RPT1` is bit-identical Grade A, and `AE1` upgrades to Grade A (`d = 0.97, t = 2.75`) on block 500.
