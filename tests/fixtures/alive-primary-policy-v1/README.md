# Portable synthetic fixture

Six finite Float32 primary-policy views, eight alias paths, six separate backings, and their fixed independent expected catalog. Synthetic edge values include negative zero and a subnormal; frozen baselines intentionally differ from live weights.

The fixture files are exact byte copies of the public synthetic references listed in `manifest.json`. The manifest records the original repository-relative provenance path, byte length and SHA-256 for each file. Those paths are historical metadata only; tests read this directory and do not require `research_notes`.

No user profile, runtime genome or application source extract is included. Keep the binary and JSON fixture bytes unchanged when relocating them; review any change to their expected hashes explicitly. This fixture does not certify a complete model registry, startup integration or durable restart.
