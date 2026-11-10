'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const p171 = require('../systems/alive-zero3-fsdp-sharded-weight-bias-gather-engine.js');
const p172 = require('../systems/alive-megatron-tensor-ring-sequence-parallelism.js');
const p173 = require('../systems/alive-eagle-medusa-tree-speculative-draft-weights.js');
const p174 = require('../systems/alive-h2o-heavy-hitter-snap-kv-cache-eviction.js');
const p175 = require('../systems/alive-distributed-zero3-speculative-kv-phase34-audit.js');

test('Pass 171 ZeRO-3 / FSDP Sharded Weight/Bias AllGather Engine achieves 100.0 score across 5 seeds', () => {
  const res = p171.runPass171Evaluation();
  assert.equal(res.winningProfileId, 'zero3-fsdp-sharded-weights-double-buffered-prefetch');
  assert.equal(res.winningScore, 100);
});

test('Pass 172 Megatron Column-Row Tensor Parallelism & Ring Attention achieves 100.0 score across 5 seeds', () => {
  const res = p172.runPass172Evaluation();
  assert.equal(res.winningProfileId, 'megatron-col-row-tensor-ring-online-lse-parallelism');
  assert.equal(res.winningScore, 100);
});

test('Pass 173 EAGLE-2 / Medusa Tree Speculative Decoding achieves 100.0 score across 5 seeds', () => {
  const res = p173.runPass173Evaluation();
  assert.equal(res.winningProfileId, 'eagle2-context-aware-tree-speculative-lossless-verify');
  assert.equal(res.winningScore, 100);
});

test('Pass 174 H2O Heavy-Hitter Oracle & SnapKV Cache Eviction achieves 100.0 score across 5 seeds', () => {
  const res = p174.runPass174Evaluation();
  assert.equal(res.winningProfileId, 'h2o-snapkv-attention-sink-heavy-hitter-eviction');
  assert.equal(res.winningScore, 100);
});

test('Pass 175 Phase XXXIV Distributed Tensor Systems Acceptance Matrix verifies E2_1..E2_10 (10/10 rows)', () => {
  const res = p175.runPass175Phase34Audit();
  assert.equal(res.verifiedRowCount, 10);
  assert.equal(res.allVerified, true);
  assert.equal(typeof res.phase34Sha256, 'string');
  assert.equal(res.phase34Sha256.length, 64);
});
