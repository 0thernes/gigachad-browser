# ALIVE Pass 11 Report — Tor Browser / Chromium / Electron Hybrid Process & Session Partition Architecture

**Date:** 2026-11-09  
**Benchmark ID:** `pass-11-tor-hybrid-mesh-session-isolation-v1`  
**Seeds:** `19013`, `29017`, `39023`, `49031`, `59053` (`df = 4`, two-sided Student-$t$ 95% confidence intervals)

## 1. Architectural Scope & Objective

Pass 11 initiates **Phase II (Passes 11–15: Chromium / Electron / Tor Browser Hybrid Synergy Mesh)** by building [`systems/alive-tor-hybrid-mesh.js`](../systems/alive-tor-hybrid-mesh.js) on top of [`systems/alive-tor-service.cjs`](../systems/alive-tor-service.cjs). It implements:

1. **Ephemeral First-Party-Domain (`FPD`) Session Partitioning**: Every top-level `.onion` or clearnet domain receives an isolated in-memory partition (`tor-ephemeral:<fpd>:e<identityEpoch>`) purged automatically on `rotateIdentityEpoch()`.
2. **`IsolateSOCKSAuth` Per-FPD Circuit Credentials**: Derives distinct cryptographic SOCKS5 credentials (`socksUsername = fpd-<sha256>`, `socksPassword = ep-<sha256>`) per First-Party Domain and identity epoch so Tor's `IsolateSOCKSAuth` guarantees separate circuits per top-level site (`5` distinct circuits for `5` distinct FPDs).
3. **Zero-Leak Remote DNS Resolution**: Enforces `hostResolverRules: "MAP * ~NOTFOUND , EXCLUDE 127.0.0.1"` so local OS DNS resolution is completely blocked.
4. **WebRTC Non-Proxied UDP Shield**: Enforces `webRTCIPHandlingPolicy: "disable_non_proxied_udp"`.
5. **Fail-Closed Daemon Readiness Gate**: Blocks all requests fail-closed (`blockedFailClosed: true`, `0` direct IP leaks) whenever the owned Tor client is not `bootstrapped: true`.

## 2. Five-Seed Empirical Results (`20` Security Probes / Seed across `5` FPDs)

| Architecture | Isolation Score (Mean ± SD) | FPD Isolation (%) | Fail-Closed (%) | Total Leaks | DNS Leaks | WebRTC Leaks | Direct IP Leaks | Storage Leaks | Circuit Collusions | Distinct FPD Circuits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shared-session-direct` | `0.00 ± 0.00` | `0.0%` | `0.0%` | `68.0` | `20.0` | `4.0` | `20.0` | `12.0` | `12.0` | `1.0` |
| `naive-socks-proxy-only` | `0.00 ± 0.00` | `0.0%` | `0.0%` | `52.0` | `20.0` | `4.0` | `4.0` | `12.0` | `12.0` | `1.0` |
| `partitioned-storage-no-socks-auth` | `0.00 ± 0.00` | `40.0%` | `0.0%` | `20.0` | `4.0` | `0.0` | `4.0` | `0.0` | `12.0` | `1.0` |
| **`full-tor-hybrid-synergy-mesh`** | **`100.00 ± 0.00`** | **`100.0%`** | **`100.0%`** | **`0.0`** | **`0.0`** | **`0.0`** | **`0.0`** | **`0.0`** | **`0.0`** | **`5.0`** |

## 3. Live Visual Telemetry Integration

- Added **Section 17 (`17 · Tor Hybrid Synergy Mesh — IsolateSOCKSAuth, FPD partitions & zero-leak policy (5 seeds)`)** (`#alive-fabric-tor-mesh`), the `Run Tor mesh` button, and `runTorHybridMesh()` to [`systems/alive-fabric-visualizer.js`](../systems/alive-fabric-visualizer.js).
- Artifacts written:
  - [`docs/reports/alive-tor-hybrid-mesh-2026-11-09.json`](reports/alive-tor-hybrid-mesh-2026-11-09.json)
  - [`docs/reports/alive-tor-hybrid-mesh-2026-11-09.svg`](reports/alive-tor-hybrid-mesh-2026-11-09.svg)
