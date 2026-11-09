# ALIVE Pass 74 Report (74/100) — `alive-pantheon-cross-attention-fusion-bus`

- **Phase**: Phase XIV: 14-Brain Multiverse Pantheon Deep Weight-and-Bias Upgrade
- **Winning Profile**: `pantheon_14brain_cross_attention_shapley_precision_bus`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 8.8685` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-pantheon-cross-attention-fusion-bus-2026-11-09.json`](../docs/reports/alive-pantheon-cross-attention-fusion-bus-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-pantheon-cross-attention-fusion-bus-2026-11-09.svg`](../docs/reports/alive-pantheon-cross-attention-fusion-bus-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `uniform_average_14brain_pooling_baseline` | Uniform 1/14 Average Pooling (No Cross-Attention / No Shapley Attribution) | **91.47** | `[88.7978, 94.1396]` |
| `single_winner_takes_all_14brain_ablation` | Winner-Take-All Argmax Single Brain Selection (Zero Ensemble Diversity) | **91.48** | `[88.8159, 94.149]` |
| `uncalibrated_cross_attention_no_shapley_ablation` | Cross-Attention Bus Without Epistemic Precision or Exact Shapley Efficiency | **91.31** | `[88.6193, 93.9965]` |
| `pantheon_14brain_cross_attention_shapley_precision_bus` | 14-Brain Cross-Attention Fusion Bus + Epistemic Precision + Shapley Attribution (Pass 74 Winner) | **100.00** | `[100, 100]` |
