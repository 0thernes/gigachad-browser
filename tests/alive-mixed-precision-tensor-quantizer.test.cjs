'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const quantizer = require('../systems/alive-mixed-precision-tensor-quantizer.js');

test('7-tier precision quantizer and Hessian-trace router cover FP64, FP32, BF16, INT8, INT4, NF4 and Binary', () => {
  assert.equal(quantizer.PRECISION_TIERS.length, 7);
  assert.equal(quantizer.assignPrecisionTierByHessian(0.95, 3.0, 0), 'FP64');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.80, 3.0, 1), 'FP32');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.62, 2.5, 2), 'BF16');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.45, 2.5, 3), 'INT8');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.25, 3.2, 4), 'NF4');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.25, 2.0, 5), 'INT4');
  assert.equal(quantizer.assignPrecisionTierByHessian(0.05, 1.5, 6), 'Binary');

  const sample = [-1.2, -0.4, 0.1, 0.8, 1.5];
  for (const tier of quantizer.PRECISION_TIERS) {
    const q = quantizer.quantizeTensorBlock(sample, tier.id);
    assert.equal(q.reconstructed.length, sample.length);
    assert.equal(q.bitsPerElement, tier.bits);
  }
});

test('5-seed Mixed-Precision Tensor Quantizer benchmark verifies hessian-nf4-error-feedback-ladder superiority', () => {
  const report = quantizer.runMixedPrecisionQuantizerBenchmark();
  assert.equal(report.passId, 'ALIVE-PASS-34-MIXED-PRECISION-TENSOR-QUANTIZER');
  assert.equal(report.seeds.length, 5);
  assert.equal(report.summary.winningProfile, 'hessian-nf4-error-feedback-ladder');
  assert.equal(report.summary.allSeedsVerified, true);
  assert.equal(report.summary.fullQuantizerScoreMean, 100);
  assert.equal(report.summary.spectralFidelityPctMean, 100);
  assert.equal(report.summary.compressionBudgetCompliancePctMean, 100);
  assert.equal(report.summary.sevenTierCoveragePctMean, 100);
  assert.ok(report.summary.meanCosineSimilarity >= 0.992);
  assert.ok(report.summary.meanCompressionRatioVsFp32 >= 4.0);
  assert.ok(report.summary.gainVsUniformBinary > 50);
  assert.ok(report.summary.gainVsStaticFp32 >= 50);
});
