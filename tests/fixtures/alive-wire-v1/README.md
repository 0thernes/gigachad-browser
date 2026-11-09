# Portable synthetic fixture

Synthetic public wire payload with eleven typed-view representations, declared aliases and three scalar states; independent expected bytes and descriptor definition. This is format coverage, not runtime registry completeness.

The fixture files are exact byte copies of the public synthetic references listed in `manifest.json`. The manifest records the original repository-relative provenance path, byte length and SHA-256 for each file. Those paths are historical metadata only; tests read this directory and do not require `research_notes`.

No user profile, runtime genome or application source extract is included. Keep the binary and JSON fixture bytes unchanged when relocating them; review any change to their expected hashes explicitly. This fixture does not certify a complete model registry, startup integration or durable restart.
