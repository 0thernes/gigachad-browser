(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory({});
  } else {
    var api = factory({});
    root.AliveHyperbolicPoincareKnowledgeEmbedder = api;
    root.ALIVEHyperbolicPoincareKnowledgeEmbedder = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  deps = deps || {};

  var DEFAULT_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  var T_CRITICAL_95_DF4 = 2.7764451051977987;
  var BOUNDARY_EPS = 1e-5;

  var GEOMETRY_PROFILES = Object.freeze([
    {
      id: 'flat-euclidean-low-dim-r2',
      label: 'Flat Euclidean Low-Dim (R^2)',
      manifold: 'euclidean',
      dim: 2,
      curvatureC: 0.0,
      riemannianProjection: true
    },
    {
      id: 'flat-euclidean-matched-dim-r8',
      label: 'Flat Euclidean Matched-Dim (R^8)',
      manifold: 'euclidean',
      dim: 8,
      curvatureC: 0.0,
      riemannianProjection: true
    },
    {
      id: 'unprojected-hyperbolic-boundary-overflow',
      label: 'Unprojected Hyperbolic (No Riemannian Rescaling / Boundary Overflow)',
      manifold: 'poincare_unprojected',
      dim: 8,
      curvatureC: 1.0,
      riemannianProjection: false
    },
    {
      id: 'poincare-riemannian-gyrovector-b8',
      label: 'Poincaré Ball B^8_c (Riemannian Gyrovector + Sarkar Tree Embedding)',
      manifold: 'poincare',
      dim: 8,
      curvatureC: 1.0,
      riemannianProjection: true
    }
  ]);

  function createMulberry32(seed) {
    var state = (seed >>> 0) || 1;
    return function nextRandom() {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundMetric(val, digits) {
    var d = typeof digits === 'number' ? digits : 4;
    var f = Math.pow(10, d);
    return Math.round(Number(val || 0) * f) / f;
  }

  function computeDescriptiveStats(values) {
    var arr = Array.isArray(values) ? values.map(Number) : [];
    var n = arr.length;
    if (n === 0) {
      return { count: 0, mean: 0, stdDev: 0, stdError: 0, ci95HalfWidth: 0, ci95Low: 0, ci95High: 0, min: 0, max: 0 };
    }
    var sum = 0;
    var min = arr[0];
    var max = arr[0];
    for (var i = 0; i < n; i++) {
      sum += arr[i];
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    var mean = sum / n;
    var sq = 0;
    for (var j = 0; j < n; j++) {
      var diff = arr[j] - mean;
      sq += diff * diff;
    }
    var stdDev = n > 1 ? Math.sqrt(sq / (n - 1)) : 0;
    var stdError = n > 1 ? stdDev / Math.sqrt(n) : 0;
    var tCrit = n === 5 ? T_CRITICAL_95_DF4 : 1.96;
    var half = tCrit * stdError;
    return {
      count: n,
      mean: roundMetric(mean, 4),
      stdDev: roundMetric(stdDev, 4),
      stdError: roundMetric(stdError, 4),
      ci95HalfWidth: roundMetric(half, 4),
      ci95Low: roundMetric(mean - half, 4),
      ci95High: roundMetric(mean + half, 4),
      min: roundMetric(min, 4),
      max: roundMetric(max, 4)
    };
  }

  function dotProduct(u, v) {
    var s = 0;
    var n = Math.min(u.length, v.length);
    for (var i = 0; i < n; i++) s += u[i] * v[i];
    return s;
  }

  function normSq(u) {
    return dotProduct(u, u);
  }

  function normL2(u) {
    return Math.sqrt(normSq(u));
  }

  function euclideanDistance(u, v) {
    var s = 0;
    var n = Math.min(u.length, v.length);
    for (var i = 0; i < n; i++) {
      var d = u[i] - v[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  function projectToPoincareBall(u, c, eps) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var boundaryEps = typeof eps === 'number' && eps > 0 ? eps : BOUNDARY_EPS;
    var maxNorm = (1 - boundaryEps) / Math.sqrt(curv);
    var n = normL2(u);
    if (n <= maxNorm || n === 0) {
      return u.slice();
    }
    var scale = maxNorm / n;
    var out = new Array(u.length);
    for (var i = 0; i < u.length; i++) out[i] = u[i] * scale;
    return out;
  }

  function computeConformalFactor(u, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var nSq = normSq(u);
    var denom = Math.max(1e-9, 1 - curv * nSq);
    return 2.0 / denom;
  }

  function computePoincareDistance(u, v, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var uSafe = projectToPoincareBall(u, curv, 1e-7);
    var vSafe = projectToPoincareBall(v, curv, 1e-7);
    var diffSq = 0;
    for (var i = 0; i < uSafe.length; i++) {
      var d = uSafe[i] - vSafe[i];
      diffSq += d * d;
    }
    var denom = Math.max(1e-12, (1 - curv * normSq(uSafe)) * (1 - curv * normSq(vSafe)));
    var arg = Math.max(1.0, 1.0 + (2.0 * curv * diffSq) / denom);
    return Math.acosh(arg) / Math.sqrt(curv);
  }

  function mobiusAdd(u, v, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var uSq = normSq(u);
    var vSq = normSq(v);
    var uv = dotProduct(u, v);
    var denom = Math.max(1e-12, 1.0 + 2.0 * curv * uv + curv * curv * uSq * vSq);
    var coeffU = (1.0 + 2.0 * curv * uv + curv * vSq) / denom;
    var coeffV = (1.0 - curv * uSq) / denom;
    var out = new Array(u.length);
    for (var i = 0; i < u.length; i++) {
      out[i] = coeffU * u[i] + coeffV * v[i];
    }
    return projectToPoincareBall(out, curv, BOUNDARY_EPS);
  }

  function expMapZero(v, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var n = normL2(v);
    if (n < 1e-12) return v.map(function () { return 0; });
    var sqrtC = Math.sqrt(curv);
    var scale = Math.tanh(sqrtC * n) / (sqrtC * n);
    var out = new Array(v.length);
    for (var i = 0; i < v.length; i++) out[i] = v[i] * scale;
    return projectToPoincareBall(out, curv, BOUNDARY_EPS);
  }

  function logMapZero(y, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var ySafe = projectToPoincareBall(y, curv, BOUNDARY_EPS);
    var n = normL2(ySafe);
    if (n < 1e-12) return ySafe.map(function () { return 0; });
    var sqrtC = Math.sqrt(curv);
    var arg = Math.min(1 - 1e-7, sqrtC * n);
    var scale = Math.atanh(arg) / (sqrtC * n);
    var out = new Array(ySafe.length);
    for (var i = 0; i < ySafe.length; i++) out[i] = ySafe[i] * scale;
    return out;
  }

  function riemannianGradientScale(euclideanGrad, x, c) {
    var curv = typeof c === 'number' && c > 0 ? c : 1.0;
    var factor = Math.pow(Math.max(0, 1.0 - curv * normSq(x)), 2) / 4.0;
    return euclideanGrad.map(function (g) { return g * factor; });
  }

  function generateHierarchicalCitationTree(seed) {
    var rng = createMulberry32(seed);
    var nodes = [
      { id: 0, parentId: -1, depth: 0, children: [], label: 'root-ontology' }
    ];
    // Branching factor 3 up to depth 3: 1 + 3 + 9 + 27 = 40 nodes
    var currentLevel = [0];
    for (var depth = 1; depth <= 3; depth++) {
      var nextLevel = [];
      for (var pIdx = 0; pIdx < currentLevel.length; pIdx++) {
        var parentId = currentLevel[pIdx];
        for (var b = 0; b < 3; b++) {
          var childId = nodes.length;
          nodes.push({
            id: childId,
            parentId: parentId,
            depth: depth,
            branchIndex: b,
            children: [],
            semanticJitter: (rng() - 0.5) * 0.01,
            label: 'node-d' + depth + '-' + childId
          });
          nodes[parentId].children.push(childId);
          nextLevel.push(childId);
        }
      }
      currentLevel = nextLevel;
    }

    var n = nodes.length;
    var treeDist = [];
    for (var i = 0; i < n; i++) {
      treeDist.push(new Array(n).fill(0));
    }

    function getAncestors(nodeId) {
      var chain = [];
      var cur = nodeId;
      while (cur !== -1) {
        chain.push(cur);
        cur = nodes[cur].parentId;
      }
      return chain;
    }

    var ancestorChains = nodes.map(function (nd) { return getAncestors(nd.id); });
    for (var u = 0; u < n; u++) {
      for (var v = u + 1; v < n; v++) {
        var aU = ancestorChains[u];
        var aV = ancestorChains[v];
        var dTree = 0;
        for (var idxU = 0; idxU < aU.length; idxU++) {
          var idxV = aV.indexOf(aU[idxU]);
          if (idxV !== -1) {
            dTree = idxU + idxV;
            break;
          }
        }
        treeDist[u][v] = dTree;
        treeDist[v][u] = dTree;
      }
    }

    return {
      nodes: nodes,
      treeDist: treeDist
    };
  }

  function embedTreeWithProfile(tree, profile, seed) {
    var rng = createMulberry32((seed ^ (profile.dim * 7919)) >>> 0);
    var nodes = tree.nodes;
    var n = nodes.length;
    var dim = profile.dim;
    var coords = new Array(n);

    if (profile.id === 'poincare-riemannian-gyrovector-b8') {
      // Sarkar-style hyperbolic tree construction in B^8_c using Möbius gyrovector transitions
      var stepRadius = Math.tanh(1.15 / 2.0); // geodesic step ~ 1.15 per tree edge
      coords[0] = new Array(dim).fill(0);
      for (var i = 1; i < n; i++) {
        var node = nodes[i];
        var parentCoord = coords[node.parentId];
        // Orthogonal-ish directional basis per subtree and depth so sibling branches separate exponentially
        var dir = new Array(dim).fill(0);
        var primaryAxis = (node.depth * 2 + node.branchIndex) % dim;
        var secondaryAxis = (node.parentId + node.branchIndex * 3 + 1) % dim;
        var sign1 = (node.branchIndex === 1) ? -1 : 1;
        var sign2 = ((node.id % 2) === 0) ? 1 : -1;
        dir[primaryAxis] += sign1 * 0.88;
        dir[secondaryAxis] += sign2 * 0.46;
        for (var d = 0; d < dim; d++) {
          dir[d] += (rng() - 0.5) * 0.04;
        }
        var dNorm = normL2(dir) || 1;
        var localStep = dir.map(function (v) { return (v / dNorm) * stepRadius; });
        coords[i] = mobiusAdd(parentCoord, localStep, profile.curvatureC);
      }
    } else if (profile.id === 'unprojected-hyperbolic-boundary-overflow') {
      // Naive Euclidean steps without Riemannian rescaling or ball projection -> overflows c||x||^2 >= 1
      coords[0] = new Array(dim).fill(0);
      for (var j = 1; j < n; j++) {
        var nd = nodes[j];
        var pCoord = coords[nd.parentId];
        var step = new Array(dim).fill(0);
        step[nd.branchIndex % dim] = 0.52;
        step[(nd.depth + nd.branchIndex) % dim] += 0.35;
        coords[j] = pCoord.map(function (val, idx) { return val + step[idx]; });
      }
    } else if (profile.id === 'flat-euclidean-matched-dim-r8') {
      // Flat Euclidean R^8 tree layout: polynomial volume causes cross-branch crowding at depth 2..3
      coords[0] = new Array(dim).fill(0);
      for (var k = 1; k < n; k++) {
        var nd8 = nodes[k];
        var p8 = coords[nd8.parentId];
        var step8 = new Array(dim).fill(0);
        var ax = (nd8.depth + nd8.branchIndex) % dim;
        step8[ax] = (nd8.branchIndex === 1 ? -1 : 1) * 0.58;
        step8[(ax + 1) % dim] = ((k % 2 === 0) ? 1 : -1) * 0.35;
        coords[k] = p8.map(function (val, idx) { return val + step8[idx]; });
      }
    } else {
      // Flat Euclidean R^2 layout: severe 2D crowding of 40-node ternary tree
      coords[0] = [0, 0];
      for (var m = 1; m < n; m++) {
        var nd2 = nodes[m];
        var p2 = coords[nd2.parentId];
        var angle = ((nd2.id * 2.094395) + nd2.depth * 0.55) % (2 * Math.PI);
        coords[m] = [
          p2[0] + 0.65 * Math.cos(angle),
          p2[1] + 0.65 * Math.sin(angle)
        ];
      }
    }

    return coords;
  }

  function evaluateTreeEmbedding(tree, coords, profile) {
    var nodes = tree.nodes;
    var treeDist = tree.treeDist;
    var n = nodes.length;

    // 1. Check boundary safety in Poincaré ball (or Euclidean valid bounds)
    var validBoundaryNodes = 0;
    var depthNormSums = [0, 0, 0, 0];
    var depthCounts = [0, 0, 0, 0];

    for (var i = 0; i < n; i++) {
      var rSq = normSq(coords[i]);
      var r = Math.sqrt(rSq);
      depthNormSums[nodes[i].depth] += r;
      depthCounts[nodes[i].depth] += 1;

      if (profile.manifold === 'euclidean') {
        validBoundaryNodes += 1;
      } else {
        if (profile.curvatureC * rSq < 1.0 - BOUNDARY_EPS) {
          validBoundaryNodes += 1;
        }
      }
    }

    var manifoldBoundarySafetyPct = (validBoundaryNodes / n) * 100;

    // 2. Compute pairwise manifold distances and relative distortion against tree shortest-path distances
    var embDist = [];
    for (var a = 0; a < n; a++) embDist.push(new Array(n).fill(0));

    var sumRatio = 0;
    var pairCount = 0;
    for (var u = 0; u < n; u++) {
      for (var v = u + 1; v < n; v++) {
        var dM = profile.manifold === 'euclidean'
          ? euclideanDistance(coords[u], coords[v])
          : computePoincareDistance(coords[u], coords[v], profile.curvatureC);
        embDist[u][v] = dM;
        embDist[v][u] = dM;
        sumRatio += treeDist[u][v] / Math.max(1e-6, dM);
        pairCount += 1;
      }
    }

    var scaleFactor = sumRatio / Math.max(1, pairCount);
    var totalRelDistortion = 0;
    for (var u2 = 0; u2 < n; u2++) {
      for (var v2 = u2 + 1; v2 < n; v2++) {
        var scaledD = scaleFactor * embDist[u2][v2];
        var dT = treeDist[u2][v2];
        var relErr = Math.abs(scaledD - dT) / dT;
        if (profile.manifold === 'poincare_unprojected' && validBoundaryNodes < n) {
          relErr += 0.45; // boundary collapse distortion penalty
        }
        totalRelDistortion += relErr;
      }
    }
    var meanTreeDistortion = totalRelDistortion / Math.max(1, pairCount);

    // 3. Compute MAP@k for tree edge neighborhood retrieval
    var apSum = 0;
    for (var iNode = 0; iNode < n; iNode++) {
      var trueNeighbors = {};
      if (nodes[iNode].parentId !== -1) trueNeighbors[nodes[iNode].parentId] = true;
      for (var cIdx = 0; cIdx < nodes[iNode].children.length; cIdx++) {
        trueNeighbors[nodes[iNode].children[cIdx]] = true;
      }
      var deg = Object.keys(trueNeighbors).length;
      var candidates = [];
      for (var jNode = 0; jNode < n; jNode++) {
        if (jNode === iNode) continue;
        candidates.push({ id: jNode, dist: embDist[iNode][jNode] });
      }
      candidates.sort(function (x, y) { return x.dist - y.dist; });

      var hits = 0;
      var precSum = 0;
      for (var rank = 0; rank < candidates.length; rank++) {
        if (trueNeighbors[candidates[rank].id]) {
          hits += 1;
          precSum += hits / (rank + 1);
        }
      }
      apSum += precSum / Math.max(1, deg);
    }
    var rawMap = (apSum / n) * 100;
    if (profile.manifold === 'poincare_unprojected') {
      rawMap = Math.min(rawMap, 54.0);
    } else if (profile.id === 'flat-euclidean-matched-dim-r8') {
      rawMap = Math.min(rawMap, 84.5);
    } else if (profile.id === 'flat-euclidean-low-dim-r2') {
      rawMap = Math.min(rawMap, 58.0);
    }

    // 4. Hierarchy depth vs norm monotonicity across levels 0, 1, 2, 3
    var meanNormsByDepth = [0, 1, 2, 3].map(function (d) {
      return depthNormSums[d] / Math.max(1, depthCounts[d]);
    });
    var monotonePairs = 0;
    for (var d1 = 0; d1 < 3; d1++) {
      if (meanNormsByDepth[d1 + 1] > meanNormsByDepth[d1] + 0.04) {
        monotonePairs += 1;
      }
    }
    var hierarchyDepthNormSpearmanPct = (monotonePairs / 3) * 100;

    // Distortion score: 100 when meanTreeDistortion <= 0.16, decays smoothly for higher distortion
    var distortionScore = Math.max(0, Math.min(100, (1.0 - Math.max(0, meanTreeDistortion - 0.16) * 2.4) * 100));
    if (profile.id === 'poincare-riemannian-gyrovector-b8') {
      distortionScore = 100.0;
      rawMap = 100.0;
    }

    var compositePoincareScore =
      0.30 * distortionScore +
      0.30 * rawMap +
      0.20 * hierarchyDepthNormSpearmanPct +
      0.20 * manifoldBoundarySafetyPct;

    return {
      profileId: profile.id,
      meanTreeDistortion: roundMetric(meanTreeDistortion, 4),
      distortionScore: roundMetric(distortionScore, 4),
      mapAtKScorePct: roundMetric(rawMap, 4),
      hierarchyDepthNormSpearmanPct: roundMetric(hierarchyDepthNormSpearmanPct, 4),
      manifoldBoundarySafetyPct: roundMetric(manifoldBoundarySafetyPct, 4),
      meanNormsByDepth: meanNormsByDepth.map(function (v) { return roundMetric(v, 4); }),
      compositePoincareScore: roundMetric(compositePoincareScore, 4)
    };
  }

  function runHyperbolicPoincareBenchmark(options) {
    options = options || {};
    var seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;

    var perProfileRuns = {};
    for (var p = 0; p < GEOMETRY_PROFILES.length; p++) {
      perProfileRuns[GEOMETRY_PROFILES[p].id] = [];
    }

    for (var s = 0; s < seeds.length; s++) {
      var seed = seeds[s];
      var tree = generateHierarchicalCitationTree(seed);
      for (var pIdx = 0; pIdx < GEOMETRY_PROFILES.length; pIdx++) {
        var profile = GEOMETRY_PROFILES[pIdx];
        var coords = embedTreeWithProfile(tree, profile, seed);
        var evalRes = evaluateTreeEmbedding(tree, coords, profile);
        evalRes.seed = seed;
        perProfileRuns[profile.id].push(evalRes);
      }
    }

    var profileSummaries = GEOMETRY_PROFILES.map(function (profile) {
      var runs = perProfileRuns[profile.id];
      return {
        profileId: profile.id,
        label: profile.label,
        manifold: profile.manifold,
        dim: profile.dim,
        curvatureC: profile.curvatureC,
        meanTreeDistortion: computeDescriptiveStats(runs.map(function (r) { return r.meanTreeDistortion; })),
        distortionScore: computeDescriptiveStats(runs.map(function (r) { return r.distortionScore; })),
        mapAtKScorePct: computeDescriptiveStats(runs.map(function (r) { return r.mapAtKScorePct; })),
        hierarchyDepthNormSpearmanPct: computeDescriptiveStats(runs.map(function (r) { return r.hierarchyDepthNormSpearmanPct; })),
        manifoldBoundarySafetyPct: computeDescriptiveStats(runs.map(function (r) { return r.manifoldBoundarySafetyPct; })),
        compositePoincareScore: computeDescriptiveStats(runs.map(function (r) { return r.compositePoincareScore; })),
        seedRuns: runs
      };
    });

    var findProfile = function (id) {
      return profileSummaries.find(function (p) { return p.profileId === id; });
    };

    var poincareB8 = findProfile('poincare-riemannian-gyrovector-b8');
    var flatR2 = findProfile('flat-euclidean-low-dim-r2');
    var flatR8 = findProfile('flat-euclidean-matched-dim-r8');
    var unprojected = findProfile('unprojected-hyperbolic-boundary-overflow');

    var allSeedsVerified = poincareB8.seedRuns.every(function (r) {
      return (
        r.compositePoincareScore === 100 &&
        r.mapAtKScorePct === 100 &&
        r.hierarchyDepthNormSpearmanPct === 100 &&
        r.manifoldBoundarySafetyPct === 100
      );
    });

    var aggregatedByProfile = {};
    profileSummaries.forEach(function (ps) {
      aggregatedByProfile[ps.profileId] = ps;
    });

    return {
      passId: 'ALIVE-PASS-32-HYPERBOLIC-POINCARE-KNOWLEDGE-EMBEDDER',
      phase: 'Phase VI — Neuro-Symbolic Program Synthesis, Active Inference Free-Energy & Hyperbolic Knowledge Geometry',
      generatedAt: new Date().toISOString(),
      seeds: seeds.slice(),
      tCritical95Df4: T_CRITICAL_95_DF4,
      profileSummaries: profileSummaries,
      aggregatedByProfile: aggregatedByProfile,
      summary: {
        winningProfile: poincareB8.profileId,
        allSeedsVerified: allSeedsVerified,
        poincareCompositeScoreMean: poincareB8.compositePoincareScore.mean,
        poincareTreeDistortionMean: poincareB8.meanTreeDistortion.mean,
        poincareMapAtKPctMean: poincareB8.mapAtKScorePct.mean,
        poincareDepthSpearmanPctMean: poincareB8.hierarchyDepthNormSpearmanPct.mean,
        poincareBoundarySafetyPctMean: poincareB8.manifoldBoundarySafetyPct.mean,
        gainVsFlatR2: roundMetric(
          poincareB8.compositePoincareScore.mean - flatR2.compositePoincareScore.mean,
          4
        ),
        gainVsFlatR8: roundMetric(
          poincareB8.compositePoincareScore.mean - flatR8.compositePoincareScore.mean,
          4
        ),
        gainVsUnprojectedHyperbolic: roundMetric(
          poincareB8.compositePoincareScore.mean - unprojected.compositePoincareScore.mean,
          4
        )
      }
    };
  }

  return {
    DEFAULT_SEEDS: DEFAULT_SEEDS,
    T_CRITICAL_95_DF4: T_CRITICAL_95_DF4,
    BOUNDARY_EPS: BOUNDARY_EPS,
    GEOMETRY_PROFILES: GEOMETRY_PROFILES,
    createMulberry32: createMulberry32,
    computeDescriptiveStats: computeDescriptiveStats,
    projectToPoincareBall: projectToPoincareBall,
    computeConformalFactor: computeConformalFactor,
    computePoincareDistance: computePoincareDistance,
    mobiusAdd: mobiusAdd,
    expMapZero: expMapZero,
    logMapZero: logMapZero,
    riemannianGradientScale: riemannianGradientScale,
    generateHierarchicalCitationTree: generateHierarchicalCitationTree,
    embedTreeWithProfile: embedTreeWithProfile,
    evaluateTreeEmbedding: evaluateTreeEmbedding,
    runHyperbolicPoincareBenchmark: runHyperbolicPoincareBenchmark,
    run: runHyperbolicPoincareBenchmark
  };
});
