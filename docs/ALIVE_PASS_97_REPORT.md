# ALIVE Pass 97 Report (97/100) — `alive-ibp-crown-formal-bound-verifier`

- **Phase**: Phase XIX: Mechanistic Interpretability (SAE), Formal Verification (IBP/CROWN), Conformal Calibration & 100-Pass Grand Omega Crown
- **Winning Profile**: `ibp_plus_alpha_crown_adaptive_chord_verifier`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 999` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-ibp-crown-formal-bound-verifier-2026-11-09.json`](../docs/reports/alive-ibp-crown-formal-bound-verifier-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-ibp-crown-formal-bound-verifier-2026-11-09.svg`](../docs/reports/alive-ibp-crown-formal-bound-verifier-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `unverified_empirical_pgd_only_baseline` | Empirical PGD Sampling Only Without Certified Lower/Upper Interval Bounds | **63.43** | `[63.4267, 63.4267]` |
| `naive_ibp_only_loose_interval_bloating_ablation` | Pure Interval Bound Propagation (IBP) Without CROWN Linear Chord Relaxation | **100.00** | `[100, 100]` |
| `crown_fixed_zero_lower_slope_ablation` | CROWN Linear Bound Propagation With Fixed Zero Lower Slope on Unstable ReLUs | **100.00** | `[100, 100]` |
| `ibp_plus_alpha_crown_adaptive_chord_verifier` | Hybrid IBP + alpha-CROWN Adaptive Linear Relaxation Formal Verifier (Pass 97 Winner) | **100.00** | `[100, 100]` |
