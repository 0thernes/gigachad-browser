import * as S from "./sampler.js";
const ort = window.ort; ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
const $ = id => document.getElementById(id); let emb, meta, presets = [], sessions = {}, provider = "wasm", stopFlag = false, lastX = null, lastN = 0;
async function session(name) {
  if (sessions[name]) return sessions[name];
  const want = new URLSearchParams(location.search).get("backend"); const tries = want ? [want] : (navigator.gpu ? ["webgpu", "wasm"] : ["wasm"]);
  for (const p of tries) { try { sessions[name] = await ort.InferenceSession.create(`models/${name}.onnx`, { executionProviders: [p] }); provider = p; break; } catch (e) { console.warn(p, e); } }
  $("backend").textContent = provider === "webgpu" ? "WebGPU" : "WebAssembly (CPU)"; return sessions[name];
}
function bind(id, out) { const f = () => $(out).textContent = $(id).value; $(id).oninput = f; f(); }
[["n", "nv"], ["g", "gv"], ["nz", "nzv"], ["ex", "exv"], ["k", "kv"], ["steps", "sv"], ["eta", "etv"], ["up", "uv"]].forEach(a => bind(...a));
$("mode").onchange = () => $("chaosctl").style.display = $("mode").value === "chaos" ? "" : "none";
function randStr() { const r = S.makeRng(S.cryptoSeed()); return Array.from({ length: +$("n").value }, () => meta.vocab[Math.floor(r.u() * meta.vocab.length)]).join(""); }
$("rand").onclick = () => { $("preset").value = ""; $("str").value = randStr(); };
$("preset").onchange = () => { const p = presets[+$("preset").value]; if (p) $("str").value = p.string; };
function draw(x, n) {
  const g = $("grid"), up = +$("up").value; if (g.children.length !== n) { g.innerHTML = ""; for (let i = 0; i < n; i++) { const c = document.createElement("canvas"); c.width = c.height = 64; g.appendChild(c); } }
  [...g.children].forEach((c, i) => { c.style.width = c.style.height = 64 * up + "px"; c.getContext("2d").putImageData(new ImageData(S.toRGBA(x, i), 64, 64), 0, 0); });
}
$("up").addEventListener("input", () => lastX && draw(lastX, lastN));
$("stop").onclick = () => stopFlag = true;
$("dl").onclick = () => { if (!lastX) return; const up = +$("up").value, n = lastN, c = document.createElement("canvas"); c.width = 64 * up * n; c.height = 64 * up;
  const ctx = c.getContext("2d"); ctx.imageSmoothingEnabled = false; [...$("grid").children].forEach((s, i) => ctx.drawImage(s, i * 64 * up, 0, 64 * up, 64 * up));
  const a = document.createElement("a"); a.download = `tsotchke_${$("mode").value}_${Date.now()}.png`; a.href = c.toDataURL("image/png"); a.click(); };
$("go").onclick = async () => {
  $("go").disabled = true; stopFlag = false; const n = +$("k").value, chaos = $("mode").value === "chaos"; const t0 = performance.now();
  try {
    const p = presets[+$("preset").value]; const pr = chaos && p && $("preset").value !== "";
    const rng = S.makeRng(pr ? S.seedFromBigInt(p.seed) : S.cryptoSeed());
    if (chaos && !$("str").value) $("str").value = randStr();
    const str = $("str").value, weights = $("qw").checked ? (pr ? p.weights : Array.from(str, () => rng.u() * 2)) : null;
    $("status").textContent = "loading model..."; const sess = await session(chaos ? "chaos_unet" : "uncond_unet");
    let conds = null, nullVec = null;
    if (chaos) { conds = Array.from({ length: n }, () => S.blend(emb, str, { mode: $("blend").value, weights, noise: +$("nz").value, extrap: +$("ex").value, rng })); nullVec = emb.W.slice(0, emb.dim); }
    $("used").textContent = chaos ? `string "${str}", CFG ${$("g").value}, ${$("blend").value}${weights ? " + weights" : ""}, noise ${$("nz").value}, extrapolate ${$("ex").value}; seed: ${pr ? "Tsotchke QRNG preset #" + p.id : "browser crypto RNG"}` : "unconditional model (real_best_long)";
    lastN = n; const x = await S.sample(ort, sess, { n, conds, nullVec, steps: +$("steps").value, guidance: +$("g").value, eta: +$("eta").value, rng,
      onFrame: async (x, k, tot) => { lastX = x; draw(x, n); $("status").textContent = `step ${k}/${tot} on ${provider}`; await new Promise(r => setTimeout(r, 0)); if (stopFlag) throw new Error("stopped"); } });
    lastX = x; draw(x, n); $("status").textContent = `done in ${((performance.now() - t0) / 1000).toFixed(1)} s on ${provider}`;
  } catch (e) { $("status").textContent = e.message === "stopped" ? "stopped" : "error: " + e.message; console.error(e); }
  $("go").disabled = false;
};
(async () => {
  meta = await (await fetch("models/chaos_meta.json")).json(); const buf = await (await fetch("models/chaos_emb.f32")).arrayBuffer();
  emb = { W: new Float32Array(buf), dim: meta.dim, vocab: meta.vocab }; $("vocab").textContent = meta.vocab.join(" ");
  try { presets = (await (await fetch("models/qrng_presets.json")).json()).presets; presets.forEach((p, i) => { const o = document.createElement("option"); o.value = i; o.textContent = `#${p.id}: ${p.string}`; $("preset").appendChild(o); }); } catch (e) { }
  $("str").value = randStr(); $("status").textContent = "ready";
})();
