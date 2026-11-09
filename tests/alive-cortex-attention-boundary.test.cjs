'use strict';
// Source-backed boundary regression. Only the real cortex/connectome allocation
// and bounded attention fragment execute; no application or external engine runs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
function extract(begin, end, maximum) {
  const start = source.indexOf(begin), stop = source.indexOf(end, start + begin.length);
  assert(start >= 0 && stop > start, 'Actual production source boundaries exist');
  assert.equal(source.indexOf(begin, start + begin.length), -1, 'Unique start boundary');
  const result = source.slice(start, stop);
  assert(result.length < maximum, 'Bounded source extraction');
  return result;
}
const allocation = extract('        const initXavier = (rows, cols) => {',
  '        // Sovereign Browser Master Controller Telemetry', 20000);
const attentionSource = extract('// BEGIN BOUNDED ATTENTION COVERAGE', '// END BOUNDED ATTENTION COVERAGE', 8000);
const allocate = new Function('hybridQrng', '"use strict";\n' + allocation);
const compile = text => new Function('dc', 'h128', 'zPost', 'rH', '"use strict";\n' + text);
const attention = compile(attentionSource);
function fixture() {
  const runtime = { W_actor: new Float32Array(80), W_critic: new Float32Array(16) };
  let seed = 17n;
  allocate.call(runtime, { u64() { return seed++; } });
  const dc = runtime.deepCortex;
  assert.equal(dc.W_attn_qkv.length, 12288);
  assert.equal(dc.W_attn_out.length, 4096, 'The declared 64 by 64 architecture must not inflate to hide an invalid read');
  assert.equal(dc.W_attn_out.byteLength, 16384);
  return dc;
}
function inputs() {
  return [Float32Array.from({ length: 128 }, (_, i) => .1 + i / 512),
    Float32Array.from({ length: 128 }, (_, i) => .2 + i / 1024),
    Float32Array.from({ length: 128 }, (_, i) => -.1 + i / 768)];
}
function finiteGates(dc) {
  assert(dc.attnWeights8.every(value => Number.isFinite(value) && value > 0), 'Every actual expert gate stays finite and positive');
}
function observeReads(values) {
  const seen = new Uint8Array(values.length);
  let reads = 0, maximum = -1;
  const proxy = new Proxy(values, { get(target, key) {
    if (typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key)) {
      const index = Number(key);
      assert(index < target.length, `Actual coefficient read ${index} exceeds allocated length ${target.length}`);
      seen[index] = 1; reads++; maximum = Math.max(maximum, index);
    }
    return Reflect.get(target, key, target);
  } });
  return { proxy, seen, get reads() { return reads; }, get maximum() { return maximum; } };
}

test('actual constructor attention remains finite across every QKV/output lane and multiple output wraps', () => {
  const dc = fixture(), latent = inputs();
  const qkv = observeReads(dc.W_attn_qkv), output = observeReads(dc.W_attn_out);
  dc.W_attn_qkv = qkv.proxy; dc.W_attn_out = output.proxy;
  for (let tick = 0; tick < 1025; tick++) {
    const beforeQ = qkv.reads, beforeOutput = output.reads;
    attention(dc, ...latent); finiteGates(dc);
    assert.equal(qkv.reads - beforeQ, 16, 'Unchanged bounded QKV read budget');
    assert.equal(output.reads - beforeOutput, 8, 'Unchanged bounded output read budget');
  }
  assert(qkv.seen.every(Boolean)); assert(output.seen.every(Boolean));
  assert.equal(output.maximum, 4095);
  assert.equal(dc.attentionQkvUniqueParameters, 12288);
  assert.equal(dc.attentionOutputUniqueParameters, 4096);
  assert.equal(dc.attentionParameterCoveragePct, 100, 'Coverage denominator matches actual declared parameters');
});

test('actual final output phase 511 wraps directly to phase zero without an out-of-range read', () => {
  const dc = fixture(), latent = inputs();
  attention(dc, ...latent);
  dc.attentionOutputPhase = 511;
  attention(dc, ...latent); finiteGates(dc);
  assert.equal(dc.attentionOutputPhase, 0);
  attention(dc, ...latent); finiteGates(dc);
  assert.equal(dc.attentionOutputPhase, 1);
});

test('the final declared output coefficient changes its actual expert gate on phase 511', () => {
  const left = fixture(), right = fixture(), latent = inputs();
  attention(left, ...latent); attention(right, ...latent);
  left.attentionOutputPhase = right.attentionOutputPhase = 511;
  right.W_attn_out[4095] += 2;
  attention(left, ...latent); attention(right, ...latent);
  finiteGates(left); finiteGates(right);
  assert(right.attnWeights8[7] > left.attnWeights8[7], 'The last allocated coefficient has a causal output path');
});

test('regression control: the former 1024-phase modulus poisons actual 4096-lane allocation at phase 512', () => {
  // Surgical fault injection only restores the old oversized phase modulus.
  // All numerical reads and gates still execute the extracted production code.
  const brokenSource = attentionSource.replace(/dc\.attentionOutputPhase % (?:512|1024)/,
    'dc.attentionOutputPhase % 1024').replace(/\(outputPhase \+ 1\) % (?:512|1024)/,
    '(outputPhase + 1) % 1024');
  assert.match(brokenSource, /dc\.attentionOutputPhase % 1024/);
  const dc = fixture(), latent = inputs(), broken = compile(brokenSource);
  broken(dc, ...latent); finiteGates(dc);
  dc.attentionOutputPhase = 512;
  broken(dc, ...latent);
  assert(dc.attnWeights8.every(Number.isNaN), 'The old bounds failure is observed, not hidden by a larger test allocation');
});
