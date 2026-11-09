# ALIVE Pass 77 Report (77/100) — `alive-equilibrium-propagation-energy-ising`

- **Phase**: Phase XV: Biologically Plausible Local Learning Rules & Energy-Based Brains
- **Winning Profile**: `centered_eqprop_symmetric_weights_pm_beta005`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 2768.7936` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-equilibrium-propagation-energy-ising-2026-11-09.json`](../docs/reports/alive-equilibrium-propagation-energy-ising-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-equilibrium-propagation-energy-ising-2026-11-09.svg`](../docs/reports/alive-equilibrium-propagation-energy-ising-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `asymmetric_weights_divergent_relaxation_baseline` | Asymmetric Weights W != W^T (Limit Cycles & Non-Gradient Energy Drift) | **23.82** | `[23.7427, 23.8955]` |
| `one_sided_nudge_first_order_bias_ablation` | One-Sided Nudge (+beta vs 0) With O(beta) First-Order Finite-Difference Bias | **88.22** | `[88.2208, 88.2208]` |
| `large_nudge_beta08_nonlinear_distortion_ablation` | Large Nudging Factor (beta=0.80) Inducing Higher-Order Curvature Distortion | **78.45** | `[78.4513, 78.4513]` |
| `centered_eqprop_symmetric_weights_pm_beta005` | Centered EqProp Symmetric Weights W=W^T + Two-Sided Nudging (+/-beta=0.05) (Pass 77 Winner) | **100.00** | `[100, 100]` |
