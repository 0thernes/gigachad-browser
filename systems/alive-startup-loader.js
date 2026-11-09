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
    'systems/alive-fabric-visualizer.js'
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
        phase = 'preparing';
        const primary = await preparePrimary({ json, primary: win.AlivePrimaryPolicyState,
          trainer: win.AliveTrainerState,
          replay: win.AliveReplayState,
          hub: win.AliveHubState,
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
