# ALIVE Pass 43 Report — Pass 43 · Maximal Update Parameterization (muP) Width-Invariant Weight/Bias/LR Scaling

**Pass ID:** `ALIVE-PASS-43-MUP-MAXIMAL-UPDATE-PARAMETERIZATION`  
**Phase:** Phase VIII — Spectral, Orthogonal & Riemannian Weight-and-Bias Initialization & Parameter Conditioning  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `full-mup-width-invariant-weight-bias-lr-scaling` (`score = 100.00`, `+79.04` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `standard-parameterization-sp-no-width-scaling` | `20.9553 ± 0.3119` | Baseline/Ablation |
| `neural-tangent-kernel-ntk-lazy-regime` | `49.2128 ± 0.2599` | Baseline/Ablation |
| `partial-lr-scaling-without-output-readout-1overd` | `75.9702 ± 0.2079` | Baseline/Ablation |
| `full-mup-width-invariant-weight-bias-lr-scaling` | `100.0000 ± 0.0000` | **WINNING** |
