// Runs one v2.3 live test page in headless Chrome via the DevTools protocol; prints the #livetest JSON.
import { spawn } from "node:child_process";
const [url, port] = [process.argv[2], 9300 + Math.floor(Math.random() * 500)];
const ch = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--window-size=400,800", `--remote-debugging-port=${port}`, "--user-data-dir=/tmp/lcdp" + port, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let tabs;
for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl); let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r)); const send = (method, params = {}) => new Promise((r) => { pend.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send("Page.navigate", { url }); let out = null, t0 = Date.now();
while (Date.now() - t0 < Number(process.env.LIVE_TIMEOUT_MS || 600000)) { await sleep(1000); const r = await send("Runtime.evaluate", { expression: "(document.getElementById('livetest')||{}).textContent||''" }); if (r?.result?.value) { out = r.result.value; break; } }
process.stdout.write(out ?? JSON.stringify({ error: "timeout" })); ws.close(); ch.kill("SIGKILL"); process.exit(0);
