# ALIVE Pass 76 Report (76/100) — `alive-hinton-forward-forward-goodness`

- **Phase**: Phase XV: Biologically Plausible Local Learning Rules & Energy-Based Brains
- **Winning Profile**: `hinton_ff_l2norm_goodness_threshold_peer_bias`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 60.5571` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-hinton-forward-forward-goodness-2026-11-09.json`](../docs/reports/alive-hinton-forward-forward-goodness-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-hinton-forward-forward-goodness-2026-11-09.svg`](../docs/reports/alive-hinton-forward-forward-goodness-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `random_local_hebbian_no_goodness_threshold_baseline` | Unnormalized Local Hebbian Without Goodness Threshold theta_bias | **45.32** | `[42.8181, 47.8316]` |
| `ff_without_l2_direction_norm_information_leak_ablation` | Forward-Forward Without L2 Layer Normalization (Norm Magnitude Leaks to Next Layer) | **65.00** | `[65, 65]` |
| `ff_without_peer_normalization_dead_neurons_ablation` | Forward-Forward Without Peer-Normalization Homeostatic Bias (Dead Units) | **77.12** | `[76.8328, 77.4094]` |
| `hinton_ff_l2norm_goodness_threshold_peer_bias` | Hinton Forward-Forward + L2 Direction Norm + Adaptive Goodness Threshold + Peer Bias (Pass 76 Winner) | **100.00** | `[100, 100]` |
