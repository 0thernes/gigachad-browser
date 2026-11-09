# ALIVE Pass 56 Report — Pass 56 · Mamba-2 Structured State-Space Duality (SSD) 1-Semiseparable Matrix & Softplus dt_bias

**Pass ID:** `ALIVE-PASS-56-MAMBA2-SSD-STATE-SPACE-DUALITY`  
**Phase:** Phase XI — Next-Generation Sequence & State-Space Neural Architectures  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `mamba2-ssd-1semiseparable-softplus-dt-bias` (`score = 100.00`, `+60.09` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `time-invariant-lti-s4-no-selective-gates` | `39.9108 ± 0.0891` | Baseline/Ablation |
| `mamba1-sequential-scan-no-ssd-block-gemm` | `78.1757 ± 0.0742` | Baseline/Ablation |
| `ssd-without-softplus-dt-bias-floor` | `85.9405 ± 0.0594` | Baseline/Ablation |
| `mamba2-ssd-1semiseparable-softplus-dt-bias` | `100.0000 ± 0.0000` | **WINNING** |
