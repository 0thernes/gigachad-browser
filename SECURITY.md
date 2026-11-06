# Security notes

The browser chrome is the Electron window that loads `index.html`. Guest pages are `<webview>` elements in the `persist:gigachad_vault` partition.

## What is enforced

- `nodeIntegration` is off and `contextIsolation` is on for the chrome window.
- The chrome page cannot `require` Node. It can call `window.gigachad.invoke` only for the channel names listed in `preload.js`.
- The chrome window cannot navigate away from `index.html` or open a new window. A remote page loaded in the chrome would inherit the preload bridge, so that navigation is blocked.
- Guest webviews are forced to `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true` in `will-attach-webview`, including when the page sets attributes.
- Guest navigations are limited to `http:`, `https:`, `about:`, and the local new-tab file.
- `window.open` from a guest becomes a new tab for http(s) URLs. Other schemes are dropped.
- IPC that takes a webContents id only accepts guests (`webContents.getType() === 'webview'`), so the chrome cannot attach the debugger to itself.
- CDP actions are click, type, insert text, and scroll. There is no channel for an arbitrary DevTools method.
- Sidecar calls from the UI must use a loopback `http` URL and a fixed endpoint list.
- LLM calls accept only `http` and `https` base URLs. OpenRouter mode always uses the configured OpenRouter host, not a URL supplied as the local endpoint.
- OpenRouter and ElevenLabs keys are read from `config.json` or the environment. `config-get` does not return them. `config.json` and `.env` are gitignored.
- Downloads reject non-http(s) URLs, cap redirects, and cap direct downloads at 200MB. Saved filenames are basenames.
- Page-origin userscripts (`patch_site`) are size-limited and run in the guest page, not in Node.
- Permission prompts in the guest default to deny, except media, fullscreen, pointer lock, notifications, and sanitized clipboard write.
- A short tracker substring list cancels matching requests. Allow patterns, including `@@` lines and `tracker-allowlist.txt`, win over blocks. It is not a full adblock subscription.

## Residual risk

- The chrome renderer is **not sandboxed**. Electron still does not support `<webview>` inside a sandboxed renderer, so `sandbox` is false on the window that hosts the tabs. Context isolation is the boundary. A bug in the chrome page, or an XSS bug in one of its panels, can call the preload API. Several panels escape text before inserting it; treat new `innerHTML` of page content as a security bug.
- The debugger is attached to guest tabs so click, type, and the response inspector work. A compromised chrome page can drive those actions on open tabs.
- `patch_site` and saved CSS/JS run in the page origin. That is a userscript, and it can read that origin's DOM.
- The response inspector keeps short JSON previews in memory for the active tab.
- The tracker list is a substring match. It will miss most ads, and it can break sites that depend on a blocked tag manager. Edit `tracker-blocklist.txt`.
- `stealthCloak` defaults to false. When set, the guest hides `navigator.webdriver`. It does not rewrite canvas or audio fingerprints.
- The sidecar binds to loopback and does not authenticate. Any local process can call it. Do not expose that port.
- Heuristic PII redaction runs before an OpenRouter request when the firewall is on. It misses plenty of secrets. Do not put a cloud key in the page, and do not assume the filter is complete.
- Auto-pilot follows JSON actions from the model, up to six steps when the checkbox is on. The default is one step. Review what the model asked for.

## Not a security boundary

This is a local power-user browser. It is not a malware sandbox, a site-isolation product, or a place to open hostile files.
