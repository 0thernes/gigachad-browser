// ===================== Creature #1 v3: GPU brain, HDR raymarched body, evaluation panel =====================
// --- entropy + Moonlab-style 2-qubit state vector with CHSH-gated randomness (TypeScript port, not Moonlab itself) ---
function osU32(): number { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0]; }
class QSim { re = new Float64Array(4); im = new Float64Array(4);
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  h(q: number): void { const s = Math.SQRT1_2, m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = s * (a + b); this.re[j] = s * (a - b); this.im[i] = s * (ai + bi); this.im[j] = s * (ai - bi); } }
  cx(): void { let x = this.re[1]; this.re[1] = this.re[3]; this.re[3] = x; x = this.im[1]; this.im[1] = this.im[3]; this.im[3] = x; }
  probs(): number[] { return [0, 1, 2, 3].map((k) => this.re[k] ** 2 + this.im[k] ** 2); }
  measure(u: number): number { const p = this.probs(); let k = 0; for (; k < 3; k++) { u -= p[k]; if (u < 0) break; } return k; } }
function chsh(shots: number): number { const q = new QSim(); const A = [0, Math.PI / 2], B = [Math.PI / 4, -Math.PI / 4]; let S = 0;
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) { let e = 0; for (let s = 0; s < shots; s++) { q.reset(); q.h(0); q.cx(); q.ry(0, -A[x]); q.ry(1, -B[y]); const k = q.measure(osU32() / 4294967296); e += ((k & 1) ^ (k >> 1)) ? -1 : 1; } e /= shots; S += x && y ? -e : e; } return Math.abs(S); }

function substrateCheck(): { ok: boolean; n: number } { const rv = new RV(); rv.x[10] = 0x1234567; let js = 0x1234567 | 0; let ok = true; const n = 500;
  for (let k = 0; k < n; k++) { for (let i = 0; i < PROGRAM.length; i++) rv.step(); js ^= js << 13; js ^= js >>> 17; js ^= js << 5; if ((rv.mem.getInt32(264, true) | 0) !== (js | 0)) ok = false; } return { ok, n }; }

// --- reverse-mode autodiff tape: trains the readout of the GPU network online ---
class Tn { v: Float32Array; g: Float32Array; back: (() => void) | null = null; par: Tn[] = []; constructor(n: number) { this.v = new Float32Array(n); this.g = new Float32Array(n); } }
function linT(x: Tn, W: Tn, b: Tn, ni: number, no: number): Tn { const y = new Tn(no); for (let o = 0; o < no; o++) { let s = b.v[o]; const off = o * ni; for (let i = 0; i < ni; i++) s += W.v[off + i] * x.v[i]; y.v[o] = s; }
  y.par = [x, W, b]; y.back = () => { for (let o = 0; o < no; o++) { const g = y.g[o]; if (!g) continue; b.g[o] += g; const off = o * ni; for (let i = 0; i < ni; i++) { W.g[off + i] += g * x.v[i]; x.g[i] += g * W.v[off + i]; } } }; return y; }
function tanhTn(x: Tn): Tn { const y = new Tn(x.v.length); for (let i = 0; i < y.v.length; i++) y.v[i] = Math.tanh(x.v[i]); y.par = [x]; y.back = () => { for (let i = 0; i < y.v.length; i++) x.g[i] += y.g[i] * (1 - y.v[i] ** 2); }; return y; }
function mseTn(x: Tn, t: number[]): Tn { const y = new Tn(1); let s = 0; for (let i = 0; i < t.length; i++) s += (x.v[i] - t[i]) ** 2; y.v[0] = s / t.length; y.par = [x]; y.back = () => { for (let i = 0; i < t.length; i++) x.g[i] += y.g[0] * 2 * (x.v[i] - t[i]) / t.length; }; return y; }
function backwardTn(root: Tn): void { const ord: Tn[] = []; const seen = new Set<Tn>(); const vis = (t: Tn): void => { if (seen.has(t)) return; seen.add(t); t.par.forEach(vis); ord.push(t); }; vis(root); root.g[0] = 1; for (let i = ord.length - 1; i >= 0; i--) { const b = ord[i].back; if (b) b(); } }

// --- GPU parameter engine: 4 dense tanh layers of 5000x5000 procedural weights = 100,000,000 inference weights ---
const NN = 5000, NL = 4, NOUT = 8;
const HASH_GLSL = `uint hh(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;x^=x>>16;return x;}`;
const HASH_WGSL = `fn hh(xi:u32)->u32{var x=xi;x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}`;
// fwd: y[o] = tanh(0.0245·Σ_i w(l,o,i)·x[i] + add[o]) for o < rows (else 0).  bwd: y[i] = Σ_{o<rows} w(l,o,i)·g[o]  (exact transpose, for LoRA backprop)
type Engine = { kind: string; info: string; fwd: (l: number, x: Float32Array, rows: number, add: Float32Array) => Promise<Float32Array>; bwd: (l: number, g: Float32Array, rows: number) => Promise<Float32Array> };
async function makeWebGPU(): Promise<Engine | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any; if (!nav.gpu) return null; const ad = await nav.gpu.requestAdapter(); if (!ad) return null; const dev = await ad.requestDevice();
  const code = `${HASH_WGSL}
@group(0) @binding(0) var<storage,read> xin: array<f32>; @group(0) @binding(1) var<storage,read_write> yout: array<f32>; @group(0) @binding(2) var<uniform> P: vec4<u32>; @group(0) @binding(3) var<storage,read> addv: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3<u32>) { let o = id.x; if (o >= ${NN}u) { return; } var s = 0.0;
  if (P.w == 0u) { if (o >= P.y) { yout[o] = 0.0; return; } let base = P.x * ${NN}u * ${NN}u + o * ${NN}u;
    for (var i = 0u; i < ${NN}u; i++) { let w = f32(hh(base + i) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[i]; } yout[o] = tanh(s * 0.0245 + addv[o]); }
  else { let base = P.x * ${NN}u * ${NN}u + o; for (var r = 0u; r < P.y; r++) { let w = f32(hh(base + r * ${NN}u) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[r]; } yout[o] = s; } }`;
  const pipe = dev.createComputePipeline({ layout: "auto", compute: { module: dev.createShaderModule({ code }), entryPoint: "main" } });
  const mk = (): unknown => dev.createBuffer({ size: NN * 4, usage: 0x80 | 0x8 | 0x4 }); const bin = mk(), bout = mk(), badd = mk();
  const ub = dev.createBuffer({ size: 16, usage: 0x40 | 0x8 }); const rb = dev.createBuffer({ size: NN * 4, usage: 0x1 | 0x8 });
  const bg = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: bin } }, { binding: 1, resource: { buffer: bout } }, { binding: 2, resource: { buffer: ub } }, { binding: 3, resource: { buffer: badd } }] });
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    dev.queue.writeBuffer(bin, 0, x); if (add) dev.queue.writeBuffer(badd, 0, add); dev.queue.writeBuffer(ub, 0, new Uint32Array([l, rows, 0x9e3779b9, mode]));
    const enc = dev.createCommandEncoder(); const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(Math.ceil(NN / 64)); p.end();
    enc.copyBufferToBuffer(bout, 0, rb, 0, NN * 4); dev.queue.submit([enc.finish()]); await rb.mapAsync(1); const out = new Float32Array(rb.getMappedRange().slice(0)); rb.unmap(); return out; };
  return { kind: "WebGPU compute", info: ad.info ? String(ad.info.vendor || "") + " " + String(ad.info.architecture || "") : "", fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) };
}
function makeWebGL2Engine(): Engine | null { const c = document.createElement("canvas"); c.width = NN; c.height = 1; const gl = c.getContext("webgl2"); if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  const vs = `#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `#version 300 es\nprecision highp float; precision highp int; uniform highp sampler2D X; uniform highp sampler2D A; uniform uint L; uniform int rows; uniform int mode; out vec4 o; ${HASH_GLSL}
void main(){ int oi = int(gl_FragCoord.x); float s = 0.;
  if (mode == 0) { if (oi >= rows) { o = vec4(0.); return; } uint base = L*${NN}u*${NN}u + uint(oi)*${NN}u;
    for (int i = 0; i < ${NN}; i++) { float w = float(hh(base + uint(i)) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(i,0), 0).r; } o = vec4(tanh(s*0.0245 + texelFetch(A, ivec2(oi,0), 0).r),0.,0.,1.); }
  else { uint base = L*${NN}u*${NN}u + uint(oi); for (int r = 0; r < ${NN}; r++) { if (r >= rows) break; float w = float(hh(base + uint(r)*${NN}u) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(r,0), 0).r; } o = vec4(s,0.,0.,1.); } }`;
  const prog = linkProg(gl, vs, fs); if (!prog) return null; quad(gl, prog);
  const mkT = (): WebGLTexture => { const t = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, NN, 1, 0, gl.RGBA, gl.FLOAT, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return t; };
  const tx = mkT(), ta = mkT(), to = mkT(); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, to, 0);
  const up = new Float32Array(NN * 4); const rd = new Float32Array(NN * 4);
  const upl = (t: WebGLTexture, v: Float32Array): void => { for (let i = 0; i < NN; i++) up[i * 4] = v[i]; gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NN, 1, gl.RGBA, gl.FLOAT, up); };
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    upl(tx, x); if (add) upl(ta, add); gl.useProgram(prog); gl.viewport(0, 0, NN, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(gl.getUniformLocation(prog, "X"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ta); gl.uniform1i(gl.getUniformLocation(prog, "A"), 1); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1ui(gl.getUniformLocation(prog, "L"), l); gl.uniform1i(gl.getUniformLocation(prog, "rows"), rows); gl.uniform1i(gl.getUniformLocation(prog, "mode"), mode); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.readPixels(0, 0, NN, 1, gl.RGBA, gl.FLOAT, rd); const out = new Float32Array(NN); for (let i = 0; i < NN; i++) out[i] = rd[i * 4]; return out; };
  return { kind: "WebGL2 fragment-shader fallback", info: String(gl.getParameter(gl.RENDERER)), fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) }; }
// --- LoRA adapters into all 4 body layers: W_l + A_l·B_l, rank 16. Exact backprop through the procedural weights via the transpose kernel ---
const RK = 16;
class Lora { A: Float32Array[]; B: Float32Array[]; constructor() { this.A = Array.from({ length: NL }, () => new Float32Array(NN * RK)); this.B = Array.from({ length: NL }, () => { const b = new Float32Array(RK * NN); for (let i = 0; i < b.length; i++) b[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; return b; }); }
  count(): number { return NL * 2 * NN * RK; }
  z(l: number, h: Float32Array): Float32Array { const z = new Float32Array(RK), B = this.B[l]; for (let k = 0; k < RK; k++) { let s = 0; const off = k * NN; for (let i = 0; i < NN; i++) s += B[off + i] * h[i]; z[k] = s; } return z; }
  add(l: number, z: Float32Array, rows: number): Float32Array { const a = new Float32Array(NN), A = this.A[l]; for (let o = 0; o < rows; o++) { let s = 0; const off = o * RK; for (let k = 0; k < RK; k++) s += A[off + k] * z[k]; a[o] = s; } return a; } }
function linkProg(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null { const mk = (t: number, s: string): WebGLShader | null => { const sh = gl.createShader(t); if (!sh) return null; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; } return sh; };
  const a = mk(gl.VERTEX_SHADER, vs), b = mk(gl.FRAGMENT_SHADER, fs); if (!a || !b) return null; const p = gl.createProgram(); if (!p) return null; gl.attachShader(p, a); gl.attachShader(p, b); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; } return p; }
function quad(gl: WebGL2RenderingContext, _p: WebGLProgram): void { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); }

// --- HDR renderer: raymarched SDF body, iridescent thin-film + subsurface skin, bloom, ACES, chromatic aberration ---
const VS = `#version 300 es\nin vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
const SCENE_FS = `#version 300 es
precision highp float; precision highp int; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T; uniform vec3 Lp[48]; uniform vec4 N; uniform vec4 N2; uniform vec4 Q; uniform vec2 M; uniform float calm; uniform vec4 W4;
uniform highp sampler2D ACT; uniform uint RG[16]; uniform vec4 QP; uniform float EN; uniform float WS; uniform vec4 CUT; uniform float SIG;
// Body plan: short asymmetric hollow shell (cutaway) with spines, membrane fin, red eye cluster and limbs outside;
// inside: 4 nested activation shells (real 100M-net activations), a second brain lobe, RV32I register die, 2-qubit core, energy organ, signal fibers.
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float cap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float capH(vec3 p, vec3 a, vec3 b){ vec3 pa=p-a, ba=b-a; return clamp(dot(pa,ba)/dot(ba,ba),0.,1.); }
float box(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
vec3 rot4(vec3 p){ vec4 q=vec4(p, W4.x); float c=cos(W4.y), s=sin(W4.y); q.xw=mat2(c,-s,s,c)*q.xw; c=cos(W4.z); s=sin(W4.z); q.yw=mat2(c,-s,s,c)*q.yw; return q.xyz/(1.6-q.w*.35); }
const vec3 C0=vec3(0.,.02,0.), C2=vec3(.2,.13,-.07), CPU=vec3(-.15,-.13,.04), QA=vec3(.05,-.17,.12), QB=vec3(.12,-.15,.07), ORG=vec3(-.13,.1,-.13);
float body(vec3 p){ vec3 bp=rot4(p)*1.6; float n=sin(bp.x*9.+T*.5*(1.-calm*.6))*sin(bp.y*7.-T*.4)*sin(bp.z*8.+T*.3);
  float d=length(p*vec3(1.,1.12,.95))-(.36+.03*N.x); d=smin(d, length(p-vec3(.21,.12,-.07))-.22, .1); d=smin(d, length(p-vec3(-.17,-.11,.1))-.19, .1); d=smin(d, length(p-vec3(.02,-.2,-.12))-.15, .08);
  return d + n*(.018+.025*N.y); }
float shellD(vec3 p){ float d=abs(body(p))-.018; float cut=dot(p,CUT.xyz)-CUT.w; return max(d, cut); }
vec2 opU(vec2 a, vec2 b){ return a.x<b.x?a:b; }
vec2 outer(vec3 p){ vec2 r=vec2(shellD(p),0.);
  // limbs: 5 of the 8 simulated chains, shortened and of unequal thickness
  float dl=1e9; for(int l=0;l<8;l++){ if(l==2||l==5||l==7) continue; float th=.03+.012*float(l%3); for(int s=0;s<5;s++){ int k=l*6+s; vec3 a=Lp[k]*.62, b=Lp[k+1]*.62; dl=smin(dl, cap(p,a,b, th*(1.-float(s)/6.)+.006), .05); } } r=opU(r, vec2(dl,1.));
  // dorsal spines, unequal
  float ds=1e9; for(int i=0;i<7;i++){ float a=-.9+float(i)*.32; vec3 b=vec3(sin(a)*.3, .26+.04*sin(float(i)*2.1), cos(a)*.18-.05); vec3 tip=b+normalize(b-vec3(0.,-.1,0.))*(.12+.1*fract(sin(float(i)*12.9)*437.))+vec3(0.,.02*sin(T*.6+float(i)),0.); ds=min(ds, cap(p,b,tip,.012*(1.+float(i%2)))); } r=opU(r, vec2(ds,1.));
  // membrane fin between two limbs (thin, perforated)
  vec3 q=p-vec3(-.34,.02,-.05); float dm=max(abs(q.z+.15*q.x*q.x)-.004, length(q.xy)-.2); dm=max(dm, -(length(fract(q.xy*16.)-.5)-.18)); r=opU(r, vec2(dm,3.));
  // eye cluster: 7 red eyes of different sizes on the right-front
  float de=1e9; for(int e=0;e<7;e++){ float a=float(e)*2.4; vec3 c=vec3(.26+.05*cos(a), .05+.07*sin(a), .26+.03*cos(a*1.7)); de=min(de, length(p-c)-(.02+.012*fract(float(e)*.37))); } r=opU(r, vec2(de,2.));
  return r; }
vec2 inner(vec3 p){ vec3 q=p-C0; float rr=length(q); vec2 r=vec2(1e9,0.);
  for(int l=0;l<4;l++){ float R0=.07+.032*float(l); float d=abs(rr-R0)-.004; vec3 g=abs(fract(q*28.)-.5); d=max(d, -(min(g.x,min(g.y,g.z))-.12)); r=opU(r, vec2(d,10.+float(l))); }
  r=opU(r, vec2(length(p-C2)-.06+.006*sin(p.x*70.)*sin(p.y*60.), 20.));
  r=opU(r, vec2(box(p-CPU, vec3(.07,.012,.045)), 21.));
  r=opU(r, vec2(min(length(p-QA), length(p-QB))-.026, 22.));
  r=opU(r, vec2(length((p-ORG)*vec3(1.,1.3,1.))-(.05+.012*EN*sin(T*1.6)), 23.));
  float df=1e9; df=min(df, cap(p,C0,C2,.006)); df=min(df, cap(p,C0,CPU,.006)); df=min(df, cap(p,C0,(QA+QB)*.5,.006)); df=min(df, cap(p,C0,ORG,.006)); df=min(df, cap(p,C0,vec3(.26,.05,.26),.005)); r=opU(r, vec2(df,24.));
  return r; }
vec2 map(vec3 p){ return opU(outer(p), inner(p)); }
vec3 nrm(vec3 p){ vec2 e=vec2(.0012,0); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec3 film(float c, float th){ vec3 l=vec3(650.,530.,440.); return .5+.5*cos(6.2832*(2.*1.33*th*c)/l); }
vec3 hue(float h){ return .5+.5*cos(6.2832*(h+vec3(0.,.33,.67))); }
float act(int l, vec3 q){ float u=atan(q.z,q.x)/6.2832+.5, v=acos(clamp(q.y/max(length(q),1e-4),-1.,1.))/3.1416; return texelFetch(ACT, ivec2(clamp(int(u*100.),0,99), l*50+clamp(int(v*50.),0,49)), 0).r; }
vec3 shade(vec3 p, vec3 rd, float id, out float alpha){ vec3 n=nrm(p), v=-rd, L=normalize(vec3(.5,.8,.4)); float c=max(dot(n,v),0.), dif=max(dot(n,L),0.), fr=pow(1.-c,3.); float spec=pow(max(dot(reflect(-L,n),v),0.),60.); alpha=1.;
  if(id<.5){ // hollow shell: moss base, iridescent thin film, neon glitch bands, fresnel transparency
    vec3 moss=vec3(.05,.16,.04); vec3 ir=film(c, 260.+240.*N.w); float band=step(.86, fract(p.y*14.+floor(T*.5)*.37))*(1.-calm);
    alpha=mix(.06,.5,fr); return moss*(.15+.6*dif)+ir*fr*.55+hue(p.y*2.+T*.03)*band*.5+spec*vec3(.9)+vec3(1.,.15,.1)*N2.x*.6; }
  if(id<1.5){ float tip=smoothstep(.35,.0,length(p)-.42); vec3 base=mix(vec3(.003,.003,.004),vec3(.05,.16,.04),smoothstep(.2,.5,length(p))); return base*(.25+dif)+film(c,300.+200.*sin(p.y*9.))*fr*.7+hue(length(p)*3.+T*.02)*(1.-tip)*.35*(1.-calm*.5)+spec*vec3(.6); }
  if(id<2.5){ vec3 look=normalize(vec3(M*.6,1.)); float pupil=smoothstep(.85,.97,dot(n,look)); return mix(vec3(1.6,.05,.03)*(1.+Q.x), vec3(0.), pupil)+vec3(2.)*spec; }
  if(id<3.5){ alpha=.55; return film(c,200.+300.*N.z)*.9+vec3(.9,.35,.05)*.2; }
  if(id<14.){ int l=int(id-10.+.5); float a=act(l, p-C0); return hue(.6+a*.35+float(l)*.08)*(.15+1.6*abs(a))*(1.-.4*calm); }
  if(id<20.5) return vec3(.5,.2,.6)*(.2+dif)+vec3(.9,.3,1.)*.5*abs(N.z)*(.5+.5*sin(p.x*80.+p.y*70.));
  if(id<21.5){ vec2 cell=(p.xz-CPU.xz)/vec2(.14,.09)+.5; int ci=clamp(int(cell.x*8.),0,7)+8*clamp(int(cell.y*2.),0,1); uint w=RG[ci]; int bit=clamp(int(fract(cell.x*8.)*4.)+4*int(fract(cell.y*2.)*2.),0,7);
    float on=float((w>>uint(bit*4+int(fract(cell.y*8.)*1.)))&1u); return n.y>.5 ? mix(vec3(.02,.03,.02), vec3(.1,1.4,.3), on) : vec3(.03)*(.3+dif); }
  if(id<22.5){ vec3 b=normalize(vec3(QP.y-QP.z, QP.x-QP.w, QP.y+QP.z-.5)); float ax=pow(max(dot(n,b),0.),20.); return vec3(.2,.5,1.4)*(.3+dif)+vec3(1.4,1.2,.3)*ax*2.; }
  if(id<23.5) return vec3(.15,.8,.12)*(.2+1.2*EN)+vec3(1.,.4,.05)*fr;
  float s=.5+.5*sin(length(p-C0)*60.-T*SIG); return vec3(1.,.45,.05)*(.1+1.6*s*s); }
void main(){ vec2 q=(uv*R*2.-R)/R.y; float yaw=M.x*.7+T*.05*(1.-calm*.7), pit=M.y*.4; vec3 ro=vec3(sin(yaw)*1.55, pit+.1, cos(yaw)*1.55); vec3 f=normalize(-ro), r=normalize(cross(vec3(0,1,0),f)), u=cross(f,r);
  vec3 rd=normalize(f*1.6+r*q.x+u*q.y);
  vec3 bg=vec3(.004,.002,.006)+.012*vec3(.05,.2,.05)*(1.-length(q)*.5);
  // orange spores drifting in the dark
  vec2 sg=q*9.+vec2(0.,T*.05); vec2 cid=floor(sg); float hsh=fract(sin(dot(cid,vec2(12.9,78.2)))*43758.5); if(hsh>.86){ vec2 c=fract(sg)-.5-.3*vec2(sin(hsh*40.),cos(hsh*30.)); bg+=vec3(1.2,.4,.04)*smoothstep(.06,0.,length(c))*(.4+.6*hsh); }
  vec3 acc=vec3(0.); float tr=1.; float t=0.; int layers=0;
  for(int i=0;i<110;i++){ vec3 p=ro+rd*t; vec2 h=map(p); if(t>4.) break;
    if(h.x<.0012){ float a; vec3 c=shade(p,rd,h.y,a); acc+=tr*a*c; tr*=1.-a; layers++; if(tr<.03||layers>4) break; t+=.03; continue; }
    t+=max(h.x*.8,.002); }
  vec3 col=acc+tr*bg; o=vec4(col,1.); }`;
const BRIGHT_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; void main(){ vec3 c=texture(S,uv).rgb; o=vec4(max(c-vec3(.9),0.),1.); }`;
const BLUR_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform vec2 D; void main(){ vec3 c=texture(S,uv).rgb*.227; float w[4]=float[](.194,.121,.054,.016); for(int i=1;i<5;i++){ c+=(texture(S,uv+D*float(i)).rgb+texture(S,uv-D*float(i)).rgb)*w[i-1]; } o=vec4(c,1.); }`;
const COMP_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform sampler2D B; uniform float ca; uniform float bloom; uniform float expo;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
void main(){ vec2 d=(uv-.5)*ca; vec3 c=vec3(texture(S,uv+d).r, texture(S,uv).g, texture(S,uv-d).b); c+=texture(B,uv).rgb*bloom; c=aces(c*expo); c=pow(c,vec3(1./2.2)); float vg=1.-.35*dot(uv-.5,uv-.5)*2.; o=vec4(c*vg,1.); }`;
type RT = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };
function mkRT(gl: WebGL2RenderingContext, w: number, h: number): RT { const tex = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer() as WebGLFramebuffer; gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); return { fb, tex, w, h }; }

type Hud = { arousal?: number; light?: number; gens?: number; head?: string; loraSteps: number; loraLoss: number; backend: string; gpu: string; inferParams: number; rowsActive: number; learned: number; fps: number; passHz: number; bw: number; bh: number; scale: number; loss: number[]; energy: number; integrity: number; conf: number; ws: string; att: number; probs: number[]; S: number; regs: number[]; pc: number; steps: number; saved: string; mood: string };
const MODS = ["gaze", "sound", "hunger", "novelty"];
const MOODS = ["|00> drift", "|01> hunt", "|10> recoil", "|11> elsewhere"];
const fmt = (n: number): string => n.toLocaleString("en-US");

export default function Creature() {
  const theme = useGrokTheme();
  const cv = useRef<HTMLCanvasElement>(null);
  const LTQ = new URLSearchParams(typeof location !== "undefined" ? location.search : ""); const LIVE = LTQ.get("livetest") === "1"; const [started, setStarted] = useState(LIVE); const [calm, setCalm] = useState(false); const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null); const [glErr, setGlErr] = useState("");
  const [evalItems, setEvalItems] = useState<Item[]>([]); const [evalRun, setEvalRun] = useState(""); const [showJson, setShowJson] = useState(false); const [jsonUrl, setJsonUrl] = useState("");
  const ctl = useRef({ calm: false, muted: false, power: [0, 0, 0, 0] as number[], sound: false, damage: 0 });
  ctl.current.calm = calm; ctl.current.muted = muted;
  const audio = useRef<{ master: GainNode } | null>(null);
  const hudRef = useRef<Hud | null>(null); const orgRef = useRef<Organism | null>(null); const [orgReady, setOrgReady] = useState(false); const [speed, setSpeedS] = useState(2); const speedRef = useRef(2);
  useEffect(() => { if (audio.current) audio.current.master.gain.value = muted ? 0 : 0.12; }, [muted]);

  useEffect(() => {
    if (!started) return; const canvas = cv.current; if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false }); if (!gl || !gl.getExtension("EXT_color_buffer_float")) { setGlErr("WebGL2 with float render targets is not available in this browser, so the body cannot render."); return; }
    const progs = { scene: linkProg(gl, VS, SCENE_FS), bright: linkProg(gl, VS, BRIGHT_FS), blur: linkProg(gl, VS, BLUR_FS), comp: linkProg(gl, VS, COMP_FS) };
    if (!progs.scene || !progs.bright || !progs.blur || !progs.comp) { setGlErr("A shader failed to compile on this GPU."); return; }
    quad(gl, progs.scene);
    const actTex = gl.createTexture() as WebGLTexture; gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 100, 200, 0, gl.RED, gl.FLOAT, new Float32Array(20000)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.activeTexture(gl.TEXTURE0); let actShown: Float32Array[] = [];
    let alive = true; let engine: Engine | null = null; let busy = false; let passes = 0, passT = performance.now(), passHz = 0; let rows = NN;
    void (async () => { try { engine = await makeWebGPU(); } catch { engine = null; } if (!engine) engine = makeWebGL2Engine(); })();
    // learned readout 5000 -> 8 (trained by the autodiff tape), persisted
    const Wr = new Tn(NN * NOUT), br = new Tn(NOUT); for (let i = 0; i < Wr.v.length; i++) Wr.v[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; let saved = "new life";
    try { const s = localStorage.getItem("creature1.v2.readout"); if (s) { const b = atob(s); const f = new Float32Array(new Uint8Array(Array.from(b, (c) => c.charCodeAt(0))).buffer); if (f.length === Wr.v.length + NOUT) { Wr.v.set(f.subarray(0, Wr.v.length)); br.v.set(f.subarray(Wr.v.length)); saved = "resumed learned readout from a previous visit"; } } } catch { saved = "storage unavailable; this session only"; }
    const save = (): void => { try { const f = new Float32Array(Wr.v.length + NOUT); f.set(Wr.v); f.set(br.v, Wr.v.length); const u = new Uint8Array(f.buffer); let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...Array.from(u.subarray(i, i + 8192))); localStorage.setItem("creature1.v2.readout", btoa(s)); saved = "learned readout saved " + new Date().toLocaleTimeString(); } catch { /* sandbox */ } };
    let feat: Float32Array = new Float32Array(NN); let out: Float32Array = new Float32Array(NOUT); let lastPredT: Tn | null = null; const lossH: number[] = []; const lora = new Lora(); let layerActs: Float32Array[] = []; let loraLoss = 0, loraSteps = 0; let passMs = 0; let lastTarget: number[] = [0, 0, 0, 0];
    const proj = Array.from({ length: NN }, (_, i) => [i % 24, ((Math.imul(i + 1, 2654435761) >>> 0) % 2) ? 1 : -1]);
    // body, metabolism, workspace, attention schema, metacognition
    const limbs = Array.from({ length: 8 }, (_, l) => ({ a: (l / 8) * 6.283, x: new Float64Array(18), p: new Float64Array(18) }));
    for (const L of limbs) for (let s = 0; s < 6; s++) { L.x[s * 3] = Math.cos(L.a) * 0.4 * (1 + s * 0.2); L.x[s * 3 + 1] = -0.2; L.x[s * 3 + 2] = Math.sin(L.a) * 0.4 * (1 + s * 0.2); }
    let energy = 0.8, integrity = 1, conf = 0.5, t = 0; const att = { ea: 0, ed: 0, P: 1 }; let wsIdx = 0; let curiosity = 0;
    const qs = new QSim(); let S = chsh(160); let collapsed = -1, collapseT = 0; let mood = 0;
    const rv = new RV(); rv.x[10] = osU32() | 1;
    const ABL = (LTQ.get("ablate") || "").split(",").filter(Boolean); const organs = new Organs(Number(LTQ.get("seed")) || (osU32() % 100000), ABL); (window as any).__organs = organs; const org = new Organism({ seed: Number(LTQ.get("seed")) || (osU32() % 100000), entropy: "crypto" }); orgRef.current = org; (window as any).__org = org; setOrgReady(true); let ov = org.view(); let frame = 0, startle = 0, arousal = 0.5, light = 0; const LR: { R: number; ar: number; th: number }[] = []; const FR = Number(LTQ.get("frames")) || 480;
    const m = { x: 0, y: 0, vx: 0, vy: 0, in: false, click: 0 };
    const onMove = (e: PointerEvent): void => { const r = canvas.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1); m.vx = nx - m.x; m.vy = ny - m.y; m.x = nx; m.y = ny; m.in = true; };
    const onLeave = (): void => { m.in = false; }; const onDown = (): void => { m.click = 1; startle = Math.max(startle, organs.poke((m.x > 0 ? "R" : "L") + (m.y > 0 ? "U" : "D"))); /* habituation organ */ };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave); canvas.addEventListener("pointerdown", onDown);
    let A: { ac: AudioContext; master: GainNode; shep: { o: OscillatorNode; g: GainNode }[]; bl: OscillatorNode; br: OscillatorNode; voice: OscillatorNode; f1: BiquadFilterNode; pan: PannerNode; an: AnalyserNode | null } | null = null;
    if (ctl.current.sound) { try { const ac = new AudioContext(); const master = ac.createGain(); master.gain.value = ctl.current.muted ? 0 : 0.12; const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      const shep = Array.from({ length: 8 }, () => { const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); return { o, g }; });
      const mg = ac.createChannelMerger(2); const bl = ac.createOscillator(), brr = ac.createOscillator(); const bg = ac.createGain(); bg.gain.value = 0.2; bl.frequency.value = 110; brr.frequency.value = 116; bl.connect(mg, 0, 0); brr.connect(mg, 0, 1); mg.connect(bg); bg.connect(master); bl.start(); brr.start();
      const voice = ac.createOscillator(); voice.type = "sawtooth"; const f1 = ac.createBiquadFilter(); f1.type = "bandpass"; f1.Q.value = 10; const vg = ac.createGain(); vg.gain.value = 0.25; const pan = ac.createPanner(); pan.panningModel = "HRTF"; pan.positionZ.value = -1.5; voice.connect(f1); f1.connect(vg); vg.connect(pan); pan.connect(master); voice.start();
      A = { ac, master, shep, bl, br: brr, voice, f1, pan, an: null }; audio.current = { master }; } catch { A = null; } }
    (window as unknown as { __c1mic?: () => void }).__c1mic = () => { if (!A) return; const a = A; void navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => { const an = a.ac.createAnalyser(); an.fftSize = 512; a.ac.createMediaStreamSource(st).connect(an); a.an = an; }).catch(() => undefined); };
    // render targets with adaptive resolution (backbuffer capped at 3840 px wide)
    let scale = Math.min(2, devicePixelRatio || 1); let rts: RT[] = []; let bw = 0, bh = 0; const fpsH: number[] = [];
    const resize = (): void => { const cw = canvas.clientWidth, ch = canvas.clientHeight; const s = Math.min(scale, 3840 / Math.max(1, cw)); bw = Math.max(64, Math.floor(cw * s)); bh = Math.max(64, Math.floor(ch * s)); canvas.width = bw; canvas.height = bh;
      rts = [mkRT(gl, bw, bh), mkRT(gl, bw >> 2, bh >> 2), mkRT(gl, bw >> 2, bh >> 2)]; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const U = (p: WebGLProgram, n: string): WebGLUniformLocation | null => gl.getUniformLocation(p, n);
    const lpArr = new Float32Array(48 * 3);
    let raf = 0, prev = performance.now(), lastHud = 0, lastSave = performance.now(), lastAdapt = performance.now();
    const loop = (now: number): void => { if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - prev) / 1000); fpsH.push((now - prev) / 1000); prev = now; /* raw frame time: v2 pushed the clamped dt, which overstated fps */ if (fpsH.length > 60) fpsH.shift(); const C = ctl.current; const ck = C.calm ? 0.4 : 1; t += dt * ck;
      const fps = fpsH.length / fpsH.reduce((a, b) => a + b, 0);
      if (now - lastAdapt > 1500 && fpsH.length > 30) { lastAdapt = now; const ns = fps < 40 ? Math.max(0.5, scale * 0.8) : fps > 57 ? Math.min(Math.min(4, (devicePixelRatio || 1) * 2), scale * 1.15) : scale; if (Math.abs(ns - scale) > 0.02) { scale = ns; resize(); } }
      let mic = 0; if (A && A.an) { const b = new Uint8Array(A.an.fftSize); A.an.getByteTimeDomainData(b); let s = 0; for (const v of b) s += (v - 128) ** 2; mic = Math.min(1, Math.sqrt(s / b.length) / 30); }
      const gx = m.in ? m.x : Math.sin(t * 0.21) * 0.6, gy = m.in ? m.y : Math.cos(t * 0.13) * 0.4;
      // RV32I core: 8 loop iterations per frame
      rv.mem.setInt32(256, Math.floor(1 + 600 * Math.hypot(m.vx, m.vy)), true); for (let i = 0; i < PROGRAM.length * 8; i++) rv.step(); const phase = rv.mem.getInt32(260, true) * 0.002, mut = rv.mem.getUint32(264, true);
      frame++; light = (frame % 24) < 12 ? 1 : 0; organs.circ(light); /* legacy v2.3 oscillator kept for the lineage chain; arousal/light now come from the organism */ for (let k = 0; k < speedRef.current; k++) org.step(); ov = org.view(); light = ov.light; arousal = Math.max(0, Math.min(1, ov.NE / 0.6)); organs.recover(); startle *= 0.8; if (frame % 30 === 0) organs.mutate(mut); /* live organs: circadian, habituation, lineage */
      // attention schema (Kalman model of where its own attention is; noisy observation = gaze)
      { const obs = gx + (((mut >>> 8) & 255) / 255 - 0.5) * 0.3; const Kg = att.P / (att.P + 0.3); att.ea += Kg * (obs - att.ea) + att.ed; att.ed = 0.95 * att.ed + 0.05 * Kg * (obs - att.ea); att.P = (1 - Kg) * att.P + 0.02; }
      // workspace: 4 modules compete by salience, winner broadcast
      const salience = [Math.hypot(m.vx, m.vy) * 40 + (m.in ? 0.3 : 0), mic * 2, Math.max(0, 0.6 - energy) * 3, curiosity * 8];
      wsIdx = salience.indexOf(Math.max(...salience));
      const senses = [gx, gy, m.vx * 20, m.vy * 20, m.click, mic, energy * 2 - 1, integrity * 2 - 1, conf, curiosity * 4, ...qs.probs(), Math.sin(phase), Math.cos(phase), wsIdx / 3, att.ea, att.ed * 10, ov.DA, ov.kappa, /* organism state into the 100M net's senses (replaced two clock sinusoids) */ ((mut >>> 4) & 255) / 128 - 1, C.power[0] > 0 ? 1 : 0, C.power[1] > 0 ? 1 : 0];
      // GPU brain: asynchronous forward pass of the 100M procedural network; readout learns online
      if (engine && !busy) { busy = true; const x = new Float32Array(NN); for (let i = 0; i < NN; i++) x[i] = senses[proj[i][0]] * proj[i][1] * (1 - C.damage * ((i * 7919) % 100 < 40 ? 1 : 0));
        const eng = engine; const tgt = lastTarget.slice(); const pStart = performance.now(); void (async () => { const hs: Float32Array[] = [x]; const zs: Float32Array[] = []; const ro = (l: number): number => (l === NL - 1 ? NN : rows);
          for (let l = 0; l < NL; l++) { const z = lora.z(l, hs[l]); zs.push(z); hs.push(await eng.fwd(l, hs[l], ro(l), lora.add(l, z, ro(l)))); }
          feat = hs[NL]; layerActs = hs.slice(1);
          // LoRA training: exact gradient of the readout loss through all 4 layers (transpose kernel on the GPU for W_lᵀδ)
          let g: Float32Array = new Float32Array(NN); { const pr = new Float32Array(NOUT); for (let o = 0; o < NOUT; o++) { let s = br.v[o]; const off = o * NN; for (let i = 0; i < NN; i++) s += Wr.v[off + i] * feat[i]; pr[o] = Math.tanh(s); }
            let L = 0; for (let o = 0; o < tgt.length; o++) { const e = pr[o] - tgt[o]; L += e * e / tgt.length; const gp = 2 * e / tgt.length * (1 - pr[o] * pr[o]); const off = o * NN; for (let i = 0; i < NN; i++) g[i] += gp * Wr.v[off + i]; } loraLoss = L; }
          const lr = 0.002 * (0.3 + energy);
          for (let l = NL - 1; l >= 0; l--) { const h = hs[l + 1], R = ro(l); const d = new Float32Array(NN); for (let o = 0; o < R; o++) d[o] = g[o] * (1 - h[o] * h[o]);
            const A = lora.A[l], B = lora.B[l], z = zs[l]; const at = new Float32Array(RK); for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) at[k] += A[off + k] * dv; }
            let gn: Float32Array | null = l > 0 ? await eng.bwd(l, d, R) : null; if (gn) { for (let i = 0; i < NN; i++) { let s = 0; for (let k = 0; k < RK; k++) s += B[k * NN + i] * at[k]; gn[i] = gn[i] * 0.0245 + s; } }
            const cl = (v: number): number => Math.max(-0.05, Math.min(0.05, v)); const hp = hs[l];
            for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) A[off + k] -= lr * cl(dv * z[k]); }
            for (let k = 0; k < RK; k++) { const ak = at[k]; if (!ak) continue; const off = k * NN; for (let i = 0; i < NN; i++) B[off + i] -= lr * cl(ak * hp[i]); }
            if (gn) g = gn; }
          loraSteps++; passes++; const pd = performance.now() - pStart; passMs = passMs ? passMs * 0.7 + pd * 0.3 : pd; })().catch(() => { /* lost GPU */ }).finally(() => { busy = false; }); }
      if (now - passT > 1000) { passHz = passMs ? 1000 / passMs : 0; passes = 0; passT = now; /* from measured pass duration (forward + LoRA backward) */ if (passHz < 2 && rows > 1250) rows = Math.floor(rows * 0.75); else if (passHz > 20 && rows < NN) rows = Math.min(NN, Math.floor(rows * 1.25)); }
      const target = [gx, gy, energy * 2 - 1, integrity * 2 - 1]; lastTarget = target;
      if (lastPredT) { const Ls = mseTn(lastPredT, target); backwardTn(Ls); const lr = 0.0006 * (0.3 + energy) * (integrity > 0.3 ? 1 : 0.3); for (const P of [Wr, br]) { for (let k = 0; k < P.v.length; k++) P.v[k] -= lr * Math.max(-1, Math.min(1, P.g[k])); P.g.fill(0); }
        curiosity = curiosity * 0.95 + Ls.v[0] * 0.05; org.predErr = Math.max(org.predErr, Math.min(1, Ls.v[0])); /* GPU net prediction error → LC */ conf = conf * 0.95 + 0.05 * Math.exp(-Ls.v[0] * 4); lossH.push(Ls.v[0]); if (lossH.length > 120) lossH.shift(); }
      const xin = new Tn(NN); xin.v.set(feat); const pred = tanhTn(linT(xin, Wr, br, NN, NOUT)); lastPredT = pred; out = pred.v;
      // metabolism, homeostasis, damage & repair
      const activity = Math.abs(out[4]) * 0.4 + C.power.reduce((a, b) => a + (b > 0 ? 0.5 : 0), 0) + m.click;
      void activity; energy = Math.max(0, Math.min(1, 0.5 * Math.min(1, ov.atp / 2) + 0.5 * Math.min(1, ov.glc / 5))); /* energy = organism brain ATP + blood glucose */
      if (C.damage > 0) { integrity = Math.max(0, integrity - dt * 0.4); C.damage = Math.max(0, C.damage - dt * 0.05 * energy); } else integrity = Math.min(1, integrity + dt * 0.05 * energy);
      // quantum mood
      qs.reset(); qs.ry(0, (out[5] + 1) * 1.57 + curiosity * 2); qs.ry(1, (out[6] + 1) * 1.57 * energy + m.click); qs.cx(); const probs = qs.probs();
      if (collapseT > 0) collapseT -= dt; else collapsed = -1; if (m.click && collapsed < 0) { collapsed = qs.measure(osU32() / 4294967296); collapseT = 2.5; }
      { const am = probs.indexOf(Math.max(...probs)); mood = collapsed >= 0 ? collapsed : probs[am] > probs[mood] + 0.08 ? am : mood; }
      if (Math.floor(now / 30000) !== Math.floor((now - dt * 1000) / 30000)) S = chsh(160);
      // limbs: damped Hamiltonian chains, symplectic Euler, driven by network outputs and the broadcast module
      for (let l = 0; l < 8; l++) { const L = limbs[l]; const reach = (0.5 + 0.25 * out[l % NOUT] + 0.15 * Math.sin(t * 1.3 + l + phase)) * (0.4 + 0.6 * integrity) * (C.power[0] > 0 ? 1.4 : 1) * (ABL.includes("circbody") ? 1 : 0.7 + 0.6 * arousal) * (1 + 1.2 * startle);
        for (let s = 0; s < 6; s++) { const u = (s + 1) / 6; const sw = Math.sin(t * 1.7 + l * 0.8 + u * 3) * 0.3 * u + (wsIdx === 0 ? 0.3 * u : 0) * Math.sign(gx - Math.cos(L.a));
          const tx = Math.cos(L.a + sw) * (0.35 + u * reach) + gx * u * u * (mood === 1 ? 0.5 : 0.2), ty = -0.25 + Math.sin(t + l + u * 2) * 0.15 * u + gy * u * u * 0.3 - (C.power[2] > 0 ? 0.3 * u : 0), tz = Math.sin(L.a + sw) * (0.35 + u * reach);
          limbNodeStep(L.x, L.p, s * 3, [tx, ty, tz], dt, energy, ck); /* shared with V2.1-25 scale test */ }
        lpArr.set([0, 0, 0], (l * 6) * 3); for (let s = 0; s < 5; s++) lpArr.set([L.x[s * 3], L.x[s * 3 + 1], L.x[s * 3 + 2]], (l * 6 + s + 1) * 3); }
      if (LIVE) LR.push({ R: limbs.reduce((a, L) => a + Math.hypot(L.x[15], L.x[17]), 0) / 8, ar: arousal, th: organs.th });
      if (LIVE) { const poke = (fx: number, fy: number): void => { const r = canvas.getBoundingClientRect(); const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height }; canvas.dispatchEvent(new PointerEvent("pointermove", o)); canvas.dispatchEvent(new PointerEvent("pointerdown", o)); };
        if (frame >= 40 && frame <= 116 && (frame - 40) % 4 === 0) poke(0.75, 0.25); if (frame === 124) poke(0.25, 0.75);
        if (frame === FR) { const ta = organs.tamperAudit(100, mulberry((Number(LTQ.get("seed")) || 0) * 53 + 1)); const el = document.createElement("pre"); el.id = "livetest"; el.textContent = JSON.stringify({ R: LR.map((x) => +x.R.toFixed(5)), ar: LR.map((x) => +x.ar.toFixed(4)), th: LR.map((x) => +x.th.toFixed(4)), tamper: ta, gens: organs.G.length, head: organs.head() }); document.body.appendChild(el); } }
      for (let k = 0; k < 4; k++) C.power[k] = Math.max(0, C.power[k] - dt);
      if (A) { const ac = A.ac; const sp = (t * 0.03 * (C.power[1] > 0 ? -3 : 1) + out[7] * 0.2) % 1; const ph = sp < 0 ? sp + 1 : sp;
        A.shep.forEach((s, k) => { const f = 30 * Math.pow(2, k + ph); const lg = Math.log2(f / 300); s.o.frequency.setTargetAtTime(f, ac.currentTime, 0.05); s.g.gain.setTargetAtTime(Math.exp(-lg * lg / 2.5) * 0.05 * (0.4 + energy), ac.currentTime, 0.1); });
        A.br.frequency.setTargetAtTime(114 + 4 * out[3] + curiosity * 15, ac.currentTime, 0.3); A.voice.frequency.setTargetAtTime(70 + 40 * (out[2] + 1) + mic * 50, ac.currentTime, 0.2); A.f1.frequency.setTargetAtTime(400 + 900 * (out[1] + 1), ac.currentTime, 0.15);
        A.pan.positionX.setTargetAtTime(Math.sin(t * 0.15) * 1.2, ac.currentTime, 0.5); }
      if (now - lastSave > 20000) { save(); lastSave = now; }
      m.click = 0; m.vx *= 0.8; m.vy *= 0.8;
      // ---- render ----
      const sp = progs.scene as WebGLProgram; gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fb); gl.viewport(0, 0, bw, bh); gl.useProgram(sp);
      gl.uniform2f(U(sp, "R"), bw, bh); gl.uniform1f(U(sp, "T"), t); gl.uniform3fv(U(sp, "Lp"), lpArr); gl.uniform4f(U(sp, "N"), out[0], out[1], out[2], out[3]); gl.uniform4f(U(sp, "N2"), integrity < 0.7 ? 1 - integrity : 0, C.calm || ov.stage > 0 ? 0 : Math.max(0, out[4]) * 0.5, Math.min(1, ov.kappa), wsIdx === 1 ? 1 : 0.2);
      gl.uniform4f(U(sp, "Q"), collapsed >= 0 ? 1 : probs[3], probs[1] + (C.power[3] > 0 ? 1 : 0), 0, 0); gl.uniform2f(U(sp, "M"), att.ea, gy); gl.uniform1f(U(sp, "calm"), C.calm ? 1 : ov.stage > 0 ? 0.7 : 0); /* asleep → calm visuals */
      gl.uniform4f(U(sp, "W4"), 0.3 * out[5], t * 0.11 * ck + (C.power[0] > 0 ? t * 0.5 : 0), t * 0.07 * ck + out[6] * 0.5, 0); if (layerActs.length === NL && layerActs !== actShown) { actShown = layerActs; const a = new Float32Array(100 * 200); for (let l = 0; l < NL; l++) a.set(layerActs[l].subarray(0, 5000), l * 5000); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 100, 200, gl.RED, gl.FLOAT, a); }
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.uniform1i(U(sp, "ACT"), 2); gl.activeTexture(gl.TEXTURE0);
      gl.uniform1uiv(U(sp, "RG"), new Uint32Array(Array.from(rv.x.slice(0, 16), (v) => v >>> 0))); gl.uniform4f(U(sp, "QP"), probs[0], probs[1], probs[2], probs[3]); gl.uniform1f(U(sp, "EN"), energy); gl.uniform1f(U(sp, "WS"), wsIdx);
      { const yaw = att.ea * 0.7 + t * 0.05 * (C.calm ? 0.3 : 1) + 0.6; const nx = Math.sin(yaw), nz = Math.cos(yaw), ny = 0.25, nl = Math.hypot(nx, ny, nz); gl.uniform4f(U(sp, "CUT"), nx / nl, ny / nl, nz / nl, 0.04 + 0.08 * Math.sin(t * 0.1)); }
      gl.uniform1f(U(sp, "SIG"), (4 + 6 * Math.min(1, ov.ctx * 4)) * (C.calm ? 0.5 : 1)); /* fiber pulse ≤ 10 rad/s = 1.6 Hz at any pixel, below the 3 Hz limit */
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const bp = progs.bright as WebGLProgram, bl = progs.blur as WebGLProgram, cp = progs.comp as WebGLProgram;
      gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fb); gl.viewport(0, 0, rts[1].w, rts[1].h); gl.useProgram(bp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(bp, "S"), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(bl); for (const [src, dst, dx, dy] of [[1, 2, 1, 0], [2, 1, 0, 1], [1, 2, 2, 0], [2, 1, 0, 2]] as const) { gl.bindFramebuffer(gl.FRAMEBUFFER, rts[dst].fb); gl.bindTexture(gl.TEXTURE_2D, rts[src].tex); gl.uniform1i(U(bl, "S"), 0); gl.uniform2f(U(bl, "D"), dx / rts[1].w, dy / rts[1].h); gl.drawArrays(gl.TRIANGLES, 0, 6); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, bw, bh); gl.useProgram(cp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(cp, "S"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rts[1].tex); gl.uniform1i(U(cp, "B"), 1);
      gl.uniform1f(U(cp, "ca"), C.calm ? 0.002 : 0.006 + 0.02 * curiosity + (C.power[3] > 0 ? 0.012 : 0)); gl.uniform1f(U(cp, "bloom"), C.calm ? 0.5 : 1.1 + 0.6 * Math.max(0, out[3])); gl.uniform1f(U(cp, "expo"), 1.1 + 0.3 * energy); gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (now - lastHud > 250) { lastHud = now; const h: Hud = { backend: engine ? engine.kind : "starting…", gpu: engine ? engine.info : "", inferParams: (NL - 1) * rows * NN + NN * NN, rowsActive: rows, learned: NN * NOUT + NOUT + lora.count(), loraSteps, loraLoss, fps, passHz, bw, bh, scale, loss: lossH.slice(), energy, integrity, conf,
        arousal, light, gens: organs.G.length, head: organs.head(), ws: MODS[wsIdx], att: att.ea, probs, S, regs: Array.from(rv.x.slice(0, 16)), pc: rv.pc, steps: rv.steps, saved, mood: collapsed >= 0 ? "collapsed → " + MOODS[collapsed] : "superposed, leaning " + MOODS[mood] }; hudRef.current = h; setHud(h); } };
    const onKey = (e: globalThis.KeyboardEvent): void => { const k = "1234".indexOf(e.key); if (k >= 0) ctl.current.power[k] = 3; };
    window.addEventListener("keydown", onKey); raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); save(); window.removeEventListener("keydown", onKey); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("pointerdown", onDown); if (A) void A.ac.close(); audio.current = null; };
  }, [started]);

  const runEval = (): void => { setEvalItems([]); const acc: Item[] = []; let i = 0; const t0 = performance.now(); const STEPS2: [string, () => Item[]][] = [...STEPS, ["Prereg v2", runV2], ["Prereg v2.1", v21Tests]];
    const next = (): void => { if (i < STEPS2.length) { setEvalRun(`running ${STEPS2[i][0]} (${i + 1}/${STEPS2.length})…`); const f = STEPS2[i][1]; setTimeout(() => { acc.push(...f()); i++; setEvalItems(acc.slice()); next(); }, 10); return; }
      const ci = acc.findIndex((x) => x.id === "ctm"); acc.splice(ci + 1, 0, butlinRollup(acc));
      const sc = substrateCheck(); const a1 = JSON.stringify(rpt1()), a2 = JSON.stringify(rpt1()); const h = hudRef.current;
      for (const it of acc) { if (it.id === "23") it.note = `RV32I machine code vs native JS xorshift32: ${sc.n} outputs ${sc.ok ? "identical" : "MISMATCH"}`; if (it.id === "24") it.note = `RPT-1 re-run with same seeds: ${a1 === a2 ? "bit-identical" : "DIFFERENT"}`;
        if (it.id === "25") it.note = h ? `${fmt(h.inferParams)} inference weights (${h.backend}), ${h.bw}×${h.bh} HDR backbuffer, ${h.fps.toFixed(0)} fps, ${h.passHz.toFixed(1)} brain passes/s` : "start the creature to measure"; }
      setEvalItems(acc.slice()); setEvalRun(`done in ${((performance.now() - t0) / 1000).toFixed(1)} s · 16 seeds per condition`);
      try { const blob = new Blob([JSON.stringify({ disclaimer: "Functional indicator tests on the creature's core mechanisms in seeded toy tasks. Not evidence of consciousness. No aggregate score.", criteria: "pass iff Cohen's d >= 0.8 and Welch t >= 2.75 vs every control, 16 seeds", items: acc }, null, 1)], { type: "application/json" }); setJsonUrl(URL.createObjectURL(blob)); } catch { setJsonUrl(""); } };
    next(); };

  const mono = { fontFamily: theme.font.mono, fontSize: 11, lineHeight: "15px", color: theme.text.secondary } as const;
  const panel = { border: `1px solid ${theme.border.default}`, borderRadius: 12, padding: 12, minWidth: 0 } as const;
  const h = (s: string) => <div style={{ fontSize: 12, fontWeight: 600, color: theme.text.primary, marginBottom: 6 }}>{s}</div>;
  const spark = (a: number[]) => { const mx = Math.max(1e-6, ...a); return <svg width="100%" height="36" viewBox="0 0 120 36" preserveAspectRatio="none"><polyline fill="none" stroke={theme.dataviz.categorical[0]} strokeWidth="1.5" points={a.map((v, i) => `${(i / Math.max(1, a.length - 1)) * 120},${34 - (v / mx) * 32}`).join(" ")} /></svg>; };
  const fx = (v: number): string => (Number.isFinite(v) ? (Math.abs(v) >= 1000 ? v.toExponential(1) : v.toFixed(2)) : "∞");
  const ok = theme.dataviz.categorical[2], bad = theme.dataviz.categorical[1];
  const row = (it: Item) => <div key={it.id + it.group} style={{ borderTop: `1px solid ${theme.border.default}`, padding: "6px 0" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><span style={{ fontFamily: theme.font.mono, fontSize: 11, fontWeight: 700, color: it.category === "Implementation identified" ? theme.text.secondary : it.pass ? ok : bad, minWidth: 40 }}>{it.category === "Implementation identified" ? "IMPL" : it.pass ? "PASS" : "FAIL"}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{it.id} · {it.name}</span>{it.group === "CQM-25" && <span style={{ ...mono }}>[{it.category}]</span>}</div>
    <div style={mono}>{it.metric} · {it.mechanism}{it.note ? ` · ${it.note}` : ""}</div>
    {it.cmps.map((c, k) => <div key={k} style={{ ...mono, paddingLeft: 48 }}>{c.pass ? "✓" : "✗"} vs {c.control}: full {fx(c.full)} vs {fx(c.ctrl)} · d={fx(c.d)} · t={fx(c.t)}</div>)}</div>;
  const groups: [string, string][] = [["Butlin", "(a) Butlin et al. 14 indicators"], ["Framework", "(b) 10 frameworks and their falsifiers"], ["CQM-25", "(c) CQM-25 dimensions"], ["Prereg v2", "(d) Pre-registration v2: new non-ceiling tests for active inference, CQM-10, CQM-21 (v1 results above stay as they are)"], ["Prereg v2.1", "(e) Pre-registration v2.1: substrate pluralism, reproducibility, scale (the GPU comparisons need a GPU record from measure_gpu.ts; without one they show as failed in the page)"]];
  const RN = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2", "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5"];
  return (
    <div style={{ color: theme.text.primary, fontFamily: theme.font.family, display: "flex", flexDirection: "column", gap: 12, padding: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>Creature #1 · v3</div>
      <div style={{ color: theme.text.secondary, fontSize: 13 }}>A promptless artificial organism. Its brain is a 4-layer, 100,000,000-weight network evaluated on the GPU every pass, with weights regenerated procedurally from a seed instead of stored. Rank-16 LoRA adapters inside all four layers plus a readout (680,008 parameters) learn online through reverse-mode autodiff. The body is a raymarched signed-distance creature rendered in HDR, and every visual and sound parameter comes from network state. The Evaluate panel runs seeded experiments against ablations and controls.</div>
      {!started ? (
        <div style={{ ...panel, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Photosensitivity note: read before it wakes</div>
          <div style={{ fontSize: 13, color: theme.text.secondary }}>This contains slow color shifts, bloom glow, chromatic fringing, moving iridescent surfaces, and Shepard, binaural and spatial audio. Nothing strobes or flashes, and all brightness changes are smooth and slower than 3 Hz. Calm mode slows motion and reduces glow and fringing. Mute is always visible. If you are sensitive to moving patterns, start in calm mode or skip it. Audio works best on headphones at low volume.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="primary" label="Wake it (with sound)" onClick={() => { ctl.current.sound = true; setStarted(true); }} />
            <Button label="Wake it silently" onClick={() => { ctl.current.sound = false; setStarted(true); }} />
            <Toggle label="Start in calm mode" value={calm} onChange={setCalm} />
          </div>
        </div>) : (
        <Fragment>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Button label="1 Reach" onClick={() => { ctl.current.power[0] = 3; }} /><Button label="2 Reverse Shepard" onClick={() => { ctl.current.power[1] = 3; }} /><Button label="3 Crouch" onClick={() => { ctl.current.power[2] = 3; }} /><Button label="4 Shimmer" onClick={() => { ctl.current.power[3] = 3; }} />
            <Toggle label="Calm mode" value={calm} onChange={setCalm} /><Toggle label="Mute" value={muted} onChange={setMuted} />
            <Button label="Let it hear (mic)" onClick={() => { const f = (window as unknown as { __c1mic?: () => void }).__c1mic; if (f) f(); }} />
            <Button label="Injure it (silences 40% of brain inputs)" onClick={() => { ctl.current.damage = 1; }} />
            <Button label="Forget learned readout" onClick={() => { try { localStorage.removeItem("creature1.v2.readout"); } catch { /* none */ } }} />
          </div>
          {glErr ? <div style={{ ...panel, color: theme.text.secondary }}>{glErr}</div> : <canvas ref={cv} style={{ width: "100%", height: 600, borderRadius: 12, background: "#020104", cursor: "crosshair", touchAction: "none" }} />}
          {orgReady && orgRef.current && <Inspector org={orgRef.current} theme={theme} speed={speed} setSpeed={(n) => { speedRef.current = n; setSpeedS(n); }} />}
          {hud && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            <div style={panel}>{h("Parameter engine (measured)")}<div style={mono}>backend: {hud.backend} {hud.gpu}<br />inference weights used per pass: {fmt(hud.inferParams)}{hud.rowsActive < NN ? ` (adaptive: ${fmt(hud.rowsActive)}/${fmt(NN)} rows in layers 1–3)` : " (all 4×5000×5000)"}<br />weights: procedural hash(seed, layer, row, col), not stored, fp32 math<br />updated by learning: {fmt(hud.learned)} = 40,008 readout + {fmt(hud.learned - 40008)} LoRA (rank 16 into all 4 layers)<br />LoRA steps {fmt(hud.loraSteps)} · loss {hud.loraLoss.toFixed(3)} · effective weights W+AB per pass also add {fmt(NL * 2 * NN * RK)} adapter MACs<br />brain passes/s: {hud.passHz.toFixed(1)} · render {hud.fps.toFixed(0)} fps<br />backbuffer {hud.bw}×{hud.bh} RGBA16F (scale {hud.scale.toFixed(2)})</div></div>
            <div style={panel}>{h("Life signs")}<div style={mono}>energy {(hud.energy * 100).toFixed(0)}% · integrity {(hud.integrity * 100).toFixed(0)}%<br />confidence (metacognitive) {hud.conf.toFixed(2)}<br />organs: arousal {(hud.arousal ?? 0).toFixed(2)} ({hud.light ? "day" : "night"}) · lineage {hud.gens ?? 0} gens, head {String(hud.head ?? "").slice(0, 10)}<br />workspace broadcast: {hud.ws} · attention schema x̂ {hud.att.toFixed(2)}<br />mood {hud.mood}<br />{hud.saved}</div>{h("Surprise loss (online autodiff)")}{spark(hud.loss)}</div>
            <div style={panel}>{h("Quantum mood (2-qubit state vector, port)")}<div style={mono}>{hud.probs.map((p, i) => <div key={i}>{MOODS[i].padEnd(14, " ")} {"█".repeat(Math.round(p * 20))} {p.toFixed(3)}</div>)}CHSH S = {hud.S.toFixed(3)} (classical ≤ 2)</div></div>
            <div style={panel}>{h(`RV32I · pc=0x${hud.pc.toString(16)} · ${fmt(hud.steps)} instr`)}<div style={{ ...mono, display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>{hud.regs.map((r, i) => <div key={i}>x{i} {RN[i].padEnd(4, " ")} {(r >>> 0).toString(16).padStart(8, "0")}</div>)}</div></div>
          </div>}
        </Fragment>)}
      <div style={panel}>
        {h("Evaluate")}
        <div style={{ fontSize: 12, color: theme.text.secondary, marginBottom: 8 }}>These are functional indicator tests of the creature's core mechanisms, run in small seeded tasks. They are not evidence of consciousness, and no aggregate consciousness score is computed. Criteria were fixed before the first run: an item passes only if, against every control, Cohen's d ≥ 0.8 and Welch t ≥ 2.75 over 16 seeds. Failures are shown as they came out.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><Button variant="primary" label="Run all experiments" onClick={runEval} />
          {jsonUrl && <a href={jsonUrl} download="creature1-eval.json" style={{ color: theme.text.primary, fontSize: 12 }}>Download JSON</a>}
          {evalItems.length > 0 && <Button label={showJson ? "Hide JSON" : "Show JSON"} onClick={() => setShowJson(!showJson)} />}<span style={mono}>{evalRun}</span></div>
        {groups.map(([g, title]) => { const its = evalItems.filter((x) => x.group === g); return its.length ? <div key={g} style={{ marginTop: 10 }}>{h(title + ` · ${its.filter((x) => x.pass).length} pass / ${its.filter((x) => !x.pass && x.category !== "Implementation identified").length} fail${g === "CQM-25" ? ` / ${its.filter((x) => x.category === "Implementation identified").length} implementation-only` : ""}`)}{its.map(row)}</div> : null; })}
        {showJson && <pre style={{ ...mono, whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>{JSON.stringify(evalItems, null, 1)}</pre>}
      </div>
      <div style={panel}>{h("Wiring map")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Senses → 26 features: gaze, cursor velocity, click, mic level, energy, integrity, confidence, curiosity, qubit probabilities, RV32I phase, workspace winner, attention-schema state, keys. These are projected to 5000 inputs.
GPU brain: four dense tanh layers of 5000×5000 = 100,000,000 weights, w = hash(seed, layer, row, col), computed in a WebGPU compute shader (or a WebGL2 fragment shader). If the GPU is slow, layers 1–3 evaluate fewer rows, and the count shown is the true one.
Learning: 680,008 parameters. Rank-16 LoRA adapters (A·B) on all four 5000×5000 layers (640,000 params) are trained once per brain pass by exact backprop through the procedural weights (a GPU transpose kernel computes Wᵀδ). The 5000→8 tanh readout (40,008 params) is trained every frame by the reverse-mode autodiff tape to predict the next [gaze x, gaze y, energy, integrity]. The loss is surprise and drives curiosity; confidence comes from recent loss.
Outputs 0–3 → body radius, surface noise, skin hue, thin-film thickness, bloom; 4 → banding; 5–6 → qubit angles and 4D rotation; 7 → Shepard drift; 0–7 → limb reach.
Workspace: gaze, sound, hunger and novelty modules compete by salience. The winner is broadcast (gaze bends the limbs, sound lights the background).
Attention schema: a Kalman model of its own attention aims the eyes and the camera.
Metabolism: energy drains with activity and recovers toward a 0.7 setpoint. Injury silences 40% of brain inputs; integrity falls, then repairs at a rate scaled by energy.
Limbs: damped Hamiltonian chains integrated with symplectic Euler and fed to the SDF as capsules. The body SDF is 4D-rotated (xw, yw) before projection.
Body: a short, asymmetric, hollow shell (SDF shell 0.036 thick, fresnel transparency, a slowly rotating section cut) with unequal spines, a perforated membrane fin, a cluster of 7 red eyes and 5 limbs from the physics chains. Inside, all driven by live state: 4 nested shells colored by the actual activations of the 4 network layers (5000 units each, texture updated every brain pass), a second brain lobe (readout output), an RV32I die whose cells light from the live register bits, a 2-qubit core whose glowing axis follows the state-vector probabilities, an energy organ that swells with metabolism, and fibers whose pulse speed follows brain passes/s (≤1.6 Hz at any pixel). Orange spores drift in the dark.
Renderer: raymarched SDF → RGBA16F HDR → bright pass → 4× separable blur → ACES tone map + chromatic aberration + vignette. The backbuffer adapts between 0.5× and 4× DPR, capped at 3840 px wide.
RV32I: encoded machine code (xorshift32 + phase) runs 96 instructions per frame and sets limb phase.`}</div></div>
      <div style={panel}>{h("Prior-art check (quick search, Oct 2026; novel means not found, not proven)")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{"LoRA on a seed-regenerated random backbone | Established | closest: LottaLoRA, arXiv 2604.08749\nIn-browser WebGPU LoRA backward | Established | closest: Emberglass (GitHub maceip)\nHash weights recomputed per MAC in-shader + exact transpose kernel so LoRA trains through them live (WebGPU and WebGL2) | New combination | closest: the two above\nExecutable Butlin harness with ablations | Established | closest: tlcdv/the_consciousness_ai; symthaea\nPreregistered d and t vs every control across Butlin 14 + 10 frameworks + CQM-25, no aggregate score | New combination | closest: the above\nAttention schema that inflates its own uncertainty from its surprise (NIS) | New combination | closest: adaptive-inflation EnKF (arXiv 1507.08319, 2604.17343)\nBayesian latent-cause reversal learning | Established | closest: latent-cause models (Gershman et al.)\nExpected-free-energy expectimax over beliefs | Established | closest: active-inference literature\nPlasticity-shaped thresholded binary net scored on a phi proxy and partition-sensitive behavior | New combination | closest: none found\nHollow cutaway raymarched creature showing live 100M-net activations, RV32I registers and a qubit core | Novel as far as found | closest: arogozhnikov/3d_nn; tobis.vision Critters"}</div></div>
      <div style={panel}>{h("What runs here vs what is ported")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Runs here for real: the 100M-weight GPU forward pass (procedural weights; about 100M multiply-adds per pass), the online autodiff readout, the HDR raymarcher and bloom, the RV32I interpreter, the 2-qubit simulator and CHSH test, every evaluation experiment, Web Audio and localStorage.
Ported (TypeScript re-implementations, not the originals): Eshkol-style reverse-mode AD; Moonlab-style state vector and Bell-gated randomness. Neither Eshkol's WASM VM nor Moonlab's C library is executed, because a Page cannot load them.
Stand-in: crypto.getRandomValues replaces Moonlab's hardware entropy.
Not done: the 100M base weights stay fixed (procedural); 680,008 parameters learn (0.68% of the body). Adapters are session-only (not saved); the readout is saved. fp16 is used for render targets only.`}</div></div>
    </div>
  );
}
