# ALIVE Pass 33 Report — Neuro-Symbolic DOM/API Extractor Program Synthesis & SMT-Style Invariant Verification

**Date:** 2026-11-09  
**Phase:** Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry (Pass 33 of 40)  
**Module:** [`systems/alive-neurosymbolic-program-synthesizer.js`](../systems/alive-neurosymbolic-program-synthesizer.js)  
**CLI Runner:** [`scripts/alive-neurosymbolic-program-synthesizer.cjs`](../scripts/alive-neurosymbolic-program-synthesizer.cjs)  
**Test Suite:** [`tests/alive-neurosymbolic-program-synthesizer.test.cjs`](../tests/alive-neurosymbolic-program-synthesizer.test.cjs), [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs)  
**Artifacts:** [`docs/reports/alive-neurosymbolic-program-synthesizer-2026-11-09.json`](reports/alive-neurosymbolic-program-synthesizer-2026-11-09.json), [`docs/reports/alive-neurosymbolic-program-synthesizer-2026-11-09.svg`](reports/alive-neurosymbolic-program-synthesizer-2026-11-09.svg)

---

## 1. Executive Summary

Pass 33 implements a **Neuro-Symbolic DOM/API Extractor Program Synthesizer with Counterexample-Guided Inductive Synthesis (`CEGIS`) and Hoare/SMT Invariant Verification**:

1. **Typed Combinator DSL & Hoare Triple Verification ($\{P\}\; e \;\{Q\}$):**
   - Synthesizes total-function AST programs (`SelectRole`, `ProjectField`, `NormalizeCurrencyOrUnit`, `FilterPredicate`) that enforce 5 formal SMT-style invariants (`INV1_NON_DECOY_SAFETY`, `INV2_UNIT_CANONICALIZATION`, `INV3_TOTAL_FINITE_GUARD`, `INV4_INTERVAL_POSTCONDITION`, `INV5_SEMANTIC_SELECTOR_INVARIANCE`).
2. **CEGIS Counterexample Refinement Loop:**
   - Tests candidate neural sketches against adversarial mutation counterexamples (`cloaked_decoy_and_layout_drift`, `unit_scaling_and_null_poison`, `interval_bound_outlier_injection`) and refines AST combinators in `2.00` mean CEGIS iterations until zero counterexamples remain.
3. **5-Seed Statistical Verification (`19013`, `29017`, `39023`, `49031`, `59053`):**
   - Across 24 DOM/API extraction specifications per seed, `neurosymbolic-cegis-smt-synthesizer` achieves **`100.0 ± 0.0` composite score** (`+100.0` over `fragile-regex-xpath-scraper`, `+81.67` over `neural-sketch-no-cegis-verifier`, `+59.44` over `enumerative-bottom-up-untyped`), **`100.0%` SMT invariant soundness**, **`100.0%` adversarial mutation survival**, and **`100.0%` cloaked decoy rejection**.

---

## 2. 5-Seed Comparative Benchmark Summary

| Synthesis Profile | Composite Score (Mean ± 95% CI) | SMT Invariant Soundness (%) | Adversarial Holdout Survival (%) | Cloaked Decoy Rejection (%) | Mean CEGIS Steps |
| --- | --- | --- | --- | --- | --- |
| **`neurosymbolic-cegis-smt-synthesizer`** | **`100.00 ± 0.00`** | **`100.00%`** | **`100.00%`** | **`100.00%`** | **`2.00`** |
| `enumerative-bottom-up-untyped` | `40.56 ± 0.00` | `0.00%` | `44.44%` | `100.00%` | `6.00` |
| `neural-sketch-no-cegis-verifier` | `18.33 ± 0.00` | `0.00%` | `16.67%` | `50.00%` | `1.00` |
| `fragile-regex-xpath-scraper` | `0.00 ± 0.00` | `0.00%` | `0.00%` | `0.00%` | `1.00` |

---

## 3. Verification Commands

```powershell
node --test tests/alive-neurosymbolic-program-synthesizer.test.cjs tests/alive-fabric-visualizer.test.cjs
node scripts/alive-neurosymbolic-program-synthesizer.cjs
```
