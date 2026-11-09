# ALIVE Pass 22 Report — Tor v3 `.onion` Equi-X Proof-of-Work (`rend-spec-v3` §3.4 / Proposal 327) & `x25519` Client Authorization Descriptor Decryption

**Date:** 2026-11-09  
**Pass:** 22 of 40 (Phase IV: Deep Onion Rendezvous, Pluggable Transports & Traffic-Analysis Defense)  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` ($\text{df}=4$, $t_{0.975,4}=2.7764$)

---

## 1. Executive Summary

Pass 22 implements and benchmarks **Tor v3 `.onion` Equi-X Proof-of-Work (`rend-spec-v3` §3.4 / Proposal 327) & `x25519` Client Authorization Descriptor Decryption** in [`systems/alive-onion-pow-client-auth.js`](../systems/alive-onion-pow-client-auth.js), with live telemetry rendering in Section 28 (`#alive-fabric-onion-pow`) of [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).

Across `5/5` independent seeds (`20` `.onion` v3 scenarios per seed = `100` scenarios total across `C1-public-onion-normal`, `C2-public-onion-ddos-flood`, `C3-private-x25519-onion-ddos`, and `C4-adversarial-tampered-descriptor`), `full-equix-pow-x25519-client-auth` achieves:
- **PoW + Client-Auth Composite Score:** `100.00 ± 0.00` (`+73.33` over `unauthenticated-no-pow`, `+48.33` over `client-auth-only-no-pow`, `+63.33` over `static-low-pow-no-mac-verify`)
- **Legitimate Rendezvous Establishment Rate:** `100.00%` (`15/15` legitimate services per seed)
- **Private `x25519` Descriptor Decryption Rate:** `100.00%` (`5/5` private services per seed)
- **Introduction-Point DDoS Priority Queue Admission Rate:** `100.00%` (`10/10` flooded services per seed at `suggested_effort ∈ [16..64]`, mean effort `34.4`, mean solve latency `8.071 ms`)
- **Adversarial Tampered `D_MAC` / Expired PoW Seed Rejection Rate:** `100.00%` (`0` forged descriptors accepted)

---

## 2. 5-Seed Quantitative Comparison

| Profile | Composite Score (Mean ± CI95) | Legit Rendezvous (%) | Private `x25519` Decrypt (%) | DDoS Queue Admission (%) | Tampered `D_MAC` Reject (%) | Mean Equi-X Effort | Mean Solve Time (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `unauthenticated-no-pow` | `26.6667 ± 0.0000` | `33.3333%` | `0.0000%` | `0.0000%` | `100.0000%` | `0.0` | `0.000` |
| `client-auth-only-no-pow` | `51.6667 ± 0.0000` | `33.3333%` | `100.0000%` | `0.0000%` | `100.0000%` | `0.0` | `0.000` |
| `static-low-pow-no-mac-verify` | `36.6667 ± 0.0000` | `33.3333%` | `100.0000%` | `0.0000%` | `0.0000%` | `1.0` | `0.350` |
| **`full-equix-pow-x25519-client-auth`** | **`100.0000 ± 0.0000`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`34.4`** | **`8.071`** |

---

## 3. Artifacts & Verification

- **System Module:** [`systems/alive-onion-pow-client-auth.js`](../systems/alive-onion-pow-client-auth.js)
- **Visualizer Section 28:** [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js) (`#alive-fabric-onion-pow`, `runOnionPowClientAuth`)
- **Artifact Generator:** [`scripts/alive-onion-pow-client-auth.cjs`](../scripts/alive-onion-pow-client-auth.cjs)
- **JSON Report:** [`docs/reports/alive-onion-pow-client-auth-2026-11-09.json`](reports/alive-onion-pow-client-auth-2026-11-09.json)
- **SVG Chart:** [`docs/reports/alive-onion-pow-client-auth-2026-11-09.svg`](reports/alive-onion-pow-client-auth-2026-11-09.svg)
- **Tests:** [`tests/alive-onion-pow-client-auth.test.cjs`](../tests/alive-onion-pow-client-auth.test.cjs) and [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs) (`32/32` passing)
