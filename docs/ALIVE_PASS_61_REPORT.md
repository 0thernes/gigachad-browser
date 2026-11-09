# ALIVE Pass 61 Report — Pass 61 · Kolmogorov-Arnold Chebyshev/B-Spline Edge-Weight Networks (KAN)

**Pass ID:** `ALIVE-PASS-61-KAN-KOLMOGOROV-ARNOLD-SPLINE-NET`  
**Phase:** Phase XII — Kolmogorov-Arnold Networks (KAN), Liquid Time-Constant (sLTC) & Continuous-Depth Neural ODEs  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `chebyshev-bspline-kan-with-silu-residual-weights` (`score = 100.00`, `+66.02` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `fixed-relu-mlp-node-activations` | `39.7408 ± 0.0891` | Baseline/Ablation |
| `naive-monomial-polynomial-edge-basis` | `33.9759 ± 0.1039` | Baseline/Ablation |
| `bspline-kan-without-silu-residual-branch` | `82.9405 ± 0.0594` | Baseline/Ablation |
| `chebyshev-bspline-kan-with-silu-residual-weights` | `100.0000 ± 0.0000` | **WINNING** |
