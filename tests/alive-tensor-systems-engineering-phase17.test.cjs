'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pass86 = require('../systems/alive-cache-tiled-gemm-fused-epilogue.js');
const pass87 = require('../systems/alive-flash-attention-online-softmax-tiler.js');
const pass88 = require('../systems/alive-zero-alloc-reverse-autograd-tape.js');
const pass89 = require('../systems/alive-double-buffered-atomic-weight-server.js');
const pass90 = require('../systems/alive-tensor-systems-engineering-phase17-audit.js');

test('Pass 86 Cache-Tiled 4x4 GEMM + Fused Bias-SiLU Epilogue achieves 100.0 score across 5 seeds', () => {
  const res = pass86.runPass86TiledGemmBenchmark();
  assert.equal(res.passNumber, 86);
  assert.equal(res.winnerProfileId, 'cache_tiled_4x4_gemm_fused_bias_silu_zero_alloc');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 87 FlashAttention-2 Online Softmax Tiler achieves 100.0 score across 5 seeds', () => {
  const res = pass87.runPass87FlashAttentionBenchmark();
  assert.equal(res.passNumber, 87);
  assert.equal(res.winnerProfileId, 'flash_attention2_online_softmax_fused_alibi_tiler');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 88 Zero-Alloc Reverse-Mode Autograd Tape + O(sqrt(L)) Checkpointing achieves 100.0 score across 5 seeds', () => {
  const res = pass88.runPass88AutogradTapeBenchmark();
  assert.equal(res.passNumber, 88);
  assert.equal(res.winnerProfileId, 'zero_alloc_arena_autograd_sqrt_l_checkpointing');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 89 Double-Buffered RCU Atomic Weight Server achieves 100.0 score across 5 seeds', () => {
  const res = pass89.runPass89AtomicWeightServerBenchmark();
  assert.equal(res.passNumber, 89);
  assert.equal(res.winnerProfileId, 'double_buffered_rcu_ieee754_spectral_atomic_server');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 90 Phase XVII Tensor Systems Engineering Acceptance Matrix verifies K1..K10 across 5 seeds', () => {
  const audit1 = pass90.runPass90TensorSystemsPhase17Audit();
  const audit2 = pass90.runPass90TensorSystemsPhase17Audit();
  assert.equal(audit1.passNumber, 90);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.phase17Sha256.length, 64);
  assert.equal(audit1.phase17Sha256, audit2.phase17Sha256);
});
