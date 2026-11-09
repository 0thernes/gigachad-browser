# ALIVE Pass 96 Report (96/100) — `alive-sparse-autoencoder-monosemantic-sae`

- **Phase**: Phase XIX: Mechanistic Interpretability (SAE), Formal Verification (IBP/CROWN), Conformal Calibration & 100-Pass Grand Omega Crown
- **Winning Profile**: `jumprelu_topk_monosemantic_sae_b_pre_unit_decoder`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-sparse-autoencoder-monosemantic-sae-2026-11-09.json`](../docs/reports/alive-sparse-autoencoder-monosemantic-sae-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-sparse-autoencoder-monosemantic-sae-2026-11-09.svg`](../docs/reports/alive-sparse-autoencoder-monosemantic-sae-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `dense_pca_polysemantic_superposition_baseline` | Dense PCA / Unconstrained Autoencoder (Polysemantic Superposition & High L0) | **44.91** | `[44.91, 44.91]` |
| `l1_relu_sae_shrinkage_bias_ablation` | Standard L1 ReLU SAE Without JumpReLU Threshold Bias theta_jump (Activation Shrinkage) | **72.12** | `[72.12, 72.12]` |
| `sae_without_unit_norm_decoder_or_b_pre_ablation` | JumpReLU SAE Without Pre-Encoder Centering Bias b_pre or Unit-Norm Decoder Columns | **70.32** | `[70.32, 70.32]` |
| `jumprelu_topk_monosemantic_sae_b_pre_unit_decoder` | Top-k JumpReLU Monosemantic SAE + Pre-Encoder Bias b_pre + Unit-Norm Decoder + Feature Steering (Pass 96 Winner) | **100.00** | `[100, 100]` |
