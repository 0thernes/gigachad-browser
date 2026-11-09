# ALIVE Pass 47 Report — Pass 47 · Kronecker-Factored Approximate Curvature (K-FAC) Natural-Gradient Preconditioner

**Pass ID:** `ALIVE-PASS-47-KFAC-NATURAL-GRADIENT-PRECONDITIONER`  
**Phase:** Phase IX — Second-Order & Matrix-Preconditioned Weight-and-Bias Optimizers  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `tikhonov-damped-homogeneous-kfac-natural-gradient` (`score = 100.00`, `+64.44` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `diagonal-empirical-fisher-rmsprop` | `35.5641 ± 0.2104` | Baseline/Ablation |
| `undamped-kronecker-fisher-singular` | `49.1547 ± 0.2455` | Baseline/Ablation |
| `kfac-weight-only-without-homogeneous-bias-augment` | `77.0427 ± 0.1403` | Baseline/Ablation |
| `tikhonov-damped-homogeneous-kfac-natural-gradient` | `100.0000 ± 0.0000` | **WINNING** |
