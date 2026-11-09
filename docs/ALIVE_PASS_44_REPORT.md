# ALIVE Pass 44 Report — Pass 44 · Pre-RMSNorm + QK-Norm + ReZero Residual Gate & Affine Gain/Bias Conditioning

**Pass ID:** `ALIVE-PASS-44-RMSNORM-REZERO-RESIDUAL-CONDITIONING`  
**Phase:** Phase VIII — Spectral, Orthogonal & Riemannian Weight-and-Bias Initialization & Parameter Conditioning  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `pre-rmsnorm-qknorm-rezero-affine-conditioned` (`score = 100.00`, `+77.49` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `post-ln-unscaled-residual-branch` | `22.5130 ± 0.2515` | Baseline/Ablation |
| `pre-ln-without-qk-norm-or-rezero` | `65.9308 ± 0.2096` | Baseline/Ablation |
| `rezero-only-without-affine-rmsnorm` | `79.0087 ± 0.1677` | Baseline/Ablation |
| `pre-rmsnorm-qknorm-rezero-affine-conditioned` | `100.0000 ± 0.0000` | **WINNING** |
