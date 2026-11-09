# ALIVE Pass 72 Report (72/100) — `alive-pantheon-quantum-riemannian-hdc-weights`

- **Phase**: Phase XIV: 14-Brain Multiverse Pantheon Deep Weight-and-Bias Upgrade
- **Winning Profile**: `cayley_unitary_riemannian_hdc10240_koopman_brains_5to8`
- **Composite Score**: **100/100**
- **Paired Student-t vs Baseline (df=4)**: `t = 308.5802` (`p < 0.05` significant: `true`)
- **Seeds**: `19013, 29017, 39023, 49031, 59053` (`24` episodes/seed)
- **JSON Telemetry**: [`docs/reports/alive-pantheon-quantum-riemannian-hdc-weights-2026-11-09.json`](../docs/reports/alive-pantheon-quantum-riemannian-hdc-weights-2026-11-09.json)
- **SVG Visual**: [`docs/reports/alive-pantheon-quantum-riemannian-hdc-weights-2026-11-09.svg`](../docs/reports/alive-pantheon-quantum-riemannian-hdc-weights-2026-11-09.svg)

## Profile Ablation Matrix

| Profile ID | Description | Composite Mean | 95% Student-t CI |
| :--- | :--- | :---: | :---: |
| `non_unitary_euclidean_dense_brains_5to8_baseline` | Non-Unitary Complex + Euclidean Metric + Dense Low-D + Naive Linear Brains 5-8 | **47.56** | `[47.087, 48.0306]` |
| `cayley_unitary_no_riemannian_metric_ablation` | Cayley Unitary CQM Only (Flat Euclidean Metric / No Christoffel Geodesics) | **87.67** | `[87.2559, 88.0768]` |
| `no_hdc_kanerva_binding_ablation` | Cayley Unitary + Riemannian Metric Without 10,240-Bit HDC Kanerva Memory | **93.01** | `[92.9027, 93.1259]` |
| `cayley_unitary_riemannian_hdc10240_koopman_brains_5to8` | Cayley Unitary CQM + Riemannian Christoffel + 10,240-Bit HDC Kanerva + Koopman Spectral (Pass 72 Winner) | **100.00** | `[100, 100]` |
