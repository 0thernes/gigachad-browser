# ALIVE Pass 69 Report — Pass 69 · SparseGPT Cholesky Inverse-Hessian 2:4 Pruning & Residual Bias Absorption

**Pass ID:** `ALIVE-PASS-69-SPARSEGPT-HESSIAN-PRUNING-2TO4`  
**Phase:** Phase XIII — Sparse Mixture-of-Experts (DeepSeekMoE), Aux-Loss-Free Dynamic Bias Routing & Structured Sparsity  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `sparsegpt-cholesky-hessian-2to4-bias-compensated` (`score = 100.00`, `+60.46` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `naive-magnitude-pruning-uncompensated` | `39.5369 ± 0.1606` | Baseline/Ablation |
| `wanda-weight-activation-norm-no-hessian-update` | `79.0246 ± 0.1070` | Baseline/Ablation |
| `sparsegpt-unstructured-without-2to4-bias-absorb` | `77.4384 ± 0.0803` | Baseline/Ablation |
| `sparsegpt-cholesky-hessian-2to4-bias-compensated` | `100.0000 ± 0.0000` | **WINNING** |
