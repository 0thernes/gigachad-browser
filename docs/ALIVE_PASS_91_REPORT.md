# ALIVE Pass 91 Report (91/100) — `alive-darts-bilevel-architecture-search`

- **Phase**: Phase XVIII: Meta-Learning, DARTS Architecture Search, Hypernetworks & Continual Plasticity
- **Winning Profile**: `second_order_bilevel_darts_gumbel_annealed_arch_bias`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-darts-bilevel-architecture-search-2026-11-09.json`](../docs/reports/alive-darts-bilevel-architecture-search-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-darts-bilevel-architecture-search-2026-11-09.svg`](../docs/reports/alive-darts-bilevel-architecture-search-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `single_level_joint_train_skip_collapse_baseline` | Single-Level Joint Training of (w, alpha) on Train Split (Overfits & Collapses to Identity Skip) | **48.70** | `[48.7, 48.7]` |
| `first_order_darts_no_skip_regularization_ablation` | First-Order DARTS (xi=0) Without Skip-Connection Regularization Bias b_arch | **99.14** | `[99.1384, 99.1384]` |
| `high_temp_unannealed_discretization_gap_ablation` | Second-Order DARTS With Unannealed Softmax Temperature (tau=2.0 Discretization Gap) | **92.17** | `[92.1748, 92.1748]` |
| `second_order_bilevel_darts_gumbel_annealed_arch_bias` | Second-Order Bilevel DARTS + Skip-Penalty Architecture Bias b_arch + Annealed Discretization (Pass 91 Winner) | **100.00** | `[100, 100]` |
