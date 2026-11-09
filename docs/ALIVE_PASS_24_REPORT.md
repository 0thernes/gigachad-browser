# ALIVE Pass 24 Report — Ed25519 Signed Merkle-DAG Citation & Content-Addressed Archival Ledger across Ephemeral `.onion` & Clearnet Sources

**Date:** 2026-11-09  
**Pass:** 24 of 40 (Phase IV: Deep Onion Rendezvous, Pluggable Transports & Traffic-Analysis Defense)  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` ($\text{df}=4$, $t_{0.975,4}=2.7764$)

---

## 1. Executive Summary

Pass 24 implements and benchmarks the **Ed25519 Signed Merkle-DAG Citation & Content-Addressed Archival Ledger** in [`systems/alive-onion-merkle-provenance-ledger.js`](../systems/alive-onion-merkle-provenance-ledger.js), with live telemetry rendering in Section 30 (`#alive-fabric-onion-merkle`) of [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).

Across `5/5` independent seeds (`24` archival and provenance audit scenarios per seed = `120` scenarios total across `S1-live-valid-citation`, `S2-ephemeral-onion-offline-replay`, `S3-post-hoc-content-tamper`, and `S4-split-view-equivocation-attack`), `signed-merkle-dag-bft-provenance-ledger` achieves:
- **Merkle-DAG Provenance Composite Score:** `100.00 ± 0.00` (`+100.00` over `mutable-url-bookmark-only`, `+75.00` over `unverified-snapshot-cache`, `+16.67` over `hash-chain-no-equivocation-quorum`)
- **Offline `.onion` Replay Survival Rate (`503 HS_DESC_NOT_FOUND` Link-Rot):** `100.00%` (`6/6` offline `.onion` services replayed per seed)
- **Post-Hoc Bit-Flip / Content Tampering Rejection Rate:** `100.00%` (`6/6` tampered leaves rejected via $O(\log_2 N)$ Merkle inclusion proofs)
- **Multi-Circuit Split-View Equivocation & Forged Signature Detection Rate:** `100.00%` (`6/6` equivocations/forgeries quarantined per seed, `0` corrupted citations accepted)
- **Merkle Proof Verification Rate on Legitimate Citations:** `100.00%` (`12/12` legitimate citations verified per seed)

---

## 2. 5-Seed Quantitative Comparison

| Profile | Composite Score (Mean ± CI95) | Offline `.onion` Replay (%) | Tampered Content Reject (%) | Equivocation Detection (%) | Merkle Proof Verified (%) | Total Corrupted Accepted (5 Seeds) |
| --- | --- | --- | --- | --- | --- | --- |
| `mutable-url-bookmark-only` | `0.0000 ± 0.0000` | `0.0000%` | `0.0000%` | `0.0000%` | `0.0000%` | `60` |
| `unverified-snapshot-cache` | `25.0000 ± 0.0000` | `100.0000%` | `0.0000%` | `0.0000%` | `0.0000%` | `60` |
| `hash-chain-no-equivocation-quorum` | `83.3333 ± 0.0000` | `100.0000%` | `100.0000%` | `33.3333%` | `100.0000%` | `20` |
| **`signed-merkle-dag-bft-provenance-ledger`** | **`100.0000 ± 0.0000`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`100.0000%`** | **`0`** |

---

## 3. Artifacts & Verification

- **System Module:** [`systems/alive-onion-merkle-provenance-ledger.js`](../systems/alive-onion-merkle-provenance-ledger.js)
- **Visualizer Section 30:** [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js) (`#alive-fabric-onion-merkle`, `runOnionMerkleLedger`)
- **Artifact Generator:** [`scripts/alive-onion-merkle-provenance-ledger.cjs`](../scripts/alive-onion-merkle-provenance-ledger.cjs)
- **JSON Report:** [`docs/reports/alive-onion-merkle-provenance-ledger-2026-11-09.json`](reports/alive-onion-merkle-provenance-ledger-2026-11-09.json)
- **SVG Chart:** [`docs/reports/alive-onion-merkle-provenance-ledger-2026-11-09.svg`](reports/alive-onion-merkle-provenance-ledger-2026-11-09.svg)
- **Tests:** [`tests/alive-onion-merkle-provenance-ledger.test.cjs`](../tests/alive-onion-merkle-provenance-ledger.test.cjs) and [`tests/alive-fabric-visualizer.test.cjs`](../tests/alive-fabric-visualizer.test.cjs) (`33/33` passing)
