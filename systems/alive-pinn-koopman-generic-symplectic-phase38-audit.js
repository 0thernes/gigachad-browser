/**
 * ALIVE Pass 195: Phase XXXVIII Physics-Informed & Conservation-Law Neural Networks
 * (PINN, Koopman, GENERIC & Symplectic SRNN) Acceptance Matrix (C2_1..C2_10) & SHA-256 Freeze
 * ===========================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p191 = null;
  var p192 = null;
  var p193 = null;
  var p194 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p191 = require('./alive-pinn-ntk-adaptive-collocation-pde-weights.js');
    p192 = require('./alive-koopman-autoencoder-companion-eigenweights.js');
    p193 = require('./alive-generic-poisson-onsager-thermodynamic-weights.js');
    p194 = require('./alive-storer-symplectic-euler-verlet-recurrent-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p191 = root.AlivePinnNtkAdaptiveCollocationPdeWeights;
    p192 = root.AliveKoopmanAutoencoderCompanionEigenweights;
    p193 = root.AliveGenericPoissonOnsagerThermodynamicWeights;
    p194 = root.AliveStorerSymplecticEulerVerletRecurrentWeights;
  }
  var api = factory(engine, p191, p192, p193, p194);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AlivePinnKoopmanGenericSymplecticPhase38Audit = api;
    root.ALIVEPinnKoopmanGenericSymplecticPhase38Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p191, p192, p193, p194) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass195Phase38Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r191 = p191.runPass191Evaluation({ seeds: seeds, episodes: 24 });
    var r192 = p192.runPass192Evaluation({ seeds: seeds, episodes: 24 });
    var r193 = p193.runPass193Evaluation({ seeds: seeds, episodes: 24 });
    var r194 = p194.runPass194Evaluation({ seeds: seeds, episodes: 24 });

    var w191 = r191.profiles[r191.winningProfileId].stats;
    var w192 = r192.profiles[r192.winningProfileId].stats;
    var w193 = r193.profiles[r193.winningProfileId].stats;
    var w194 = r194.profiles[r194.winningProfileId].stats;

    var rows = [
      {
        rowId: 'C2_1-PINN-Curl-Potential-Exact-Divergence-Free-Continuity',
        passNumber: 191,
        metric: 'continuityDivergenceFreeDefect',
        threshold: '<= 1e-12',
        observed: w191.continuityDivergenceFreeDefect.mean,
        verified: w191.continuityDivergenceFreeDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_2-PINN-NTK-Balanced-PDE-Relative-L2-Solution-Error',
        passNumber: 191,
        metric: 'pdeRelativeL2SolutionErrorPct',
        threshold: '<= 0.5%',
        observed: w191.pdeRelativeL2SolutionErrorPct.mean,
        verified: w191.pdeRelativeL2SolutionErrorPct.mean <= 0.5
      },
      {
        rowId: 'C2_3-Koopman-Modal-Semigroup-Consistency-K_dt_N',
        passNumber: 192,
        metric: 'multiStepsemigroupConsistencyDefect',
        threshold: '<= 1e-12',
        observed: w192.multiStepsemigroupConsistencyDefect.mean,
        verified: w192.multiStepsemigroupConsistencyDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_4-Koopman-Hurwitz-Spectral-Radius-Stability',
        passNumber: 192,
        metric: 'spectralRadiusHurwitzBoundViolation',
        threshold: '=== 0.0',
        observed: w192.spectralRadiusHurwitzBoundViolation.mean,
        verified: w192.spectralRadiusHurwitzBoundViolation.mean === 0
      },
      {
        rowId: 'C2_5-GENERIC-First-Law-Exact-Energy-Conservation',
        passNumber: 193,
        metric: 'firstLawEnergyConservationDefect',
        threshold: '<= 1e-12',
        observed: w193.firstLawEnergyConservationDefect.mean,
        verified: w193.firstLawEnergyConservationDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_6-GENERIC-Second-Law-NonNegative-Entropy-Production',
        passNumber: 193,
        metric: 'secondLawNegativeEntropyViolation',
        threshold: '=== 0.0',
        observed: w193.secondLawNegativeEntropyViolation.mean,
        verified: w193.secondLawNegativeEntropyViolation.mean === 0
      },
      {
        rowId: 'C2_7-GENERIC-Degeneracy-Orthogonality-Defect',
        passNumber: 193,
        metric: 'degeneracyOrthogonalityDefect',
        threshold: '<= 1e-12',
        observed: w193.degeneracyOrthogonalityDefect.mean,
        verified: w193.degeneracyOrthogonalityDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_8-Symplectic-Verlet-Liouville-Volume-Preservation-DetJ',
        passNumber: 194,
        metric: 'liouvilleJacobianDeterminantDefect',
        threshold: '<= 1e-12',
        observed: w194.liouvilleJacobianDeterminantDefect.mean,
        verified: w194.liouvilleJacobianDeterminantDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_9-Symplectic-Verlet-Time-Reversibility-Symmetry',
        passNumber: 194,
        metric: 'timeReversibilitySymmetryDefect',
        threshold: '<= 1e-12',
        observed: w194.timeReversibilitySymmetryDefect.mean,
        verified: w194.timeReversibilitySymmetryDefect.mean <= 1e-12
      },
      {
        rowId: 'C2_10-Phase38-All-Four-Physics-Informed-Passes-100-Score',
        passNumber: 195,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r191.winningScore, r192.winningScore, r193.winningScore, r194.winningScore].join(' / '),
        verified: r191.winningScore === 100 && r192.winningScore === 100 && r193.winningScore === 100 && r194.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-195-PINN-KOOPMAN-GENERIC-SYMPLECTIC-PHASE38-AUDIT',
      passNumber: 195,
      phase: 'Phase XXXVIII: Physics-Informed & Conservation-Law Neural Networks (PINN, Koopman, GENERIC & Symplectic SRNN)',
      generatedAt: '2026-11-09T20:59:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass191Sha256: r191.sha256,
        pass192Sha256: r192.sha256,
        pass193Sha256: r193.sha256,
        pass194Sha256: r194.sha256
      }
    };
    result.phase38Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass195Phase38Audit: runPass195Phase38Audit
  };
});
