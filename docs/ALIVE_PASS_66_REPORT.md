# ALIVE Pass 66 Report — Pass 66 · DeepSeekMoE Shared + Fine-Grained Experts & Aux-Loss-Free Dynamic Bias Routing

**Pass ID:** `ALIVE-PASS-66-DEEPSEEK-MOE-DYNAMIC-BIAS-ROUTER`  
**Phase:** Phase XIII — Sparse Mixture-of-Experts (DeepSeekMoE), Aux-Loss-Free Dynamic Bias Routing & Structured Sparsity  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `deepseek-moe-shared-plus-auxfree-dynamic-bias` (`score = 100.00`, `+62.43` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `top2-moe-no-load-balance-routing-collapse` | `37.5660 ± 0.2049` | Baseline/Ablation |
| `switch-aux-loss-gradient-interference` | `65.1757 ± 0.0742` | Baseline/Ablation |
| `fine-grained-moe-without-shared-expert-or-bias-step` | `78.9405 ± 0.0594` | Baseline/Ablation |
| `deepseek-moe-shared-plus-auxfree-dynamic-bias` | `100.0000 ± 0.0000` | **WINNING** |
