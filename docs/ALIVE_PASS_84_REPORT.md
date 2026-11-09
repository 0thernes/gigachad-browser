# ALIVE Pass 84 Report (84/100) — `alive-dreamerv3-symlog-twohot-rssm`

- **Phase**: Phase XVI: Generative World Models, Optimal-Transport Flow Matching & Test-Time Training
- **Winning Profile**: `dreamerv3_symlog_twohot41_categorical_1pct_unimix`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 804424.0605` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-dreamerv3-symlog-twohot-rssm-2026-11-09.json`](../docs/reports/alive-dreamerv3-symlog-twohot-rssm-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-dreamerv3-symlog-twohot-rssm-2026-11-09.svg`](../docs/reports/alive-dreamerv3-symlog-twohot-rssm-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `raw_mse_critic_gaussian_rssm_baseline` | Raw Linear MSE Critic + Gaussian RSSM Without Symlog or 1% Unimix (Gradient Explosion Across Scales) | **6.19** | `[6.1885, 6.1892]` |
| `symlog_scalar_mse_no_twohot_bins_ablation` | Symlog Scalar Regression Without Two-Hot K=41 Distributional Bins | **88.86** | `[88.8625, 88.8625]` |
| `categorical_rssm_zero_unimix_kl_spike_ablation` | 32x32 Categorical RSSM With 0% Unimix (Deterministic One-Hot KL Divergence Spikes) | **61.19** | `[61.1885, 61.1892]` |
| `dreamerv3_symlog_twohot41_categorical_1pct_unimix` | DreamerV3 Symlog-Symexp K=41 Two-Hot Critic + 32x32 Categorical RSSM 1% Unimix (Pass 84 Winner) | **100.00** | `[100, 100]` |
