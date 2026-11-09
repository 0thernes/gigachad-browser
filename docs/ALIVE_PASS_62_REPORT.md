# ALIVE Pass 62 Report — Pass 62 · Closed-Form Continuous-Time (CfC) & Spiking Liquid Time-Constant (sLTC)

**Pass ID:** `ALIVE-PASS-62-CFC-SLTC-LIQUID-TIME-CONSTANT`  
**Phase:** Phase XII — Kolmogorov-Arnold Networks (KAN), Liquid Time-Constant (sLTC) & Continuous-Depth Neural ODEs  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (24 episodes/seed, Student-$t$ 95% CI, $\text{df}=4$)  
**Winning Profile:** `cfc-closed-form-sltc-exponential-euler-hybrid` (`score = 100.00`, `+80.11` vs baseline)

## 5-Seed Profile Comparison

| Profile | Composite Score (Mean ± 95% CI) | Verified Across 5/5 Seeds |
| :--- | :---: | :---: |
| `explicit-forward-euler-ltc-stiff-blowup` | `19.8885 ± 0.1504` | Baseline/Ablation |
| `fixed-tau-leak-rnn-no-input-modulation` | `67.2988 ± 0.1254` | Baseline/Ablation |
| `semi-implicit-ltc-without-cfc-closed-form` | `90.7324 ± 0.0960` | Baseline/Ablation |
| `cfc-closed-form-sltc-exponential-euler-hybrid` | `100.0000 ± 0.0000` | **WINNING** |
