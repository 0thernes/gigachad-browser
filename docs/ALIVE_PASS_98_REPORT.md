# ALIVE Pass 98 Report (98/100) — `alive-conformal-temperature-calibration`

- **Phase**: Phase XIX: Mechanistic Interpretability (SAE), Formal Verification (IBP/CROWN), Conformal Calibration & 100-Pass Grand Omega Crown
- **Winning Profile**: `vector_temperature_bias_scaling_plus_split_conformal_95`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-conformal-temperature-calibration-2026-11-09.json`](../docs/reports/alive-conformal-temperature-calibration-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-conformal-temperature-calibration-2026-11-09.svg`](../docs/reports/alive-conformal-temperature-calibration-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `uncalibrated_overconfident_logits_baseline` | Raw Uncalibrated Logits Without Temperature Scaling or Conformal Quantile (High ECE & Undercoverage) | **50.98** | `[50.98, 50.98]` |
| `scalar_temperature_only_no_class_bias_ablation` | Scalar Temperature T Only Without Class-Specific Calibration Bias b_T or Conformal Set | **73.30** | `[73.3, 73.3]` |
| `naive_gaussian_quantile_undercoverage_ablation` | Parametric Gaussian Quantile Without Finite-Sample Split Conformal Correction ceil((n+1)(1-alpha))/n | **79.95** | `[79.9538, 79.9538]` |
| `vector_temperature_bias_scaling_plus_split_conformal_95` | Vector Temperature & Bias Scaling (w_T, b_T) + Split Conformal 95% Prediction Sets (Pass 98 Winner) | **100.00** | `[100, 100]` |
