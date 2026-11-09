# ALIVE Pass 79 Report (79/100) — `alive-modern-continuous-hopfield-ramsauer`

- **Phase**: Phase XV: Biologically Plausible Local Learning Rules & Energy-Based Brains
- **Winning Profile**: `ramsauer_modern_continuous_hopfield_beta24_prior_bias`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 107.6096` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-modern-continuous-hopfield-ramsauer-2026-11-09.json`](../docs/reports/alive-modern-continuous-hopfield-ramsauer-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-modern-continuous-hopfield-ramsauer-2026-11-09.svg`](../docs/reports/alive-modern-continuous-hopfield-ramsauer-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `classical_quadratic_hopfield_0138d_collapse_baseline` | Classical 1982 Quadratic Hopfield W = sum x_mu x_mu^T (0.138d Capacity Collapse) | **49.68** | `[48.385, 50.9814]` |
| `low_beta_metastable_superposition_ablation` | Modern Continuous Hopfield With Low Inverse Temperature (beta=0.5 Metastable Averaging) | **100.00** | `[100, 100]` |
| `no_associative_prior_bias_under_50pct_mask_ablation` | Modern Continuous Hopfield Without Associative Prior Bias b_prior Under 50% Masking | **91.47** | `[90.7469, 92.1957]` |
| `ramsauer_modern_continuous_hopfield_beta24_prior_bias` | Ramsauer Modern Continuous Hopfield (beta=36.0) + Associative Prior Bias (Pass 79 Winner) | **100.00** | `[100, 100]` |
