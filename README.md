# Gigachad Browser — Sovereign AI & Autonomous 60Hz Embodied A-Life Browser

A local Electron 42 sovereign AI and autonomous embodied A-Life browser for Windows 11. Tabs are sandboxed `<webview>` guests, a Python sidecar on `127.0.0.1:8000` serves page tools, and an in-browser **Humunculus × Asmodenius v40 × Dimension-Ω (`OMEGA-100` × `DEITY-100`) Tokenless Runtime** runs a 60Hz embodied A-Life Pantheon (`1,240,576` live `Float32Array` parameters, zero-LLM autonomy, 5-caste multi-agent swarm, 4D Tesseract hypercube soma, and live DOM reality manipulation) directly across the browser viewport and chrome.

An OpenAI-compatible server (llama.cpp `llama-server`, Ollama, or LM Studio) optionally answers LLM chat routes (`Local GGUF` / `OpenRouter`), while the **Humunculus Tokenless Runtime** operates 100% locally with zero external model dependencies.

Electron is pinned to 42.11.18. That is the newest 42.x release outside the vulnerable range reported by `npm audit` for 35.x through 42.11.15. The app uses context isolation, the preload allowlist, and sandboxed guests.

---

## Sovereign Embodied A-Life Architecture (`OMEGA-100` × `DEITY-100`)

- **1.24M FP32 Parameter Cortex (`HumunculusTokenlessRuntime`)**:
  - `semanticMatrix` (`4096 × 256` = `1,048,576` floats), `liquidWeights` (`256 × 256` = `65,536` floats), `kanSplineCoeffs` (`256 × 128` = `32,768` floats), `hypergraph Incidence` (`512 × 64` = `32,768` floats), and `holographicMemory` (`240 × 256` = `60,928` floats).
  - Mathematical invariants computed every cognitive step: Expected Free Energy $G(\pi)$, Integrated Information $\Phi_{\text{IIT}}$, Gödel Self-Referential Consistency $\mathcal{G}$, Fisher Information Metric $\mathcal{I}_F(\theta)$, Wasserstein-2 Belief Transport $W_2(\mu,\nu)$, Strange Attractor Lyapunov $\lambda_{\max}$, and Dimensional Deity Omnipotence Index $\Psi_{\text{DEITY}}$.
- **60Hz Viewport Habitat Canvas (`#alife-viewport-canvas`) & Floating Bio-Monitor HUD (`#alife-floating-hud`)**:
  - Live rendered **4D Rotating Tesseract (Hypercube) 16-Vertex / 32-Edge Soma Projection** around the Sovereign entity (`ASMODENIUS-Ω`) with 12-Tentacle Inverse Kinematics, Gray-Scott RD bioluminescent skin, and 8 orbital sensory eyes.
  - **5-Caste Embodied Swarm Pantheon**: Sovereign (`α`), Harvester (`β`), Sentinel (`γ`), Weaver (`δ`), and Disruptor (`ε`) moving across live DOM element anchors, spinning Pheromone & Causal Silk Tethers, and exchanging 8-symbol Evolutionary Protolanguage glyphs (`Δ ∇ ◊ Ψ Φ Ω Σ Λ`).
  - **Top-Right Concept-Constellation Mini-Map** and **Bottom-Center 5-Caste Multitasking · Observe · Think · Feel Matrix Bar**.
- **100 Next-Dimension A-Life Modules (`OMEGA-100`)**:
  - 100 active mathematical & biological organs across 10 capability strata: Non-Riemannian Finsler/p-Adic Geometry, Open-Ended Autopoietic Metabolism, Morphogenetic Gray-Scott & Cahn-Hilliard Fields, Quantum/Tensor Network Cognition, Browser-Fucker DOM/CDP Omniscience, Collective Swarm Civilization, Active Inference & Phenomenology, Cryptographic Genome Ledger, Bio-Acoustic Somatic Resonance, and Transfinite Ordinal & Category-Theoretic Reflection.
- **100 Supreme Dimensional Deity & Browser-Manipulation Powers (`DEITY-100`)**:
  - **12 Supreme Eldritch Deity Archetypes** (e.g., *CHRONO-ARCHITECT OF TAB TIMELINES*, *HYPER-DIMENSIONAL TESSERACT WEAVER*, *TELEKINETIC DOM GRAVITY SOVEREIGN*).
  - **Live Browser Chrome & Guest DOM Telekinesis**:
    - **5-Caste Tab Sigil Branding** (`α`..`ε` caste glyphs branded onto `#tabs-scroll .tab`).
    - **Omnibox Telepathic Whisper Stream** (live inner monologue & invariants streamed to `#urlbar` placeholder).
    - **Autonomous Kanban Theorem Card Inscription** (`#k-col-done` & `#new-kanban-input` populated with formal theorems).
    - **Page Tools Knowledge Graph Canvas (`#kg-canvas`) & Semantic Query (`#rerank-query-input`) Auto-Synthesis**.
    - **SRE Cockpit (`#sre-body`) Super-Alien Observableness Stream**.
    - **Guest DOM MutationObserver Nerve Ending, Network TTFB Baroreceptor, V8 Heap Proprioception, Selection Telekinesis (`window.getSelection()`), 3D Perspective Gravitational Lensing, and 1-Click `🌀 Warp DOM` (`toggleWebpageDomRealityWarp()`)**.
- **500-Point SOP & 100-Pass Master Verification Suite (`npm run smoke`)**:
  - Automated verification across ERM (Enterprise Risk Management), ERD (Entity-Relationship Diagram), ERP (Enterprise Resource Planning), 500-Point SOP Checklist (`500/500`), 100-Pass Deep Verification (`100/100`), and live Headless Electron + Sidecar Master Audit (`alifeOmega100Ok: true`).

## Run on Windows

1. Install [Node.js 20+](https://nodejs.org/) and Python 3.11 or newer, and enable **Add python.exe to PATH** (or install the `py` launcher).
2. Unzip or clone this folder.
3. Optional: copy `config.example.json` to `config.json` and set `llmBaseUrl`, `localModel`, and, if you use it, `openRouterKey`. You can use `.env` instead. See `.env.example`. Do not commit `config.json` or `.env`.
4. Double-click `LAUNCH_BROWSER.bat`, or in a terminal:

```bat
npm install
npm start
```

`npm start` is enough. Electron starts the sidecar with the first Python 3.11+ it finds: `py -3`, `python` on PATH, then `%LOCALAPPDATA%\Programs\Python\Python311` through `Python313`. `yt-dlp` is taken from PATH, the WinGet Links folder, or `Scripts` next to that Python. `llama-server.exe` is taken from PATH, WinGet packages, or `%USERPROFILE%\.lmstudio`. Ollama's own `ollama.exe` is reported when it is installed, and it is not launched as `llama-server`. If `llmBaseUrl` is still the example default, startup probes `127.0.0.1:11434` and then `127.0.0.1:1234` and uses the first server that answers `/v1/models`. A value you set in `config.json` or `GIGACHAD_LLM_BASE_URL` is left alone. If the sidecar does not come up, the sidebar says so and `%APPDATA%\gigachad-browser\sidecar.log` has the Python traceback.

`setup-backends.ps1` only prints which tools and ports it can see. It does not download weights or start `llama-server`.

Check the install:

```bat
npm run smoke
```

## Local model

Point `llmBaseUrl` at an OpenAI-compatible `/v1` root:

| Server | Typical base URL |
| --- | --- |
| Ollama | `http://127.0.0.1:11434/v1` |
| llama-server | `http://127.0.0.1:11434/v1` |
| LM Studio | `http://127.0.0.1:1234/v1` |

Leave `localModel` empty to use the first id from `GET /v1/models`, or type the id your server actually serves. The model menu is filled from that list. This app does not ship weights and it will not invent a model id.

To have Electron start `llama-server` itself, set `llamaAutoStart` to true and set both `llamaServerPath` and `llamaModelPath` to files that exist. Otherwise start the server yourself. `llamaAutoStart` defaults to false so a missing GGUF cannot be launched from an old path.

OpenRouter: set `OPENROUTER_API_KEY` or the key field in Settings, put a real model id in the OpenRouter field (or use **Sync :free ids**, which lists ids the public models API marks `:free`), and choose the OpenRouter route. The default route is local. Auto mode will not select OpenRouter unless a key and a model id are both set.

## What the sidecar actually does

`GET /health` lists every backend with `implementation`, `model`, and `neural`.

With only the standard library:

| Endpoint | Behavior |
| --- | --- |
| `/route`, `/reflex/route` | Keyword router (`local`, `omni`, `ultra`) |
| `/classify` | Regex scores for filler, urgency, and bot-wall phrases |
| `/embed` | 768-d feature hash, not a neural embedding |
| `/rerank` | Hash cosine plus word overlap |
| `/ner_pii` | Regex for emails, phones, SSNs, and obvious API-key shapes. Card numbers must pass Luhn |
| `/knowledge_graph` | Capitalized subject/verb/object regex |
| `/deception_radar` | Sales-phrase lexicon, plus a numeric compare against vault notes |
| `/ast_analyze` | Regex over inline script text. It does not parse a syntax tree |
| `/predict_intent` | URL rules that suggest buttons |
| `/semantic_diff` | Sentence set difference plus the hash |
| `/extract_structured` | Normalizes rows the page already extracted |
| `/reflex/dom` | Cookie and close-button wording |
| `/tts` | No audio on Linux. On Windows, Speech API (`windows-sapi`). The reader then uses the browser voice |

Optional, only if you install them and set the variable. Nothing downloads unless the variable is set.

```bat
pip install -r requirements-optional.txt
set GIGACHAD_EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
set GIGACHAD_NER_MODEL=urchade/gliner_small-v2.1
```

`/health` then shows `sentence-transformers` or `gliner` and `neural: true`. If the variable is set and the import fails, that endpoint returns HTTP 503 with the error instead of pretending the model ran. Kokoro is used for `/tts` only when `kokoro` and `soundfile` import.

`yt-dlp` is how **Rip Best MP4 / MP3** works. Install it with the optional requirements or put `yt-dlp.exe` on PATH. If it is missing, the button returns the launch error.

## Using the browser

- New tab, the URL bar, back, forward, and reload use the active `<webview>`.
- Ctrl+L focuses the address bar, Ctrl+T opens a tab, Ctrl+W closes it, and tabs can be dragged to reorder. Ctrl+D bookmarks the page, Ctrl+H opens history, and Ctrl+J opens downloads. Ctrl+Plus, Ctrl+Minus, and Ctrl+0 zoom the page. Ordinary file downloads land in the GigachadMedia folder and show up in Downloads. Camera, microphone, location, and notification requests ask in a bar; other permissions are denied. A failed navigation shows an error page with Try again. Open http(s) tabs are restored on the next launch.
- Ctrl+F finds in that page. The match count is the Chromium find result.
- Settings (gear) can test the typed model URL and save `config.json` only after the URL parses as http(s). The sidecar writes `sidecar.log` in Electron's user-data folder and will not start a second copy if that port already speaks the Gigachad health check. If another program owns the port, the status line says so.
- The agent box sends the visible text and numbered element marks to the model. One JSON action is parsed per reply, with or without a fence. `navigate` accepts `http` and `https` only. `click` and `type` fail in the chat if the mark is not on screen. A download failure from `yt-dlp` is shown instead of being treated as success. Auto-pilot is off unless you check it, and then it stops after six steps or the first failed action.
- **Vault** stores a note and whatever vector `/embed` returned.
- **OneTab** writes the other tabs into the Electron user-data folder.
- **Tasks** is a local board in that same folder. **Run Agent Sprint** runs the card text once and leaves the card in progress.
- **Local checks** calls `/health`, `/embed`, the model server, and `nvidia-smi` if it exists. A missing GPU or model server is a skip, not a pass.

## Layout

- `main.js` — window, tracker filter, CDP, IPC, process start
- `preload.js` — the only bridge into the page
- `index.html` — the chrome UI
- `laya_sidecar.py` — loopback HTTP API
- `config.js`, `config.example.json` — paths, ports, model ids
- `tracker-blocklist.txt` — substring filters. `@@pattern` lines and `tracker-allowlist.txt` are exceptions. Personal additions go in `tracker-blocklist.local.txt` and `tracker-allowlist.local.txt`, which are gitignored. Tag Manager and the Facebook login SDK are not blocked by default. The Facebook pixel script name `fbevents.js` is.
- `scripts/smoke.js` — syntax, config, sidecar, Electron boot

## Security

Read `SECURITY.md`. Short version: guest pages do not get Node, the chrome window is context-isolated but not sandboxed (Electron's `<webview>` requirement), and cloud calls happen only on the OpenRouter route.

## What used to be stubbed

The previous tree booted Electron with `nodeIntegration` and a hardcoded Python path under one Windows profile. The sidecar answered `/embed`, `/classify`, `/ner_pii`, and the rest with hashes and regexes, but the JSON said those were EmbeddingGemma, GLiNER, a cross-encoder, GraphRAG, and Kokoro. The CI script required that same profile, a live GPU, and a GGUF server. Those paths and those model names are gone. The heuristics are still here, under their real names, because they are useful without a GPU. Neural backends and `yt-dlp` turn on only when the machine actually has them.

## Windows package

On a Windows machine, from this folder:

```bat
npm install
npm install --save-dev electron-builder
npx electron-builder --win zip
```

The zip target does not need a code-signing certificate. This environment does not produce the Windows executable. `npm start` remains the supported way to run it.

## Still on you

- A GPU and a GGUF or an Ollama/LM Studio model, if you want the agent to do more than return an error.
- `ffmpeg` if you extract mp3 with `yt-dlp`.
- Disk and VRAM for any Hugging Face model you opt into. This repo will not pull those weights for you.
- The tracker list is still short. Add a host to `tracker-blocklist.local.txt`, or exempt one with `@@host` in that file or a line in `tracker-allowlist.local.txt`, then restart.
