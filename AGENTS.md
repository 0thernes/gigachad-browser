# Gigachad Browser

Windows 11 is the target. Electron 35+ and Python 3.11+.

- `npm start` launches Electron. Electron starts `laya_sidecar.py` when Python is on PATH or `pythonPath` is set.
- Do not hardcode a user profile, model id, or API key. Use `config.example.json`, `config.json` (gitignored), or the environment variables in `.env.example`.
- The sidecar must label heuristic endpoints. Do not return a neural model name unless that package loaded.
- Guest pages stay in `<webview>` with node integration off. Chrome IPC goes through `preload.js`.
- `npm run smoke` checks config, the sidecar, and that Electron boots with the preload bridge.
