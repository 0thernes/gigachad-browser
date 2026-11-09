'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pass81 = require('../systems/alive-ijepa-vjepa-ema-world-predictor.js');
const pass82 = require('../systems/alive-ot-cfm-optimal-transport-flow-matching.js');
const pass83 = require('../systems/alive-ttt-test-time-training-fast-weights.js');
const pass84 = require('../systems/alive-dreamerv3-symlog-twohot-rssm.js');
const pass85 = require('../systems/alive-world-models-ttt-phase16-audit.js');

test('Pass 81 I-JEPA/V-JEPA Cosine EMA + VICReg + Mask Positional Bias achieves 100.0 score across 5 seeds', () => {
  const res = pass81.runPass81IjepaVjepaBenchmark();
  assert.equal(res.passNumber, 81);
  assert.equal(res.winnerProfileId, 'ijepa_vjepa_cosine_ema_vicreg_mask_bias');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 82 Optimal-Transport Conditional Flow Matching (OT-CFM) achieves 100.0 score across 5 seeds', () => {
  const res = pass82.runPass82OtCfmFlowMatchingBenchmark();
  assert.equal(res.passNumber, 82);
  assert.equal(res.winnerProfileId, 'ot_cfm_rectified_straight_flow_2step_midpoint');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 83 Test-Time Training (TTT-Linear/MLP) Fast Weights achieves 100.0 score across 5 seeds', () => {
  const res = pass83.runPass83TttFastWeightsBenchmark();
  assert.equal(res.passNumber, 83);
  assert.equal(res.winnerProfileId, 'ttt_fast_weights_token_adaptive_eta_layernorm');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 84 DreamerV3 Symlog-Symexp Two-Hot Critic + Categorical RSSM achieves 100.0 score across 5 seeds', () => {
  const res = pass84.runPass84DreamerV3SymlogBenchmark();
  assert.equal(res.passNumber, 84);
  assert.equal(res.winnerProfileId, 'dreamerv3_symlog_twohot41_categorical_1pct_unimix');
  assert.equal(res.winnerCompositeScore, 100);
  assert.equal(res.gatesPassed, true);
});

test('Pass 85 Phase XVI World Models & TTT Acceptance Matrix verifies G1..G10 across 5 seeds', () => {
  const audit1 = pass85.runPass85WorldModelsTttPhase16Audit();
  const audit2 = pass85.runPass85WorldModelsTttPhase16Audit();
  assert.equal(audit1.passNumber, 85);
  assert.equal(audit1.verifiedRows, 10);
  assert.equal(audit1.totalRows, 10);
  assert.equal(audit1.allRowsVerified, true);
  assert.equal(audit1.phase16Sha256.length, 64);
  assert.equal(audit1.phase16Sha256, audit2.phase16Sha256);
});
