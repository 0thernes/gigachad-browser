# ALIVE Pass 45 Report — Phase VIII Weight & Bias Conditioning Acceptance Matrix (`W1`–`W10`)

**Pass ID:** `ALIVE-PASS-45-WEIGHT-CONDITIONING-PHASE8-AUDIT`  
**Verified Rows:** `10 / 10` (`100.0%`)  
**Phase VIII Frozen SHA-256 Digest:** `332a9a5b02688cce6d497ba2a140087549446f4b076df069e4ffa1fcbb821edc`

| Row ID | Pass | Threshold Criterion | Measured Mean ± 95% CI | Seeds | Status |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `W1-Stiefel-QR-Orthogonality-Fidelity` | Pass 41 | Orthogonality == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W2-Analytic-Chrono-And-Gate-Bias-Retention` | Pass 41 | Chrono Bias Retention == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W3-Stiefel-Superiority-Over-Naive-Init` | Pass 41 | Gain vs Naive >= +75.0 | `80.2300 ± 0.0000` | `5/5` | **PASS** |
| `W4-Power-Iteration-1Lipschitz-Compliance` | Pass 42 | 1-Lipschitz Compliance == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W5-Deep-Jacobian-Spectral-Radius-Stability` | Pass 42 | Spectral Deviation < 1e-6 | `0.0000 ± 0.0000` | `5/5` | **PASS** |
| `W6-MuP-Width-Invariant-ZeroShot-Transfer` | Pass 43 | muP Transfer == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W7-MuP-Feature-Evolution-Coordinate-Check` | Pass 43 | Optimal LR Shift == 0.0 | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W8-PreRMSNorm-ReZero-64Layer-Signal` | Pass 44 | 64-Layer Preservation == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W9-QKNorm-Effective-Rank-Retention` | Pass 44 | Rank Retention == 100% | `100.0000 ± 0.0000` | `5/5` | **PASS** |
| `W10-Runtime-Primary-Cortex-Hub-Weight-Programming` | Pass 45 | 13 Runtime Tensors Programmed | `13.0000 ± 0.0000` | `5/5` | **PASS** |
