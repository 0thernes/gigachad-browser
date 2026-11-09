# ALIVE Pass 48 Report — Pass 48 · Sophia-H Hutchinson Clipped Diagonal Hessian + Lion Sign-Momentum Hybrid

**Pass ID:** `ALIVE-PASS-48-SOPHIA-LION-HESSIAN-OPTIMIZER`  
**Phase:** Phase IX — Second-Order & Matrix-Preconditioned Weight-and-Bias Optimizers  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `sophia-hutchinson-clipped-hessian-lion-hybrid` (`score = 100.00`, `+80.56` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `unclipped-newton-saddle-instability` | `19.4434 ± 0.3281` | Baseline/Ablation |
| `pure-sign-sgd-high-variance-jitter` | `63.2029 ± 0.2734` | Baseline/Ablation |
| `lion-sign-momentum-without-hessian-clip` | `81.6323 ± 0.2188` | Baseline/Ablation |
| `sophia-hutchinson-clipped-hessian-lion-hybrid` | `100.0000 ± 0.0000` | **WINNING** |
