/**
 * ALIVE Pass 165: Phase XXXII Multi-Agent Game-Theoretic Equilibrium Weights
 * (CFR+, Stackelberg, Mean-Field & VCG) Acceptance Matrix (M2_1..M2_10) & SHA-256 Freeze
 * ======================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p161 = null;
  var p162 = null;
  var p163 = null;
  var p164 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p161 = require('./alive-cfr-plus-regret-matching-nash-policy-weights.js');
    p162 = require('./alive-stackelberg-bilevel-leader-follower-jacobian.js');
    p163 = require('./alive-mean-field-fokker-planck-hjb-swarm-weights.js');
    p164 = require('./alive-vcg-mechanism-incentive-compatible-bias-pricing.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p161 = root.AliveCfrPlusRegretMatchingNashPolicyWeights;
    p162 = root.AliveStackelbergBilevelLeaderFollowerJacobian;
    p163 = root.AliveMeanFieldFokkerPlanckHjbSwarmWeights;
    p164 = root.AliveVcgMechanismIncentiveCompatibleBiasPricing;
  }
  var api = factory(engine, p161, p162, p163, p164);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveGameTheoryCfrStackelbergPhase32Audit = api;
    root.ALIVEGameTheoryCfrStackelbergPhase32Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p161, p162, p163, p164) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass165Phase32Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r161 = p161.runPass161Evaluation({ seeds: seeds, episodes: 24 });
    var r162 = p162.runPass162Evaluation({ seeds: seeds, episodes: 24 });
    var r163 = p163.runPass163Evaluation({ seeds: seeds, episodes: 24 });
    var r164 = p164.runPass164Evaluation({ seeds: seeds, episodes: 24 });

    var w161 = r161.profiles[r161.winningProfileId].stats;
    var w162 = r162.profiles[r162.winningProfileId].stats;
    var w163 = r163.profiles[r163.winningProfileId].stats;
    var w164 = r164.profiles[r164.winningProfileId].stats;

    var rows = [
      {
        rowId: 'M2_1-CFRPlus-NashConv-Exploitability-Bound',
        passNumber: 161,
        metric: 'nashConvExploitability',
        threshold: '<= 1e-4',
        observed: w161.nashConvExploitability.mean,
        verified: w161.nashConvExploitability.mean <= 1e-4
      },
      {
        rowId: 'M2_2-CFRPlus-Zero-Negative-Regret-Accumulation',
        passNumber: 161,
        metric: 'negativeRegretAccumulationLeak',
        threshold: '=== 0.0',
        observed: w161.negativeRegretAccumulationLeak.mean,
        verified: w161.negativeRegretAccumulationLeak.mean === 0
      },
      {
        rowId: 'M2_3-Stackelberg-Total-Derivative-Stationarity-Defect',
        passNumber: 162,
        metric: 'stackelbergStationarityGradientDefect',
        threshold: '<= 1e-12',
        observed: w162.stackelbergStationarityGradientDefect.mean,
        verified: w162.stackelbergStationarityGradientDefect.mean <= 1e-12
      },
      {
        rowId: 'M2_4-Stackelberg-Leader-Utility-Advantage-Over-Naive',
        passNumber: 162,
        metric: 'leaderUtilityAdvantageOverNaivePct',
        threshold: '>= 40.0%',
        observed: w162.leaderUtilityAdvantageOverNaivePct.mean,
        verified: w162.leaderUtilityAdvantageOverNaivePct.mean >= 40.0
      },
      {
        rowId: 'M2_5-MeanField-FPK-Probability-Mass-Conservation-Defect',
        passNumber: 163,
        metric: 'fpkProbabilityMassConservationDefect',
        threshold: '<= 1e-12',
        observed: w163.fpkProbabilityMassConservationDefect.mean,
        verified: w163.fpkProbabilityMassConservationDefect.mean <= 1e-12
      },
      {
        rowId: 'M2_6-MeanField-HJB-Bellman-Optimality-Residual',
        passNumber: 163,
        metric: 'hjbBellmanOptimalityResidual',
        threshold: '<= 0.001',
        observed: w163.hjbBellmanOptimalityResidual.mean,
        verified: w163.hjbBellmanOptimalityResidual.mean <= 0.001
      },
      {
        rowId: 'M2_7-VCG-Clarke-Pivot-DSIC-Zero-Profitable-Misreport',
        passNumber: 164,
        metric: 'profitableMisreportGainDefect',
        threshold: '=== 0.0',
        observed: w164.profitableMisreportGainDefect.mean,
        verified: w164.profitableMisreportGainDefect.mean === 0
      },
      {
        rowId: 'M2_8-VCG-Clarke-Pivot-Individual-Rationality',
        passNumber: 164,
        metric: 'individualRationalitySatisfactionPct',
        threshold: '=== 100.0%',
        observed: w164.individualRationalitySatisfactionPct.mean,
        verified: w164.individualRationalitySatisfactionPct.mean === 100
      },
      {
        rowId: 'M2_9-VCG-Allocative-Social-Welfare-Efficiency',
        passNumber: 164,
        metric: 'allocativeSocialWelfareEfficiencyPct',
        threshold: '=== 100.0%',
        observed: w164.allocativeSocialWelfareEfficiencyPct.mean,
        verified: w164.allocativeSocialWelfareEfficiencyPct.mean === 100
      },
      {
        rowId: 'M2_10-Phase32-All-Four-Game-Theory-Passes-100-Score',
        passNumber: 165,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r161.winningScore, r162.winningScore, r163.winningScore, r164.winningScore].join(' / '),
        verified: r161.winningScore === 100 && r162.winningScore === 100 && r163.winningScore === 100 && r164.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-165-GAME-THEORY-CFR-STACKELBERG-PHASE32-AUDIT',
      passNumber: 165,
      phase: 'Phase XXXII: Multi-Agent Game-Theoretic Equilibrium Weights (CFR+, Stackelberg, Mean-Field & VCG)',
      generatedAt: '2026-11-09T20:29:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass161Sha256: r161.sha256,
        pass162Sha256: r162.sha256,
        pass163Sha256: r163.sha256,
        pass164Sha256: r164.sha256
      }
    };
    result.phase32Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass165Phase32Audit: runPass165Phase32Audit
  };
});
