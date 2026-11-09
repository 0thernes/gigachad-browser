# ALIVE Pass 49 Report — Pass 49 · Schedule-Free Polyak-Ruppert Primal-Dual Averager & Gradient Centralization

**Pass ID:** `ALIVE-PASS-49-SCHEDULE-FREE-PRIMAL-DUAL-AVERAGER`  
**Phase:** Phase IX — Second-Order & Matrix-Preconditioned Weight-and-Bias Optimizers  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `schedule-free-primal-dual-gradient-centralized` (`score = 100.00`, `+69.80` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `fixed-step-lr-without-schedule-or-averaging` | `30.1976 ± 0.2108` | Baseline/Ablation |
| `cosine-annealing-requiring-known-horizon-T` | `57.9430 ± 0.1757` | Baseline/Ablation |
| `naive-ema-post-hoc-weight-averaging` | `79.0184 ± 0.1406` | Baseline/Ablation |
| `schedule-free-primal-dual-gradient-centralized` | `100.0000 ± 0.0000` | **WINNING** |
