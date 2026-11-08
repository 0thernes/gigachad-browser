# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x (scaffold/PoC) | Yes |

## Reporting a vulnerability

Email **0_0@0thernes.art** with subject `SECURITY: chaos-entropy-art-engine`.
Please include reproduction steps and affected component (`poc/`, `core/`, CI).
You will receive an acknowledgement within 72 hours. Please do not open public
issues for unpatched vulnerabilities.

## Threat model notes (current stage)

- The engine renders **locally generated** content from numeric seeds; it does not
  fetch remote data, execute user-supplied code, or load untrusted model weights.
- Font files are the main external input. Malformed fonts are parsed by Pillow's
  FreeType bindings — keep Pillow updated; do not point the engine at untrusted fonts.
- Seeds are not secrets and carry no entropy guarantees; do **not** repurpose the
  sampler as a CSPRNG.
- Generated datasets may be redistributed as seed manifests; manifests contain no
  personal data by design.
