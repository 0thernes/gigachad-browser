/* Ordered renderer startup. Persisted exact components are prepared before the
 * trusted inert main source becomes a real classic script in global scope. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveStartupLoader = api;
  if (root?.document && !root.aliveStartup) {
    root.aliveStartup = api.create({ window: root, document: root.document });
    root.aliveStartup.start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SOURCE_ID = 'gigachad-main-source';
  const SOURCE_TYPE = 'application/x-gigachad-main';
  const STORAGE_KEY = 'humunculus_persistent_genome_v1';
  const POST_MODULES = Object.freeze([
    'systems/alife-learning-evidence.js',
    'systems/alive-learning-five-seed.js',
    'systems/alive-neural-coupling.js',
    'systems/alive-specialist-fusion.js',
    'systems/alive-autosave.js',
    'systems/alive-checkpoints.js',
    'systems/alive-authority.js',
    'systems/alive-research-policy.js',
    'systems/alive-overdrive-adapters.js',
    'systems/alive-cognitive-faculties.js',
    'systems/alive-tensor-evidence.js',
    'systems/alive-workspace-ui.js',
    'systems/alive-faculty-visuals.js',
    'systems/alive-synaptic-fabric.js',
    'systems/alive-unseen-task-benchmark.js',
    'systems/alive-architecture-ablations.js',
    'systems/alive-restart-equivalence.js',
    'systems/alive-continual-morphology-transfer.js',
    'systems/alive-colony-population-fitness.js',
    'systems/alive-research-provenance-evaluator.js',
    'systems/alive-browser-fault-recovery.js',
    'systems/alive-sustained-performance-qualifier.js',
    'systems/alive-integrated-release-audit.js',
    'systems/alive-tor-hybrid-mesh.js',
    'systems/alive-tor-circuit-controller.js',
    'systems/alive-onion-v3-verifier.js',
    'systems/alive-tor-fingerprint-shield.js',
    'systems/alive-tor-acceptance-matrix.js',
    'systems/alive-hyper-swarm-coordinator.js',
    'systems/alive-swarm-budget-governor.js',
    'systems/alive-swarm-stigmergic-mesh.js',
    'systems/alive-swarm-wild-foraging-benchmark.js',
    'systems/alive-omega-20-pass-auditor.js',
    'systems/alive-tor-pluggable-transports.js',
    'systems/alive-onion-pow-client-auth.js',
    'systems/alive-tor-padding-traffic-defense.js',
    'systems/alive-onion-merkle-provenance-ledger.js',
    'systems/alive-tor-deepweb-phase4-audit.js',
    'systems/alive-crow-raven-corvid-epistemology.js',
    'systems/alive-locust-phase-polyphenism.js',
    'systems/alive-fish-lateral-line-hydrodynamics.js',
    'systems/alive-symbiotic-cross-guild-coevolution.js',
    'systems/alive-hyper-swarm-phase5-audit.js',
    'systems/alive-active-inference-free-energy.js',
    'systems/alive-hyperbolic-poincare-knowledge-embedder.js',
    'systems/alive-neurosymbolic-program-synthesizer.js',
    'systems/alive-mixed-precision-tensor-quantizer.js',
    'systems/alive-neurosymbolic-phase6-audit.js',
    'systems/alive-adversarial-prompt-dom-shield.js',
    'systems/alive-autonomous-long-horizon-mission-runner.js',
    'systems/alive-self-healing-byzantine-watchdog.js',
    'systems/alive-full-stack-hybrid-synergy-benchmark.js',
    'systems/alive-omega-40-pass-grand-auditor.js',
    'systems/alive-programmed-weights-biases-engine.js',
    'systems/alive-stiefel-orthogonal-weight-bias-init.js',
    'systems/alive-spectral-norm-lipschitz-conditioner.js',
    'systems/alive-mup-maximal-update-parameterization.js',
    'systems/alive-rmsnorm-rezero-residual-conditioning.js',
    'systems/alive-weight-conditioning-phase8-audit.js',
    'systems/alive-muon-newton-schulz-optimizer.js',
    'systems/alive-kfac-natural-gradient-preconditioner.js',
    'systems/alive-sophia-lion-hessian-optimizer.js',
    'systems/alive-schedule-free-primal-dual-averager.js',
    'systems/alive-optimizer-preconditioner-phase9-audit.js',
    'systems/alive-dora-weight-decomposed-adapter.js',
    'systems/alive-pissa-svd-lora-plus-adapter.js',
    'systems/alive-vera-random-matrix-bitfit-bias.js',
    'systems/alive-ties-dare-slerp-model-merger.js',
    'systems/alive-parameter-adapters-phase10-audit.js',
    'systems/alive-mamba2-ssd-state-space-duality.js',
    'systems/alive-mla-multi-head-latent-attention.js',
    'systems/alive-xlstm-exponential-matrix-memory.js',
    'systems/alive-griffin-rglru-hybrid-recurrent.js',
    'systems/alive-sequence-architectures-phase11-audit.js',
    'systems/alive-kan-kolmogorov-arnold-spline-net.js',
    'systems/alive-cfc-sltc-liquid-time-constant.js',
    'systems/alive-port-hamiltonian-symplectic-ode.js',
    'systems/alive-deq-deep-equilibrium-implicit-layer.js',
    'systems/alive-continuous-spline-brains-phase12-audit.js',
    'systems/alive-deepseek-moe-dynamic-bias-router.js',
    'systems/alive-sinkhorn-expert-choice-soft-moe.js',
    'systems/alive-mixture-of-depths-compute-router.js',
    'systems/alive-sparsegpt-hessian-pruning-2to4.js',
    'systems/alive-moe-sparse-routing-phase13-audit.js',
    'systems/alive-pantheon-connectome-flywire-weights.js',
    'systems/alive-pantheon-quantum-riemannian-hdc-weights.js',
    'systems/alive-pantheon-cortical-striatal-chaos-weights.js',
    'systems/alive-pantheon-cross-attention-fusion-bus.js',
    'systems/alive-pantheon-14brain-upgrade-phase14-audit.js',
    'systems/alive-hinton-forward-forward-goodness.js',
    'systems/alive-equilibrium-propagation-energy-ising.js',
    'systems/alive-rao-ballard-predictive-coding-net.js',
    'systems/alive-modern-continuous-hopfield-ramsauer.js',
    'systems/alive-local-learning-energy-phase15-audit.js',
    'systems/alive-ijepa-vjepa-ema-world-predictor.js',
    'systems/alive-ot-cfm-optimal-transport-flow-matching.js',
    'systems/alive-ttt-test-time-training-fast-weights.js',
    'systems/alive-dreamerv3-symlog-twohot-rssm.js',
    'systems/alive-world-models-ttt-phase16-audit.js',
    'systems/alive-cache-tiled-gemm-fused-epilogue.js',
    'systems/alive-flash-attention-online-softmax-tiler.js',
    'systems/alive-zero-alloc-reverse-autograd-tape.js',
    'systems/alive-double-buffered-atomic-weight-server.js',
    'systems/alive-tensor-systems-engineering-phase17-audit.js',
    'systems/alive-darts-bilevel-architecture-search.js',
    'systems/alive-kronecker-hypernetwork-weight-generator.js',
    'systems/alive-ewc-synaptic-intelligence-continual.js',
    'systems/alive-cmaes-pbt-hyperparameter-evolver.js',
    'systems/alive-meta-hypernet-continual-phase18-audit.js',
    'systems/alive-sparse-autoencoder-monosemantic-sae.js',
    'systems/alive-ibp-crown-formal-bound-verifier.js',
    'systems/alive-conformal-temperature-calibration.js',
    'systems/alive-100pass-supremo-organism-benchmark.js',
    'systems/alive-omega-100-pass-grand-auditor.js',
    'systems/alive-unitary-cayley-householder-orthogonal.js',
    'systems/alive-birkhoff-sinkhorn-doubly-stochastic.js',
    'systems/alive-zero-sum-bias-anti-collapse-centering.js',
    'systems/alive-marchenko-pastur-spectral-denoiser.js',
    'systems/alive-lie-birkhoff-rmt-phase20-audit.js',
    'systems/alive-shampoo-fourth-root-kronecker-preconditioner.js',
    'systems/alive-ademamix-dual-ema-long-horizon-momentum.js',
    'systems/alive-galore-gradient-low-rank-projection.js',
    'systems/alive-prodigy-d-adaptation-parameter-free-step.js',
    'systems/alive-shampoo-ademamix-galore-phase21-audit.js',
    'systems/alive-rope-yarn-ntk-context-extrapolation.js',
    'systems/alive-alibi-xpos-monotonic-decay-biases.js',
    'systems/alive-differential-transformer-noise-canceling-attn.js',
    'systems/alive-ring-striped-blockwise-context-attention.js',
    'systems/alive-rope-yarn-diff-attn-phase22-audit.js',
    'systems/alive-fnet-gfnet-spectral-fourier-mixing-weights.js',
    'systems/alive-hyena-long-conv-implicit-filter-weights.js',
    'systems/alive-s4d-hippo-leg-s-diagonal-ssm-weights.js',
    'systems/alive-daubechies-wavelet-multiresolution-weights.js',
    'systems/alive-fourier-hyena-s4d-wavelet-phase23-audit.js',
    'systems/alive-lorentz-hyperboloid-minkowski-linear-weights.js',
    'systems/alive-clifford-geometric-algebra-multivector-weights.js',
    'systems/alive-se3-equivariant-steerable-spherical-weights.js',
    'systems/alive-spd-log-euclidean-covariance-manifold-weights.js',
    'systems/alive-riemannian-clifford-se3-spd-phase24-audit.js',
    'systems/alive-lif-surrogate-gradient-spiking-weights.js',
    'systems/alive-stdp-dopamine-three-factor-eligibility-trace.js',
    'systems/alive-dale-law-excitatory-inhibitory-ei-balance.js',
    'systems/alive-ttfs-phase-of-firing-temporal-spike-weights.js',
    'systems/alive-spiking-stdp-dale-ttfs-phase25-audit.js',
    'systems/alive-quip-sharp-hadamard-e8-lattice-quantizer.js',
    'systems/alive-aqlm-additive-multi-codebook-weight-quantizer.js',
    'systems/alive-spinquant-cayley-orthogonal-outlier-remover.js',
    'systems/alive-fp8-e4m3-e5m2-microscaling-mx-block-weights.js',
    'systems/alive-extreme-quantization-e8-spinquant-phase26-audit.js',
    'systems/alive-amari-empirical-fisher-rao-metric-weights.js',
    'systems/alive-wasserstein-natural-gradient-sinkhorn-score.js',
    'systems/alive-bregman-mirror-descent-hyperspherical-weights.js',
    'systems/alive-pac-bayes-kl-weight-posterior-bound-minimizer.js',
    'systems/alive-information-geometry-pacbayes-phase27-audit.js',
    'systems/alive-notears-dagma-acyclic-causal-weight-learner.js',
    'systems/alive-irm-vrex-invariant-causal-predictor-weights.js',
    'systems/alive-gflownet-trajectory-balance-flow-weights.js',
    'systems/alive-independent-causal-mechanisms-sparse-modular.js',
    'systems/alive-causal-notears-gflownet-phase28-audit.js',
    'systems/alive-optnet-differentiable-qp-kkt-implicit-layer.js',
    'systems/alive-neural-sinkhorn-softsort-permutation-weights.js',
    'systems/alive-satnet-maxsat-semidefinite-relaxation-weights.js',
    'systems/alive-convex-icnn-input-convex-neural-weights.js',
    'systems/alive-differentiable-optnet-satnet-icnn-phase29-audit.js',
    'systems/alive-simplicial-hodge-laplacian-cell-weights.js',
    'systems/alive-cellular-sheaf-laplacian-stalk-transport.js',
    'systems/alive-persistent-homology-betti-topological-loss.js',
    'systems/alive-euler-characteristic-transform-shape-weights.js',
    'systems/alive-topological-hodge-sheaf-phase30-audit.js',
    'systems/alive-consistency-model-single-step-distillation.js',
    'systems/alive-schrodinger-bridge-iterative-proportional-fitting.js',
    'systems/alive-edm-karras-preconditioned-score-weights.js',
    'systems/alive-cfg-autoguidance-tangential-score-steering.js',
    'systems/alive-consistency-schrodinger-edm-phase31-audit.js',
    'systems/alive-cfr-plus-regret-matching-nash-policy-weights.js',
    'systems/alive-stackelberg-bilevel-leader-follower-jacobian.js',
    'systems/alive-mean-field-fokker-planck-hjb-swarm-weights.js',
    'systems/alive-vcg-mechanism-incentive-compatible-bias-pricing.js',
    'systems/alive-game-theory-cfr-stackelberg-phase32-audit.js',
    'systems/alive-dpo-simpo-reference-free-margin-weights.js',
    'systems/alive-kto-kahneman-tversky-prospect-utility-weights.js',
    'systems/alive-caa-contrastive-activation-addition-steering.js',
    'systems/alive-circuit-breakers-orthogonal-refusal-abliteration.js',
    'systems/alive-preference-dpo-kto-steering-phase33-audit.js',
    'systems/alive-zero3-fsdp-sharded-weight-bias-gather-engine.js',
    'systems/alive-megatron-tensor-ring-sequence-parallelism.js',
    'systems/alive-eagle-medusa-tree-speculative-draft-weights.js',
    'systems/alive-h2o-heavy-hitter-snap-kv-cache-eviction.js',
    'systems/alive-distributed-zero3-speculative-kv-phase34-audit.js',
    'systems/alive-git-rebasin-hungarian-weight-permutation.js',
    'systems/alive-bezier-simplicial-mode-connectivity-curve.js',
    'systems/alive-empirical-ntk-eigenvalue-condition-governor.js',
    'systems/alive-tancik-fourier-feature-spectral-bias-cure.js',
    'systems/alive-rebasin-mode-connectivity-ntk-phase35-audit.js',
    'systems/alive-dpsgd-renyi-accountant-per-sample-clipping.js',
    'systems/alive-bulyan-multi-krum-geometric-median-aggregator.js',
    'systems/alive-fisher-scrubbing-certified-machine-unlearning.js',
    'systems/alive-uchida-spread-spectrum-weight-watermarking.js',
    'systems/alive-dpsgd-byzantine-unlearning-watermark-phase36-audit.js',
    'systems/alive-hyperneat-cppn-geometric-substrate-weights.js',
    'systems/alive-mordvintsev-neural-cellular-automata-weight-grower.js',
    'systems/alive-miconi-backpropamine-differentiable-hebbian-weights.js',
    'systems/alive-baldwin-lamarckian-epigenetic-weight-assimilation.js',
    'systems/alive-hyperneat-nca-backpropamine-phase37-audit.js',
    'systems/alive-pinn-ntk-adaptive-collocation-pde-weights.js',
    'systems/alive-koopman-autoencoder-companion-eigenweights.js',
    'systems/alive-generic-poisson-onsager-thermodynamic-weights.js',
    'systems/alive-storer-symplectic-euler-verlet-recurrent-weights.js',
    'systems/alive-pinn-koopman-generic-symplectic-phase38-audit.js',
    'systems/alive-acdc-attribution-patching-circuit-transcoder.js',
    'systems/alive-pedersen-merkle-zk-weight-inference-commitment.js',
    'systems/alive-pareto-multi-objective-mgda-pcgrad-weight-surgeon.js',
    'systems/alive-200pass-titan-omni-organism-benchmark.js',
    'systems/alive-omega-200-pass-grand-auditor.js',
    'systems/alive-fabric-visualizer.js',
    'systems/gigachad-missions.js',
    'systems/gigachad-brain-lab.js',
    'systems/gigachad-experiments.js',
    'systems/gigachad-research-map.js',
    'systems/gigachad-modes.js',
    'systems/gigachad-studio-host.js',
    'systems/gigachad-studio.js'
  ]);
  const message = error => String(error?.message || error || 'Startup failed').slice(0, 300);

  function create({ window: win, document: doc, prepare } = {}) {
    if (!win || !doc) throw new TypeError('Startup requires its browser window and document');
    let started = false, generation = 0, phase = 'idle', error = '', closeOwned = true;
    let boot = null, registering = false, registrationError = null, prepared = false;
    let loadedModules = 0, pendingScript = null, unsubscribe = null, settled = false, documentURL = null;
    let retirementDocument = null, retirementError = '';
    let closeDrain = null, closeState = null;
    const acknowledgedRequests = new Set();
    let resolveReady;
    const ready = new Promise(resolve => { resolveReady = resolve; });
    const snapshot = () => ({ phase, generation, prepared, loadedModules, totalModules: POST_MODULES.length,
      closeOwned, error, retirementError, closing: Boolean(win.__alivePersistenceClosing),
      close: closeState ? { ...closeState } : null });
    const settle = () => { if (!settled) { settled = true; resolveReady(snapshot()); } };
    const current = token => token === generation && !win.__alivePersistenceClosing;
    const driver = () => win.aliveGenomePersistence;
    function blockWrites() { try { driver()?.markApplied(false, { hadJSON: true }); } catch (_) {} }
    function stopWork() {
      win.__alivePersistenceClosing = true;
      try { win.stopAlienBrainAutonomy?.(); } catch (_) {}
    }
    function notice(text) {
      try {
        doc.body.inert = true;
        let node = doc.getElementById('alive-startup-failure');
        if (!node) {
          node = doc.createElement('section'); node.id = 'alive-startup-failure'; node.setAttribute('role', 'alert');
          node.style.cssText = 'position:fixed;inset:24px;z-index:2147483647;padding:24px;background:#171717;color:#fff;font:16px/1.5 sans-serif;white-space:pre-wrap;overflow:auto';
          doc.body.appendChild(node);
        }
        node.textContent = text;
      } catch (_) {}
    }
    function cancelPending() { const cancel = pendingScript; pendingScript = null; if (cancel) cancel(); }
    function fail(cause) {
      if (phase === 'cancelled') return;
      error = message(cause); phase = 'failed'; generation++; registering = false;
      stopWork(); blockWrites(); cancelPending();
      notice('Startup could not restore saved state. The saved genome has been preserved and further saves are blocked.\n\n' + error);
      settle();
    }
    function cancel(reason = 'Application closed during startup') {
      if (phase === 'cancelled' || !closeOwned) return snapshot();
      phase = 'cancelled'; error = message(reason); generation++; registering = false;
      stopWork(); blockWrites(); cancelPending();
      notice('Startup cancelled while the application is closing.');
      settle(); return snapshot();
    }
    async function onClose(request) {
      if (!closeOwned || !request || typeof request.requestId !== 'string' || !request.requestId || acknowledgedRequests.has(request.requestId)) return;
      acknowledgedRequests.add(request.requestId);
      cancel(); const token = generation;
      if (!closeDrain) {
        closeState = { requested: true, settled: false, acknowledged: false, error: '' };
        closeDrain = (async () => {
          try {
            if (typeof win.aliveAutosave?.cancelAndDrain === 'function') return await win.aliveAutosave.cancelAndDrain('startup-close');
            const persistence = driver(), state = persistence?.snapshot?.();
            if (typeof persistence?.fence !== 'function' || !Number.isSafeInteger(state?.epoch) || state.epoch < 0 || state.epoch >= Number.MAX_SAFE_INTEGER) {
              return { settled: false, error: 'Startup storage fence is unavailable' };
            }
            return await persistence.fence({ epoch: state.epoch + 1 });
          } catch (cause) { return { settled: false, error: message(cause) }; }
        })();
      }
      const drain = await closeDrain;
      if (token !== generation || !closeOwned) return;
      closeState.settled = drain?.settled === true && !retirementError;
      closeState.error = retirementError || (drain?.settled === true ? '' : message(drain?.error || 'Startup storage fence did not settle'));
      const result = { status: 'unverified', persistenceVerified: false, settled: closeState.settled,
        error: closeState.error || 'Closed before startup completed; no final model snapshot was saved' };
      try {
        const response = await win.gigachad.invoke('alive-genome-close-result', {
          requestId: request.requestId, ownerId: driver()?.snapshot?.().ownerId, result });
        if (token === generation && closeOwned) closeState.acknowledged = response?.status === 'acknowledged';
      } catch (cause) { if (token === generation && closeOwned) closeState.error = message(cause); }
    }
    function register(candidate) {
      if (!registering || boot !== null || typeof candidate !== 'function') {
        registrationError = new Error('Main startup callback must be registered exactly once during main execution');
        if (!registering) fail(registrationError);
        throw registrationError;
      }
      boot = candidate;
    }
    function mainSource() {
      documentURL = new URL(doc.URL || win.location?.href);
      if (documentURL.protocol !== 'file:' || documentURL.host && documentURL.host !== 'localhost') {
        throw new Error('Startup modules require the local application document');
      }
      const node = doc.getElementById(SOURCE_ID);
      if (!node || node.ownerDocument !== doc || String(node.tagName).toLowerCase() !== 'script' ||
          node.getAttribute('type') !== SOURCE_TYPE || node.hasAttribute('src') || !node.isConnected) {
        throw new Error('Trusted inert inline main source is missing or invalid');
      }
      if (doc.querySelectorAll('[id="' + SOURCE_ID + '"]').length !== 1) throw new Error('Main source identity is ambiguous');
      const source = node.textContent;
      if (typeof source !== 'string' || !source.trim()) throw new Error('Main source is empty');
      const fixedURLs = POST_MODULES.map(src => new URL(src, documentURL).href);
      for (const script of doc.querySelectorAll('script[src]')) {
        const src = script.getAttribute('src');
        if (fixedURLs.includes(new URL(src, documentURL).href)) throw new Error('Post-startup modules must not also be parser executable');
      }
      return source;
    }
    function executeMain(source) {
      let thrown = null;
      const observe = event => { thrown ||= event.error || new Error(event.message || 'Main script execution failed'); };
      const script = doc.createElement('script'); script.type = 'text/javascript'; script.textContent = source;
      script.setAttribute('data-alive-startup', 'main');
      registering = true; win.addEventListener('error', observe);
      try { (doc.head || doc.body).appendChild(script); }
      finally { registering = false; win.removeEventListener('error', observe); }
      if (thrown) throw thrown;
      if (registrationError) throw registrationError;
      if (!boot) throw new Error('Main script did not register its startup callback');
    }
    function loadModule(src, token) {
      return new Promise((resolve, reject) => {
        const script = doc.createElement('script'); script.type = 'text/javascript'; script.async = false;
        // Resolve against the actual local document, never a mutable <base>.
        script.setAttribute('data-alive-startup', 'post'); script.src = new URL(src, documentURL).href;
        let done = false, thrown = null;
        const observe = event => {
          if (event.target === script || event.filename === script.src) thrown ||= event.error || new Error(event.message || 'Startup module execution failed');
        };
        const finish = cause => {
          if (done) return; done = true;
          win.removeEventListener('error', observe); script.onload = null; script.onerror = null;
          if (pendingScript === abort) pendingScript = null;
          cause ? reject(cause) : resolve();
        };
        const abort = () => {
          // Removing a prepared external classic script alone does not stop
          // execution. Adoption changes its node document, so the HTML script
          // execution algorithm rejects its old preparation-time document.
          // https://html.spec.whatwg.org/multipage/scripting.html#execute-the-script-element
          try {
            if (retirementDocument.adoptNode(script) !== script || script.ownerDocument !== retirementDocument || script.isConnected) {
              throw new Error('Pending script document retirement was not confirmed');
            }
          } catch (cause) {
            retirementError = 'Pending script retirement failed: ' + message(cause);
            try { script.remove(); } catch (_) {}
          }
          finish(new Error(retirementError || 'Startup module was cancelled'));
        };
        pendingScript = abort;
        script.onload = () => finish(!current(token) ? new Error('Startup module was superseded') : thrown);
        script.onerror = () => finish(new Error('Could not load startup module: ' + src));
        win.addEventListener('error', observe);
        try { (doc.head || doc.body).appendChild(script); }
        catch (cause) { finish(cause); }
      });
    }
    async function run(token) {
      try {
        doc.body.inert = true;
        if (typeof win.gigachad?.on !== 'function' || typeof win.gigachad?.invoke !== 'function') throw new Error('Startup close bridge is unavailable');
        unsubscribe = win.gigachad.on('alive-genome-close-request', request => { onClose(request).catch(fail); });
        if (typeof unsubscribe !== 'function') throw new Error('Startup close subscription is unavailable');
        if (!current(token)) { cancel(); return; }
        const source = mainSource(), persistence = driver();
        retirementDocument = doc.implementation?.createHTMLDocument('');
        if (!retirementDocument || retirementDocument === doc || retirementDocument.defaultView !== null || typeof retirementDocument.adoptNode !== 'function') {
          throw new Error('Inert script retirement document is unavailable');
        }
        if (typeof persistence?.initialJSON !== 'function' || typeof persistence?.markApplied !== 'function' || typeof persistence?.snapshot !== 'function') {
          throw new Error('Canonical genome persistence is unavailable');
        }
        const json = persistence.initialJSON(win.localStorage, STORAGE_KEY), state = persistence.snapshot();
        if (state.status === 'error' || state.applicationFailed || state.writeAllowed !== true) throw new Error('Canonical genome is unavailable or blocked');
        const preparePrimary = prepare || win.AlivePrimaryPolicyBootstrap?.prepare;
        if (typeof preparePrimary !== 'function') throw new Error('Primary policy bootstrap is unavailable');
        if (typeof win.AliveTrainerState?.create !== 'function') throw new Error('Committed trainer adapter is unavailable');
        if (typeof win.AliveReplayState?.create !== 'function') throw new Error('Replay memory adapter is unavailable');
        if (typeof win.AliveHubState?.create !== 'function') throw new Error('Neural hub state adapter is unavailable');
        if (typeof win.AliveCortexState?.create !== 'function') throw new Error('Cortex state adapter is unavailable');
        phase = 'preparing';
        const primary = await preparePrimary({ json, primary: win.AlivePrimaryPolicyState,
          trainer: win.AliveTrainerState,
          replay: win.AliveReplayState,
          hub: win.AliveHubState,
          cortex: win.AliveCortexState,
          registry: win.AliveLearnedStateRegistry, codec: win.AliveLearnedStateCodec, crypto: win.crypto });
        if (!current(token)) { cancel(); return; }
        if (!primary || ['preflight', 'apply', 'capture', 'captureComponents', 'snapshot'].some(key => typeof primary[key] !== 'function')) throw new Error('Exact component bootstrap returned an invalid preparation');
        win.alivePrimaryPolicyBootstrap = primary; prepared = true;
        if (Object.prototype.hasOwnProperty.call(win, '__aliveStartupRegister')) throw new Error('Main startup registration already exists');
        Object.defineProperty(win, '__aliveStartupRegister', { value: register, configurable: false, writable: false });
        phase = 'main'; executeMain(source);
        if (!current(token)) { cancel(); return; }
        const applied = persistence.snapshot();
        if (applied.applicationFailed || applied.writeAllowed !== true) throw new Error('The saved genome was rejected by the main constructor');
        phase = 'post-modules';
        for (const src of POST_MODULES) {
          await loadModule(src, token);
          if (!current(token)) { cancel(); return; }
          loadedModules++;
        }
        if (!win.aliveStartupAutosaveDrain || typeof win.aliveAutosave?.resume !== 'function' || typeof win.aliveAutosave?.request !== 'function') {
          throw new Error('Startup autosave barrier is unavailable');
        }
        phase = 'autosave-drain';
        const drain = await win.aliveStartupAutosaveDrain;
        if (!current(token)) { cancel(); return; }
        if (drain?.settled !== true) throw new Error('Startup autosave barrier did not settle');
        if (win.aliveAutosave.resume() !== true) throw new Error('Startup autosave admission could not resume');
        // All adapters now exist. No await separates ownership transfer from
        // invoking the trusted callback; normal shutdown belongs to adapters.
        closeOwned = false; unsubscribe(); unsubscribe = null;
        phase = 'booting'; doc.body.inert = false;
        win.aliveAutosave.request('startup-ready');
        await boot();
        if (!current(token)) { phase = 'cancelled'; settle(); return; }
        phase = 'ready'; settle();
      } catch (cause) { if (current(token)) fail(cause); else if (phase !== 'cancelled' && phase !== 'failed') { phase = 'cancelled'; settle(); } }
    }
    function start() {
      if (started || settled) return ready;
      started = true; generation++; run(generation).catch(fail); return ready;
    }
    return Object.freeze({ start, ready, snapshot, ownsClose: () => closeOwned, cancel });
  }
  return Object.freeze({ create, SOURCE_ID, SOURCE_TYPE, POST_MODULES });
});
