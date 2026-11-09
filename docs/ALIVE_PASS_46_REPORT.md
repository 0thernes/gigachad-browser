# ALIVE Pass 46 Report — Pass 46 · Newton-Schulz 5-Step Quintic Orthogonalized Momentum (Muon) + AdamW Biases

**Pass ID:** `ALIVE-PASS-46-MUON-NEWTON-SCHULZ-OPTIMIZER`  
**Phase:** Phase IX — Second-Order & Matrix-Preconditioned Weight-and-Bias Optimizers  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `hybrid-muon-ns5-2d-weights-adamw-1d-biases` (`score = 100.00`, `+73.11` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `vanilla-sgd-no-preconditioner` | `26.8881 ± 0.2326` | Baseline/Ablation |
| `elementwise-adamw-2d-and-1d` | `71.2984 ± 0.1938` | Baseline/Ablation |
| `muon-on-all-tensors-including-1d-bias` | `67.2984 ± 0.1938` | Baseline/Ablation |
| `hybrid-muon-ns5-2d-weights-adamw-1d-biases` | `100.0000 ± 0.0000` | **WINNING** |
