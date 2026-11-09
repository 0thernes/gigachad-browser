# ALIVE Pass 83 Report (83/100) — `alive-ttt-test-time-training-fast-weights`

- **Phase**: Phase XVI: Generative World Models, Optimal-Transport Flow Matching & Test-Time Training
- **Winning Profile**: `ttt_fast_weights_token_adaptive_eta_layernorm`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-ttt-test-time-training-fast-weights-2026-11-09.json`](../docs/reports/alive-ttt-test-time-training-fast-weights-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-ttt-test-time-training-fast-weights-2026-11-09.svg`](../docs/reports/alive-ttt-test-time-training-fast-weights-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `frozen_weights_zero_test_time_adaptation_baseline` | Frozen Weights W_fast_0 (Zero Inner-Loop Gradient Descent at Test Time) | **0.00** | `[0, 0]` |
| `fixed_large_inner_lr_instability_ablation` | Fixed Large Inner-Loop Learning Rate (eta=0.95 Without Token-Dependent Gate b_eta) | **71.21** | `[71.1298, 71.286]` |
| `ttt_without_layernorm_residual_drift_ablation` | TTT-Linear Without Residual LayerNorm Stabilization on Fast-Weight Output | **79.17** | `[79.1172, 79.2223]` |
| `ttt_fast_weights_token_adaptive_eta_layernorm` | TTT-Linear/MLP Fast Weights + Token-Adaptive Learning-Rate Bias b_eta + LayerNorm (Pass 83 Winner) | **100.00** | `[100, 100]` |
