# ALIVE Pass 52 Report — Pass 52 · Principal Singular Values/Vectors Adaptation (PiSSA) + Asymmetric LoRA+

**Pass ID:** `ALIVE-PASS-52-PISSA-SVD-LORA-PLUS-ADAPTER`  
**Phase:** Phase X — Low-Rank, Weight-Decomposed & Principal-Singular Parameter Adapters  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `pissa-topr-svd-plus-asymmetric-loraplus-lr` (`score = 100.00`, `+63.43` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `gaussian-a-zero-b-symmetric-lr` | `36.5676 ± 0.2586` | Baseline/Ablation |
| `residual-singular-components-milora` | `60.6364 ± 0.2155` | Baseline/Ablation |
| `pissa-svd-without-loraplus-asymmetric-lr` | `85.6357 ± 0.1188` | Baseline/Ablation |
| `pissa-topr-svd-plus-asymmetric-loraplus-lr` | `100.0000 ± 0.0000` | **WINNING** |
