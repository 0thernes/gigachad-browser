# ALIVE Pass 13 Report — RFC 7686 & Tor Rendezvous Spec v3 (`.onion`) Cryptographic Verifier & State Machine

**Date:** 2026-11-09  
**Benchmark ID:** `pass-13-rfc7686-onion-v3-cryptographic-verifier-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 13 implements the RFC 7686 and Tor Rendezvous Specification v3 (`rend-spec-v3.txt` §6) cryptographic `.onion` address codec and verifier ([`systems/alive-onion-v3-verifier.js`](../systems/alive-onion-v3-verifier.js)):

1. **56-Character Base32 Codec (`encodeOnionV3`, `verifyOnionV3Address`)**: Decodes the 35-byte (`280`-bit) payload into the `32`-byte Ed25519 master public key (`PUBKEY`), `2`-byte checksum (`CHECKSUM`), and `1`-byte version (`VERSION == 0x03`).
2. **Cryptographic `SHA3-256` Checksum Validation (`computeOnionV3Checksum`)**: Computes `TRUNCATE_2(SHA3-256(".onion checksum" || PUBKEY || 0x03))` and rejects any corrupted or typosquatted 56-character `.onion` address.
3. **Legacy v2 (16-char) Deprecation Block & RFC 7686 DNS Sinkhole**: Rejects deprecated 16-character v2 `.onion` addresses (`deprecated-v2-onion-rejected`) and guarantees `.onion` hostnames are never forwarded to clearnet DNS resolvers (`rfc7686Sinkholed: true`).
4. **HSDir Ed25519 Descriptor Signature Verification**: Rejects forged hidden service descriptors (`forged-hsdir-descriptor`) before `INTRODUCE1` / `RENDEZVOUS2` circuit establishment.

## 2. Five-Seed Empirical Results (`20` Candidates / Seed: `8` Valid v3, `4` Bad Checksum, `4` Deprecated v2, `4` Forged Descriptor)

| Verifier | Security Score (Mean ± SD) | Valid v3 Acceptance (%) | Adversarial Rejection (%) | False Positives | RFC 7686 DNS Leaks |
| --- | --- | --- | --- | --- | --- |
| `clearnet-dns-passthrough` | `0.00 ± 0.00` | `100.0%` | `0.0%` | `12.0` | `20.0` |
| `regex-length-56-only` | `12.00 ± 0.00` | `100.0%` | `33.3%` | `8.0` | `0.0` |
| `checksum-without-descriptor-sig` | `56.00 ± 0.00` | `100.0%` | `66.7%` | `4.0` | `0.0` |
| **`full-rfc7686-v3-onion-verifier`** | **`100.00 ± 0.00`** | **`100.0%`** | **`100.0%`** | **`0.0`** | **`0.0`** |

## 3. Live Visual Telemetry Integration

- Added **Section 19 (`19 · RFC 7686 & Tor v3 .onion cryptographic verifier — Ed25519 + SHA3-256 + HSDir sig (5 seeds)`)** (`#alive-fabric-onion-v3`), the `Run .onion v3` button, and `runOnionV3Verifier()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-onion-v3-verifier-2026-11-09.json`](reports/alive-onion-v3-verifier-2026-11-09.json)
  - [`docs/reports/alive-onion-v3-verifier-2026-11-09.svg`](reports/alive-onion-v3-verifier-2026-11-09.svg)
