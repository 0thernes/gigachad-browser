# REARCHITECT: a first-principles rethink of creature 001 (2026-11-01 PT)
Status: design document. Dev seeds only, nothing run for scoring. Sources: CORE-ARCHITECTURE, FIRST-PRINCIPLES, DISCOVERIES, b23/BOTTLENECK-MAP, asm-wild WILD-ARCH, FREAK-100, B29-REPORT, preregistrations/v4.0. Official scores: Butlin 9/14, frameworks 7/10, CQM 17/25. Pass rule: d >= 0.8 and t >= 2.75 against every control. No claim of phenomenal consciousness.

## 0. One-paragraph verdict
We are stalled for structural reasons, not for lack of mechanisms. Three things are going on:
- The brain is a stack of about 30 flags on a 4×13-cell spiking sheet, with little capacity and close to saturation. Every addition shifts shared variance, so a new pass costs an old one: AE1 flips across pools, and C16R collapses when CQM10 is fixed.
- Several failing tests are ill-posed for any brain. AINF is capped by forage count, C03R's birth rule lives in the harness, and AE1 and HOT3RM swing at noise level across blocks.
- The architecture has no single explicit generative world model that everything reads from. Each property is therefore built locally.

Recommendation: **Blueprint A**, a predictive world-model core with VSA binding and a precision/neuromodulator economy, built at 10^4-10^5 units with local rules. Wrap Blueprint B's sub-brain auction around it later for the 100M "brains of brains". Before any build, fix the test battery (section 2.3).

## 1. First-principles teardown: what each goal family actually demands
| Family | Computational demand underneath | Common substrate |
|---|---|---|
| Butlin 14 (RPT, GWT, HOT, AST, PP, AE) | Recurrent re-entry; a limited-capacity broadcast with ignition; a generative model of its own perception (HOT-1); a confidence estimate that is a model of its own reliability (HOT-2/3); an attention schema (AST) that predicts its own attention; agency through a learned action→outcome model (AE-1) | **A latent generative model with self-modelled precision** |
| 10 frameworks (GWT, IIT-ish integration, PP/AINF, HOT, RPT, AST, LTC, CTM, UAL, embodiment) | Integration and differentiation; prediction-error minimisation that drives action; unlimited associative learning (compositional, second-order, trace conditioning); continuous-time dynamics | **Compositional binding (VSA) + eligibility-trace RL on the model's latents** |
| CQM 25 (viability, appetite, body, reproduction, replay, anticipation) | Allostasis: predicting interoceptive needs and acting before deficit; plastic body/morphology; heritable variation under selection; offline replay | **Interoceptive branch of the same world model; precision = neuromodulator budget** |

In short, one object would make most passes fall out: a world model **M** that predicts the next exteroceptive state, interoceptive state and own action. It would keep a precision (inverse variance) per channel, and the global workspace would be the slot whose precision-weighted error wins the auction. Under that model, the failing tests map like this:
- HOT confidence is the precision of the chosen latent.
- AST is M's model of where the workspace will go.
- AE1 is the action→outcome branch.
- AINF is expected information gain under M.
- C10/C16R is the interoceptive forecast that drives action before deficit.
- RPT2R is binding inside M's latent.
- UAL is trace credit over M's latents.
- CQM04 is M's body prior retargeted when the body changes.

## 2. Why the current architecture stalls (structural)
### 2.1 Structural causes
1. **Capacity starvation.** 52 excitatory cells must hold sensation, binding, drive, confidence and agency at once. B23 showed the ctx31 cells saturate, and L5 feedback could not reach the readout (B24). Every mechanism competes for the same few dynamic ranges, which explains the regressions: AE1 0.99→0.18 as AOM/vsa were added, and C16R lost to `aic`.
2. **No explicit model, so no shared currency.** Confidence, salience, information gain and appetite forecasting are each computed by separate heuristics: margin, pulvinar contrast, the AOM term, the 30-minute forecast. The `aic` forecast tie was inert (B29). That shows the "forecast" is not actually used by the controllers, so anticipation and homeostasis are not unified.
3. **Flag combinatorics.** ORG_V5=1..15 plus M50J flags. Each B-round tunes one flag on one block and confirms it on one held-out block. With 16 seeds and block SD this large, a 1-in-3 chance of a false flip per test per round is expected, so the no-lost-pass rule is near-unsatisfiable by local search.
4. **Learning-independent shortcuts contaminate lesion controls.** The vsa hub gives the RPE-lesioned arm a free signal, which drops AE1. Any fixed-weight helper weakens lesion contrasts. New substrate must be **plastic end to end** so lesions remove what they claim to remove.
5. **A spiking substrate at tiny N** makes metrics heavy-tailed (HOT3RM swings 0.69-1.31 on one build).

### 2.2 Are the tests and controls well-posed?
- **AINF (raw reward): ill-posed.** The oracle site choice gives only d≈0.24 (B23). No brain can pass it. Keep it reported; add the disclosed AINF-H (hits per forage, oracle ceiling 0.300 vs 0.222 now) as the scored variant.
- **C03R: partly ill-posed.** The birth rule is in the harness, so the creature cannot influence it except through energy. Proposal: move reproduction into the organism (an energy-gated decision the brain makes) under a v6 preregistration. That turns it into a brain test rather than a harness constant.
- **C16R vs CQM10: conflict by construction.** A strong reactive homeostat both passes CQM10 and erases the anticipation contrast in C16R. The C16R lesion should remove the *forecast* only, while leaving the integrator in both arms. Otherwise, fixing one test structurally fails the other.
- **AE1 and HOT3RM: underpowered.** Winners flip across 48-seed pools. Use pooled 64-seed paired designs (dz) as the scored statistic, preregistered, with the unpaired version still reported.
- **The vsa mixLesion control** is not independent (WILD-ARCH). The matched linear control is the right one; keep it.
- **Scale-up regressions** are expected while tests are tuned to the current N. Tests should be scored at a fixed population and protocol, not at a fixed wiring size.

### 2.3 Battery fixes before any new brain (preregister as v6 tests, originals still reported)
AINF-H; C03R-organism; C16R forecast-only lesion; AE1/HOT3RM paired 64-seed pools; and a "no fixed-weight helper" audit for every lesion control.

## 3. Whole-brain blueprints
### A. Predictive world-model core + VSA binding + precision economy ("PWM")
- **Core idea:** a single hierarchical generative model (3 levels) over [extero, intero, proprio, action]. Latents are MAP hypervectors (D=1024-4096) so bindings compose. The neuromodulators are the precision economy:
  - NE: unexpected uncertainty, which sets the learning rate;
  - ACh: expected uncertainty, which sets bottom-up vs top-down weighting;
  - DA: precision of policy, i.e. RPE;
  - 5-HT: temporal discount and patience.
  Action is chosen by expected free energy, pragmatic (interoceptive set-points) plus epistemic.
- **Modules:**
  - two-compartment predictive cells (reuse v5 apical/basal) as the error units;
  - a VSA binding hub, made plastic;
  - a thalamic precision gate;
  - a workspace slot (the top-k precision-weighted error ignites);
  - an interoceptive branch feeding hypothalamic opponent drives;
  - a hippocampal sequence buffer for replay;
  - a body schema latent.
- **Learning rules:**
  - local prediction-error plasticity (Rao & Ballard 1999; Whittington & Bogacz 2017);
  - precision learning by running error variance (Feldman & Friston 2010);
  - VSA unbind/bind weights by Hebbian resonator updates (Frady et al. 2020);
  - three-factor eligibility traces with DA (Gerstner et al. 2018);
  - replay-driven consolidation (Wilson & McNaughton 1994).
- **How each failing test passes:**
  - **AE1:** agency = the learned action→outcome branch. Under an RPE lesion the policy precision is flat, and no fixed helper exists, so the contrast is clean.
  - **AINF-H:** the epistemic term picks high-information sites, closing hits per forage toward 0.30.
  - **C10/CQM10:** pragmatic EFE on *predicted* glucose. This is allostasis with an integral term inside the model (antithetic, as in B29), but using the forecast, so the tie is no longer inert.
  - **C16R:** the forecast-only lesion leaves the integrator, so the contrast survives.
  - **C03R:** the reproduction action is valued by the predicted energy surplus.
  - **CQM04:** a body change becomes a prediction error on the proprio branch; precision-weighted learning retargets the body schema.
  - **UAL at scale:** compositional VSA latents plus traces give second-order and trace conditioning without new units.
  - **HOT3RM:** confidence = the learned posterior precision, a smooth variable, so it is far less heavy-tailed than spike margin.
- **Risks:** EFE planning cost; a rate/VSA core may lose the LTC and spiking-dependent passes (keep the spiking sheet as the sensory layer); there is a risk of "it's just a model-based RL agent" critiques.
- **Reused:** v5 two-compartment cells, thalamic gate, hypothalamic drives, vsa hub (B29), `aic` integral (B29), replay, harness. Eshkol for tensors, QRNG as the single entropy source.
- **Effort:** about 2-3 rounds for the core at 10^4 units; 1 round for the battery fixes.

### B. SUPER CREATURE society: competing sub-brains + workspace auction
- **Core idea:** following Alex's super-mind (biomimetic multi-brain), 8-64 heterogeneous sub-brains (forager, homeostat, explorer, social, body, critic, ...) each bid for the effector and the broadcast. The bid is the sub-brain's predicted value × its own confidence, and a Vickrey-style auction picks the winner. The winner's state is broadcast.
- **Modules:** sub-brains (each a small PWM or a small RL agent); an auctioneer (TRN-like); a broadcast bus; a credit market (winners pay; correct predictions earn).
- **Learning:** each sub-brain learns locally; bids are calibrated by a proper scoring rule (Brier), which gives meta-cognition for free; the bucket-brigade credit is an original formulation grounded in basal-ganglia action selection (Redgrave et al. 1999), not copied from classifier-system code.
- **Predicted passes:**
  - HOT3RM via bid calibration;
  - GWT/AST natively;
  - C10 via a dedicated homeostat sub-brain that wins when deficits are predicted;
  - AE1 via the critic's RPE;
  - CQM04 by a body sub-brain whose wins rise after a morphology change.
- **Risks:** looks like per-test modules if the sub-brains are named after tests; credit assignment instability. Sub-brains must be generic and specialise by learning.
- **Reused:** super-mind.ts concepts (not present in this repo, so it needs to be located), the workspace, the drives.
- **Effort:** 3 rounds. Best as the **scale wrapper** of A, giving "brains of brains" to 100M.

### C. Evolved developmental brain (indirect encoding + lifetime plasticity)
- **Core idea:** stop hand-designing. A compact genome (CPPN-like developmental rules, original implementation; Stanley 2007 cited as science) grows wiring and per-synapse plasticity coefficients. Eshkol meta-learns the plasticity rule parameters (in the spirit of Miconi et al. 2018 differentiable plasticity; Najarro & Risi 2020). Fitness is viability in the neutral dome, **never test scores**.
- **Predicted passes:** C03R and CQM04 become natural (heritable bodies); UAL emerges if the evolved rules are trace-based.
- **Risks:** compute heavy; Goodhart if fitness drifts toward the tests; slow; results are hard to explain to reviewers.
- **Effort:** 4+ rounds. Use it as an outer loop *over* A's rule parameters later.

### D (wild). Continuous-time sLTC "liquid dome-brain" with QRNG criticality
- **Core idea:** one large continuous-time spiking/LTC reservoir (10^5-10^6 units), conductance-based τ (Hasani 2021 cited), and the body and dome coupled into the same ODE. The system self-tunes to the edge of criticality (branching ratio ≈1; Beggs & Plenz 2003) by homeostatic plasticity. QRNG drives the stochastic resonance. Readouts are learned by FORCE / e-prop (Sussillo & Abbott 2009; Bellec et al. 2020). Consciousness-test properties are expected from criticality: maximal integration, ignition-like avalanches, long memory.
- **Predicted passes:** LTC, CTM and integration natively; UAL via e-prop traces. **Likely fails** HOT, AE1 and C10, since it has no explicit model or precision.
- **Risks:** high. It is the experiment to run if A plateaus, and it is a good Moonlab demo.
- **Effort:** 3 rounds plus GPU.

## 4. Recommendation and staged plan
**Pick A (PWM core)** as the substrate. It is the only blueprint where every failing item has a named mechanism that is the *same* variable (precision-weighted prediction under one model). B wraps it for scale, C tunes its rules, and D stays as a fallback.

### Stage 0 (1 round): battery v6
Preregister AINF-H, C16R forecast-only lesion, C03R-organism, and AE1/HOT3RM paired 64-seed pools. Originals are still reported.
- **Kill criterion:** none; this is hygiene.

### Stage 1 (1 round, dev seeds): smallest prototype on the 3 hardest
The three hardest are **AE1**, **C10/CQM10 + C16R jointly** and **HOT3RM**.
- **Build:** `ORG_V6=1`, a rate-based PWM module of 2048-D VSA latent plus 1 hidden level, sitting on top of the v5.7b sensory sheet. It has:
  - a plastic hub, with no fixed helper;
  - learned precision;
  - EFE action over {forage site, rest, explore};
  - an `aic` integral using the model's forecast.
- **Seeds:** dev 4365-4380, held-out dev 4381-4396, AE1 pool 4397-4460.
- **Kill if any of these happen:**
  1. AE1 pooled dz < 0.8;
  2. CQM10 and C16R do not *both* pass on both blocks;
  3. HOT3RM block-to-block d range > 0.4, meaning it is still unstable;
  4. more than 1 previous pass is lost.
  If killed, go to D as the substrate swap, and keep A's precision economy as the readout.

### Stage 2 (2 rounds)
- Scale to 10^5 units on Eshkol.
- Re-run the full battery on held-out dev.
- Add CQM04 (body-change retargeting) and UAL-at-scale.
- **Kill if** scale-up loses passes: that would mean a capacity-unrelated defect.

### Stage 3
- B-wrapper: 16 PWM sub-brains with a calibrated auction, as the path to the 100M "brains of brains" and the 3D dome.
- C outer loop on the plasticity coefficients, with dome viability as the only fitness.

## 5. Principles check
- One general brain: a single model and a single currency.
- Neuroscience-grounded, with citations above.
- Original: no A-Life code or mechanics copied; cited work is used as science only.
- The dome stays neutral; set-points are interoceptive, not moral.
- No built-in morals.
- Tsotchke Eshkol, QRNG and Moonlab are used as adapters.

## 6. Toy proof of concept
Not built in this pass: there was not enough time, and running jobs were left untouched. Stage 1 is the first experiment.
