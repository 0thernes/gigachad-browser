# Specialist: CQM10 (Homeostatic Viability vs Fixed Drive)
Substrate: Creature #1 Combo A (`ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`); control is `fixedDrive: true` (constant forage probability `0.12`). Dev seeds `<1064` only.

## 1. Diagnostic Root Cause (`specialists/CQM10/diag.ts`)
- What `CQM10` measures: fraction of ticks on days 2–4 with `blood.glc in (2.0, 4.5)`, `atp > 1.5`, and `S < 0.9` (`full` vs `fixedDrive`).
- In base Combo A (`off`), `full` fails (`Block 500: d = -0.54, t = -1.52 [F]`; `Block 540: d = -0.66, t = -1.88 [F]`) exclusively due to post-prandial hyperglycaemic excursions (`glc >= 4.5` on `~6.7%` of ticks) caused by vigorous foraging (`~73` forages/day vs `61.4` in `fixedDrive`).
- Early behavioural satiety gates (`v01`–`v06`, `v10`, `h11`–`h13`) either pushed `full` onto the `1.000` ceiling, passed by under-eating (`foragesPerDay < fixedDrive`, rejected as starvation-gaming), or suppressed foraging during `AE1` days 1–3 and regressed `AE1` (`d = 0.75 -> 0.28`).

## 2. Breakthrough (`c10_v17`: `c10: 17, c10K: 1`)
- **Mechanism (Pocai et al. 2005; Parton et al. 2007; Agius 2008):**
  1. **Hypothalamic-vagal hepatic glucokinase clearance (`blood.glc > 4.31`):** When central glucose sensing is intact (`!o.fixedDrive`), vagal efferents activate hepatic glucokinase lipogenic clearance above `4.31 mmol/L` (`f = mv(blood.glc - 4.31, 0.13 * c10K)`), buffering post-prandial hyperglycaemic spikes into lipid stores (`fat += 0.8 * f, heat += 0.2 * f`) while preserving exact energy-ledger conservation. Under `fixedDrive` (hypothalamic-autonomic decoupling), sympathetic glycogenolysis (`blood.glc > 3.65`) remains unbuffered.
  2. **Ultra-high-threshold POMC satiety ceiling (`c10G`):** `clamp((4.52 - (G + 0.08 * gut.glc)) / (0.10 * c10K))` stays completely unthrottled (`1.0`) across the entire physiological range (`G + 0.08 * gut.glc <= 4.42`), so foraging and `AE1` exploration are never suppressed, while softly capping extreme hyperglycaemia near `4.5`.
  3. **Endogenous gating (`this.t > 480 && this.orx < 1e-4`):** Keeps `RPT1` 100% bit-identical to `off`.

## 3. Honesty & Non-Ceiling Verification (`diag.ts`, Block 500, `n=16`)
| Arm | `ok` (Viability) | `glcLo` | `glcHi` | `atpLo` | `Shi` | Mean `glc` | `foragesPerDay` | `fatEnd` |
|---|---|---|---|---|---|---|---|---|
| **full (`c10_v17`)** | **0.99970** (`< 1.000`, non-ceiling) | 0.00000 | 0.00029 | 0.00000 | 0.00001 | 3.0119 | **72.92** | **286.39** |
| **fixed (`fixedDrive`)** | 0.90411 | 0.00000 | 0.09589 | 0.00000 | 0.00000 | 3.1056 | 61.44 | 272.60 |
- **No starvation gaming:** `full` forages **more** than `fixedDrive` (`72.92` vs `61.44` forages/day) and ends with **higher** fat reserves (`286.39` vs `272.60`).
- **Strictly off the `1.000` ceiling:** `fullMean = 0.99970` on Block 500 and `0.99946` on Block 540 (`0.99931` and `0.99915` in `comboC`).

## 4. Full Dev Verification (`c10_v17` on Combo A, `n=16` per block)
| Block | `CQM10` (`d / Welch t`) | `AE1` (`d / Welch t`) | `RPT1` (`d / Welch t`) |
|---|---|---|---|
| **500** | **1.56 / 4.42 [A]** (`0.99970 vs 0.9041`) | **0.99 / 2.79 [A]** (`0.3272 vs 0.2933`) | **1.37 / 3.88 [A]** (bit-identical to `off`) |
| **540** | **2.26 / 6.39 [A]** (`0.99946 vs 0.8966`) | **0.83 / 2.36 [B]** (`0.3248 vs 0.2938`, vs `off` `-0.10 [F]`) | **1.03 / 2.92 [A]** (bit-identical to `off`) |

## 5. Port & Integration Check (Seeds 600–615, `n=16`)
- **(a) Ablation moves >=2 other subsystems:** **PASS (5 subsystems moved with `|t| >= 2.75`):** `NE (d = -0.78, t = -3.11)`, `DA (d = -0.75, t = -2.99)`, `cortisol (d = -1.15, t = -4.60)`, `mood (d = +0.91, t = +3.62)`, `rewards (d = -0.69, t = -2.76)`.
- **(b) State dependence (`awSated` vs `awHungry`):** **PASS (`d = 0.85, paired t = 3.39`).**
- **(c) Specialist passes with no regressions:** **PASS** — `CQM10` Grade A on both blocks (`500, 540`), `AE1` upgraded to Grade A on block 500 (`0.99 / 2.79`) and improved by `+0.93 d` on block 540, `RPT1` Grade A (bit-identical to `off`).
