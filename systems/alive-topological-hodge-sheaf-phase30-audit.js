/**
 * ALIVE Pass 155: Phase XXX Topological Deep Learning (Simplicial Hodge Laplacians,
 * Cellular Sheaf Networks, Persistent Homology & DECT) Acceptance Matrix (T2_1..T2_10)
 * ====================================================================================
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  var p151 = null;
  var p152 = null;
  var p153 = null;
  var p154 = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
    p151 = require('./alive-simplicial-hodge-laplacian-cell-weights.js');
    p152 = require('./alive-cellular-sheaf-laplacian-stalk-transport.js');
    p153 = require('./alive-persistent-homology-betti-topological-loss.js');
    p154 = require('./alive-euler-characteristic-transform-shape-weights.js');
  } else if (root) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
    p151 = root.AliveSimplicialHodgeLaplacianCellWeights;
    p152 = root.AliveCellularSheafLaplacianStalkTransport;
    p153 = root.AlivePersistentHomologyBettiTopologicalLoss;
    p154 = root.AliveEulerCharacteristicTransformShapeWeights;
  }
  var api = factory(engine, p151, p152, p153, p154);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveTopologicalHodgeSheafPhase30Audit = api;
    root.ALIVETopologicalHodgeSheafPhase30Audit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, p151, p152, p153, p154) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);

  function runPass155Phase30Audit(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var r151 = p151.runPass151Evaluation({ seeds: seeds, episodes: 24 });
    var r152 = p152.runPass152Evaluation({ seeds: seeds, episodes: 24 });
    var r153 = p153.runPass153Evaluation({ seeds: seeds, episodes: 24 });
    var r154 = p154.runPass154Evaluation({ seeds: seeds, episodes: 24 });

    var w151 = r151.profiles[r151.winningProfileId].stats;
    var w152 = r152.profiles[r152.winningProfileId].stats;
    var w153 = r153.profiles[r153.winningProfileId].stats;
    var w154 = r154.profiles[r154.winningProfileId].stats;

    var rows = [
      {
        rowId: 'T2_1-Simplicial-Boundary-Nilpotency-B1-B2-Zero',
        passNumber: 151,
        metric: 'boundaryNilpotencyDefect',
        threshold: '<= 1e-12',
        observed: w151.boundaryNilpotencyDefect.mean,
        verified: w151.boundaryNilpotencyDefect.mean <= 1e-12
      },
      {
        rowId: 'T2_2-Hodge-Helmholtz-Gradient-Curl-Orthogonality',
        passNumber: 151,
        metric: 'hodgeOrthogonalityInnerProductDefect',
        threshold: '<= 1e-12',
        observed: w151.hodgeOrthogonalityInnerProductDefect.mean,
        verified: w151.hodgeOrthogonalityInnerProductDefect.mean <= 1e-12
      },
      {
        rowId: 'T2_3-Cellular-Sheaf-O2-Harmonic-Section-Zero-Coboundary',
        passNumber: 152,
        metric: 'sheafHarmonicSectionDisagreement',
        threshold: '<= 1e-12',
        observed: w152.sheafHarmonicSectionDisagreement.mean,
        verified: w152.sheafHarmonicSectionDisagreement.mean <= 1e-12
      },
      {
        rowId: 'T2_4-Cellular-Sheaf-64Layer-Dirichlet-Energy-Retention',
        passNumber: 152,
        metric: 'deep64LayerDirichletEnergyRetentionPct',
        threshold: '>= 99.0%',
        observed: w152.deep64LayerDirichletEnergyRetentionPct.mean,
        verified: w152.deep64LayerDirichletEnergyRetentionPct.mean >= 99.0
      },
      {
        rowId: 'T2_5-Persistent-Homology-Betti-Number-Exact-Recovery',
        passNumber: 153,
        metric: 'bettiNumberExactMatchPct',
        threshold: '=== 100.0%',
        observed: w153.bettiNumberExactMatchPct.mean,
        verified: w153.bettiNumberExactMatchPct.mean === 100
      },
      {
        rowId: 'T2_6-Persistent-Homology-Bottleneck-Distance',
        passNumber: 153,
        metric: 'persistenceDiagramBottleneckDistance',
        threshold: '<= 0.01',
        observed: w153.persistenceDiagramBottleneckDistance.mean,
        verified: w153.persistenceDiagramBottleneckDistance.mean <= 0.01
      },
      {
        rowId: 'T2_7-Persistent-Homology-Cycle-Signal-To-Noise-Ratio',
        passNumber: 153,
        metric: 'cycleSignalToTopologicalNoiseRatio',
        threshold: '>= 15.0',
        observed: w153.cycleSignalToTopologicalNoiseRatio.mean,
        verified: w153.cycleSignalToTopologicalNoiseRatio.mean >= 15.0
      },
      {
        rowId: 'T2_8-DECT-Euler-Poincare-Global-Identity-Preservation',
        passNumber: 154,
        metric: 'eulerPoincareGlobalIdentityDefect',
        threshold: '<= 1e-9',
        observed: w154.eulerPoincareGlobalIdentityDefect.mean,
        verified: w154.eulerPoincareGlobalIdentityDefect.mean <= 1e-9
      },
      {
        rowId: 'T2_9-DECT-1WL-Indistinguishable-Graph-Separation',
        passNumber: 154,
        metric: 'nonIsomorphic1WlGraphSeparationPct',
        threshold: '=== 100.0%',
        observed: w154.nonIsomorphic1WlGraphSeparationPct.mean,
        verified: w154.nonIsomorphic1WlGraphSeparationPct.mean === 100
      },
      {
        rowId: 'T2_10-Phase30-All-Four-Topological-Passes-100-Score',
        passNumber: 155,
        metric: 'allPassesScore100',
        threshold: '4/4 Passes === 100.0',
        observed: [r151.winningScore, r152.winningScore, r153.winningScore, r154.winningScore].join(' / '),
        verified: r151.winningScore === 100 && r152.winningScore === 100 && r153.winningScore === 100 && r154.winningScore === 100
      }
    ];

    var verifiedCount = rows.filter(function (r) { return r.verified; }).length;
    var result = {
      passId: 'ALIVE-PASS-155-TOPOLOGICAL-HODGE-SHEAF-PHASE30-AUDIT',
      passNumber: 155,
      phase: 'Phase XXX: Topological Deep Learning (Simplicial Hodge Laplacians, Cellular Sheaf Networks, Persistent Homology & DECT)',
      generatedAt: '2026-11-09T20:19:00.000Z',
      seeds: seeds.slice(),
      rows: rows,
      verifiedRowCount: verifiedCount,
      totalRows: rows.length,
      acceptanceScorePct: engine.roundMetric((verifiedCount / rows.length) * 100.0, 4),
      allVerified: verifiedCount === rows.length,
      passDigests: {
        pass151Sha256: r151.sha256,
        pass152Sha256: r152.sha256,
        pass153Sha256: r153.sha256,
        pass154Sha256: r154.sha256
      }
    };
    result.phase30Sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    runPass155Phase30Audit: runPass155Phase30Audit
  };
});
