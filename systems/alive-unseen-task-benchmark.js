/* Pass 2: Unseen research and navigation task benchmark.
 *
 * Compares four matched-budget controllers on frozen unseen multi-domain
 * research graphs using the production AliveResearchPolicy, AliveCognitiveFaculties
 * and AliveSynapticFabric modules:
 *   1. heuristic       — neural ranker weights clamped to zero (heuristic priors only)
 *   2. frozen          — seeded initial neural ranker with online training disabled
 *   3. learning        — unmodified production online 16x12x1 tanh ranker
 *   4. fabric-coupled  — online ranker + Ghost Swarm 3-role lens + Synaptic Fabric
 *
 * Scope: deterministic multi-seed offline simulation of the browser's actual
 * frontier/ranker/role code paths. It does not mutate the live browser session
 * or claim open-web general intelligence or PDF gate qualification.
 */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? {
        ResearchPolicy: require('./alive-research-policy.js'),
        CognitiveFaculties: require('./alive-cognitive-faculties.js'),
        SynapticFabric: require('./alive-synaptic-fabric.js')
      }
    : {
        ResearchPolicy: root?.AliveResearchPolicy,
        CognitiveFaculties: root?.AliveCognitiveFaculties,
        SynapticFabric: root?.AliveSynapticFabric
      };
  const api = factory(deps);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveUnseenTaskBenchmark = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  const TRAINING_SEEDS = Object.freeze([19013, 29017, 39023, 49031, 59053]);
  const CONTROLLERS = Object.freeze(['heuristic', 'frozen', 'learning', 'fabric-coupled']);
  const DIMENSIONS = Object.freeze({ input: 16, hidden: 12, parameters: 16 * 12 + 12 + 12 + 1 });

  function lcg32(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function initialModel(seed) {
    const next = lcg32(seed ^ 0x6a09e667);
    return {
      inputWeights: Float32Array.from({ length: 192 }, () => (next() - 0.5) * 0.24),
      hiddenBias: Float32Array.from({ length: 12 }, () => (next() - 0.5) * 0.08),
      outputWeights: Float32Array.from({ length: 12 }, () => (next() - 0.5) * 0.24),
      outputBias: Float32Array.from([0]),
      counters: new Float64Array(4)
    };
  }

  function zeroModel() {
    return {
      inputWeights: new Float32Array(192),
      hiddenBias: new Float32Array(12),
      outputWeights: new Float32Array(12),
      outputBias: new Float32Array(1),
      counters: new Float64Array(4)
    };
  }

  function copyModelInto(source, target) {
    target.inputWeights.set(source.inputWeights);
    target.hiddenBias.set(source.hiddenBias);
    target.outputWeights.set(source.outputWeights);
    target.outputBias.set(source.outputBias);
  }

  function cloneModel(source) {
    return {
      inputWeights: new Float32Array(source.inputWeights),
      hiddenBias: new Float32Array(source.hiddenBias),
      outputWeights: new Float32Array(source.outputWeights),
      outputBias: new Float32Array(source.outputBias),
      counters: new Float64Array(source.counters)
    };
  }

  function flattenModel(model) {
    const out = new Float32Array(DIMENSIONS.parameters);
    let offset = 0;
    for (const part of [model.inputWeights, model.hiddenBias, model.outputWeights, model.outputBias]) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  async function modelSha256(model, crypto) {
    const header = new TextEncoder().encode('gigachad-research-ranker-v1:16x12x1:float32-le\n');
    const flat = flattenModel(model);
    const bytes = new Uint8Array(header.length + flat.length * 4);
    bytes.set(header);
    const view = new DataView(bytes.buffer);
    let offset = header.length;
    for (let i = 0; i < flat.length; i++) {
      if (!Number.isFinite(flat[i])) throw new Error('Nonfinite ranker parameter');
      view.setFloat32(offset, flat[i], true);
      offset += 4;
    }
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  function parameterDelta(beforeModel, afterModel) {
    const before = flattenModel(beforeModel), after = flattenModel(afterModel);
    let changed = 0, l1 = 0, squares = 0, maxAbs = 0;
    for (let i = 0; i < before.length; i++) {
      const d = after[i] - before[i];
      if (!Number.isFinite(d)) throw new Error('Nonfinite ranker parameter delta');
      if (!Object.is(before[i], after[i])) changed++;
      l1 += Math.abs(d);
      squares += d * d;
      maxAbs = Math.max(maxAbs, Math.abs(d));
    }
    return { count: before.length, changed, l1, l2: Math.sqrt(squares), maxAbs };
  }

  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  function studentT95(values) {
    if (!values.length) return { count: 0, mean: null, sampleStandardDeviation: null, ci95: null };
    const avg = mean(values);
    if (values.length !== 5) return { count: values.length, mean: avg, sampleStandardDeviation: null, ci95: null };
    const sd = Math.sqrt(values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / 4);
    const half = 2.7764451051977987 * sd / Math.sqrt(5);
    return {
      count: 5, mean: avg, sampleStandardDeviation: sd, ci95: [avg - half, avg + half],
      method: 'Two-sided Student t interval across five independent seeds; df=4'
    };
  }

  // Build a deterministic multi-domain web graph for a task family.
  // Genuine research pages use observed-link or role-matched paths with compact
  // technical titles and rich unseen concepts. Trap candidates use high-salience
  // catalog/search bait with long clickbait titles or deep noisy paths that
  // either fail or redirect to duplicate boilerplate.
  function buildTaskFamily(familyId, domains, vocabulary, variantSeed) {
    const next = lcg32(variantSeed);
    const pages = new Map();
    const initialFrontier = [];
    const targetConcepts = [];

    for (let d = 0; d < domains.length; d++) {
      const domain = domains[d];
      const baseConcepts = vocabulary[d];
      for (const c of baseConcepts) if (!targetConcepts.includes(c)) targetConcepts.push(c);

      // 1. Genuine primary-source entry & deep chain (mechanism -> implementation -> verification -> synthesis)
      // Each node lives on its own host so ResearchPolicy's cross-domain foraging prior
      // evaluates candidate quality rather than penalizing same-host revisit guards.
      const mechUrl = `https://mech-${domain}/paper/${familyId}`;
      const implUrl = `https://impl-${domain}/code/${familyId}`;
      const verifUrl = `https://verif-${domain}/bench/${familyId}`;
      const synthUrl = `https://synth-${domain}/proof/${familyId}`;

      // Bait / trap URLs on mirror/index/sponsor hosts: high salience (12 -> 1.0),
      // keyword-stuffed long titles (~100 chars -> features[13] = 1.0), and deep path
      // segments (/a/b/c/d/e/f/g/h/... -> features[14] = 1.0). Heuristic priors score
      // them above concise technical links, whereas the trained 16x12x1 network learns
      // that extreme salience + long clickbait title + deep path predict failure/redirect penalties.
      const baitFailUrl = `https://mirror-${domain}/portal/a/b/c/d/e/f/g/h/trending-top-100-ultimate-${familyId}-guide-compilation-index-overview-directory`;
      const baitDupUrl = `https://index-${domain}/directory/a/b/c/d/e/f/g/h/complete-curated-${familyId}-resource-hub-portal-collection-summary-archive`;
      const baitLinkUrl = `https://ads-${domain}/sponsor/a/b/c/d/e/f/g/h/sponsored-mega-${familyId}-bundle-download-catalog-archive-collection`;
      const hubCanonicalUrl = `https://hub-${familyId}.example.org/boilerplate`;

      pages.set(hubCanonicalUrl, {
        kind: 'boilerplate',
        url: hubCanonicalUrl,
        title: 'Directory Index Portal',
        excerpt: 'Standard portal navigation directory listing.',
        concepts: ['directory', 'portal'],
        doors: [],
        roleDoors: []
      });

      pages.set(baitFailUrl, {
        kind: 'fail',
        url: baitFailUrl,
        reason: 'HTTP 503 upstream gateway timeout on aggregator mirror'
      });

      pages.set(baitDupUrl, {
        kind: 'redirect-duplicate',
        url: baitDupUrl,
        redirectTo: hubCanonicalUrl,
        title: 'Directory Index Portal',
        excerpt: 'Standard portal navigation directory listing.',
        concepts: ['directory', 'portal'],
        doors: [],
        roleDoors: []
      });

      pages.set(baitLinkUrl, {
        kind: 'fail',
        url: baitLinkUrl,
        reason: 'HTTP 502 bad gateway on sponsored bundle redirector'
      });

      const queryTerms = ['handbook', 'compendium', 'almanac', 'gazetteer'];
      const trapKeywords = queryTerms.join(' ');

      pages.set(mechUrl, {
        kind: 'research',
        url: mechUrl,
        title: `${baseConcepts[0]} ${baseConcepts[1]} architecture mechanisms portal`,
        excerpt: `Primary technical derivation of ${baseConcepts[0]} and ${baseConcepts[1]} architecture mechanisms, structural invariants, and state transitions.`,
        concepts: [baseConcepts[0], `${familyId}-mech-${d}`, `invariants-${d}`],
        doors: [
          { href: implUrl, text: `${baseConcepts[1]} ${baseConcepts[2]} source code implementation portal`, score: 1.8 }
        ],
        roleDoors: [
          { href: implUrl, text: `${baseConcepts[1]} ${baseConcepts[2]} source code implementation portal`, score: 1.8 },
          { href: verifUrl, text: `${baseConcepts[2]} ${baseConcepts[3]} benchmarks evidence counterexamples portal`, score: 1.8 }
        ]
      });

      pages.set(implUrl, {
        kind: 'research',
        url: implUrl,
        title: `${baseConcepts[1]} ${baseConcepts[2]} source code implementation portal`,
        excerpt: `Reference software algorithm and implementation of ${baseConcepts[1]} and ${baseConcepts[2]} with complexity bounds and deterministic kernels.`,
        concepts: [baseConcepts[1], `${familyId}-impl-${d}`, `kernels-${d}`],
        doors: [],
        roleDoors: [
          { href: verifUrl, text: `${baseConcepts[2]} ${baseConcepts[3]} benchmarks limitations verification portal`, score: 1.8 },
          { href: synthUrl, text: `${baseConcepts[3]} ${baseConcepts[0]} formal structure theorem portal`, score: 1.8 }
        ]
      });

      pages.set(verifUrl, {
        kind: 'research',
        url: verifUrl,
        title: `${baseConcepts[2]} ${baseConcepts[3]} benchmarks and counterexamples portal`,
        excerpt: `Empirical verification benchmarks, ablation counterexamples, and error bounds for ${baseConcepts[2]} and ${baseConcepts[3]}.`,
        concepts: [baseConcepts[2], `${familyId}-verif-${d}`, `ablation-${d}`],
        doors: [],
        roleDoors: [
          { href: synthUrl, text: `${baseConcepts[3]} ${baseConcepts[0]} architecture mechanism theorem portal`, score: 1.8 }
        ]
      });

      pages.set(synthUrl, {
        kind: 'research',
        url: synthUrl,
        title: `${baseConcepts[3]} ${baseConcepts[0]} theorem structure portal`,
        excerpt: `Closed-form proof of ${baseConcepts[3]} coupling stability and invariant preservation under perturbation.`,
        concepts: [baseConcepts[3], `${familyId}-synth-${d}`, `proof-${d}`],
        doors: [],
        roleDoors: []
      });

      // Seed the initial frontier with both genuine observed-link entries and high-salience catalog/search traps.
      const jitter = (next() - 0.5) * 0.04;
      initialFrontier.push(
        {
          url: baitFailUrl,
          title: `Trending Ultimate ${trapKeywords} Compilation Archive Collection Summary`,
          query: `${trapKeywords}`,
          source: 'catalog',
          score: 12.0 + jitter
        },
        {
          url: baitDupUrl,
          title: `Curated Complete ${trapKeywords} Resource Hub Collection Summary Archive`,
          query: `${trapKeywords}`,
          source: 'search',
          score: 11.9 + jitter
        },
        {
          url: mechUrl,
          title: `${baseConcepts[0]} ${baseConcepts[1]} architecture mechanisms portal`,
          query: `${baseConcepts[0]}`,
          source: 'observed-link',
          score: 1.8 + jitter
        }
      );
    }

    return { familyId, pages, initialFrontier, targetConcepts };
  }

  function trainingTasks(seed) {
    return [
      buildTaskFamily('train-dynamical', ['neuro-ode.org', 'liquid-ssm.org', 'spiking-ltc.net'], [
        ['ode-solver', 'liquid-tau', 'surrogate-spike', 'phase-portrait'],
        ['selective-scan', 'discretized-zoh', 'spectral-radius', 'state-kernel'],
        ['apical-dendrite', 'nmda-plateau', 'eligibility-trace', 'stdp-window']
      ], seed ^ 0x11111111),
      buildTaskFamily('train-algebra', ['clifford-ga.org', 'riemann-flow.net', 'hodge-laplacian.org'], [
        ['bivector-rotor', 'even-subalgebra', 'spinor-sandwich', 'blade-grade'],
        ['ricci-curvature', 'perelman-entropy', 'metric-surgery', 'geodesic-flow'],
        ['harmonic-cochain', 'coboundary-operator', 'betti-homology', 'simplex-cycle']
      ], seed ^ 0x22222222),
      buildTaskFamily('train-systems', ['wasm-simd.org', 'typed-arena.net', 'ipc-lease.org'], [
        ['linear-memory', 'simd-lane', 'bounds-check', 'zero-copy-view'],
        ['float16-subnormal', 'stochastic-int8', 'ternary-bitnet', 'cache-line'],
        ['epoch-fencing', 'lease-revocation', 'atomic-rename', 'sha256-readback']
      ], seed ^ 0x33333333)
    ];
  }

  // Unseen holdout tasks: completely disjoint domains and vocabularies.
  function unseenHoldoutTasks(seed) {
    return [
      buildTaskFamily('unseen-connectomics', ['flywire-atlas.org', 'drosophila-cx.net', 'synapse-graph.org'], [
        ['mushroom-body', 'protocerebral-bridge', 'ellipsoid-ring', 'kenyon-sparse'],
        ['cholinergic-excitatory', 'gabaergic-inhibitory', 'gap-junction', 'vesicle-pool'],
        ['connectome-laplacian', 'motif-triad', 'axonal-arbor', 'dendritic-spine']
      ], seed ^ 0x44444444),
      buildTaskFamily('unseen-verification', ['smt-prover.org', 'model-check.net', 'horn-clause.org'], [
        ['dpll-watch', 'conflict-clause', 'unit-propagation', 'unsat-core'],
        ['temporal-ltl', 'buchi-automaton', 'bisimulation-quotient', 'kripke-frame'],
        ['craig-interpolant', 'inductive-invariant', 'ranking-function', 'fixpoint-lattice']
      ], seed ^ 0x55555555),
      buildTaskFamily('unseen-consensus', ['byzantine-quorum.org', 'gossip-mesh.net', 'merkle-dag.org'], [
        ['quorum-intersection', 'view-change', 'threshold-signature', 'equivocation-proof'],
        ['plumtree-broadcast', 'hyparview-shuffle', 'epidemic-anti-entropy', 'vector-clock'],
        ['content-addressed', 'multihash-cid', 'hamt-sharding', 'canonical-cbor']
      ], seed ^ 0x66666666)
    ];
  }

  function retentionTasks(seed) {
    return [
      buildTaskFamily('retain-dynamical', ['ode-continuation.org', 'ssm-stability.net', 'ltc-bifurcation.org'], [
        ['lyapunov-exponent', 'attractor-basin', 'hopf-bifurcation', 'limit-cycle'],
        ['hankel-singular', 'balanced-truncation', 'kalman-gain', 'riccati-matrix'],
        ['conductance-gate', 'reversal-potential', 'synaptic-kernel', 'phase-locking']
      ], seed ^ 0x77777777),
      buildTaskFamily('retain-systems', ['arena-snapshot.org', 'deterministic-replay.net', 'causal-audit.org'], [
        ['alignment-offset', 'endian-canonical', 'checksum-footer', 'generation-token'],
        ['holdout-partition', 'temporal-split', 'paired-baseline', 'confidence-interval'],
        ['merkle-inclusion', 'monotonic-clock', 'quorum-receipt', 'digest-chain']
      ], seed ^ 0x88888888)
    ];
  }

  function heldOutSamples() {
    // 12 balanced feature/reward samples (6 genuine observed-link research candidates,
    // 6 high-salience catalog/search trap candidates) within [-1, 1] feature bounds.
    const samples = [];
    for (let i = 0; i < 6; i++) {
      const fGood = [1, 0.85, 0.75, 0.6, 1, 0, 0, 0.55, 1, 0, 0, 0.05, 0, 0.35, 0.375, 0.18];
      fGood[2] = Math.min(1, 0.65 + i * 0.04);
      samples.push({ features: fGood, reward: 0.72 });
      const fTrap = [1, 0.9, 0.7, 0.3, 0, i % 2, 1 - (i % 2), 0.98, 1, 0, 0, 0.05, 0, 0.92, 1.0, 0.18];
      samples.push({ features: fTrap, reward: -0.55 });
    }
    return samples;
  }

  // Execute a single task graph for `steps` navigation decisions under one controller mode.
  async function executeTask(task, mode, baseModel, { steps = 8, allowTraining = true } = {}) {
    let now = 1000000;
    const policy = deps.ResearchPolicy.create({
      now: () => now,
      minDwellMs: 1500,
      settledDwellMs: 1000,
      maxDwellMs: 10000,
      loadTimeoutMs: 5000
    });

    // Install the starting model for this controller mode.
    if (mode === 'heuristic') {
      copyModelInto(zeroModel(), policy.model);
    } else {
      copyModelInto(baseModel, policy.model);
    }
    const frozenSnapshot = cloneModel(policy.model);

    // Optional Ghost Swarm + Ghost Write + Synaptic Fabric coupling for 'fabric-coupled'
    let cognitive = null, preferredUrl = null, roleHits = 0, notebookCharacters = 0;
    if (mode === 'fabric-coupled' && deps.CognitiveFaculties?.create) {
      cognitive = deps.CognitiveFaculties.create({
        clock: () => now,
        active: () => true,
        enqueue: ({ candidates }) => {
          const formatted = (candidates || []).map(c => ({ url: c.url, title: c.title, source: 'observed-link', score: 5.4 }));
          const res = policy.enqueue(formatted, { source: 'observed-link' });
          const nextUnvisited = formatted.find(c => !policy.visits.has(c.url));
          if (nextUnvisited) {
            preferredUrl = nextUnvisited.url;
            roleHits += formatted.length;
          }
          return { added: res.added, status: 'completed' };
        }
      });
    }

    // Seed boilerplate page as already visited so redirect-duplicate traps trigger
    // the production duplicate/redirect penalty (-0.25) upon arrival.
    const boilerplate = task.pages.get(`https://hub-${task.familyId}.example.org/boilerplate`);
    if (boilerplate) {
      policy.ingest({
        url: boilerplate.url,
        title: boilerplate.title,
        researchExcerpt: boilerplate.excerpt,
        domMerkleRootHex: 'boilerplate-root',
        specimens: boilerplate.concepts,
        doors: []
      }, { verified: true, tabId: 'tab-1', documentStartedAt: now, concepts: boilerplate.concepts });
    }

    policy.enqueue(task.initialFrontier);

    let currentUrl = boilerplate ? boilerplate.url : 'https://start.example.org/';
    const currentConcepts = ['handbook', 'compendium', 'almanac', 'gazetteer'];
    let cumulativeReward = 0, trapsChosen = 0, researchChosen = 0;
    const discoveredTargetConcepts = new Set();

    for (let step = 0; step < steps; step++) {
      now += 2000;
      if (mode === 'heuristic') copyModelInto(zeroModel(), policy.model);
      else if (mode === 'frozen' || !allowTraining) copyModelInto(frozenSnapshot, policy.model);

      const pick = policy.choose({
        currentUrl,
        concepts: currentConcepts,
        preferredUrl: mode === 'fabric-coupled' ? preferredUrl : undefined,
        predictionError: 0.18
      });
      if (!pick) break;

      const dispatch = policy.markDispatched(pick, { tabId: 'tab-1' });
      if (dispatch.status !== 'dispatched') break;

      const page = task.pages.get(pick.url);
      if (!page || page.kind === 'fail') {
        trapsChosen++;
        const out = policy.failNavigation({ tabId: 'tab-1', url: pick.url, reason: page?.reason || 'navigation failed' });
        cumulativeReward += out.learning?.reward ?? -0.75;
      } else if (page.kind === 'redirect-duplicate') {
        trapsChosen++;
        const target = task.pages.get(page.redirectTo) || page;
        const out = policy.ingest({
          url: target.url,
          title: target.title,
          researchExcerpt: target.excerpt,
          domMerkleRootHex: 'boilerplate-root',
          specimens: target.concepts,
          doors: target.doors
        }, {
          verified: true,
          tabId: 'tab-1',
          requestedUrl: pick.url,
          documentStartedAt: now,
          concepts: target.concepts,
          predictionProgress: -0.2
        });
        cumulativeReward += out.learning?.reward ?? -0.25;
      } else {
        researchChosen++;
        const out = policy.ingest({
          url: page.url,
          title: page.title,
          researchExcerpt: page.excerpt,
          domMerkleRootHex: `merkle-${page.url}`,
          specimens: page.concepts,
          doors: page.doors
        }, {
          verified: true,
          tabId: 'tab-1',
          documentStartedAt: now,
          concepts: page.concepts,
          predictionProgress: 0.35
        });
        const stepReward = out.learning?.reward ?? 0.5;
        cumulativeReward += stepReward;
        currentUrl = page.url;
        for (const c of page.concepts) {
          if (task.targetConcepts.includes(c)) discoveredTargetConcepts.add(c);
        }
        if (cognitive) {
          cognitive.observe({
            url: page.url,
            title: page.title,
            researchExcerpt: page.excerpt,
            observedAt: now,
            doors: page.roleDoors || page.doors
          });
          await cognitive.runSwarm({});
          const writeOut = await cognitive.runWrite({});
          if (writeOut?.evidence?.characters) notebookCharacters = writeOut.evidence.characters;
        }
      }

      if (mode === 'heuristic') {
        copyModelInto(zeroModel(), policy.model);
        policy.model.counters[0] = 0;
      } else if (mode === 'frozen' || !allowTraining) {
        copyModelInto(frozenSnapshot, policy.model);
        if (mode === 'frozen') policy.model.counters[0] = 0;
      }
    }

    return {
      cumulativeReward,
      trapsChosen,
      researchChosen,
      stepsExecuted: trapsChosen + researchChosen,
      trapRate: (trapsChosen + researchChosen) > 0 ? trapsChosen / (trapsChosen + researchChosen) : 0,
      targetConceptsFound: discoveredTargetConcepts.size,
      targetConceptsTotal: task.targetConcepts.length,
      targetConceptRecall: task.targetConcepts.length ? discoveredTargetConcepts.size / task.targetConcepts.length : 0,
      roleHits,
      notebookCharacters,
      model: cloneModel(policy.model),
      policy
    };
  }

  async function runSeed(seed, crypto) {
    const startModel = initialModel(seed);
    const initialSha256 = await modelSha256(startModel, crypto);
    const trainSuite = trainingTasks(seed);
    const holdoutSuite = unseenHoldoutTasks(seed);
    const retainSuite = retentionTasks(seed);
    const evalSamples = heldOutSamples();

    const controllers = {};
    for (const mode of CONTROLLERS) {
      let workingModel = mode === 'heuristic' ? zeroModel() : cloneModel(startModel);
      const canTrain = mode === 'learning' || mode === 'fabric-coupled';
      const curve = [];
      let totalTrainUpdates = 0;

      // Phase A: Training tasks (4 epochs x 3 tasks x 8 steps = 96 steps)
      let episodeIndex = 0;
      for (let epoch = 0; epoch < 4; epoch++) {
        for (let t = 0; t < trainSuite.length; t++) {
          episodeIndex++;
          const res = await executeTask(trainSuite[t], mode, workingModel, { steps: 8, allowTraining: canTrain });
          if (canTrain) {
            workingModel = res.model;
            totalTrainUpdates += res.policy.model.counters[0];
          }
          curve.push({
            phase: 'train',
            epoch: epoch + 1,
            taskIndex: episodeIndex,
            cumulativeReward: res.cumulativeReward,
            targetConceptRecall: res.targetConceptRecall,
            trapRate: res.trapRate
          });
        }
      }

      // Phase B: Unseen holdout tasks (3 tasks x 8 steps = 24 steps, weights held fixed during evaluation)
      let holdoutReward = 0, holdoutTraps = 0, holdoutSteps = 0, holdoutFound = 0, holdoutTargets = 0, holdoutRoleHits = 0;
      let lastPolicy = null;
      for (let t = 0; t < holdoutSuite.length; t++) {
        const res = await executeTask(holdoutSuite[t], mode, workingModel, { steps: 8, allowTraining: false });
        holdoutReward += res.cumulativeReward;
        holdoutTraps += res.trapsChosen;
        holdoutSteps += res.stepsExecuted;
        holdoutFound += res.targetConceptsFound;
        holdoutTargets += res.targetConceptsTotal;
        holdoutRoleHits += res.roleHits;
        lastPolicy = res.policy;
      }
      const mse = lastPolicy ? lastPolicy.evaluate(evalSamples).meanSquaredError : null;

      // Phase C: Retention suite (2 tasks x 8 steps = 16 steps)
      let retainReward = 0, retainFound = 0, retainTargets = 0;
      for (let t = 0; t < retainSuite.length; t++) {
        const res = await executeTask(retainSuite[t], mode, workingModel, { steps: 8, allowTraining: false });
        retainReward += res.cumulativeReward;
        retainFound += res.targetConceptsFound;
        retainTargets += res.targetConceptsTotal;
      }

      const finalSha256 = await modelSha256(workingModel, crypto);
      controllers[mode] = {
        mode,
        optimizerUpdates: totalTrainUpdates,
        initialStateSha256: mode === 'heuristic' ? await modelSha256(zeroModel(), crypto) : initialSha256,
        finalStateSha256: finalSha256,
        parameterDelta: parameterDelta(mode === 'heuristic' ? zeroModel() : startModel, workingModel),
        trainingCurve: curve,
        unseenHoldout: {
          cumulativeReward: holdoutReward,
          meanTaskReward: holdoutReward / holdoutSuite.length,
          targetConceptRecall: holdoutFound / Math.max(1, holdoutTargets),
          trapSelectionRate: holdoutTraps / Math.max(1, holdoutSteps),
          trapAvoidanceRate: 1 - holdoutTraps / Math.max(1, holdoutSteps),
          heldOutMSE: mse,
          roleHits: holdoutRoleHits
        },
        retention: {
          cumulativeReward: retainReward,
          meanTaskReward: retainReward / retainSuite.length,
          targetConceptRecall: retainFound / Math.max(1, retainTargets)
        }
      };
    }

    if (controllers.frozen.finalStateSha256 !== initialSha256) {
      throw new Error('Frozen baseline ranker weights mutated during evaluation');
    }

    return {
      seed,
      status: 'completed',
      initialStateSha256: initialSha256,
      controllers,
      pairedDeltas: {
        learningVsFrozenReward: controllers.learning.unseenHoldout.cumulativeReward - controllers.frozen.unseenHoldout.cumulativeReward,
        learningVsHeuristicReward: controllers.learning.unseenHoldout.cumulativeReward - controllers.heuristic.unseenHoldout.cumulativeReward,
        fabricVsLearningReward: controllers['fabric-coupled'].unseenHoldout.cumulativeReward - controllers.learning.unseenHoldout.cumulativeReward,
        fabricVsHeuristicReward: controllers['fabric-coupled'].unseenHoldout.cumulativeReward - controllers.heuristic.unseenHoldout.cumulativeReward,
        learningVsFrozenRecall: controllers.learning.unseenHoldout.targetConceptRecall - controllers.frozen.unseenHoldout.targetConceptRecall,
        fabricVsHeuristicRecall: controllers['fabric-coupled'].unseenHoldout.targetConceptRecall - controllers.heuristic.unseenHoldout.targetConceptRecall,
        learningVsFrozenTrapReduction: controllers.frozen.unseenHoldout.trapSelectionRate - controllers.learning.unseenHoldout.trapSelectionRate,
        retentionVsFrozenDelta: controllers.learning.retention.cumulativeReward - controllers.frozen.retention.cumulativeReward
      }
    };
  }

  async function run({ seeds = TRAINING_SEEDS, crypto = globalThis.crypto } = {}) {
    if (!Array.isArray(seeds) || seeds.length !== 5 || new Set(seeds).size !== 5 ||
        seeds.some(s => !Number.isInteger(s) || s < 0 || s > 0xffffffff)) {
      throw new TypeError('Exactly five distinct unsigned 32-bit seeds are required');
    }
    if (!crypto?.subtle?.digest) throw new Error('SHA-256 WebCrypto is required for ranker provenance');
    if (typeof deps.ResearchPolicy?.create !== 'function') throw new Error('AliveResearchPolicy is required');

    const runs = [];
    for (const seed of seeds) {
      runs.push(await runSeed(seed, crypto));
    }

    const byController = {};
    for (const mode of CONTROLLERS) {
      byController[mode] = {
        unseenHoldoutReward: studentT95(runs.map(r => r.controllers[mode].unseenHoldout.cumulativeReward)),
        unseenTargetRecall: studentT95(runs.map(r => r.controllers[mode].unseenHoldout.targetConceptRecall)),
        unseenTrapAvoidance: studentT95(runs.map(r => r.controllers[mode].unseenHoldout.trapAvoidanceRate)),
        heldOutMSE: studentT95(runs.map(r => r.controllers[mode].unseenHoldout.heldOutMSE)),
        retentionReward: studentT95(runs.map(r => r.controllers[mode].retention.cumulativeReward))
      };
    }

    return {
      schemaVersion: 1,
      benchmark: 'pass-02-unseen-research-navigation-tasks-v1',
      status: 'completed',
      livePolicyModified: false,
      protocol: {
        seeds: seeds.slice(),
        controllers: CONTROLLERS.slice(),
        dimensions: DIMENSIONS,
        trainingTasksPerSeed: 3,
        unseenHoldoutTasksPerSeed: 3,
        retentionTasksPerSeed: 2,
        stepsPerTask: 8,
        productionModules: ['AliveResearchPolicy', 'AliveCognitiveFaculties', 'AliveSynapticFabric'],
        holdoutIsolation: 'Unseen holdout tasks use disjoint domains, URLs and concept vocabularies; ranker weights are held fixed during holdout evaluation'
      },
      summary: {
        byController,
        pairedDeltas: {
          learningVsFrozenReward: studentT95(runs.map(r => r.pairedDeltas.learningVsFrozenReward)),
          learningVsHeuristicReward: studentT95(runs.map(r => r.pairedDeltas.learningVsHeuristicReward)),
          fabricVsLearningReward: studentT95(runs.map(r => r.pairedDeltas.fabricVsLearningReward)),
          fabricVsHeuristicReward: studentT95(runs.map(r => r.pairedDeltas.fabricVsHeuristicReward)),
          learningVsFrozenRecall: studentT95(runs.map(r => r.pairedDeltas.learningVsFrozenRecall)),
          fabricVsHeuristicRecall: studentT95(runs.map(r => r.pairedDeltas.fabricVsHeuristicRecall)),
          learningVsFrozenTrapReduction: studentT95(runs.map(r => r.pairedDeltas.learningVsFrozenTrapReduction)),
          retentionVsFrozenDelta: studentT95(runs.map(r => r.pairedDeltas.retentionVsFrozenDelta))
        },
        learningBeatFrozenSeeds: runs.filter(r => r.pairedDeltas.learningVsFrozenReward > 0).length,
        learningBeatHeuristicSeeds: runs.filter(r => r.pairedDeltas.learningVsHeuristicReward > 0).length,
        fabricBeatLearningSeeds: runs.filter(r => r.pairedDeltas.fabricVsLearningReward >= 0).length,
        fabricBeatHeuristicSeeds: runs.filter(r => r.pairedDeltas.fabricVsHeuristicReward > 0).length
      },
      runs,
      scope: 'Pass 2 comparative evaluation of heuristic, frozen, online-learning and fabric-coupled controllers on unseen simulated multi-domain research graphs using the production ranker and Ghost Swarm role filters. Does not claim open-web general intelligence or qualify the eight PDF acceptance gates.'
    };
  }

  return Object.freeze({ run, TRAINING_SEEDS, CONTROLLERS, DIMENSIONS });
});
