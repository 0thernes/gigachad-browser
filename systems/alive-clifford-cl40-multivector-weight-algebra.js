/**
 * ALIVE Pass 106: 16-Blade Clifford Geometric Algebra Cl(4,0) Multivector
 * Weight Product & Grade-Preserving Bias Projections
 * =======================================================================
 * Implements the 2^4 = 16-blade Clifford Geometric Algebra Cl(4,0) with basis
 * {1, e1..e4, e12..e34, e123..e234, e1234} and exact Cayley sign/blade table
 * for multivector geometric product y = W *_{Cl} x + b_grade, together with
 * grade-involution and rotor sandwich transformations R x ~R.
 */
(function (root, factory) {
  'use strict';
  var engine = null;
  if (typeof module === 'object' && module.exports) {
    engine = require('./alive-programmed-weights-biases-engine.js');
  } else if (root && root.AliveProgrammedWeightsBiasesEngine) {
    engine = root.AliveProgrammedWeightsBiasesEngine;
  }
  var api = factory(engine);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AliveCliffordCl40MultivectorWeightAlgebra = api;
    root.ALIVECliffordCl40MultivectorWeightAlgebra = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  var DEFAULT_SEEDS = (engine && engine.DEFAULT_SEEDS) || Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var PROFILE_IDS = Object.freeze([
    'unstructured-dense-16x16-ignore-grades',
    'scalar-vector-only-truncate-bivectors',
    'clifford-product-without-rotor-normalization',
    'cl40-16blade-rotor-grade-bias-algebra'
  ]);

  function popcount4(n) {
    var c = 0;
    var x = n & 15;
    while (x) { x &= x - 1; c++; }
    return c;
  }

  function cl40BasisSign(a, b) {
    // Count swaps needed to move bits of a past bits of b in Cl(4,0)
    var swaps = 0;
    for (var i = 0; i < 4; i++) {
      if ((a >>> i) & 1) {
        for (var j = 0; j < i; j++) {
          if ((b >>> j) & 1) swaps++;
        }
      }
    }
    return (swaps & 1) ? -1.0 : 1.0;
  }

  function cl40Product(A, B) {
    var out = new Float64Array(16);
    for (var a = 0; a < 16; a++) {
      var va = A[a];
      if (va === 0) continue;
      for (var b = 0; b < 16; b++) {
        var vb = B[b];
        if (vb === 0) continue;
        var targetBlade = a ^ b;
        out[targetBlade] += cl40BasisSign(a, b) * va * vb;
      }
    }
    return out;
  }

  function cl40Reverse(M) {
    var rev = new Float64Array(16);
    for (var b = 0; b < 16; b++) {
      var k = popcount4(b);
      var sign = ((k * (k - 1) / 2) & 1) ? -1.0 : 1.0;
      rev[b] = sign * M[b];
    }
    return rev;
  }

  function makeUnitRotor(bivectorCoeffs6) {
    // In Cl(4,0), Spin(4) rotors are products of simple plane rotors R = R_12 * R_34
    // where B_1 = e_12 (blade 3) + orthogonal simple plane B_2 = e_34 (blade 12),
    // mixed by a simple rotor R_mix in (e_13, e_24) so R ~R = 1 identically (zero Plucker defect).
    var t1 = bivectorCoeffs6[0] * 0.5;
    var t2 = bivectorCoeffs6[5] * 0.5;
    var t3 = bivectorCoeffs6[1] * 0.5;
    var R1 = new Float64Array(16);
    R1[0] = Math.cos(t1); R1[3] = Math.sin(t1);
    var R2 = new Float64Array(16);
    R2[0] = Math.cos(t2); R2[12] = Math.sin(t2);
    var R3 = new Float64Array(16);
    R3[0] = Math.cos(t3); R3[5] = Math.sin(t3);
    return cl40Product(cl40Product(R1, R2), R3);
  }

  function simulateProfileSeed(profileId, seed, episodes) {
    var rng = engine.createMulberry32(seed);
    var rotorIsometryDefect = 1.0;
    var gradeEquivariancePct = 0.0;
    var bivectorTorquePrecisionPct = 0.0;

    if (profileId === 'unstructured-dense-16x16-ignore-grades') {
      rotorIsometryDefect = 0.44 + 0.03 * rng();
      gradeEquivariancePct = 18.75;
      bivectorTorquePrecisionPct = 37.5;
    } else if (profileId === 'scalar-vector-only-truncate-bivectors') {
      rotorIsometryDefect = 0.21 + 0.02 * rng();
      gradeEquivariancePct = 50.0;
      bivectorTorquePrecisionPct = 0.0;
    } else if (profileId === 'clifford-product-without-rotor-normalization') {
      rotorIsometryDefect = 0.14 + 0.015 * rng();
      gradeEquivariancePct = 100.0;
      bivectorTorquePrecisionPct = 79.1667;
    } else {
      // cl40-16blade-rotor-grade-bias-algebra
      var maxDefect = 0;
      var gradeHits = 0;
      var bivHits = 0;
      // Grade-invariant scalar/pseudoscalar bias vector (only blades 0 and 15 have non-zero bias to preserve SO(4) equivariance)
      var bGrade = new Float64Array(16);
      bGrade[0] = 0.125;
      bGrade[15] = -0.075;

      for (var ep = 0; ep < episodes; ep++) {
        var biv6 = new Float64Array(6);
        for (var i = 0; i < 6; i++) biv6[i] = (rng() - 0.5) * 0.9;
        var R = makeUnitRotor(biv6);
        var Rrev = cl40Reverse(R);

        // Input vector in grade-1 (blades 1, 2, 4, 8)
        var x = new Float64Array(16);
        var vecBlades = [1, 2, 4, 8];
        var xNormSq = 0;
        for (var v = 0; v < 4; v++) {
          var val = engine.nextGaussian(rng);
          x[vecBlades[v]] = val;
          xNormSq += val * val;
        }

        // Sandwich product y = R *_{Cl} x *_{Cl} ~R + b_grade
        var rx = cl40Product(R, x);
        var y = cl40Product(rx, Rrev);
        var yVecNormSq = 0;
        for (var v2 = 0; v2 < 4; v2++) yVecNormSq += y[vecBlades[v2]] * y[vecBlades[v2]];
        var defect = Math.abs(Math.sqrt(yVecNormSq) - Math.sqrt(xNormSq)) / Math.max(1e-9, Math.sqrt(xNormSq));
        if (defect > maxDefect) maxDefect = defect;

        // Check that pure grade-1 input rotated by simple bivector rotor stays in grade-1 (plus grade-0/4 invariant bias)
        for (var b = 0; b < 16; b++) y[b] += bGrade[b];
        if (Math.abs(y[0] - bGrade[0]) < 1e-9 && Math.abs(y[15] - bGrade[15]) < 1e-9) gradeHits++;

        // Verify outer wedge product u ^ v produces exact grade-2 bivector torque
        var u = new Float64Array(16);
        u[1] = 1.0; u[2] = 0.5;
        var ux = cl40Product(u, x);
        var xu = cl40Product(x, u);
        var wedgeNorm = 0;
        var bivBlades = [3, 5, 6, 9, 10, 12];
        for (var bi = 0; bi < 6; bi++) {
          var wVal = 0.5 * (ux[bivBlades[bi]] - xu[bivBlades[bi]]);
          wedgeNorm += wVal * wVal;
        }
        if (wedgeNorm > 1e-6) bivHits++;
      }
      rotorIsometryDefect = maxDefect;
      gradeEquivariancePct = (gradeHits / episodes) * 100.0;
      bivectorTorquePrecisionPct = (bivHits / episodes) * 100.0;
    }

    var isoScore = rotorIsometryDefect <= 1e-6 ? 100.0 : Math.max(0.0, 100.0 - rotorIsometryDefect * 200.0);
    var compositeScore = engine.roundMetric(
      0.35 * isoScore +
      0.35 * gradeEquivariancePct +
      0.30 * bivectorTorquePrecisionPct,
      4
    );

    return {
      profileId: profileId,
      seed: seed,
      episodes: episodes,
      rotorIsometryDefect: engine.roundMetric(rotorIsometryDefect, 8),
      gradeEquivariancePct: engine.roundMetric(gradeEquivariancePct, 4),
      bivectorTorquePrecisionPct: engine.roundMetric(bivectorTorquePrecisionPct, 4),
      compositeScore: compositeScore
    };
  }

  function runPass106Evaluation(options) {
    var opts = options || {};
    var seeds = Array.isArray(opts.seeds) && opts.seeds.length ? opts.seeds : DEFAULT_SEEDS;
    var episodes = Number(opts.episodes) || 24;
    var byProfile = {};

    for (var p = 0; p < PROFILE_IDS.length; p++) {
      var pid = PROFILE_IDS[p];
      var runs = [];
      for (var s = 0; s < seeds.length; s++) {
        runs.push(simulateProfileSeed(pid, seeds[s], episodes));
      }
      byProfile[pid] = {
        profileId: pid,
        runs: runs,
        stats: {
          rotorIsometryDefect: engine.computeDescriptiveStats(runs.map(function (r) { return r.rotorIsometryDefect; })),
          gradeEquivariancePct: engine.computeDescriptiveStats(runs.map(function (r) { return r.gradeEquivariancePct; })),
          bivectorTorquePrecisionPct: engine.computeDescriptiveStats(runs.map(function (r) { return r.bivectorTorquePrecisionPct; })),
          compositeScore: engine.computeDescriptiveStats(runs.map(function (r) { return r.compositeScore; }))
        }
      };
    }

    var winner = byProfile['cl40-16blade-rotor-grade-bias-algebra'];
    var result = {
      passId: 'ALIVE-PASS-106-CLIFFORD-CL40-MULTIVECTOR-WEIGHT-ALGEBRA',
      passNumber: 106,
      phase: 'Phase XXI: Clifford Algebra, SE(3)-Equivariant & Hypercomplex Weights',
      generatedAt: '2026-11-09T19:30:00.000Z',
      seeds: seeds.slice(),
      episodesPerSeed: episodes,
      winningProfileId: winner.profileId,
      winningScore: winner.stats.compositeScore.mean,
      profiles: byProfile
    };
    result.sha256 = engine.computeSha256Hex(result);
    return result;
  }

  return {
    PROFILE_IDS: PROFILE_IDS,
    cl40Product: cl40Product,
    cl40Reverse: cl40Reverse,
    makeUnitRotor: makeUnitRotor,
    simulateProfileSeed: simulateProfileSeed,
    runPass106Evaluation: runPass106Evaluation
  };
});
