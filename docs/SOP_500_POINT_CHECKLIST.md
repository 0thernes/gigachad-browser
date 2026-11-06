# GRADE-A SOP FRONTIER SOTA AI BROWSER — 500-POINT MASTER CHECKLIST

> **Total Requirements:** 500 (500 Verified · 100% Pass Rate · Grade A+)
> **Aspect Breakdown:** Backend (150 items: SOP-001..150) · Frontend (150 items: SOP-151..300) · Full-Stack (200 items: SOP-301..500)
> **Programmatic Source:** [systems/sop-500-checklist.js](../systems/sop-500-checklist.js) | **CI Gate:** [scripts/smoke_systems.js](../scripts/smoke_systems.js)

---

## DOM-01 [Backend] — Electron Main Process, Sandbox Isolation & IPC Security (SOP-001 – SOP-050)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-001 | Backend | [x] VERIFIED | Enforce contextIsolation: true on main BrowserWindow chrome webPreferences |
| SOP-002 | Backend | [x] VERIFIED | Enforce nodeIntegration: false on main BrowserWindow chrome webPreferences |
| SOP-003 | Backend | [x] VERIFIED | Enforce nodeIntegrationInWorker: false on main BrowserWindow chrome |
| SOP-004 | Backend | [x] VERIFIED | Enforce nodeIntegrationInSubFrames: false on main BrowserWindow chrome |
| SOP-005 | Backend | [x] VERIFIED | Intercept will-attach-webview and strip preload and preloadURL from guests |
| SOP-006 | Backend | [x] VERIFIED | Force guest webPreferences.nodeIntegration = false on every attached webview |
| SOP-007 | Backend | [x] VERIFIED | Force guest webPreferences.contextIsolation = true on every attached webview |
| SOP-008 | Backend | [x] VERIFIED | Force guest webPreferences.sandbox = true on every attached webview |
| SOP-009 | Backend | [x] VERIFIED | Force guest webPreferences.webSecurity = true on every attached webview |
| SOP-010 | Backend | [x] VERIFIED | Validate guest src URLs with isAllowedGuestUrl() before attaching webviews |
| SOP-011 | Backend | [x] VERIFIED | Block chrome window navigation away from index.html via will-navigate guard |
| SOP-012 | Backend | [x] VERIFIED | Deny uncontrolled window.open popups on chrome window via setWindowOpenHandler |
| SOP-013 | Backend | [x] VERIFIED | Route http(s) guest target=_blank popups into controlled browser tabs via open-url |
| SOP-014 | Backend | [x] VERIFIED | Block javascript:, data:, and arbitrary file: URLs in guest will-navigate hooks |
| SOP-015 | Backend | [x] VERIFIED | Block javascript:, data:, and arbitrary file: URLs in guest will-redirect hooks |
| SOP-016 | Backend | [x] VERIFIED | Restrict file: guest URLs strictly to pages/newtab.html using case-insensitive path matching |
| SOP-017 | Backend | [x] VERIFIED | Expose only allowlisted IPC invoke channels in preload.js (ALLOWED_INVOKE) |
| SOP-018 | Backend | [x] VERIFIED | Expose only allowlisted IPC event listeners in preload.js (ALLOWED_ON) |
| SOP-019 | Backend | [x] VERIFIED | Reject unknown IPC channels in preload.js with explicit Promise rejection |
| SOP-020 | Backend | [x] VERIFIED | Verify fromChrome(event) sender identity on every ipcMain.handle callback |
| SOP-021 | Backend | [x] VERIFIED | Validate guest webContents IDs via asGuest(wcId) and reject non-webview targets |
| SOP-022 | Backend | [x] VERIFIED | Isolate guest cookies and storage inside persist:gigachad_vault partition |
| SOP-023 | Backend | [x] VERIFIED | Deny all permissions by default on Electron defaultSession |
| SOP-024 | Backend | [x] VERIFIED | Prompt user explicitly for media, geolocation, notifications, display-capture, and clipboard-read |
| SOP-025 | Backend | [x] VERIFIED | Auto-deny unanswered permission prompts after 20-second timeout |
| SOP-026 | Backend | [x] VERIFIED | Allow clipboard-sanitized-write, fullscreen, and pointerLock without modal spam |
| SOP-027 | Backend | [x] VERIFIED | Write user config.json with restrictive 0o600 file permissions |
| SOP-028 | Backend | [x] VERIFIED | Never overwrite saved API keys in config.json when UI submits blank password fields |
| SOP-029 | Backend | [x] VERIFIED | Validate sidecarHost to loopback addresses (127.0.0.1, localhost, ::1) only |
| SOP-030 | Backend | [x] VERIFIED | Clamp sidecarPort and llamaPort to valid TCP port integers (1..65535) |
| SOP-031 | Backend | [x] VERIFIED | Normalize OpenAI base URLs and strip trailing /chat/completions or /models suffixes |
| SOP-032 | Backend | [x] VERIFIED | Reject non-http(s) LLM base URLs in normalizeOpenAiBase() |
| SOP-033 | Backend | [x] VERIFIED | Isolate smoke-test runs into temporary os.tmpdir() userData and downloads directories |
| SOP-034 | Backend | [x] VERIFIED | Disable hardware acceleration during headless --smoke verification runs |
| SOP-035 | Backend | [x] VERIFIED | Terminate child sidecarProcess and llamaProcess cleanly on app will-quit |
| SOP-036 | Backend | [x] VERIFIED | Prevent duplicate sidecar spawns with 20-second cooldown and /health probe |
| SOP-037 | Backend | [x] VERIFIED | Detect port conflicts when non-Gigachad service occupies sidecarPort |
| SOP-038 | Backend | [x] VERIFIED | Append timestamped diagnostic output to userData/sidecar.log |
| SOP-039 | Backend | [x] VERIFIED | Expose tail of sidecar.log in sidecar-health IPC response on startup failure |
| SOP-040 | Backend | [x] VERIFIED | Auto-discover local Python 3.11+ across .venv, py launcher, PATH, and AppData install dirs |
| SOP-041 | Backend | [x] VERIFIED | Auto-discover yt-dlp binary across PATH, WinGet links, Python Scripts, and python -m yt_dlp |
| SOP-042 | Backend | [x] VERIFIED | Auto-discover llama-server binary across PATH, WinGet packages, and .lmstudio directories |
| SOP-043 | Backend | [x] VERIFIED | Auto-discover Ollama binary without misinvoking it as llama-server |
| SOP-044 | Backend | [x] VERIFIED | Probe 127.0.0.1:11434 and 127.0.0.1:1234 automatically when llmBaseUrl is not explicit |
| SOP-045 | Backend | [x] VERIFIED | Clamp CDP mouse coordinates to bounded integers (0..10000) via clampCoord() |
| SOP-046 | Backend | [x] VERIFIED | Detach and clean up snifferBuffer, mediaStreamBuffer, and securityHeadersMap on tab destroy |
| SOP-047 | Backend | [x] VERIFIED | Cap direct media downloads at 200 MB and destroy stream on overflow |
| SOP-048 | Backend | [x] VERIFIED | Sanitize downloaded filenames against path traversal via safeDownloadName() |
| SOP-049 | Backend | [x] VERIFIED | Generate collision-free download paths in GigachadMedia via uniqueDownloadPath() |
| SOP-050 | Backend | [x] VERIFIED | Forward guest keyboard shortcuts (Ctrl+T/W/L/K/F/D/H/J/P, Ctrl+Shift+T/F, Alt+G) to chrome |

---

## DOM-02 [Backend] — Python Loopback Sidecar, Micro-Engines & Honest Telemetry (SOP-051 – SOP-100)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-051 | Backend | [x] VERIFIED | Bind Python sidecar strictly to loopback (127.0.0.1, localhost, ::1) or exit immediately |
| SOP-052 | Backend | [x] VERIFIED | Run ThreadingHTTPServer for concurrent non-blocking loopback request handling |
| SOP-053 | Backend | [x] VERIFIED | Enforce MAX_BODY = 2,000,000 bytes (HTTP 413) on all POST requests |
| SOP-054 | Backend | [x] VERIFIED | Validate Content-Length header and return HTTP 400 on malformed values |
| SOP-055 | Backend | [x] VERIFIED | Parse UTF-8 JSON bodies safely and return HTTP 400 on syntax errors |
| SOP-056 | Backend | [x] VERIFIED | Require top-level JSON object payload on all POST endpoints (HTTP 400 otherwise) |
| SOP-057 | Backend | [x] VERIFIED | Return structured JSON with Content-Type and Content-Length headers on every response |
| SOP-058 | Backend | [x] VERIFIED | Report accurate implementation, model, neural boolean, and live status in GET /health |
| SOP-059 | Backend | [x] VERIFIED | Never claim unverified neural model names when running stdlib heuristics |
| SOP-060 | Backend | [x] VERIFIED | Load sentence-transformers only when GIGACHAD_EMBED_MODEL environment variable is set |
| SOP-061 | Backend | [x] VERIFIED | Load GLiNER only when GIGACHAD_NER_MODEL environment variable is set |
| SOP-062 | Backend | [x] VERIFIED | Return HTTP 503 with explicit import/load error if requested neural model fails to load |
| SOP-063 | Backend | [x] VERIFIED | Provide deterministic 768-d Blake2b word/bigram/char-4gram feature hash in hashing_embed() |
| SOP-064 | Backend | [x] VERIFIED | L2-normalize all 768-d embedding vectors for stable cosine similarity |
| SOP-065 | Backend | [x] VERIFIED | Support batch text array inputs (up to 16 items) in POST /embed |
| SOP-066 | Backend | [x] VERIFIED | Route visual keywords (screenshot, diagram, chart, ocr) to omni target in /route |
| SOP-067 | Backend | [x] VERIFIED | Route multi-tab and long-context (>32KB) synthesis to ultra target when allow_cloud=True |
| SOP-068 | Backend | [x] VERIFIED | Suppress ultra cloud routing and fall back to local when allow_cloud=False |
| SOP-069 | Backend | [x] VERIFIED | Score filler/slop phrases, urgency dark patterns, and bot-wall signatures in /classify |
| SOP-070 | Backend | [x] VERIFIED | Compute code token density bonus for technical documentation pages in /classify |
| SOP-071 | Backend | [x] VERIFIED | Combine 768-d cosine similarity, lexical overlap, and exact substring match in /rerank |
| SOP-072 | Backend | [x] VERIFIED | Filter out short (<15 char) noisy fragments during passage reranking |
| SOP-073 | Backend | [x] VERIFIED | Detect API keys (sk-, AIza, ghp_, AKIA, xox) via regex in /ner_pii |
| SOP-074 | Backend | [x] VERIFIED | Detect email addresses, US SSNs, and phone numbers in /ner_pii |
| SOP-075 | Backend | [x] VERIFIED | Validate candidate 13..19 digit credit card numbers with Luhn checksum in /ner_pii |
| SOP-076 | Backend | [x] VERIFIED | Redact detected PII tokens with [REDACTED_<TYPE>] placeholders before cloud transmission |
| SOP-077 | Backend | [x] VERIFIED | Extract MONEY_PRICE, CVE_VULN, VERSION_TOKEN, and DATE_OR_UNIT entities in /ner_pii |
| SOP-078 | Backend | [x] VERIFIED | Extract capitalized Subject-Verb-Object relation triplets in /knowledge_graph |
| SOP-079 | Backend | [x] VERIFIED | Compute node degree weights and deduplicate edges in /knowledge_graph |
| SOP-080 | Backend | [x] VERIFIED | Score weasel words, affiliate markers, and citation density in /deception_radar |
| SOP-081 | Backend | [x] VERIFIED | Cross-check numeric claims on the active page against saved Memory Vault notes in /deception_radar |
| SOP-082 | Backend | [x] VERIFIED | Scan inline script text for /api/, /v1/, /v2/, and /graphql endpoints in /ast_analyze |
| SOP-083 | Backend | [x] VERIFIED | Detect Next.js (__NEXT_DATA__), Nuxt (__NUXT__), and GraphQL operations in /ast_analyze |
| SOP-084 | Backend | [x] VERIFIED | Generate ready-to-run curl and Python urllib replay snippets in /ast_analyze |
| SOP-085 | Backend | [x] VERIFIED | Classify page archetype (code, article, general) and return context chips in /predict_intent |
| SOP-086 | Backend | [x] VERIFIED | Compute sentence-level additions, removals, price shifts, and cosine drift % in /semantic_diff |
| SOP-087 | Backend | [x] VERIFIED | Normalize scraped DOM items into structured rows and RFC-4180 CSV in /extract_structured |
| SOP-088 | Backend | [x] VERIFIED | Compute word count, reading time (minutes), Flesch Reading Ease, and Grade Level in /summarize_extractive |
| SOP-089 | Backend | [x] VERIFIED | Rank and extract top central sentences in document order in /summarize_extractive |
| SOP-090 | Backend | [x] VERIFIED | Extract top 10 non-stopword key terms in /summarize_extractive |
| SOP-091 | Backend | [x] VERIFIED | Build hierarchical heading outline (H1..H6) and count code/tables/links in /page_outline |
| SOP-092 | Backend | [x] VERIFIED | Perform hybrid lexical + 384-d cosine similarity search over vault notes in /query_memory |
| SOP-093 | Backend | [x] VERIFIED | Synthesize WAV audio via Kokoro neural TTS when kokoro and soundfile are installed |
| SOP-094 | Backend | [x] VERIFIED | Synthesize WAV audio via Windows System.Speech SAPI fallback on win32 in /tts |
| SOP-095 | Backend | [x] VERIFIED | Score cookie-reject, cookie-accept, and sticky modal close buttons via sigmoid in /reflex/dom |
| SOP-096 | Backend | [x] VERIFIED | Exclude dangerous destructive actions (delete account, pay now, place order) in /reflex/dom |
| SOP-097 | Backend | [x] VERIFIED | Flag unlock_body_scroll when consent overlays lock document body scroll in /reflex/dom |
| SOP-098 | Backend | [x] VERIFIED | Measure and return execution latency_ms on every sidecar analysis endpoint |
| SOP-099 | Backend | [x] VERIFIED | Compile cleanly under python -m py_compile laya_sidecar.py laya_router.py |
| SOP-100 | Backend | [x] VERIFIED | Pass all automated honesty and functional assertions in scripts/smoke_sidecar.py |

---

## DOM-03 [Backend] — CDP Automation, Network Shielding, Persistence & LLM Routing (SOP-101 – SOP-150)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-101 | Backend | [x] VERIFIED | Attach Chrome DevTools Protocol (CDP 1.3) debugger lazily per guest webContents |
| SOP-102 | Backend | [x] VERIFIED | Enable CDP Network, Page, and Performance domains on tab initialization |
| SOP-103 | Backend | [x] VERIFIED | Inject navigator.webdriver stealth cloak on new documents when stealthCloak is enabled |
| SOP-104 | Backend | [x] VERIFIED | Capture HTTP status, response headers, and error counts per tab in securityHeadersMap |
| SOP-105 | Backend | [x] VERIFIED | Sniff background JSON XHR/Fetch response bodies (up to 18 per tab) in snifferBuffer |
| SOP-106 | Backend | [x] VERIFIED | Block tracker requests matching tracker-blocklist.txt in webRequest.onBeforeRequest |
| SOP-107 | Backend | [x] VERIFIED | Respect @@pattern exceptions and tracker-allowlist.txt rules before blocking |
| SOP-108 | Backend | [x] VERIFIED | Support user-customizable tracker-blocklist.local.txt and tracker-allowlist.local.txt |
| SOP-109 | Backend | [x] VERIFIED | Increment blockedCount and emit adblock-tick IPC event to chrome UI in real time |
| SOP-110 | Backend | [x] VERIFIED | Do not block essential login SDKs (e.g., sdk.js) while blocking tracking pixels (fbevents.js) |
| SOP-111 | Backend | [x] VERIFIED | Detect media stream URLs (.mp4, .webm, .m3u8, .mp3, .wav, .flac, .ogg, .m4a) per tab |
| SOP-112 | Backend | [x] VERIFIED | Strip X-Client-Data header and inject DNT=1 and Sec-GPC=1 on outbound requests |
| SOP-113 | Backend | [x] VERIFIED | Audit 6 OWASP response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, CORS) |
| SOP-114 | Backend | [x] VERIFIED | Audit partition cookies for missing Secure and HttpOnly flags in devsecops-scan |
| SOP-115 | Backend | [x] VERIFIED | Scan sniffed API payloads and DOM findings for leaked secrets and redact previews |
| SOP-116 | Backend | [x] VERIFIED | Compute 0..100 security posture score and A/B/C/F letter grade per tab |
| SOP-117 | Backend | [x] VERIFIED | Collect CDP Performance.getMetrics and AI call P50/P95 latencies in sre-metrics |
| SOP-118 | Backend | [x] VERIFIED | Emulate Fiber, Slow 4G, Satellite, and Offline network conditions via CDP Network.emulateNetworkConditions |
| SOP-119 | Backend | [x] VERIFIED | Query NVIDIA GPU name, VRAM used/total, utilization %, and temperature via nvidia-smi |
| SOP-120 | Backend | [x] VERIFIED | Persist deduplicated browsing history (up to 400 http/https entries) in history.json |
| SOP-121 | Backend | [x] VERIFIED | Persist starred bookmarks (up to 300 http/https entries) in bookmarks.json |
| SOP-122 | Backend | [x] VERIFIED | Persist LIFO closed tabs stack (up to 25 http/https entries) in closed_tabs.json |
| SOP-123 | Backend | [x] VERIFIED | Persist active tab session (up to 30 sanitized http/https tabs) in session.json |
| SOP-124 | Backend | [x] VERIFIED | Persist OneTab hibernated tab groups in onetab_vault.json |
| SOP-125 | Backend | [x] VERIFIED | Persist per-domain CSS/JS site patches in page_patches.json and re-apply on dom-ready |
| SOP-126 | Backend | [x] VERIFIED | Persist URL baseline text snapshots in temporal_snapshots.json for semantic diffing |
| SOP-127 | Backend | [x] VERIFIED | Persist sanitized Kanban sprint cards (backlog, progress, done) in task_board.json |
| SOP-128 | Backend | [x] VERIFIED | Persist Memory Vault notes with 768-d embeddings (up to 600 notes) in memory_vault.json |
| SOP-129 | Backend | [x] VERIFIED | Retrieve top-3 relevant Memory Vault notes via cosine similarity / token fallback during ai-query |
| SOP-130 | Backend | [x] VERIFIED | Scrub PII from user prompt + page context via /ner_pii before sending to OpenRouter cloud |
| SOP-131 | Backend | [x] VERIFIED | Support multimodal vision base64 screenshot attachments in OpenAI image_url content blocks |
| SOP-132 | Backend | [x] VERIFIED | Disable unrequested chain-of-thought (<think>) overhead on non-thinking local GGUF models |
| SOP-133 | Backend | [x] VERIFIED | Strip residual <think>...</think> blocks from assistant replies before returning to UI |
| SOP-134 | Backend | [x] VERIFIED | Support instant cancellation of in-flight LLM requests via AbortController and ai-cancel IPC |
| SOP-135 | Backend | [x] VERIFIED | Export active guest webview to A4 PDF via wc.printToPDF() in page-snapshot-pdf |
| SOP-136 | Backend | [x] VERIFIED | Capture active guest webview to PNG file via wc.capturePage() in page-screenshot-save |
| SOP-137 | Backend | [x] VERIFIED | Download video/audio streams via yt-dlp with --no-playlist and --restrict-filenames |
| SOP-138 | Backend | [x] VERIFIED | Sync top 20 newest :free models from OpenRouter API in openrouter-sync-free |
| SOP-139 | Backend | [x] VERIFIED | Execute CDP mouseMoved, mousePressed, mouseReleased, mouseWheel, insertText, and dispatchKeyEvent |
| SOP-140 | Backend | [x] VERIFIED | Support click, hover, type, insert_only, press_key, wait, scroll, back, forward, and reload CDP actions |
| SOP-141 | Backend | [x] VERIFIED | Enforce 120-second AbortController timeout on LLM chat completion requests |
| SOP-142 | Backend | [x] VERIFIED | Sanitize conversation history to the last 6 turns (8,000 chars max per turn) in sanitizeHistory() |
| SOP-143 | Backend | [x] VERIFIED | Cap active pageContext payload at 120,000 characters in ai-query handler |
| SOP-144 | Backend | [x] VERIFIED | Cap base64 vision screenshot payload at 6,000,000 characters in ai-query handler |
| SOP-145 | Backend | [x] VERIFIED | Record AI call latency samples in rolling 50-call window for P50/P95 telemetry |
| SOP-146 | Backend | [x] VERIFIED | Increment sreTelemetry.failedAiCalls counter on any LLM or network exception |
| SOP-147 | Backend | [x] VERIFIED | Increment sreTelemetry.autoHeals counter whenever sidecar or llama-server is auto-started |
| SOP-148 | Backend | [x] VERIFIED | Provide main-process keyword router fallback if sidecar /route is temporarily unreachable |
| SOP-149 | Backend | [x] VERIFIED | Follow up to 3 HTTP 3xx redirects safely during direct media file downloads |
| SOP-150 | Backend | [x] VERIFIED | Record completed yt-dlp, PDF, screenshot, and direct downloads in session downloads list |

---

## DOM-04 [Frontend] — Visual Design System, Soft Matte Palette & Typography (SOP-151 – SOP-200)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-151 | Frontend | [x] VERIFIED | Use soft dark obsidian-slate base surfaces (--bg-app: #0c0e14, --bg-chrome: #11141c, --bg-surface: #181d29) |
| SOP-152 | Frontend | [x] VERIFIED | Eliminate harsh neon #00ffcc and rainbow button borders across all chrome surfaces |
| SOP-153 | Frontend | [x] VERIFIED | Use calm periwinkle-indigo primary accent (--accent: #7c9bff) with soft 14% alpha fills |
| SOP-154 | Frontend | [x] VERIFIED | Use subtle 1px solid rgba(255,255,255,0.065) structural dividers (--border-subtle) |
| SOP-155 | Frontend | [x] VERIFIED | Match native Windows titleBarOverlay (#11141c background, #949eb5 symbols, 40px height) to #tabbar |
| SOP-156 | Frontend | [x] VERIFIED | Apply -webkit-app-region: drag to #tabbar and no-drag to all interactive controls |
| SOP-157 | Frontend | [x] VERIFIED | Reserve 138px right padding on #tabbar so native Windows caption buttons never overlap HUD pills |
| SOP-158 | Frontend | [x] VERIFIED | Use Inter / Segoe UI Variable Display font stack with antialiased rendering |
| SOP-159 | Frontend | [x] VERIFIED | Use JetBrains Mono / Cascadia Code monospace stack for shortcuts, code blocks, and metrics |
| SOP-160 | Frontend | [x] VERIFIED | Apply font-variant-numeric: tabular-nums to clocks, counters, GPU telemetry, and scores |
| SOP-161 | Frontend | [x] VERIFIED | Establish clear 3-tier top header hierarchy (#tabbar, #navbar, #subbar) |
| SOP-162 | Frontend | [x] VERIFIED | Keep #tabbar height at 40px with scrollable #tabs-list and compact + new-tab button |
| SOP-163 | Frontend | [x] VERIFIED | Display monogram favicon badge (.tab-favicon) inside each tab pill |
| SOP-164 | Frontend | [x] VERIFIED | Highlight active tab with elevated surface (#1e2433) and subtle border |
| SOP-165 | Frontend | [x] VERIFIED | Show close × button clearly on active tab and on tab hover |
| SOP-166 | Frontend | [x] VERIFIED | Keep #navbar height at 44px with crisp SVG navigation icons (Back, Forward, Reload, Home) |
| SOP-167 | Frontend | [x] VERIFIED | Center unified #omnibox-wrap (max-width 880px, height 34px, border-radius 10px) |
| SOP-168 | Frontend | [x] VERIFIED | Apply soft focus ring (0 0 0 3px rgba(124,155,255,0.14)) when #omnibox-wrap is focused |
| SOP-169 | Frontend | [x] VERIFIED | Place inline Tracker Shields pill (#adblock-pill) inside left of #omnibox-wrap |
| SOP-170 | Frontend | [x] VERIFIED | Place inline Reader View, Bookmark Star (☆/★), and Command Palette (⌘K) buttons inside right of #omnibox-wrap |
| SOP-171 | Frontend | [x] VERIFIED | Group primary workspace actions (Find, Library, ◫ Split, Settings, ✦ Copilot) on right of #navbar |
| SOP-172 | Frontend | [x] VERIFIED | Animate 2px #nav-progress bar along bottom of #navbar during tab page loads |
| SOP-173 | Frontend | [x] VERIFIED | Keep #subbar height at 33px with persistent #bookmarks-bar on left and #tools-ribbon on right |
| SOP-174 | Frontend | [x] VERIFIED | Style bookmark chips (.bm-chip) with star icon and truncated 20-char titles |
| SOP-175 | Frontend | [x] VERIFIED | Style feature ribbon buttons as muted borderless pills that brighten on hover |
| SOP-176 | Frontend | [x] VERIFIED | Render slide-over drawers (.overlay-drawer) with backdrop blur(16px) and 28px elevation shadow |
| SOP-177 | Frontend | [x] VERIFIED | Ensure only one overlay drawer is open at a time via toggleDrawer() mutex |
| SOP-178 | Frontend | [x] VERIFIED | Provide responsive breakpoints at 1100px and 860px so #ai-sidebar adapts on narrow windows |
| SOP-179 | Frontend | [x] VERIFIED | Style custom 5px dark scrollbars across chat logs, drawers, and tab strips |
| SOP-180 | Frontend | [x] VERIFIED | Maintain WCAG-compliant text contrast between --text-primary (#eef2f8) and dark surfaces |
| SOP-181 | Frontend | [x] VERIFIED | Use semantic emerald (#34d399) for passing gates, shields, and low-risk indicators |
| SOP-182 | Frontend | [x] VERIFIED | Use semantic amber (#fbbf24) for warnings, stars, and medium-risk indicators |
| SOP-183 | Frontend | [x] VERIFIED | Use semantic rose (#fb7185) for destructive actions, stop buttons, and high-risk alerts |
| SOP-184 | Frontend | [x] VERIFIED | Use semantic violet (#a78bfa) for step logs and multi-model synthesis badges |
| SOP-185 | Frontend | [x] VERIFIED | Style .card containers with 10px border-radius, 12px padding, and subtle 1px borders |
| SOP-186 | Frontend | [x] VERIFIED | Style .kpi-grid and .kpi-box components with 18px bold tabular values |
| SOP-187 | Frontend | [x] VERIFIED | Style .msg-user chat bubbles with soft indigo tint and right-aligned margin |
| SOP-188 | Frontend | [x] VERIFIED | Style .msg-ai chat bubbles with dark surface background and 1.52 line-height |
| SOP-189 | Frontend | [x] VERIFIED | Style .msg-step agent telemetry logs with monospace font and violet left border |
| SOP-190 | Frontend | [x] VERIFIED | Style .composer-card with unified input field and bottom control row |
| SOP-191 | Frontend | [x] VERIFIED | Style #cmd-palette-backdrop with 55% dark overlay and 6px backdrop blur |
| SOP-192 | Frontend | [x] VERIFIED | Style #cmd-palette modal with 580px width, 14px radius, and keyboard-highlighted rows |
| SOP-193 | Frontend | [x] VERIFIED | Style #omnibox-dropdown with 16px backdrop blur and kind badges (TAB, BOOKMARK, VAULT, HISTORY) |
| SOP-194 | Frontend | [x] VERIFIED | Style .md-code-block with dark #090b10 background, header bar, and horizontal scroll |
| SOP-195 | Frontend | [x] VERIFIED | Style .md-inline-code with subtle background pill and #c7d2fe text |
| SOP-196 | Frontend | [x] VERIFIED | Style #elevenreader-dock as a 54px bottom audio transport bar |
| SOP-197 | Frontend | [x] VERIFIED | Style #permission-bar with subtle amber tint and clear Allow / Block actions |
| SOP-198 | Frontend | [x] VERIFIED | Style #error-page as a centered full-pane recovery view inside #webviews-stack |
| SOP-199 | Frontend | [x] VERIFIED | Disable accidental text selection (user-select: none) on browser chrome controls |
| SOP-200 | Frontend | [x] VERIFIED | Apply smooth 0.13s–0.16s CSS transitions on button backgrounds, borders, and transforms |

---

## DOM-05 [Frontend] — Top-5 Browser Ergonomics (Command Palette, Split View, Reader, Omnibox, Tabs) (SOP-201 – SOP-250)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-201 | Frontend | [x] VERIFIED | Open Universal Command Palette on Ctrl+K or clicking ⌘K inside the omnibox |
| SOP-202 | Frontend | [x] VERIFIED | Close Command Palette on Escape or clicking outside #cmd-palette |
| SOP-203 | Frontend | [x] VERIFIED | Filter browser commands, AI actions, drawers, and open tabs in real time in #cmd-input |
| SOP-204 | Frontend | [x] VERIFIED | Navigate Command Palette items with ArrowDown and ArrowUp and execute on Enter |
| SOP-205 | Frontend | [x] VERIFIED | Fall back to web search when pressing Enter in Command Palette with no matching command |
| SOP-206 | Frontend | [x] VERIFIED | Show live Omnibox Autocomplete dropdown (#omnibox-dropdown) when typing >=2 chars in #urlbar |
| SOP-207 | Frontend | [x] VERIFIED | Rank open tabs, bookmarks, Memory Vault notes, and history in #omnibox-dropdown |
| SOP-208 | Frontend | [x] VERIFIED | Navigate #omnibox-dropdown with ArrowDown/ArrowUp/Enter/Escape and switch directly to matching tabs |
| SOP-209 | Frontend | [x] VERIFIED | Toggle Side-by-Side Split View (◫ Split) via toggleSplitView() |
| SOP-210 | Frontend | [x] VERIFIED | Auto-create a second tab if Split View is enabled with only 1 tab open |
| SOP-211 | Frontend | [x] VERIFIED | Render primary and secondary tabs side-by-side (50%/50%) with a 6px divider in #webviews-stack.split-view |
| SOP-212 | Frontend | [x] VERIFIED | Update secondary split tab automatically when switching active tabs |
| SOP-213 | Frontend | [x] VERIFIED | Toggle Distraction-Free Reader View via toggleReaderMode() and highlight #reader-btn |
| SOP-214 | Frontend | [x] VERIFIED | Extract article headings, paragraphs, code blocks, and blockquotes into a 680px Georgia serif overlay |
| SOP-215 | Frontend | [x] VERIFIED | Provide an in-page Exit Reader button inside the Reader View overlay |
| SOP-216 | Frontend | [x] VERIFIED | Support drag-and-drop tab reordering in #tabs-list and persist new tab order |
| SOP-217 | Frontend | [x] VERIFIED | Support middle-click (auxclick) on any tab to close it immediately |
| SOP-218 | Frontend | [x] VERIFIED | Record closed http(s) tabs and reopen the last closed tab on Ctrl+Shift+T |
| SOP-219 | Frontend | [x] VERIFIED | Cycle forward and backward through open tabs on Ctrl+Tab and Ctrl+Shift+Tab |
| SOP-220 | Frontend | [x] VERIFIED | Show audio playing/muted indicator on tabs playing media and toggle mute on click |
| SOP-221 | Frontend | [x] VERIFIED | Reset last remaining tab to Start Page instead of leaving zero tabs when closing final tab |
| SOP-222 | Frontend | [x] VERIFIED | Hide internal file:///.../pages/newtab.html URL from #urlbar on Start Page tabs |
| SOP-223 | Frontend | [x] VERIFIED | Auto-prepend https:// to bare domain inputs and route search queries to DuckDuckGo |
| SOP-224 | Frontend | [x] VERIFIED | Toggle star icon (★ in amber vs ☆) dynamically based on whether active tab URL is bookmarked |
| SOP-225 | Frontend | [x] VERIFIED | Open in-page Find bar on Ctrl+F with Prev, Next, live match ordinal/total count, and Escape to close |
| SOP-226 | Frontend | [x] VERIFIED | Support Page Zoom In (Ctrl++), Zoom Out (Ctrl+-), and Reset Zoom (Ctrl+0) per tab |
| SOP-227 | Frontend | [x] VERIFIED | Display non-intrusive permission confirmation bar (#permission-bar) with Allow and Block buttons |
| SOP-228 | Frontend | [x] VERIFIED | Display friendly error page (#error-page) with Try Again and Dismiss on main-frame load failures |
| SOP-229 | Frontend | [x] VERIFIED | Ignore benign ERR_ABORTED (-3) and sub-frame load failures so error page never false-triggers |
| SOP-230 | Frontend | [x] VERIFIED | Guard all <webview> method calls with tabObj.domReady to prevent pre-attachment exceptions |
| SOP-231 | Frontend | [x] VERIFIED | Update #urlbar automatically on did-navigate and did-navigate-in-page events |
| SOP-232 | Frontend | [x] VERIFIED | Update tab title automatically on page-title-updated and map New Tab to Start Page |
| SOP-233 | Frontend | [x] VERIFIED | Trigger silent page signal classification 350ms after active tab dom-ready |
| SOP-234 | Frontend | [x] VERIFIED | Trigger context-aware intent chip refresh 350ms after active tab dom-ready |
| SOP-235 | Frontend | [x] VERIFIED | Support right-click on any tab to Pin/Unpin or Duplicate the tab |
| SOP-236 | Frontend | [x] VERIFIED | Render pinned tabs with compact .tab.pinned width and pin indicator |
| SOP-237 | Frontend | [x] VERIFIED | Focus and select all text in #urlbar on Ctrl+L |
| SOP-238 | Frontend | [x] VERIFIED | Support Alt+Left and Alt+Right for history Back and Forward navigation |
| SOP-239 | Frontend | [x] VERIFIED | Support Ctrl+R for reloading the active tab |
| SOP-240 | Frontend | [x] VERIFIED | Support Ctrl+D for bookmarking or unbookmarking the active tab |
| SOP-241 | Frontend | [x] VERIFIED | Support Ctrl+H for opening the Library drawer directly to Browsing History |
| SOP-242 | Frontend | [x] VERIFIED | Support Ctrl+J for opening the Library drawer directly to Downloads |
| SOP-243 | Frontend | [x] VERIFIED | Support Ctrl+P for exporting the active webpage to an A4 PDF in GigachadMedia |
| SOP-244 | Frontend | [x] VERIFIED | Support 1-click Snap button to save a full PNG screenshot of the active webpage |
| SOP-245 | Frontend | [x] VERIFIED | Clear Chromium findInPage selection highlights when closing #findbar |
| SOP-246 | Frontend | [x] VERIFIED | Support Shift+Enter in #find-input to search backward and Enter to search forward |
| SOP-247 | Frontend | [x] VERIFIED | Auto-dismiss #omnibox-dropdown on blur with 180ms click grace period |
| SOP-248 | Frontend | [x] VERIFIED | Restore previous session http(s) tabs automatically on browser launch |
| SOP-249 | Frontend | [x] VERIFIED | Fall back to a fresh Start Page tab when session.json has no saved tabs |
| SOP-250 | Frontend | [x] VERIFIED | Render default curated bookmarks on #bookmarks-bar when user bookmarks list is empty |

---

## DOM-06 [Frontend] — Start Page, AI Copilot Sidebar, Rich Markdown & Unified Library UX (SOP-251 – SOP-300)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-251 | Frontend | [x] VERIFIED | Render live digital clock (HH:MM) and localized weekday/month/day on Start Page (pages/newtab.html) |
| SOP-252 | Frontend | [x] VERIFIED | Display dynamic time-of-day greeting (Good morning / Good afternoon / Good evening) |
| SOP-253 | Frontend | [x] VERIFIED | Provide multi-engine search bar on Start Page supporting DuckDuckGo, Google, GitHub, and ArXiv |
| SOP-254 | Frontend | [x] VERIFIED | Render 8 default Quick Launch Speed-Dial cards with colored monogram badges |
| SOP-255 | Frontend | [x] VERIFIED | Allow users to add custom Quick Launch shortcuts (+ Add Shortcut) persisted in localStorage |
| SOP-256 | Frontend | [x] VERIFIED | Allow users to remove individual Quick Launch shortcuts or Reset to defaults |
| SOP-257 | Frontend | [x] VERIFIED | Provide auto-saved local Quick Scratchpad textarea on Start Page |
| SOP-258 | Frontend | [x] VERIFIED | Display keyboard shortcut reference bar at bottom of Start Page |
| SOP-259 | Frontend | [x] VERIFIED | Allow collapsing and expanding #ai-sidebar via ✦ Copilot button |
| SOP-260 | Frontend | [x] VERIFIED | Provide Copilot Route selector (Local OpenAI Server, Auto Smart Router, Local Multimodal Vision, OpenRouter Cloud) |
| SOP-261 | Frontend | [x] VERIFIED | Display live backend status line showing Sidecar implementation and Local LLM model count |
| SOP-262 | Frontend | [x] VERIFIED | Populate Active Local Model dropdown from GET /v1/models and provide ↻ Refresh button |
| SOP-263 | Frontend | [x] VERIFIED | Provide collapsible Settings drawer (#config-drawer) for endpoints, model IDs, and API keys |
| SOP-264 | Frontend | [x] VERIFIED | Render assistant replies with safe XSS-escaped Markdown formatting (headings, bold, lists, inline code) |
| SOP-265 | Frontend | [x] VERIFIED | Render fenced code blocks with language header and 1-click Copy Code button |
| SOP-266 | Frontend | [x] VERIFIED | Display model/route/vault telemetry header on assistant cards with Copy Reply and Speak Reply buttons |
| SOP-267 | Frontend | [x] VERIFIED | Provide ⚡ Instant TL;DR button in Copilot that runs <15ms extractive summary + Flesch readability |
| SOP-268 | Frontend | [x] VERIFIED | Provide 1-click Summarize, Key Facts, Synth Tabs, Audit Signal, and Clear quick-action buttons |
| SOP-269 | Frontend | [x] VERIFIED | Render dynamic context-aware intent chips (#intent-chips-bar) from sidecar /predict_intent |
| SOP-270 | Frontend | [x] VERIFIED | Provide unified bottom composer card with Auto-pilot toggle, Vision screenshot toggle, Mic, Stop, and Send |
| SOP-271 | Frontend | [x] VERIFIED | Show animated thinking step indicator with active model name while awaiting LLM response |
| SOP-272 | Frontend | [x] VERIFIED | Remove thinking step indicator cleanly as soon as reply or error arrives |
| SOP-273 | Frontend | [x] VERIFIED | Display count of Memory Vault notes injected into context on assistant reply header |
| SOP-274 | Frontend | [x] VERIFIED | Display count of PII tokens redacted by firewall on assistant reply header |
| SOP-275 | Frontend | [x] VERIFIED | Allow speaking any assistant reply aloud via 1-click Speak button in message header |
| SOP-276 | Frontend | [x] VERIFIED | Allow copying full assistant reply via 1-click Copy button in message header |
| SOP-277 | Frontend | [x] VERIFIED | Provide Test Connection button in Settings that probes /v1/models and shows model count |
| SOP-278 | Frontend | [x] VERIFIED | Display discovered local toolchain paths (Python, yt-dlp, llama-server, Ollama) in Settings |
| SOP-279 | Frontend | [x] VERIFIED | Provide unified 4-tab Library drawer (Bookmarks, History, Downloads, Memory Vault) |
| SOP-280 | Frontend | [x] VERIFIED | Provide real-time search/filter input (#library-search-input) across all 4 Library tabs |
| SOP-281 | Frontend | [x] VERIFIED | Route Memory Vault search queries through hybrid BM25 + cosine sidecar /query_memory |
| SOP-282 | Frontend | [x] VERIFIED | Display matched query terms and similarity scores on searched Memory Vault cards |
| SOP-283 | Frontend | [x] VERIFIED | Allow opening or deleting any saved Bookmark from the Library drawer |
| SOP-284 | Frontend | [x] VERIFIED | Allow opening any History entry or clearing all Browsing History from the Library drawer |
| SOP-285 | Frontend | [x] VERIFIED | Allow opening or deleting any Memory Vault note from the Library drawer |
| SOP-286 | Frontend | [x] VERIFIED | Auto-refresh Downloads view in Library drawer when download-update IPC event arrives |
| SOP-287 | Frontend | [x] VERIFIED | Provide 1-click Open Folder button in Library drawer to open GigachadMedia in Explorer |
| SOP-288 | Frontend | [x] VERIFIED | Support Web Speech API voice dictation (Mic button) into #prompt-input when available |
| SOP-289 | Frontend | [x] VERIFIED | Auto-scroll #chat-log to newest message on every user, step, or assistant append |
| SOP-290 | Frontend | [x] VERIFIED | Preserve clean welcome card when clearing chat history via Clear button |
| SOP-291 | Frontend | [x] VERIFIED | Support /swarm <topic> slash command directly inside #prompt-input |
| SOP-292 | Frontend | [x] VERIFIED | Open #ai-sidebar automatically if user clicks Settings while sidebar is collapsed |
| SOP-293 | Frontend | [x] VERIFIED | Populate cloud-models datalist with synced OpenRouter :free model IDs |
| SOP-294 | Frontend | [x] VERIFIED | Show placeholder status for saved OpenRouter, ElevenLabs, and Local API keys without leaking secrets |
| SOP-295 | Frontend | [x] VERIFIED | Provide tooltip descriptions on all navigation, omnibox, and ribbon controls |
| SOP-296 | Frontend | [x] VERIFIED | Ensure Start Page search input auto-focuses on new tab creation |
| SOP-297 | Frontend | [x] VERIFIED | Route bare domains on Start Page search directly to https:// URLs |
| SOP-298 | Frontend | [x] VERIFIED | Persist Start Page scratchpad edits immediately on input event with timestamp indicator |
| SOP-299 | Frontend | [x] VERIFIED | Validate new shortcut URLs on Start Page and auto-prepend https:// when missing |
| SOP-300 | Frontend | [x] VERIFIED | Maintain zero external CDN or font dependencies so Start Page and Chrome load 100% offline |

---

## DOM-07 [Full-Stack] — Agentic Browsing, Set-of-Mark Grounding, Ghost Swarm & Subscription Council (SOP-301 – SOP-350)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-301 | Full-Stack | [x] VERIFIED | Inject numbered Set-of-Mark (SoM) badges onto visible interactive elements (a, button, input, select) |
| SOP-302 | Full-Stack | [x] VERIFIED | Record element center coordinates (x, y) in lastMarkMap for deterministic CDP click/type grounding |
| SOP-303 | Full-Stack | [x] VERIFIED | Capture page screenshot with SoM badges when Vision mode or send-screenshot is enabled |
| SOP-304 | Full-Stack | [x] VERIFIED | Remove temporary SoM badges cleanly after capture (or after 2.5s in previewSoM) |
| SOP-305 | Full-Stack | [x] VERIFIED | Parse fenced ```json action blocks and raw action objects via GigachadActions.parseAgentReply() |
| SOP-306 | Full-Stack | [x] VERIFIED | Tolerate trailing commas in LLM-generated JSON action blocks |
| SOP-307 | Full-Stack | [x] VERIFIED | Enforce single action execution per agent turn and report count of deferred actions |
| SOP-308 | Full-Stack | [x] VERIFIED | Normalize action aliases (goto/open->navigate, enter/input->type, wheel->scroll, key->press_key) |
| SOP-309 | Full-Stack | [x] VERIFIED | Reject non-http(s) URLs in agent navigate actions |
| SOP-310 | Full-Stack | [x] VERIFIED | Validate mark IDs against lastMarkMap and report clear error if mark is off-screen |
| SOP-311 | Full-Stack | [x] VERIFIED | Execute multi-step autonomous loop (up to 6 steps) when Auto-pilot checkbox is enabled |
| SOP-312 | Full-Stack | [x] VERIFIED | Wait for page load completion (waitForLoad) on agent navigate actions and verify URL change |
| SOP-313 | Full-Stack | [x] VERIFIED | Support extract_table agent action to pull HTML tables into structured rows |
| SOP-314 | Full-Stack | [x] VERIFIED | Support patch_site agent action to inject and persist per-domain CSS/JS modifications |
| SOP-315 | Full-Stack | [x] VERIFIED | Spawn 3 hidden sandboxed <webview> workers in #ghost-pool for /swarm parallel research |
| SOP-316 | Full-Stack | [x] VERIFIED | Clean up hidden ghost-pool webviews in finally block after swarm synthesis completes |
| SOP-317 | Full-Stack | [x] VERIFIED | Synthesize active tab + 3 background search tabs into unified research brief in runGhostSwarm() |
| SOP-318 | Full-Stack | [x] VERIFIED | Extract focused input field context and insert AI-drafted text at cursor via Alt+G Ghostwriter |
| SOP-319 | Full-Stack | [x] VERIFIED | Strip sticky paywalls/overlays, click safe consent buttons via /reflex/dom, and extract __NEXT_DATA__ |
| SOP-320 | Full-Stack | [x] VERIFIED | Host isolated ChatGPT, Claude, Gemini, and Grok webviews in #council-drawer with Beam, Quad-Beam, and Harvest |
| SOP-321 | Full-Stack | [x] VERIFIED | Lazy-load Subscription Council webviews only when #council-drawer is opened or switched |
| SOP-322 | Full-Stack | [x] VERIFIED | Copy beamed webpage + prompt payload to system clipboard as backup during Beam Page |
| SOP-323 | Full-Stack | [x] VERIFIED | Inject beamed text into #prompt-textarea, contenteditable, or textarea inside council webviews |
| SOP-324 | Full-Stack | [x] VERIFIED | Broadcast prompt + webpage context across all 4 council webviews in quadBeamAllCouncil() |
| SOP-325 | Full-Stack | [x] VERIFIED | Harvest last assistant response blocks from ChatGPT, Claude, Gemini, and Grok in harvestAndSynthesizeCouncil() |
| SOP-326 | Full-Stack | [x] VERIFIED | Synthesize consensus truths, contradictions, and unique insights across harvested council replies |
| SOP-327 | Full-Stack | [x] VERIFIED | Support hover agent action with mark lookup or explicit (x, y) coordinates |
| SOP-328 | Full-Stack | [x] VERIFIED | Support press_key agent action for Enter, Escape, Tab, Backspace, Space, Arrow, and Page keys |
| SOP-329 | Full-Stack | [x] VERIFIED | Support wait agent action bounded between 100ms and 5000ms |
| SOP-330 | Full-Stack | [x] VERIFIED | Support back and forward agent history navigation actions |
| SOP-331 | Full-Stack | [x] VERIFIED | Support reload agent action via CDP Page.reload |
| SOP-332 | Full-Stack | [x] VERIFIED | Support insert_only agent action for direct CDP text insertion without mouse click |
| SOP-333 | Full-Stack | [x] VERIFIED | Support download_media agent action triggering yt-dlp MP4 or MP3 extraction |
| SOP-334 | Full-Stack | [x] VERIFIED | Support done agent action to terminate multi-step Auto-pilot loop early with summary |
| SOP-335 | Full-Stack | [x] VERIFIED | Format human-readable step descriptions via GigachadActions.explainAction() |
| SOP-336 | Full-Stack | [x] VERIFIED | Filter SoM candidate elements to visible viewport bounds (width > 12, height > 12, top >= 0) |
| SOP-337 | Full-Stack | [x] VERIFIED | Cap SoM badges at 75 interactive elements per viewport to prevent token overflow |
| SOP-338 | Full-Stack | [x] VERIFIED | Include page TITLE, URL, numbered ELEMENTS list, and 8,000 chars of TEXT in buildSoMContext() |
| SOP-339 | Full-Stack | [x] VERIFIED | Stop multi-step Auto-pilot immediately on first failed action or missing mark |
| SOP-340 | Full-Stack | [x] VERIFIED | Stop multi-step Auto-pilot immediately when user clicks Stop button (abortAutopilot = true) |
| SOP-341 | Full-Stack | [x] VERIFIED | Pass previous step summary into next turn prompt during multi-step Auto-pilot execution |
| SOP-342 | Full-Stack | [x] VERIFIED | Extract __APOLLO_STATE__, __NUXT__, and application/ld+json blocks in unlockPageState() |
| SOP-343 | Full-Stack | [x] VERIFIED | Restore document.body.style.overflow = auto when unlocking scroll-locked pages |
| SOP-344 | Full-Stack | [x] VERIFIED | Remove high-z-index fixed/sticky backdrop-blur overlays during unlockPageState() |
| SOP-345 | Full-Stack | [x] VERIFIED | Verify guest sandboxing on all ghost-pool worker webviews via GUEST_PREFS |
| SOP-346 | Full-Stack | [x] VERIFIED | Bound Ghost Swarm worker tab wait time with 5.5-second timeout per worker |
| SOP-347 | Full-Stack | [x] VERIFIED | Extract up to 5,000 chars of text per Ghost Swarm worker tab for synthesis |
| SOP-348 | Full-Stack | [x] VERIFIED | Strip conversational filler preambles before inserting Inline Ghostwriter text |
| SOP-349 | Full-Stack | [x] VERIFIED | Support Alt+G Ghostwriter trigger from both chrome window and guest webview focus |
| SOP-350 | Full-Stack | [x] VERIFIED | Log every executed CDP action and navigation outcome to #chat-log as a step entry |

---

## DOM-08 [Full-Stack] — Page Intelligence Suite, Knowledge Graph, Media Grabber & ElevenReader (SOP-351 – SOP-400)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-351 | Full-Stack | [x] VERIFIED | Extract page paragraphs and score top matching passages via /rerank in runNeuralPageReranker() |
| SOP-352 | Full-Stack | [x] VERIFIED | Highlight matched passages directly in the live DOM with score badges |
| SOP-353 | Full-Stack | [x] VERIFIED | Scroll to and highlight any clicked passage card inside the active <webview> via findInPage() |
| SOP-354 | Full-Stack | [x] VERIFIED | Clear injected passage highlights cleanly via clearNeuralHighlights() |
| SOP-355 | Full-Stack | [x] VERIFIED | Render visual Node-Link Knowledge Graph on #kg-canvas and list S-V-O triplets in runKnowledgeGraph() |
| SOP-356 | Full-Stack | [x] VERIFIED | Audit page text for PII and named entities via /ner_pii and display redaction summary |
| SOP-357 | Full-Stack | [x] VERIFIED | Audit page credibility, weasel words, affiliate markers, and vault contradictions via /deception_radar |
| SOP-358 | Full-Stack | [x] VERIFIED | Extract repeating DOM cards/tables, normalize via /extract_structured, and export CSV to GigachadMedia |
| SOP-359 | Full-Stack | [x] VERIFIED | Scan inline scripts + sniffed XHRs via /ast_analyze and generate curl/Python replay snippets |
| SOP-360 | Full-Stack | [x] VERIFIED | Compare live page text against stored baseline via /semantic_diff and show added/removed sentences |
| SOP-361 | Full-Stack | [x] VERIFIED | RunPageOutlineAndSummary() combining /page_outline heading tree + /summarize_extractive readability |
| SOP-362 | Full-Stack | [x] VERIFIED | Allow clicking any heading in the Page Outline card to jump to that heading in the active tab |
| SOP-363 | Full-Stack | [x] VERIFIED | Capture viewport screenshot and run Vision OCR extraction via runViewportVisionOcr() |
| SOP-364 | Full-Stack | [x] VERIFIED | Translate visible DOM text nodes in-place into target language via runInlineDomTranslator() |
| SOP-365 | Full-Stack | [x] VERIFIED | List sniffed video/audio streams and high-res (>=250x250) gallery images in #media-drawer |
| SOP-366 | Full-Stack | [x] VERIFIED | Support 1-click bulk image download and yt-dlp MP4/MP3 extraction into GigachadMedia |
| SOP-367 | Full-Stack | [x] VERIFIED | Hibernate all background tabs into OneTab Vault and support Restore All or AI Digest |
| SOP-368 | Full-Stack | [x] VERIFIED | Queue article sentences in #elevenreader-dock with Play/Pause, Prev/Next, and 1.0x..2.0x speed control |
| SOP-369 | Full-Stack | [x] VERIFIED | Highlight the currently spoken sentence in the active <webview> during narration |
| SOP-370 | Full-Stack | [x] VERIFIED | Fall back seamlessly from Kokoro -> Windows SAPI -> ElevenLabs -> Web Speech Synthesis |
| SOP-371 | Full-Stack | [x] VERIFIED | Draw directed edges and degree-scaled node circles on #kg-canvas in drawKnowledgeGraphCanvas() |
| SOP-372 | Full-Stack | [x] VERIFIED | Hide #kg-canvas automatically when switching to non-graph tools in #maxsmart-drawer |
| SOP-373 | Full-Stack | [x] VERIFIED | Display Flesch Reading Ease, Grade Level, Word Count, and Reading Time in Outline & Readability |
| SOP-374 | Full-Stack | [x] VERIFIED | Display top 10 extracted key terms as badges in Outline & Readability view |
| SOP-375 | Full-Stack | [x] VERIFIED | Display extractive summary bullet points in document order in Outline & Readability view |
| SOP-376 | Full-Stack | [x] VERIFIED | Indent H1..H6 outline items proportionally by heading level |
| SOP-377 | Full-Stack | [x] VERIFIED | Display count of code blocks, HTML tables, and links in Page Outline KPI row |
| SOP-378 | Full-Stack | [x] VERIFIED | Provide 1-click Copy CSV and Save CSV to Downloads buttons in Structured Scraper view |
| SOP-379 | Full-Stack | [x] VERIFIED | Display AST discovered API routes, GraphQL operations, and WebSocket channels in Discover APIs view |
| SOP-380 | Full-Stack | [x] VERIFIED | Display semantic drift percentage, added sentences, removed sentences, and price shifts in Page Diff view |
| SOP-381 | Full-Stack | [x] VERIFIED | Display Astroturf Risk, Clickbait Score, and Primary Evidence Score in Credibility Check view |
| SOP-382 | Full-Stack | [x] VERIFIED | Highlight Vault contradictions in rose cards when page numbers conflict with saved notes |
| SOP-383 | Full-Stack | [x] VERIFIED | Display redacted PII preview tokens and named entity categories in Entities & PII view |
| SOP-384 | Full-Stack | [x] VERIFIED | Provide AI Red-Team Summary button in Security drawer to analyze OWASP scan findings |
| SOP-385 | Full-Stack | [x] VERIFIED | Display DOM sink counts (inline scripts, insecure forms, eval/innerHTML sinks) in Security drawer |
| SOP-386 | Full-Stack | [x] VERIFIED | Display Chrome Web Vitals (FCP, DOM Interactive, Total Load, JS Heap) in SRE drawer |
| SOP-387 | Full-Stack | [x] VERIFIED | Display AI P50/P95 latency, error rate, and auto-heal count in SRE drawer |
| SOP-388 | Full-Stack | [x] VERIFIED | Update playback rate immediately when user changes speed selector in #elevenreader-dock |
| SOP-389 | Full-Stack | [x] VERIFIED | Stop audio playback and clear sentence highlight when closing #elevenreader-dock |
| SOP-390 | Full-Stack | [x] VERIFIED | Synthesize cross-tab comparison matrix across all open tabs in synthesizeAllTabs() |
| SOP-391 | Full-Stack | [x] VERIFIED | Provide 1-click Save to Memory Vault from any Page Intelligence tool card |
| SOP-392 | Full-Stack | [x] VERIFIED | Support instant extractive TL;DR without LLM round-trip via ⚡ Instant TL;DR button |
| SOP-393 | Full-Stack | [x] VERIFIED | Display sentence count and extractive top-5 sentence ranking in /summarize_extractive |
| SOP-394 | Full-Stack | [x] VERIFIED | Support full-page PDF export to Downloads/GigachadMedia via webContents.printToPDF() |
| SOP-395 | Full-Stack | [x] VERIFIED | Support instant viewport PNG capture to Downloads/GigachadMedia via webContents.capturePage() |
| SOP-396 | Full-Stack | [x] VERIFIED | Provide 1-click Reveal in Explorer button after saving PDF or PNG snapshot |
| SOP-397 | Full-Stack | [x] VERIFIED | Auto-detect and list direct HLS (.m3u8), DASH (.mpd), and MP4/WebM streams in Media Grabber |
| SOP-398 | Full-Stack | [x] VERIFIED | Deduplicate gallery images and sort by pixel area descending in scanPageMedia() |
| SOP-399 | Full-Stack | [x] VERIFIED | Allow custom CSS/JS site patch persistence per domain in #vibe-code-drawer |
| SOP-400 | Full-Stack | [x] VERIFIED | Provide 4 instant Vibe Coding presets (OLED Cyberpunk, Clean Paper, Kill Popups, Wide Code) |

---

## DOM-09 [Full-Stack] — ERM (Enterprise Risk), ERD (Data Architecture) & ERP (Resource Planning) (SOP-401 – SOP-450)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-401 | Full-Stack | [x] VERIFIED | Define formal ERD schema for all 12 browser entities in systems/erd-schema.js |
| SOP-402 | Full-Stack | [x] VERIFIED | Document primary keys, foreign keys, and 1:1 / 1:N / N:1 cardinalities in ERD_RELATIONSHIPS |
| SOP-403 | Full-Stack | [x] VERIFIED | Validate runtime data stores against ERD constraints in auditErdIntegrity() |
| SOP-404 | Full-Stack | [x] VERIFIED | Enforce http(s)-only invariant on HistoryRecord, BookmarkItem, ClosedTabEntry, and TabSession persistence |
| SOP-405 | Full-Stack | [x] VERIFIED | Maintain ERM Risk Register across Backend, Frontend, and Full-Stack in systems/erm-risk-engine.js |
| SOP-406 | Full-Stack | [x] VERIFIED | Score inherent vs. residual Likelihood x Impact (1..25) for all 12 enterprise risk scenarios |
| SOP-407 | Full-Stack | [x] VERIFIED | Adjust live residual risk dynamically if PII firewall is disabled or sidecar is offline |
| SOP-408 | Full-Stack | [x] VERIFIED | Compute overall risk reduction percentage and posture grade (A/B/C) in evaluateErmPosture() |
| SOP-409 | Full-Stack | [x] VERIFIED | Define ERP compute, storage, and SLA quotas in systems/erp-resource-planner.js |
| SOP-410 | Full-Stack | [x] VERIFIED | Enforce 7,168 MB VRAM target cap with --models-max 1 and q4_0 KV cache quantization |
| SOP-411 | Full-Stack | [x] VERIFIED | Enforce storage caps (400 history, 300 bookmarks, 25 closed tabs, 600 vault notes, 200 kanban cards) |
| SOP-412 | Full-Stack | [x] VERIFIED | Monitor live storage utilization % and OPTIMAL vs OVER_QUOTA status in evaluateErpPlan() |
| SOP-413 | Full-Stack | [x] VERIFIED | Monitor AI latency P50/P95 against SLA targets (1200ms P50 / 4500ms P95) |
| SOP-414 | Full-Stack | [x] VERIFIED | Expose systems-audit IPC channel returning combined ERD + ERM + ERP + SOP-500 telemetry |
| SOP-415 | Full-Stack | [x] VERIFIED | Render live ERM / ERD / ERP Systems Engineering view inside the browser Tasks & Systems drawer |
| SOP-416 | Full-Stack | [x] VERIFIED | Render searchable 500-Point SOP Frontier Browser Checklist inside the browser UI |
| SOP-417 | Full-Stack | [x] VERIFIED | Provide docs/SYSTEMS_ENGINEERING_ERM_ERD_ERP.md with Mermaid erDiagram, flowchart, and stateDiagram-v2 |
| SOP-418 | Full-Stack | [x] VERIFIED | Provide docs/SOP_500_POINT_CHECKLIST.md with all 500 numbered SOP items |
| SOP-419 | Full-Stack | [x] VERIFIED | Keep modular systems/ directory cleanly separated from root Electron entrypoints |
| SOP-420 | Full-Stack | [x] VERIFIED | Verify ERD, ERM, ERP, and 500-Point SOP modules automatically in scripts/smoke_systems.js |
| SOP-421 | Full-Stack | [x] VERIFIED | Model TabSession entity with id PK and url/title/pinned/muted attributes |
| SOP-422 | Full-Stack | [x] VERIFIED | Model HistoryRecord entity with url PK, TabSession FK, and ISO-8601 timestamp |
| SOP-423 | Full-Stack | [x] VERIFIED | Model BookmarkItem entity with url PK, TabSession FK, and ISO-8601 timestamp |
| SOP-424 | Full-Stack | [x] VERIFIED | Model ClosedTabEntry entity with url PK and closedAt timestamp for LIFO recovery |
| SOP-425 | Full-Stack | [x] VERIFIED | Model MemoryVaultVector entity with id PK, 768-d float32 embedding, and implementation tag |
| SOP-426 | Full-Stack | [x] VERIFIED | Model OneTabGroup entity with id PK and 1:N serialized tab array |
| SOP-427 | Full-Stack | [x] VERIFIED | Model VibeSitePatch entity with domain PK and bounded CSS/JS payloads (<=100KB) |
| SOP-428 | Full-Stack | [x] VERIFIED | Model TemporalSnapshot entity with url PK and 20KB baseline text snapshot |
| SOP-429 | Full-Stack | [x] VERIFIED | Model KanbanSprintCard entity with id PK, col enum (backlog\|progress\|done), and tag |
| SOP-430 | Full-Stack | [x] VERIFIED | Model DownloadArtifact entity with id PK, state enum, and GigachadMedia filepath |
| SOP-431 | Full-Stack | [x] VERIFIED | Model SecurityAuditReport entity with wcId PK, 0..100 score, grade, and cookieAudit |
| SOP-432 | Full-Stack | [x] VERIFIED | Model ErpResourceSample entity with uptimeSec, vramUsedMb, vramTotalMb, and aiP50Ms/aiP95Ms |
| SOP-433 | Full-Stack | [x] VERIFIED | Mitigate ERM-BE-01 (Sandbox Escape) to LOW residual risk via strict webview isolation |
| SOP-434 | Full-Stack | [x] VERIFIED | Mitigate ERM-BE-02 (Sidecar SSRF) to LOW residual risk via loopback-only binding |
| SOP-435 | Full-Stack | [x] VERIFIED | Mitigate ERM-BE-03 (Unauthorized IPC) to LOW residual risk via preload allowlist + sender check |
| SOP-436 | Full-Stack | [x] VERIFIED | Mitigate ERM-BE-04 (Sidecar Crash) to LOW residual risk via 15s watchdog auto-healer |
| SOP-437 | Full-Stack | [x] VERIFIED | Mitigate ERM-FE-01 (DOM XSS) to LOW residual risk via esc() entity escaping and safe Markdown |
| SOP-438 | Full-Stack | [x] VERIFIED | Mitigate ERM-FE-02 (Pre-domReady Crash) to LOW residual risk via tabObj.domReady guard |
| SOP-439 | Full-Stack | [x] VERIFIED | Mitigate ERM-FE-03 (UI Freeze) to LOW residual risk via payload slicing and AbortController |
| SOP-440 | Full-Stack | [x] VERIFIED | Mitigate ERM-FE-04 (Permission Abuse) to LOW residual risk via default-deny + 20s timeout bar |
| SOP-441 | Full-Stack | [x] VERIFIED | Mitigate ERM-FS-01 (Prompt Injection) to MEDIUM/LOW residual risk via single-action http(s) parser |
| SOP-442 | Full-Stack | [x] VERIFIED | Mitigate ERM-FS-02 (PII Exfiltration) to LOW residual risk via /ner_pii pre-flight scrubbing |
| SOP-443 | Full-Stack | [x] VERIFIED | Mitigate ERM-FS-03 (VRAM Exhaustion) to LOW residual risk via single-active-model router cap |
| SOP-444 | Full-Stack | [x] VERIFIED | Mitigate ERM-FS-04 (Tracker Fingerprinting) to LOW residual risk via webRequest blocklist + GPC/DNT |
| SOP-445 | Full-Stack | [x] VERIFIED | Track ERP compute quota utilization across GPU VRAM and context window limits |
| SOP-446 | Full-Stack | [x] VERIFIED | Track ERP storage quota utilization across all 5 persistent JSON stores |
| SOP-447 | Full-Stack | [x] VERIFIED | Track ERP SLA compliance across sidecar health (<800ms), micro-engines (<4000ms), and LLM P50/P95 |
| SOP-448 | Full-Stack | [x] VERIFIED | Allow filtering 500-Point SOP items by Backend, Frontend, or Full-Stack aspect in UI |
| SOP-449 | Full-Stack | [x] VERIFIED | Allow full-text keyword search across all 500 SOP requirements in UI |
| SOP-450 | Full-Stack | [x] VERIFIED | Maintain 100% pass rate across all ERD, ERM, ERP, and SOP-500 automated assertions |

---

## DOM-10 [Full-Stack] — CI/CD Pipeline, Kanban Sprint Governance, Smoke Gates & Release Engineering (SOP-451 – SOP-500)

| SOP ID | Aspect | Status | Requirement Specification |
| :--- | :--- | :---: | :--- |
| SOP-451 | Full-Stack | [x] VERIFIED | Validate JavaScript syntax of main.js, preload.js, config.js, and blocklist.js via node --check |
| SOP-452 | Full-Stack | [x] VERIFIED | Verify tracker blocklist/allowlist matching and exception rules in scripts/smoke_config.js |
| SOP-453 | Full-Stack | [x] VERIFIED | Verify Windows Python, yt-dlp, and llama-server discovery helpers in scripts/smoke_config.js |
| SOP-454 | Full-Stack | [x] VERIFIED | Verify config.json loading, environment variable overrides, and loopback host sanitization |
| SOP-455 | Full-Stack | [x] VERIFIED | Scan source files for hardcoded user profile paths in scripts/smoke_config.js |
| SOP-456 | Full-Stack | [x] VERIFIED | Scan index.html for banned legacy strings and verify guest sandbox webpreferences attribute |
| SOP-457 | Full-Stack | [x] VERIFIED | Verify JSON action parsing, trailing comma repair, URL normalization, and key/wait/hover actions in scripts/smoke_actions.js |
| SOP-458 | Full-Stack | [x] VERIFIED | Verify history deduplication, bookmark toggling, session sanitization, closed-tab stack, and omnibox suggestions in scripts/smoke_browser.js |
| SOP-459 | Full-Stack | [x] VERIFIED | Verify ERD schema validator, ERM risk engine, ERP resource planner, and 500-point SOP checklist in scripts/smoke_systems.js |
| SOP-460 | Full-Stack | [x] VERIFIED | Compile Python sidecar and router via python -m py_compile |
| SOP-461 | Full-Stack | [x] VERIFIED | Boot sidecar on isolated test port and verify /health, /embed, /route, /classify, /ner_pii, /tts, /reflex/dom, /summarize_extractive, /page_outline, and /query_memory in scripts/smoke_sidecar.py |
| SOP-462 | Full-Stack | [x] VERIFIED | Boot full Electron app in headless --smoke mode and verify preload bridge, guest webview URL, action parser, and sidecar health |
| SOP-463 | Full-Stack | [x] VERIFIED | Provide interactive Kanban Sprint Board (#kanban-drawer) with Backlog, In Progress, and Verified/Done columns |
| SOP-464 | Full-Stack | [x] VERIFIED | Support adding, advancing, deleting, and running AI Agent Sprints on Kanban cards |
| SOP-465 | Full-Stack | [x] VERIFIED | Provide in-app Run CI/CD Checks gate runner testing Sidecar /health, /embed, Local LLM /models, nvidia-smi, and Tracker blocklist |
| SOP-466 | Full-Stack | [x] VERIFIED | Pin Electron to patched release 42.11.18 in package.json |
| SOP-467 | Full-Stack | [x] VERIFIED | Provide LAUNCH_BROWSER.bat and start-gigachad.ps1 for 1-click Windows desktop startup |
| SOP-468 | Full-Stack | [x] VERIFIED | Provide setup-backends.ps1 for non-destructive local toolchain discovery |
| SOP-469 | Full-Stack | [x] VERIFIED | Maintain zero console errors during full-stack UI navigation, drawer switching, and AI queries |
| SOP-470 | Full-Stack | [x] VERIFIED | Ensure npm run smoke and npm run ci exit with code 0 across all verification stages |
| SOP-471 | Full-Stack | [x] VERIFIED | Validate syntax of browser-data.js and agent-actions.js via node --check in scripts/smoke.js |
| SOP-472 | Full-Stack | [x] VERIFIED | Validate syntax of systems/erd-schema.js, systems/erm-risk-engine.js, systems/erp-resource-planner.js, and systems/sop-500-checklist.js |
| SOP-473 | Full-Stack | [x] VERIFIED | Assert exact count of 500 SOP items (150 Backend, 150 Frontend, 200 Full-Stack) in scripts/smoke_systems.js |
| SOP-474 | Full-Stack | [x] VERIFIED | Assert uniqueness of all 500 SOP item IDs (SOP-001..SOP-500) and requirement strings |
| SOP-475 | Full-Stack | [x] VERIFIED | Assert zero ERD integrity violations on clean and populated data stores in scripts/smoke_systems.js |
| SOP-476 | Full-Stack | [x] VERIFIED | Assert ERM posture grade A and >=65% risk reduction across all 12 risk items in scripts/smoke_systems.js |
| SOP-477 | Full-Stack | [x] VERIFIED | Assert ERP quota calculations and SLA status evaluation in scripts/smoke_systems.js |
| SOP-478 | Full-Stack | [x] VERIFIED | Support GIGACHAD_SKIP_ELECTRON=1 environment flag for headless container CI environments |
| SOP-479 | Full-Stack | [x] VERIFIED | Enforce 45-second timeout on Electron --smoke execution in scripts/smoke.js |
| SOP-480 | Full-Stack | [x] VERIFIED | Enforce 20-second internal watchdog timer inside main.js SMOKE mode |
| SOP-481 | Full-Stack | [x] VERIFIED | Verify window.gigachad.invoke bridge presence and window.require === undefined in SMOKE_OK probe |
| SOP-482 | Full-Stack | [x] VERIFIED | Verify active guest webview loads file:///.../pages/newtab.html in SMOKE_OK probe |
| SOP-483 | Full-Stack | [x] VERIFIED | Verify document.createElement("webview").loadURL is available in SMOKE_OK probe |
| SOP-484 | Full-Stack | [x] VERIFIED | Verify window.GigachadActions.parseAgentReply is loaded in SMOKE_OK probe |
| SOP-485 | Full-Stack | [x] VERIFIED | Verify sidecar-health IPC round-trip succeeds in SMOKE_OK probe |
| SOP-486 | Full-Stack | [x] VERIFIED | Include ERD/ERM/ERP Systems gate in in-app Run CI/CD Checks |
| SOP-487 | Full-Stack | [x] VERIFIED | Include 500-Point SOP verification gate in in-app Run CI/CD Checks |
| SOP-488 | Full-Stack | [x] VERIFIED | Pre-populate Kanban board with actionable Backend, Frontend, and Full-Stack engineering cards |
| SOP-489 | Full-Stack | [x] VERIFIED | Sanitize Kanban card IDs, titles (<=240 chars), columns, and tags in sanitizeBoard() |
| SOP-490 | Full-Stack | [x] VERIFIED | Provide 4-view switcher inside #kanban-drawer (Kanban Board, CI/CD Gates, ERM/ERD/ERP Audit, 500-Point SOP) |
| SOP-491 | Full-Stack | [x] VERIFIED | Keep .gitignore configured to exclude node_modules, .venv, config.json, .env, and *.local.txt |
| SOP-492 | Full-Stack | [x] VERIFIED | Provide .env.example and config.example.json with safe loopback defaults and blank keys |
| SOP-493 | Full-Stack | [x] VERIFIED | Document security boundaries and threat model in SECURITY.md |
| SOP-494 | Full-Stack | [x] VERIFIED | Document architecture, ERM, ERD, ERP, and CI/CD workflows in docs/SYSTEMS_ENGINEERING_ERM_ERD_ERP.md |
| SOP-495 | Full-Stack | [x] VERIFIED | Document all 500 SOP items in docs/SOP_500_POINT_CHECKLIST.md |
| SOP-496 | Full-Stack | [x] VERIFIED | Ensure zero hardcoded user-specific paths across all tracked repository files |
| SOP-497 | Full-Stack | [x] VERIFIED | Ensure all sidecar endpoints return valid HTTP 404 JSON on unknown routes |
| SOP-498 | Full-Stack | [x] VERIFIED | Ensure all sidecar endpoints return HTTP 400 JSON on malformed request bodies |
| SOP-499 | Full-Stack | [x] VERIFIED | Ensure all IPC handlers return { ok: false, error: "unauthorized" } or empty state when called from non-chrome senders |
| SOP-500 | Full-Stack | [x] VERIFIED | Verify full-stack readiness across Backend, Frontend, and Full-Stack before concluding any release sprint |
