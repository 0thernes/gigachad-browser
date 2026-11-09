# ALIVE Pass 68 Report — Pass 68 · Mixture-of-Depths (MoD) Static-Graph Top-K & Causal Threshold Bias Router

**Pass ID:** `ALIVE-PASS-68-MIXTURE-OF-DEPTHS-COMPUTE-ROUTER`  
**Phase:** Phase XIII — Sparse Mixture-of-Experts (DeepSeekMoE), Aux-Loss-Free Dynamic Bias Routing & Structured Sparsity  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `mod-static-graph-causal-threshold-bias-router` (`score = 100.00`, `+54.96` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `uniform-full-depth-no-skip-waste` | `45.0389 ± 0.1106` | Baseline/Ablation |
| `early-exit-global-threshold-variable-batch` | `57.2385 ± 0.2577` | Baseline/Ablation |
| `mod-topk-without-causal-autoregressive-predictor` | `75.0535 ± 0.1204` | Baseline/Ablation |
| `mod-static-graph-causal-threshold-bias-router` | `100.0000 ± 0.0000` | **WINNING** |
