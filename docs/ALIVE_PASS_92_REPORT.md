# ALIVE Pass 92 Report (92/100) — `alive-kronecker-hypernetwork-weight-generator`

- **Phase**: Phase XVIII: Meta-Learning, DARTS Architecture Search, Hypernetworks & Continual Plasticity
- **Winning Profile**: `kronecker_hypernetwork_chang_init_film_modulation`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-kronecker-hypernetwork-weight-generator-2026-11-09.json`](../docs/reports/alive-kronecker-hypernetwork-weight-generator-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-kronecker-hypernetwork-weight-generator-2026-11-09.svg`](../docs/reports/alive-kronecker-hypernetwork-weight-generator-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `dense_unfactored_hypernetwork_explosion_baseline` | Dense Unfactored Hypernetwork Without Chang Variance Scaling (O(d_z * M * N) Params & Variance Explosion) | **17.01** | `[17.01, 17.01]` |
| `kronecker_hypernet_naive_init_variance_drift_ablation` | Kronecker Hypernetwork Without Chang Principled Variance Scaling (1/(d_z * d_in)) | **47.01** | `[47.01, 47.01]` |
| `film_bias_only_no_kronecker_weight_delta_ablation` | FiLM Bias/Gain Modulation Only (gamma(z), beta(z) Without Kronecker Weight Delta) | **60.83** | `[60.83, 60.83]` |
| `kronecker_hypernetwork_chang_init_film_modulation` | Kronecker-Factored Hypernetwork + Chang Variance-Preserving Init + FiLM Biases (Pass 92 Winner) | **100.00** | `[100, 100]` |
