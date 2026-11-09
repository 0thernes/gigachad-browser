# ALIVE Pass 67 Report — Pass 67 · Causal Sinkhorn-Knopp Doubly-Stochastic Transport & SMEAR Soft-Merging

**Pass ID:** `ALIVE-PASS-67-SINKHORN-EXPERT-CHOICE-SOFT-MOE`  
**Phase:** Phase XIII — Sparse Mixture-of-Experts (DeepSeekMoE), Aux-Loss-Free Dynamic Bias Routing & Structured Sparsity  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `causal-sinkhorn-doubly-stochastic-smear-soft-moe` (`score = 100.00`, `+49.11` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `token-choice-topk-dropped-tokens` | `50.8885 ± 0.1504` | Baseline/Ablation |
| `expert-choice-non-causal-future-leak` | `72.6288 ± 0.1253` | Baseline/Ablation |
| `sinkhorn-routing-without-smear-weight-merge` | `93.3935 ± 0.1504` | Baseline/Ablation |
| `causal-sinkhorn-doubly-stochastic-smear-soft-moe` | `100.0000 ± 0.0000` | **WINNING** |
