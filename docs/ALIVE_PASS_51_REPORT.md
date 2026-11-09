# ALIVE Pass 51 Report — Pass 51 · Weight-Decomposed Low-Rank Adaptation (DoRA) & Decoupled Task Biases

**Pass ID:** `ALIVE-PASS-51-DORA-WEIGHT-DECOMPOSED-ADAPTER`  
**Phase:** Phase X — Low-Rank, Weight-Decomposed & Principal-Singular Parameter Adapters  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `full-dora-magnitude-direction-bias-decoupled` (`score = 100.00`, `+66.58` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `standard-lora-coupled-magnitude-direction` | `65.8548 ± 0.1534` | Baseline/Ablation |
| `magnitude-only-scaling-without-lowrank-ba` | `33.4218 ± 0.1841` | Baseline/Ablation |
| `dora-without-task-bias-calibration` | `84.9478 ± 0.1227` | Baseline/Ablation |
| `full-dora-magnitude-direction-bias-decoupled` | `100.0000 ± 0.0000` | **WINNING** |
