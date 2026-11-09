# ALIVE Pass 78 Report (78/100) — `alive-rao-ballard-predictive-coding-net`

- **Phase**: Phase XV: Biologically Plausible Local Learning Rules & Energy-Based Brains
- **Winning Profile**: `rao_ballard_friston_precision_weighted_pcn_16step`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-rao-ballard-predictive-coding-net-2026-11-09.json`](../docs/reports/alive-rao-ballard-predictive-coding-net-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-rao-ballard-predictive-coding-net-2026-11-09.svg`](../docs/reports/alive-rao-ballard-predictive-coding-net-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `feedforward_only_no_iterative_inference_baseline` | Single-Pass Feedforward Only (No Iterative Variational Free-Energy Minimization) | **0.00** | `[0, 0]` |
| `pcn_fixed_identity_precision_noisy_channels_ablation` | Predictive Coding With Fixed Identity Precision Pi_l = I (Corrupted by Heteroscedastic Noise) | **90.47** | `[90.4729, 90.4729]` |
| `pcn_under_settled_2step_inference_ablation` | Predictive Coding With Only 2 Value-Node Relaxation Steps (Premature Weight Plasticity) | **73.10** | `[73.0995, 73.0995]` |
| `rao_ballard_friston_precision_weighted_pcn_16step` | Rao-Ballard / Friston Precision-Weighted PCN + 16-Step Variational Relaxation (Pass 78 Winner) | **100.00** | `[100, 100]` |
