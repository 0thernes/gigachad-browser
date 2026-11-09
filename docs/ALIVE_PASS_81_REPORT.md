# ALIVE Pass 81 Report (81/100) — `alive-ijepa-vjepa-ema-world-predictor`

- **Phase**: Phase XVI: Generative World Models, Optimal-Transport Flow Matching & Test-Time Training
- **Winning Profile**: `ijepa_vjepa_cosine_ema_vicreg_mask_bias`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-ijepa-vjepa-ema-world-predictor-2026-11-09.json`](../docs/reports/alive-ijepa-vjepa-ema-world-predictor-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-ijepa-vjepa-ema-world-predictor-2026-11-09.svg`](../docs/reports/alive-ijepa-vjepa-ema-world-predictor-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `pixel_space_mse_autoencoder_baseline` | Pixel-Space MSE Reconstruction Autoencoder (High-Frequency Noise Overfitting) | **49.68** | `[49.68, 49.68]` |
| `shared_encoder_no_ema_representation_collapse_ablation` | Shared Online/Target Weights (tau=0 No EMA -> Constant Representation Collapse) | **27.00** | `[27, 27]` |
| `jepa_without_mask_positional_bias_ablation` | I-JEPA Without Conditioned Spatial/Temporal Mask-Token Positional Bias b_mask_pos | **85.09** | `[85.095, 85.095]` |
| `ijepa_vjepa_cosine_ema_vicreg_mask_bias` | I-JEPA/V-JEPA Cosine EMA Target (tau=0.996) + VICReg Variance Floor + Mask Positional Bias (Pass 81 Winner) | **100.00** | `[100, 100]` |
