# ALIVE Pass 31 Report — Variational Free-Energy Minimization ($\mathcal{F}$) & Epistemic-Pragmatic Expected Free Energy ($\mathcal{G}(\pi)$) Planner

**Date:** 2026-11-09  
**Phase:** Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry (Pass 31 of 40)  
**Module:** [`systems/alive-active-inference-free-energy.js`](../systems/alive-active-inference-free-energy.js)  
**CLI Runner:** [`scripts/alive-active-inference-free-energy.cjs`](../scripts/alive-active-inference-free-energy.cjs)  
**Test Suite:** [`tests/alive-active-inference-free-energy.test.cjs`](../tests/alive-active-inference-free-energy.test.cjs), [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs)  
**Artifacts:** [`docs/reports/alive-active-inference-free-energy-2026-11-09.json`](reports/alive-active-inference-free-energy-2026-11-09.json), [`docs/reports/alive-active-inference-free-energy-2026-11-09.svg`](reports/alive-active-inference-free-energy-2026-11-09.svg)

---

## 1. Executive Summary

Pass 31 initiates **Phase VI (Passes 31–35)** by implementing a Karl Friston POMDP Active Inference Engine for the ALIVE Browser's autonomous epistemic-pragmatic planning loop:

1. **Variational Free Energy ($\mathcal{F}(Q(s), o)$) Minimization:**
   $$\mathcal{F}(Q(s), o) = D_{\mathrm{KL}}\!\left(Q(s)\,\|\,P(s)\right) - \mathbb{E}_{Q(s)}\!\left[\ln P(o \mid s)\right] = D_{\mathrm{KL}}\!\left(Q(s)\,\|\,P(s \mid o)\right) - \ln P(o)$$
   Exact coordinate-ascent variational updates $Q^*(s) = \sigma(\ln D + \ln A(o, \cdot))$ guarantee strict monotonic reduction $\Delta\mathcal{F} = \mathcal{F}(Q^*, o) - \mathcal{F}(Q_0, o) \le 0$ across every observation (`0.7944 nats` mean VFE reduction).
2. **Expected Free Energy ($\mathcal{G}(\pi)$) Policy Selection:**
   $$\mathcal{G}(\pi) = \underbrace{\mathbb{E}_{Q(o \mid \pi)}\!\left[D_{\mathrm{KL}}\!\left(Q(s \mid \pi)\,\|\,Q(s \mid o, \pi)\right)\right]}_{\text{Ambiguity / Negative Epistemic Info Gain}} + \underbrace{D_{\mathrm{KL}}\!\left(Q(o \mid \pi)\,\|\,P^*(o)\right)}_{\text{Pragmatic Risk vs. Prior Preferences } C}$$
   Under high latent entropy $H(Q(s))$, the planner automatically selects an epistemic probe (`probe_diagnostic_cue`) that reduces ambiguity before committing to a terminal extraction policy.
3. **5-Seed Statistical Verification (`19013`, `29017`, `39023`, `49031`, `59053`):**
   - `full-vfe-efe-active-inference-planner` achieves **`100.0 ± 0.0` composite score** (`+70.0` over `greedy-pragmatic-no-epistemic`, `+70.0` over `pure-curiosity-no-preferences`, `+100.0` over `uncalibrated-dogmatic-prior`).

---

## 2. 5-Seed Comparative Benchmark Summary

| Policy Profile | Composite Score (Mean ± 95% CI) | VFE Monotonic Drop (%) | Mean $\Delta\mathcal{F}$ Drop (nats) | Epistemic Disambiguation (%) | Pragmatic Goal Convergence (%) |
| --- | --- | --- | --- | --- | --- |
| **`full-vfe-efe-active-inference-planner`** | **`100.00 ± 0.00`** | **`100.00%`** | **`0.7944 nats`** | **`100.00%`** | **`100.00%`** |
| `greedy-pragmatic-no-epistemic` | `30.00 ± 0.00` | `100.00%` | `0.7944 nats` | `0.00%` | `0.00%` |
| `pure-curiosity-no-preferences` | `30.00 ± 0.00` | `100.00%` | `0.7944 nats` | `100.00%` | `0.00%` |
| `uncalibrated-dogmatic-prior` | `0.00 ± 0.00` | `0.00%` | `0.0000 nats` | `0.00%` | `0.00%` |

---

## 3. Verification Commands

```powershell
node --test tests/alive-active-inference-free-energy.test.cjs tests/alive-fabric-visualizer.test.cjs
node scripts/alive-active-inference-free-energy.cjs
```
