# Security Notes — Defensive Posture

This document describes the security model of the Chaos Entropy Art Engine:
what assets are worth protecting, where the trust boundaries are, the relevant
risk categories at this stage of the project, and the mitigations that are in
place or planned for each. The framing is protective — how we defend against
problems — not a guide to exploiting them.

---

## Assets to protect

| Asset | Why it matters |
|---|---|
| **Determinism contract** | The core product value. If an attacker or a dependency can silently alter `render(seed)`, published manifests become untrustworthy. |
| **The dev workstation and CI environment** | Compromised dependencies could inject bad code into releases or steal credentials. |
| **Consumer disk and CPU** | A misbehaving engine invoked with `--count 1_000_000_000` could exhaust disk or run indefinitely. |
| **System font files** | FreeType parses binary font data. A malformed font file is a known attack surface for the underlying library. |
| **No user data is processed** | The engine does not accept, store, or transmit user-provided content, so data-privacy risks are low at this stage. |

---

## Trust boundaries

```
[user / caller] -- CLI args + seed values --> [poc/glyph_engine.py]
                                                    |
                                  Pillow (FreeType) + NumPy
                                                    |
                                          [system font files]
                                                    |
                                           [local filesystem]
```

The engine operates entirely locally. It does not make network calls, does not
load model weights, and does not execute user-supplied code. The only external
inputs are: (1) integer seeds and CLI arguments from the caller, (2) font files
from known system directories.

---

## Risk categories and mitigations

### 1. Resource exhaustion — disk and CPU

**Risk:** a caller passing `--count 1_000_000_000` could fill a disk or run
for hours unattended without any warning.

**Mitigations in place:**
- The benchmark mode (`--benchmark`) renders entirely in memory, so it cannot
  exhaust disk regardless of `--count`.
- The `--out` directory is the user's explicit choice; the engine does not
  write anywhere else.

**Planned mitigations (T-RES):**
- Pre-flight disk-space estimate: before beginning a write run, compute
  `estimated_bytes = count × avg_png_size` (derived from a 10-image warm-up
  sample) and compare to `shutil.disk_usage(out).free`. Emit a `WARNING` log
  and optionally abort if estimated bytes exceed a configurable threshold
  (default: 90% of free space).
- A `--max-disk-gb` safety flag caps the maximum bytes written in a single run.
- CPU: no mitigation needed beyond wall-clock awareness; the engine is not a
  background daemon and does not bypass the OS scheduler.

### 2. Malformed font file parsing (FreeType attack surface)

**Risk:** FreeType has a history of memory-safety vulnerabilities in font
parsing. Pointing the engine at an untrusted or maliciously crafted `.ttf` /
`.otf` file could in principle trigger a vulnerability in the underlying C
library.

**Mitigations in place:**
- `_FONT_CANDIDATES` in `poc/glyph_engine.py` is a **frozen allow-list** of
  well-known system font paths. The engine only loads fonts from this list;
  it does not traverse directories or accept arbitrary font paths.
- The Pillow dependency is tracked by Dependabot (weekly), which surfaces
  Pillow security advisories that transitively cover FreeType.

**Planned mitigations:**
- When a `--font` CLI flag is added (planned for v1), it will require the
  user to explicitly opt in and will document that untrusted fonts are a
  risk. Adding a font file hash verification step is the preferred mitigation
  at that stage.
- Keep Pillow updated; FreeType vulnerabilities are typically patched promptly
  in Pillow releases.

### 3. Determinism-integrity attack (silent drift)

**Risk:** a dependency upgrade (Pillow, NumPy, FreeType) could silently change
rendered output for existing seeds, causing published manifests to become
inconsistent with what consumers regenerate.

**Mitigations in place:**
- The golden-seed digest test (T-002) pins SHA-256 of 100 canonical seeds'
  PNG output. A dependency upgrade that changes any digest fails CI, forcing
  an explicit engine version bump before the change can merge.
- CI runs the determinism test suite on every push, catching any code-level
  drift immediately.
- `space_hash` in manifests encodes the axis-table definitions. A consumer
  whose engine version's `space_hash` differs from the manifest's refuses to
  render, preventing silent dataset corruption.

### 4. Dependency supply chain

**Risk:** a compromised or malicious version of Pillow or NumPy on PyPI could
introduce malicious code into the render pipeline.

**Mitigations in place:**
- Dependabot monitors `poc/requirements.txt` weekly and opens PRs for updates.
- `pip-audit -r poc/requirements.txt` (wired into `make audit`) checks known
  vulnerabilities in installed packages.
- The project pins minimum versions (`pillow>=10.1`, `numpy>=1.26`) rather than
  exact hashes at this PoC stage; hash-pinning will be added for production use.

**Planned mitigations:**
- Pin exact hashes in a `requirements-lock.txt` for reproducible builds before
  the first external partner integration.
- Evaluate a private PyPI mirror or artifact cache for CI to reduce exposure
  to PyPI availability and integrity issues.

### 5. CI / GitHub Actions security

**Risk:** a malicious dependency PR or Actions workflow could exfiltrate
environment variables or write tampered artifacts.

**Mitigations in place:**
- All workflow files use `permissions: contents: read` at the top level —
  no workflow has more than read access unless a specific job requires it
  (CodeQL adds `security-events: write` scoped to that job only).
- `CODEOWNERS` ensures every PR requires a review from @0thernes.
- Dependabot is configured to cover `github-actions` as well as pip and cargo,
  so action version bumps get the same review process as code changes.
- No secrets are stored in the repository or in Actions environment variables
  beyond what GitHub itself requires for CI. Seeds are not secrets.

### 6. Seed values are not secret — and that is by design

Seeds are dataset coordinates. They are expected to be shared in manifests,
committed to `tests/fixtures/`, and published openly. Do not attempt to "hide"
images by keeping seeds secret — that is not a supported security model.
Anyone who obtains a seed and the engine version can reproduce the image.
This is a feature: it enables auditable, reproducible datasets.

---

## What this project does not protect against

- **Physical access to the developer machine** — out of scope for a local tool.
- **Watermarking or fingerprinting images for rights management** — out of scope
  at this stage; the seed *is* the provenance record.
- **Model training on generated data** — the engine does not control downstream
  use; the MIT licence governs redistribution.
