# ALIVE Pass 14 Report — Anti-Fingerprinting & Anonymity Hardening Matrix

**Date:** 2026-11-09  
**Benchmark ID:** `pass-14-tor-anti-fingerprinting-shield-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 14 implements the Tor Browser-grade anti-fingerprinting and cross-origin unlinkability shield ([`systems/alive-tor-fingerprint-shield.js`](../systems/alive-tor-fingerprint-shield.js)):

1. **Letterboxing Viewport Quantization (`quantizeLetterboxViewport`)**: Collapses diverse hardware display resolutions (`2560×1440@2x`, `1920×1080@1.25x`, `3024×1964@2x`, `3840×2160@1.5x`, etc.) into a uniform `1000×800@1.0x` letterboxed viewport bucket.
2. **100ms High-Resolution Timer Coarsening (`clampTimerPrecision`)**: Quantizes `performance.now()` timestamps to `100ms` quanta to defeat clock-skew and microarchitectural timing side channels.
3. **Uniform Navigator / WebGL / Font / HTTP Header Profile**: Normalizes `hardwareConcurrency = 2`, `deviceMemory = 4`, `WebGL = Mozilla-Standard-WebGL`, `Accept-Language = en-US,en;q=0.5`, and base font set (`32` fonts), reducing static hardware-identifying surface entropy across 6 distinct machines to `0.00` bits (`1` uniform anonymity set).
4. **Per-First-Party-Domain (`FPD`) + Per-Epoch Keyed Canvas / Audio Perturbation**: Perturbs Canvas/Audio readouts with a key derived from `(seed, firstPartyDomain, identityEpoch)` so third-party trackers embedded across multiple `.onion` and clearnet sites achieve `0.0%` cross-origin linkability (`100.0%` unlinkability).

## 2. Five-Seed Empirical Results (`24` Tracking Probes / Seed: `6` Hardware Machines $\times$ `4` First-Party Domains)

| Shield Profile | Anonymity Score (Mean ± SD) | Cross-Origin Unlinkability (%) | Cross-Origin Linkability (%) | Anonymity Set Uniformity (%) | Static Surface Entropy (Bits) | Distinct Static Surfaces |
| --- | --- | --- | --- | --- | --- | --- |
| `unprotected-native-chromium` | `0.00 ± 0.00` | `0.0%` | `100.0%` | `0.0%` | `2.585 bits` | `6 / 6` |
| `ua-header-spoof-only` | `0.00 ± 0.00` | `0.0%` | `100.0%` | `0.0%` | `2.585 bits` | `6 / 6` |
| `static-global-noise-injection` | `0.00 ± 0.00` | `0.0%` | `100.0%` | `0.0%` | `2.585 bits` | `6 / 6` |
| **`full-tor-letterbox-fpd-shield`** | **`100.00 ± 0.00`** | **`100.0%`** | **`0.0%`** | **`100.0%`** | **`0.000 bits`** | **`1 / 6`** |

## 3. Live Visual Telemetry Integration

- Added **Section 20 (`20 · Anti-fingerprinting & anonymity shield — letterboxing, 100ms timers & FPD canvas (5 seeds)`)** (`#alive-fabric-tor-shield`), the `Run Tor shield` button, and `runTorShield()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-tor-fingerprint-shield-2026-11-09.json`](reports/alive-tor-fingerprint-shield-2026-11-09.json)
  - [`docs/reports/alive-tor-fingerprint-shield-2026-11-09.svg`](reports/alive-tor-fingerprint-shield-2026-11-09.svg)
