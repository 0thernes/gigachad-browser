// DDPM / strided DDIM sampler with classifier-free guidance, mirroring core/chaos.py and core/diffusion.py.
// Works in the browser (onnxruntime-web) and in Node (onnxruntime-node): pass the `ort` module in.
export const T = 400, RES = 64;
export function schedule(Tn = T) {
  const betas = new Float64Array(Tn), ab = new Float64Array(Tn); let p = 1;
  for (let i = 0; i < Tn; i++) { betas[i] = 1e-4 + (0.02 * 1000 / Tn - 1e-4) * i / (Tn - 1); p *= 1 - betas[i]; ab[i] = p; }
  return { betas, ab };
}
// Seeded PRNG (sfc32) + Box-Muller. Seed comes from crypto.getRandomValues or a precomputed QRNG preset.
export function makeRng(seedWords) {
  let [a, b, c, d] = seedWords.map(v => v >>> 0);
  const u = () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; };
  for (let i = 0; i < 15; i++) u();
  let spare = null;
  const randn = () => { if (spare !== null) { const s = spare; spare = null; return s; }
    let x = 0; while (x === 0) x = u(); const r = Math.sqrt(-2 * Math.log(x)), th = 2 * Math.PI * u(); spare = r * Math.sin(th); return r * Math.cos(th); };
  return { u, randn };
}
export function seedFromBigInt(s) { const v = BigInt(s); return [Number(v & 0xffffffffn), Number((v >> 32n) & 0xffffffffn), 0x9e3779b9, 0x7f4a7c15]; }
export function cryptoSeed() { const a = new Uint32Array(4); crypto.getRandomValues(a); return Array.from(a); }

// Embedding blend: emb = {W: Float32Array(rows*dim), dim, vocab}
export function blend(emb, str, { mode = "mean", weights = null, noise = 0, extrap = 1, rng }) {
  const { W, dim, vocab } = emb, K = vocab.length, row = i => W.subarray(i * dim, (i + 1) * dim);
  let mu = 0, sq = 0; for (let i = dim; i < W.length; i++) { mu += W[i]; } mu /= (W.length - dim);
  for (let i = dim; i < W.length; i++) sq += (W[i] - mu) ** 2; const std = Math.sqrt(sq / (W.length - dim - 1));
  const chars = Array.from(str || ""), v = new Float32Array(dim); let wsum = 0;
  chars.forEach((ch, k) => {
    const w = weights ? weights[k % weights.length] : 1; wsum += w; let vec;
    const idx = vocab.indexOf(ch);
    if (idx >= 0) vec = row(idx + 1);
    else { // unknown char -> fixed random softmax mix of known rows (seeded by the code point; differs from the Python mix)
      const r = makeRng([ch.codePointAt(0), 0x1234567, 0xdeadbeef, 0x5a5a5a5a]); const lg = Array.from({ length: K }, () => r.randn());
      const m = Math.max(...lg), e = lg.map(x => Math.exp(x - m)), s = e.reduce((a, b) => a + b);
      vec = new Float32Array(dim); for (let j = 0; j < K; j++) { const row_ = row(j + 1); for (let d = 0; d < dim; d++) vec[d] += e[j] / s * row_[d] * Math.sqrt(K); }
    }
    for (let d = 0; d < dim; d++) v[d] += w * vec[d];
  });
  if (!chars.length) return Float32Array.from(row(0));
  const null_ = row(0);
  for (let d = 0; d < dim; d++) { let x = mode === "mean" ? v[d] / wsum : v[d]; x = null_[d] + extrap * (x - null_[d]); v[d] = x + (noise ? noise * std * rng.randn() : 0); }
  return v;
}

// conds: array of Float32Array(dim) (chaos) or null (unconditional). onFrame(x, k, total) is awaited every step.
export async function sample(ort, session, { n, conds = null, nullVec = null, steps = 50, guidance = 3, eta = 1, rng, x0 = null, onFrame = null }) {
  const { betas, ab } = schedule(); const S = 3 * RES * RES; steps = Math.max(2, Math.min(T, steps | 0));
  const x = x0 ? Float32Array.from(x0) : Float32Array.from({ length: n * S }, () => rng.randn());
  const ts = Array.from({ length: steps }, (_, k) => Math.round(T - 1 - k * (T - 1) / (steps - 1)));
  const cfg = !!conds, B = cfg ? 2 * n : n, dim = cfg ? conds[0].length : 0;
  let C = null; if (cfg) { C = new Float32Array(B * dim); conds.forEach((c, i) => { C.set(c, i * dim); C.set(nullVec, (n + i) * dim); }); }
  for (let k = 0; k < ts.length; k++) {
    const i = ts[k], xin = new Float32Array(B * S); xin.set(x); if (cfg) xin.set(x, n * S);
    const feeds = { x: new ort.Tensor("float32", xin, [B, 3, RES, RES]), t: new ort.Tensor("int64", BigInt64Array.from({ length: B }, () => BigInt(i)), [B]) };
    if (cfg) feeds.c = new ort.Tensor("float32", C, [B, dim]);
    const e = (await session.run(feeds)).eps.data;
    const abi = ab[i], j = k + 1 < ts.length ? ts[k + 1] : -1, abp = j >= 0 ? ab[j] : 1;
    const sig = eta * Math.sqrt(Math.max(0, (1 - abp) / (1 - abi) * (1 - abi / abp)));
    const cdir = Math.sqrt(Math.max(0, 1 - abp - sig * sig));
    for (let p = 0; p < n * S; p++) {
      const eps = cfg ? e[n * S + p] + guidance * (e[p] - e[n * S + p]) : e[p];
      let xo = (x[p] - Math.sqrt(1 - abi) * eps) / Math.sqrt(abi); xo = Math.max(-1, Math.min(1, xo));
      const ec = (x[p] - Math.sqrt(abi) * xo) / Math.sqrt(1 - abi);
      x[p] = Math.sqrt(abp) * xo + cdir * ec + (j >= 0 && sig > 0 ? sig * rng.randn() : 0);
    }
    if (onFrame) await onFrame(x, k + 1, ts.length);
  }
  for (let p = 0; p < x.length; p++) x[p] = Math.max(-1, Math.min(1, x[p]));
  return x;
}
// CHW float [-1,1] -> RGBA bytes for image idx
export function toRGBA(x, idx) {
  const S = RES * RES, o = new Uint8ClampedArray(S * 4), base = idx * 3 * S;
  for (let p = 0; p < S; p++) { for (let c = 0; c < 3; c++) o[p * 4 + c] = Math.round((x[base + c * S + p] + 1) * 127.5); o[p * 4 + 3] = 255; }
  return o;
}
