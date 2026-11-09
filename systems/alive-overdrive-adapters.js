/* Shared, bounded adapters between the creature model, scheduler and browser. */
(() => {
  'use strict';
  const h = humunculusRuntime;
  const m = hybridBrainMesh;
  h.bleedingEdge25Engine?.suspendWorkerTrainer?.('startup');
  window.AliveNeuralCoupling.install(h, m);
  window.AliveSpecialistFusion?.install(h);
  window.aliveAutosave = window.AliveAutosave.install(h, typeof h.capturePersistentGenomePayload === 'function' ? {
    capture: () => h.capturePersistentGenomePayload(),
    storage: window.localStorage,
    storageKey: 'humunculus_persistent_genome_v1',
    ...(window.aliveGenomePersistence ? { durableStorage: window.aliveGenomePersistence } : {}),
    workerURL: new URL('./systems/alive-genome-codec.js', document.baseURI).href
  } : {});
  if (window.aliveStartup?.ownsClose?.()) {
    // Close admission immediately; a later startup-module failure must not
    // publish a baseline before the loader completes and hands off ownership.
    window.aliveStartupAutosaveDrain = window.aliveAutosave.cancelAndDrain('startup-hydration');
  } else if (window.aliveGenomePersistence) h.savePersistentGenome();
  window.AlifeLearningEvidence?.install(h);
  const state = { observation: null, observationAt: 0, observationTabId: null, frames: [], lastFrame: 0, learnedOutcomes: 0, lastNavigation: -Infinity, lastCheckpoint: null, lastBackendProbe: null };
  // Fast forager: ~5 s on a page still yielding content, ~2.5 s once content and
  // links settle or the viewport is exhausted, 10 s before a stalled load is
  // abandoned. User navigation, pins, Pause and Auto-Hop keep their priority.
  const research = window.aliveResearch = window.AliveResearchPolicy?.create({ minDwellMs: 5000, settledDwellMs: 2500, maxDwellMs: 14000, loadTimeoutMs: 10000 });
  const researchKey = 'gigachad_alive_research_v1';
  state.researchPersistence = { status: 'not_saved' };
  if (research) {
    try {
      const saved = window.localStorage?.getItem(researchKey);
      if (saved) state.researchPersistence = research.restoreState(JSON.parse(saved));
    } catch (error) { state.researchPersistence = { status: 'error', reason: String(error.message).slice(0, 160) }; }
    research.enqueue(ALIEN_RABBIT_HOLES.map(item => ({ ...item, source: 'catalog' })));
  }
  const researchConcepts = () => h.cognitiveCortex?.lastComprehension?.topConcepts || [];
  const researchEngines = () => typeof POLYMATH_SEARCH_ENGINES === 'undefined' ? [] : POLYMATH_SEARCH_ENGINES;
  function saveResearch() {
    if (!research || !window.localStorage) return;
    try {
      const encoded = JSON.stringify(research.exportState());
      window.localStorage.setItem(researchKey, encoded);
      if (window.localStorage.getItem(researchKey) !== encoded) throw new Error('Research memory readback mismatch');
      state.researchPersistence = { status: 'saved', at: Date.now(), bytes: encoded.length };
    } catch (error) { state.researchPersistence = { status: 'error', reason: String(error.message).slice(0, 160) }; }
  }
  window.aliveResearchNavigationFailed = failure => {
    const result = research?.failNavigation(failure);
    if (result?.learned) { saveResearch(); window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: { at: performance.now(), id: 'portal-jump', type: 'arrival-failed', evidence: result } })); }
    return result;
  };
  window.cancelAliveResearchNavigation = (tabId, reason = 'Navigation superseded') => {
    if (!research?.pending || tabId && research.pending.tabId !== tabId) return;
    research.cancelPending(reason);
    const tab = tabs.find(item => item.id === tabId);
    if (tab) { tab.aliveRedirectFrom = null; tab.aliveRedirectTarget = null; }
  };
  window.invalidateAliveTransportPage = (reason = 'Active document changed') => {
    const probe = state.lastBackendProbe;
    if (probe) {
      probe.navigation = null; probe.addressValidation = null;
      probe.pageReceiptStatus = 'invalidated: ' + reason;
    }
    const ddw = h.deepDarkWebSubstrateEngine;
    if (ddw) {
      ddw.torV3OnionAddress = '';
      ddw.activeDeepLayerName = probe?.socksHandshakeVerified && probe?.torPacApplied
        ? 'SOCKS_ROUTE_READY / PAGE_UNVERIFIED' : 'PAGE_UNVERIFIED / ONION_UNAVAILABLE';
      ddw.lastDeepDarkVerdict = ddw.activeDeepLayerName;
    }
  };
  const finite = n => Number.isFinite(Number(n)) ? Number(n) : null;
  const observed = evidence => ({ status: 'observed', evidence });
  const completed = evidence => ({ status: 'completed', evidence });
  const blocked = reason => ({ status: 'blocked', reason, evidence: { reason } });
  const guestFailure = (result, fallback) => ['blocked', 'cancelled', 'unavailable'].includes(result?.status)
    ? result.status === 'unavailable' ? result : blocked(result.reason || fallback) : null;
  const authority = window.aliveAuthority = window.AliveAuthority?.create({
    executor: window.AliveGuestExecution,
    resolveGuest: id => tabs.find(candidate => candidate.id === id)?.wv || null,
    isGuestReady: (id, webview) => Boolean(tabs.find(candidate => candidate.id === id)?.domReady && isWebviewGuestReady(webview)),
    getSelectedTabId: () => getActiveTab()?.id,
    getEpoch: () => h.authorityEpoch,
    paused: true,
    onCommit(record) {
      h.authorityEpoch = record.newEpoch;
      h.activeHostTabId = record.toTabId;
      h.lastPolicyStep = null;
      state.observation = null; state.observationTabId = null; h.aliveSelectedDoor = null;
      if (!Array.isArray(h.handoffLedger)) h.handoffLedger = [];
      h.handoffLedger.push({ ...record, agentId: h.agentId, bodyCid: h.bodyRecipe.bodyCid,
        policyCid: h.policyCid, checkpointCid: state.lastCheckpoint?.cid || null });
      if (h.handoffLedger.length > 64) h.handoffLedger.splice(0, h.handoffLedger.length - 64);
    },
    onEvent(event) { window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: { ...event, id: 'epoch-handoff' } })); }
  });
  window.selectAliveGuest = async (id, options = {}) => {
    if (!authority) return blocked('Guest authority is unavailable');
    const outcome = await authority.select(id, options);
    if (outcome.status === 'completed' && authority.leaseFor(id) && getActiveTab()?.id === id &&
        window.aliveOverdrive?.running && !document.hidden) {
      window.syncAliveGuestState?.();
      window.aliveOverdrive.request('dom-body');
    }
    return outcome;
  };
  const committedUrl = tab => typeof tab?.committedUrl === 'string' ? tab.committedUrl : '';
  const readyPage = (tab = getActiveTab()) => Boolean(tab?.domReady && !tab.isLoading && !tab.frozen && tab.wv && isWebviewGuestReady(tab.wv));
  const freshObservation = () => {
    const tab = getActiveTab(), url = committedUrl(tab);
    return state.observation && readyPage(tab) && url && state.observationTabId === tab.id &&
      performance.now() - state.observationAt < 10000 && state.observation.url === url &&
      state.observationNavStarted === tab.lastNavStartTs && (!authority || authority.isCurrent(state.observation.authority)) ? state.observation : null;
  };
  const pageReady = () => readyPage() || 'Waiting for the current page to finish loading';
  const navigationReadiness = () => {
    const tab = getActiveTab();
    if (!research) return { ready: window.alienAutoNavigateLinks !== false && performance.now() - state.lastNavigation >= 15000 && readyPage(), reason: 'Navigation paused, disabled, or waiting for the page' };
    const url = safeGetUrl(tab) || tab?.url || '';
    return research.navigationReadiness({ enabled: window.alienAutoNavigateLinks !== false,
      currentUrl: url, tabId: tab?.id, pageReady: readyPage(), isLoading: Boolean(tab?.isLoading),
      lastStartedAt: tab?.lastNavStartTs, lastReadyAt: tab?.lastDomReadyTs,
      lastUserNavAt: tab?.lastUserNavTs, pinned: tab?.pinned,
      protectedPage: /\/brains\/|127\.0\.0\.1:\d+\//i.test(url) });
  };
  const navigationReady = () => { const result = navigationReadiness(); return result.ready || result.reason; };
  const baseEvidence = () => ({ tick: h.simulationTick, policy: h.policyCid, body: h.bodyRecipe.bodyCid });
  const modelEvidence = object => {
    if (!object) return { available: false };
    const result = {};
    for (const [key, value] of Object.entries(object)) {
      if (typeof value === 'number' && Number.isFinite(value)) result[key] = value;
      if (Object.keys(result).length >= 12) break;
    }
    return result;
  };
  // The model's own transitions remain shared. No separate synthetic actor is
  // substituted for page perception, and diagnostic scores never become rewards.
  async function observePage({ signal, authorityToken }) {
    if (signal.aborted) return blocked('Observation cancelled');
    const tab = getActiveTab();
    if (!readyPage(tab) || !committedUrl(tab)) return blocked('Waiting for a ready committed page');
    if (authority?.snapshot().paused && !authorityToken) {
      return authority.withManualLease(tab?.id, token => observePage({ signal, authorityToken: token }), { signal });
    }
    if (authority && !authorityToken && !authority.leaseFor(tab?.id)) {
      const selected = await window.selectAliveGuest(tab?.id, { reason: 'page-observation', signal });
      if (selected.status !== 'completed' || signal.aborted) return blocked(selected.reason || 'Waiting for an acknowledged page lease');
    }
    if (tab !== getActiveTab() || !readyPage(tab) || !committedUrl(tab)) return blocked('Page changed before observation');
    const captured = { url: committedUrl(tab), webview: tab.wv, navStarted: tab.lastNavStartTs };
    const previous = h.worldPredError;
    const exp = await performWeirdAlienDomExperiment(tab, { signal, authorityToken });
    if (signal.aborted) return blocked('Paused during observation');
    if (!exp || /^proprioceptiveHold/.test(exp.domWeirdAction || '')) return blocked('Page observation unavailable; internal proprioception only');
    if (tab !== getActiveTab() || !readyPage(tab) || tab.wv !== captured.webview || committedUrl(tab) !== captured.url ||
        exp.url !== captured.url || tab.lastNavStartTs !== captured.navStarted || (authority && !authority.isCurrent(exp.authority))) return blocked('Page or guest authority changed while observing');
    state.observation = exp;
    state.observationTabId = tab.id;
    state.observationAt = performance.now();
    state.observationNavStarted = captured.navStarted;
    const progress = Number.isFinite(previous) && Number.isFinite(h.worldPredError) ? Math.max(-1, Math.min(1, previous - h.worldPredError)) : null;
    const discovery = research?.ingest(exp, { verified: true, tabId: tab.id, documentStartedAt: captured.navStarted, concepts: researchConcepts(), predictionProgress: progress,
      requestedUrl: tab.aliveRedirectTarget === window.AliveResearchPolicy?.normalizeURL(exp.url)?.url ? tab.aliveRedirectFrom : undefined });
    tab.aliveRedirectFrom = null; tab.aliveRedirectTarget = null;
    if (discovery?.learned) { saveResearch(); window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: { at: performance.now(), id: 'portal-jump', type: 'arrival-observed', evidence: discovery.learning } })); }
    let secondary = null;
    if (typeof window.observeAliveSecondaryPane === 'function') {
      try { secondary = await window.observeAliveSecondaryPane({ signal, authorityToken: exp.authority }); }
      catch (error) { secondary = { status: 'unavailable', reason: String(error.message || error).slice(0, 160) }; }
      if (signal.aborted || tab !== getActiveTab() || !readyPage(tab) || tab.wv !== captured.webview || committedUrl(tab) !== captured.url ||
          tab.lastNavStartTs !== captured.navStarted || (authority && !authority.isCurrent(exp.authority))) return blocked('Primary page or authority changed during split-pane observation');
    }
    return { status: 'completed', evidence: { ...baseEvidence(), authority: exp.authority, url: exp.url, colliders: exp.specimens?.length || 0, doors: exp.doors?.length || 0, action: exp.domWeirdAction, predictionError: h.worldPredError, secondary,
      research: discovery && { status: discovery.status, added: discovery.added, learned: discovery.learned, learning: discovery.learning } }, reward: progress };
  }
  function observeArchitecture(object, extra = {}) {
    if (!object) return { status: 'unavailable', reason: 'Model instance unavailable', evidence: { ...extra, available: false } };
    return observed({ ...baseEvidence(), ...modelEvidence(object), ...extra, source: 'live in-process model state' });
  }
  const tensorRoots = () => ({ policy: h, cortex: h.deepCortex, hub: h.trainableAlifeNeuralHub,
    connectome: h.connectome512, world: h.continuousWorldModel, mesh: m,
    flywire: h.flywireConnectome, deduplication: h.decursiveSelfDeduplicator,
    metacognition: h.multivectorMetacognitionEngine, sltc: h.deepWebAndSltcConnectomeEngine,
    federation: h.portedMultiverseBrains, reasoning: h.aotTotGotEngine, research: research?.model });
  function checkpointDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('gigachad-alive-checkpoints', 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('snapshots')) request.result.createObjectStore('snapshots'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Checkpoint database is blocked by another window'));
    });
  }
  async function checkpoint({ signal }) {
    if (signal.aborted) return blocked('Checkpoint cancelled');
    if (!window.AliveCheckpoints) return { status: 'unavailable', reason: 'Checkpoint codec unavailable' };
    const started = performance.now();
    const captured = window.AliveCheckpoints.capture(tensorRoots(), { agentId: h.agentId,
      body: h.bodyRecipe, policyCid: h.policyCid, authorityEpoch: h.authorityEpoch,
      simulationTick: h.simulationTick, stageIdx: h.stageIdx, research: research?.exportState() || null });
    const captureMs = performance.now() - started;
    const record = await window.AliveCheckpoints.seal(captured, { signal });
    if (signal.aborted) return blocked('Checkpoint cancelled');
    const db = await checkpointDatabase();
    try {
      if (signal.aborted) return blocked('Checkpoint cancelled');
      await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readwrite');
        const abortWrite = () => { try { tx.abort(); } catch (_) {} };
        signal.addEventListener('abort', abortWrite, { once: true });
        tx.objectStore('snapshots').put(record, 'latest');
        const cleanup = () => signal.removeEventListener('abort', abortWrite);
        tx.oncomplete = () => { cleanup(); resolve(); };
        tx.onerror = () => { cleanup(); reject(tx.error); };
        tx.onabort = () => { cleanup(); reject(tx.error || new Error('Checkpoint write aborted')); };
      });
    } finally { db.close(); }
    if (signal.aborted) return blocked('Checkpoint cancelled after persistence');
    state.lastCheckpoint = { cid: record.cid, tensorCount: record.tensors.length, bytes: record.bytes, captureMs };
    h.checkpointCid = record.cid;
    return completed({ ...state.lastCheckpoint, persistence: 'IndexedDB; SHA-256 CIDv1 of tensor manifest', scope: record.manifest.scope });
  }
  const guestAuthorityUnsettled = () => {
    const snapshot = authority?.snapshot();
    return Boolean(snapshot?.transitioning || snapshot?.manuals ||
      ['pending', 'blocked'].includes(snapshot?.cleanup?.status) || snapshot?.cleanup?.unresolved?.length);
  };
  window.restoreAliveCheckpoint = async () => {
    if (window.__alivePersistenceClosing) return blocked('Application shutdown is saving the final genome');
    if (window.aliveOverdrive?.running || window.aliveOverdrive?.inFlight.size || window.AliveGuestExecution?.pendingCount() || guestAuthorityUnsettled() || window.__aliveCheckpointRestore) return blocked('Pause overdrive and let current operations, including guest cleanup and raw execution, settle before restoring');
    window.__aliveCheckpointRestore = true;
    h.bleedingEdge25Engine?.suspendWorkerTrainer?.('checkpoint-restore');
    let autosaveHeld = false;
    try {
      const db = await checkpointDatabase();
      let record;
      try {
        record = await new Promise((resolve, reject) => {
          const request = db.transaction('snapshots', 'readonly').objectStore('snapshots').get('latest');
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
      } finally { db.close(); }
      const verified = await window.AliveCheckpoints.verify(record);
      if (record.manifest.metadata.agentId !== h.agentId) return blocked('Checkpoint belongs to a different creature identity');
      // Database reads and hash verification yield. Recheck immediately before
      // the synchronous apply so direct/manual work cannot race restoration.
      if (window.__alivePersistenceClosing || controller.running || controller.inFlight.size || window.AliveGuestExecution?.pendingCount() ||
          guestAuthorityUnsettled()) return blocked('An operation or unresolved guest cleanup appeared while verifying the checkpoint; wait for it to settle and restore again');
      const started = performance.now();
      // Validate research metadata against a disposable instance before any live tensor write.
      if (record.manifest.metadata.research && window.AliveResearchPolicy) window.AliveResearchPolicy.create().restoreState(record.manifest.metadata.research);
      window.AliveCheckpoints.preflight?.(record, tensorRoots());
      if (window.aliveGenomePersistence && window.aliveAutosave?.cancelAndDrain) {
        autosaveHeld = true;
        const drained = await window.aliveAutosave.cancelAndDrain('checkpoint-restore');
        if (!drained?.settled) return blocked('Genome storage could not confirm physical write settlement; checkpoint was not applied');
        if (window.__alivePersistenceClosing || controller.running || controller.inFlight.size || window.AliveGuestExecution?.pendingCount() || guestAuthorityUnsettled()) {
          return blocked('An operation appeared while draining genome storage; checkpoint was not applied');
        }
      }
      const applyStarted = performance.now();
      const restored = window.AliveCheckpoints.applyVerified(record, tensorRoots());
      if (research && record.manifest.metadata.research) { research.restoreState(record.manifest.metadata.research); saveResearch(); }
      // Verification and shape checks must succeed before fencing live state.
      // This closes admission synchronously; a restored model never restores a guest lease.
      authority?.invalidate('checkpoint-restored');
      h.bodyRecipe = structuredClone(record.manifest.metadata.body);
      h.policyCid = record.manifest.metadata.policyCid;
      h.stageIdx = record.manifest.metadata.stageIdx;
      h.authorityEpoch = Math.max(h.authorityEpoch, authority?.snapshot().epoch || 0, record.manifest.metadata.authorityEpoch) + 1;
      h.checkpointCid = record.cid;
      const restoreMs = performance.now() - applyStarted;
      // Legacy storage cannot yield during commit. The durable path was
      // physically fenced before apply and now publishes the restored epoch.
      let genomePersistence = null;
      if (autosaveHeld) {
        if (!window.aliveAutosave.resume()) throw new Error('Genome write admission did not reopen after restore');
        autosaveHeld = false;
        genomePersistence = await window.aliveAutosave.flush('checkpoint-restored');
      } else { window.aliveAutosave?.cancel(); h.savePersistentGenome(); }
      state.observation = null; h.aliveSelectedDoor = null;
      const evidence = { ...verified, ...restored, restoreMs, epoch: h.authorityEpoch,
        ...(genomePersistence ? { genomePersistence, durableRestoreMs: performance.now() - started } : {}), scope: record.manifest.scope };
      state.lastCheckpoint = { ...evidence, restored: true };
      window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: { at: performance.now(), id: 'checkpoint', type: 'restored', evidence } }));
      if (genomePersistence && !genomePersistence.persistenceVerified) return { status: 'error',
        reason: 'Checkpoint applied in memory, but restored genome persistence was not verified', evidence: { ...evidence, modelRestored: true } };
      return completed(evidence);
    } finally {
      if (autosaveHeld && !window.__alivePersistenceClosing) window.aliveAutosave?.resume();
      window.__aliveCheckpointRestore = false;
    }
  };
  async function portalJump({ signal }) {
    const readiness = navigationReadiness();
    if (signal.aborted || !readiness.ready) return blocked(readiness.reason || 'Navigation cancelled');
    const observation = freshObservation();
    const selected = observation?.doors?.find(door => door.href === h.aliveSelectedDoor?.href);
    let pick;
    if (research) {
      research.expandQueries({ concepts: researchConcepts(), engines: researchEngines() });
      const probe = state.lastBackendProbe;
      pick = research.choose({ currentUrl: safeGetUrl(getActiveTab()), concepts: researchConcepts(), predictionError: h.worldPredError,
        preferredUrl: selected?.href || state.planner?.proposal?.preferredUrl,
        tor: { available: probe?.socksHandshakeVerified === true && !['starting', 'bootstrapping'].includes(probe?.managedTor?.status),
          proxyApplied: probe?.torPacApplied === true, checkedAt: probe?.checkedAt } });
      if (!pick) return blocked('Research frontier exhausted or awaiting a verified transport; no repeated fallback dispatched');
    } else if (selected && /^https?:\/\//i.test(selected.href) && !h.isUrlOrAnchorTaboo(selected.href, selected.text)) {
      pick = { url: selected.href, title: selected.text, selection: 'observed Grover-selected door' };
    } else {
      const query = h.cognitiveCortex.emergentQuery;
      if (query && typeof buildChaoticPolymathSearchUrl === 'function') pick = { ...buildChaoticPolymathSearchUrl(query), selection: 'current learned concept query' };
      else {
        const candidates = ALIEN_RABBIT_HOLES.filter(item => !h.isUrlOrAnchorTaboo(item.url, item.title));
        if (!candidates.length) return blocked('No unvisited portal available');
        const index = m.groverSelectDoorIndex(candidates.length).doorIdx;
        pick = { ...candidates[index % candidates.length], selection: 'unvisited discovery catalog' };
      }
    }
    if (!pick?.url || !/^https?:\/\//i.test(pick.url)) return blocked('Portal target is not a navigable HTTP page');
    const source = getActiveTab();
    let target = source;
    if (tabs.length >= 4 && (!target || target.pinned)) target = tabs.find(tab => !tab.pinned && !tab.isLoading && tab.id !== secondaryTabId);
    if (tabs.length >= 4 && !target) return blocked('Four-tab habitat limit reached and no unpinned tab can be reused');
    // Split habitat: the new destination opens in the primary (left) pane and the
    // page just explored moves to the secondary (right) pane, so both panes keep
    // changing and the creature inhabits both. At the tab limit a spare hidden tab
    // is reused rather than overwriting the page about to become the right pane.
    const splitHabitat = typeof splitViewActive !== 'undefined' && splitViewActive === true;
    if (splitHabitat && tabs.length >= 4 && !readiness.recovery && source && !source.pinned) {
      const spare = tabs.filter(tab => tab.id !== source.id && tab.id !== secondaryTabId && !tab.pinned && !tab.isLoading)
        .sort((a, b) => (a.lastDomReadyTs || 0) - (b.lastDomReadyTs || 0))[0];
      if (spare) target = spare;
    }
    if (signal.aborted || window.alienAutoNavigateLinks === false) return blocked('Navigation cancelled');
    if (readiness.recovery && target?.isLoading) { try { target.wv.stop(); } catch (_) {} }
    if (tabs.length < 4 && !readiness.recovery) target = createTab(pick.url, { title: String(pick.title || 'Creature portal').slice(0, 32) });
    else if (!dispatchNonBlockingTabNavigation(target, pick.url, String(pick.title || 'Creature portal').slice(0, 32))) return blocked('Browser retained the current page because its navigation or dwell guard declined the portal');
    if (!target) return blocked('Browser did not create or reuse a portal tab');
    state.lastNavigation = performance.now();
    if (research) research.markDispatched(pick, { tabId: target.id });
    else h.recordVisitedUrl(pick.url, pick.title);
    if (splitHabitat && source && target.id !== source.id && tabs.includes(source)) secondaryTabId = source.id;
    switchTab(target.id); alienBrainDoorsCount++;
    state.observation = null; h.aliveSelectedDoor = null;
    const lease = authority && target.domReady ? await window.selectAliveGuest(target.id, { reason: 'alive-selected-portal', signal }) : null;
    return completed({ url: pick.url, tab: target.id, tabCount: tabs.length, selection: pick.selection, reason: pick.reason, recovery: readiness.recovery,
      navigation: 'dispatched; page load not yet verified', destinationAcknowledged: lease?.status === 'completed',
      guestAuthority: lease?.evidence || null });
  }
  async function deepDarkProbe({ signal }) {
    if (signal.aborted) return blocked('Backend probe cancelled');
    const query = (h.cognitiveCortex.lastComprehension.topConcepts || []).slice(0, 3).join(' ');
    const tab = getActiveTab();
    const currentUrl = committedUrl(tab);
    const captured = { webview: tab?.wv, token: authority?.leaseFor(tab?.id),
      ready: readyPage(tab) && Boolean(currentUrl), document: window.AliveGuestExecution?.documentIdentity?.(tab?.wv), navStarted: tab?.lastNavStartTs };
    let wcId; try { wcId = tab?.wv?.getWebContentsId(); } catch (_) {}
    const result = await ipcRenderer.invoke('deep-dark-web-probe', { query, wcId, onion: captured.ready && /\.onion(?:[/:]|$)/i.test(currentUrl) ? currentUrl : '' });
    if (signal.aborted) return blocked('Backend probe cancelled');
    const active = result?.ok === true && result.socksHandshakeVerified === true;
    const identity = window.AliveGuestExecution?.documentIdentity?.(tab?.wv);
    const pageCurrent = !!tab && captured.ready && readyPage(tab) && tab === getActiveTab() && tab.wv === captured.webview &&
      committedUrl(tab) === currentUrl && tab.lastNavStartTs === captured.navStarted &&
      (!authority || authority.isCurrent(captured.token, tab.wv)) &&
      (!captured.document || identity?.generation === captured.document.generation && identity.available !== false && identity.connected !== false);
    const evidence = { checkedAt: result?.checkedAt || Date.now(), localTorSocksActive: active, probeOk: result?.ok === true,
      socksHandshakeVerified: active, torPacApplied: result?.torPacApplied === true, routing: result?.routing,
      managedTor: result?.managedTor ? { status: result.managedTor.status, bootstrapProgress: result.managedTor.bootstrapProgress, bootstrapped: result.managedTor.bootstrapped, lastError: result.managedTor.lastError } : null,
      addressValidation: pageCurrent ? result?.addressValidation : null, navigation: pageCurrent ? result?.navigation || null : null,
      pageReceiptStatus: pageCurrent ? 'current document' : authority && !captured.token
        ? 'discarded: no current document lease' : 'discarded: selected tab, navigation, or document authority changed',
      scope: result?.scope || 'SOCKS5 negotiation does not identify a Tor daemon or prove an onion document loaded' };
    state.lastBackendProbe = evidence;
    if (h.deepDarkWebSubstrateEngine) {
      const ddw = h.deepDarkWebSubstrateEngine, nav = evidence.navigation;
      ddw.localTorSocksActive = active; ddw.socksHandshakeVerified = active;
      ddw.torV3OnionAddress = evidence.addressValidation?.valid ? evidence.addressValidation.hostname : '';
      ddw.activeDeepLayerName = nav?.networkVerified && nav.onion && nav.url === currentUrl ? 'ONION_DOCUMENT_OBSERVED' : active && evidence.torPacApplied ? 'SOCKS_ROUTE_READY / PAGE_UNVERIFIED' : 'PAGE_UNVERIFIED / ONION_UNAVAILABLE';
      ddw.lastDeepDarkVerdict = ddw.activeDeepLayerName;
      ddw.gatewayMode = evidence.routing?.mode || 'UNVERIFIED';
    }
    return { status: active && evidence.torPacApplied ? 'completed' : 'unavailable', reason: active ? evidence.torPacApplied ? '' : 'SOCKS negotiated but route application failed' : 'No local SOCKS5 handshake verified', evidence };
  }
  async function planResearch({ signal }) {
    const observation = freshObservation(), tab = getActiveTab();
    if (!observation || !research || !window.AliveResearchPolicy.normalizeURL(observation.url)) return blocked('A fresh public-page observation is required for research deliberation');
    const captured = { url: committedUrl(tab), tabId: tab.id, webview: tab.wv, navStarted: tab.lastNavStartTs, authority: observation.authority, at: state.observationAt };
    const result = await ipcRenderer.invoke('alive-research-plan', {
      observation: { url: observation.url, title: observation.title, excerpt: observation.researchExcerpt, concepts: researchConcepts(), observedAt: captured.at },
      recent: research.snapshot().recentPages,
      candidates: (observation.doors || []).slice(0, 32).map(door => ({ url: door.href, title: door.text }))
    });
    if (signal.aborted || tab !== getActiveTab() || !readyPage(tab) || tab.wv !== captured.webview ||
        committedUrl(tab) !== captured.url || tab.lastNavStartTs !== captured.navStarted || authority && !authority.isCurrent(captured.authority)) return blocked('Discarded stale or cancelled research proposal');
    state.planner = result;
    if (result?.status !== 'completed' || !result.proposal) return { status: result?.status || 'unavailable', reason: result?.reason || 'Local language specialist unavailable', evidence: result };
    const engines = researchEngines();
    let added = 0;
    for (const [index, query] of result.proposal.queries.entries()) {
      const engine = engines[index % engines.length];
      if (!engine) break;
      added += research.enqueue([{ url: engine.buildUrl(query), title: query, query, source: 'search', discoveredFrom: captured.url }]).added;
    }
    saveResearch();
    return completed({ model: result.model, backend: result.backend, durationMs: result.durationMs, goal: result.proposal.goal, hypothesis: result.proposal.hypothesis, queries: result.proposal.queries, candidatesAdded: added, scope: result.scope });
  }
  const adapters = {
    'brains-precision': () => {
      const federation = h.portedMultiverseBrains, arena = federation?.precisionArena;
      const brains = Object.keys(federation || {}).filter(key => /^brain\d+[A-Z]/.test(key) && typeof federation[key]?.step60Hz === 'function');
      const precisionTypes = Array.from(new Set(Object.values(arena || {}).filter(value => ArrayBuffer.isView(value)).map(value => value.constructor.name)));
      const coupling = h.aliveNeuralCoupling.snapshot();
      return observeArchitecture(federation, { brains: brains.length, precisionBytes: arena?.backingBuffer?.byteLength || 0, precisionTypes,
        coupledSources: coupling.sourceCount, coupledTrainableParameters: coupling.trainableParameters, observedFeedbackUpdates: coupling.feedbackUpdates,
        implementation: 'local ported models; mixed precision arena views; original Asmodensius tracked separately', originalAsmodensius: h.authenticAsmodensiusReadout?.status || 'initializing' });
    },
    macro: () => {
      const fusion = h.aliveSpecialistFusion?.snapshot();
      return observed({ ...baseEvidence(), regions: m.macroRate.length, winner: m.gwtWinner, specialists: h.activeSpecialists,
        fusionScope: fusion?.scope || 'Specialist fusion module not installed', fusionCaptureTick: fusion?.capturedTick ?? null,
        fusionTick: fusion?.tick ?? null, fusionMotorDrive: fusion?.residual || null,
        // Flat numeric rows survive the coordinator's deliberately bounded evidence serializer.
        specialistFusion: fusion?.sources.map(source => ({ name: source.name, available: source.available, selected: source.selected,
          gate: source.gate, readoutX: source.readout[0], readoutY: source.readout[1],
          contributionX: source.contribution[0], contributionY: source.contribution[1] })) || [],
        motorBefore: fusion?.appliedMotor.baselineActions || null, motorAfter: fusion?.appliedMotor.actions || null,
        motorMatchesFusion: fusion?.appliedMotor.matchesFusion || null,
        modelScalars: modelEvidence(m), source: 'live in-process model state' });
    },
    meso: () => observed({ regions: m.mesoElig.length, columns: m.mesoElig.reduce((sum, row) => sum + row.length, 0), apicalSample: Array.from(m.mesoApical?.[0] || []).slice(0, 8), eligibilitySample: Array.from(m.mesoElig[0]).slice(0, 8), tick: h.simulationTick }),
    micro: () => observed({ qgtTrace: finite(m.qgtTrace), berry: finite(m.berry01), qrng: hybridQrng.lastHex, implementation: 'local numerical micro-models; hardware quantum and external Eshkol execution are not established by this readout', flywireHeading: finite(h.flywireConnectome.headingAngleRad) }),
    'body-curriculum': () => observed({ ...baseEvidence(), currentStage: HUMUNCULUS_STAGES[h.stageIdx].code, stageCount: HUMUNCULUS_STAGES.length, curriculum: 'sequential stages with shared online learning', limbs: h.bodyRecipe.limbCount, viscera: modelEvidence(m.viscera), episodes: h.episodicMemory.length }),
    connectome: () => observeArchitecture(h.connectome512, { neurons: h.connectome512?.v512?.length || 0, synapses: h.connectome512?.synWeights262K?.length || 0, stdpUpdates: h.connectome512?.stdpUpdatesCount, backprop: h.trainableAlifeNeuralHub?.totalBackpropStepsTrained }),
    millennium: () => observeArchitecture(h.multivectorMetacognitionEngine, { model: 'numerical Cl(4,0) and Millennium-inspired features', dsd: h.decursiveSelfDeduplicator.totalSelfDeduplicationsCount }),
    reasoning: () => observeArchitecture(h.aotTotGotEngine, { backprop: h.trainableAlifeNeuralHub.totalBackpropStepsTrained }),
    // Each observation issues at most one ~viewport-sized measured scroll stride;
    // 900 ms (vs the 1.4 s default) still exceeds the 650 ms smooth-scroll settle.
    'dom-body': { intervalMs: 900, ready: pageReady, run: observePage },
    'train-policy': () => { const result = h.runPracticeAndHeldOutEval(); return completed({ ...result.evalReport, policy: result.policyCid, source: 'single-candidate simulated steering; three training trajectories, five holdout and five retention evaluation seeds' }); },
    'grover-collapse': () => { const doors = freshObservation()?.doors || []; if (!doors.length) return blocked('No fresh observed page doors'); const pick = m.groverSelectDoorIndex(doors.length); h.aliveSelectedDoor = doors[pick.doorIdx]; return completed({ index: pick.doorIdx, probability: pick.prob, target: h.aliveSelectedDoor?.href, implementation: 'classical amplitude simulation' }); },
    decursive: { ready: pageReady, run: async ({ signal }) => { const result = await triggerPrimarkDecursiveSelfDeduplicationBurst(false, { signal }); if (signal.aborted) return blocked('Decursive action cancelled'); const failure = guestFailure(result, 'Decursive authority unavailable'); if (failure) return failure; if (!result) return blocked('Decursive model unavailable'); return completed({ localMutation: true, deduplications: result.totalSelfDeduplicationsCount, guest: result.lastDomOutcome || { confirmed: 0 }, scope: 'Local model and body mutation; guest outcome reported separately' }); } },
    feed: { ready: pageReady, run: async ({ signal }) => {
      const outcome = await feedCreatureFromHabitatBar({ signal });
      if (signal.aborted || outcome?.status === 'blocked' || outcome?.status === 'cancelled') return blocked(outcome?.reason || 'Feeding cancelled');
      return completed({ glucose: m.viscera.glc, dopamine: m.nm.DA, localFed: outcome?.localFed === true,
        pageApplied: outcome?.pageApplied === true, pagePellets: outcome?.pagePellets || 0 });
    } },
    formation: () => { cycleCreatureSwarmFormation(); return completed({ formation: h.swarmCollective.formationMode || h.swarmCollective.formation }); },
    'soul-surge': () => { m.surge9dParasiteSoul(); return completed({ torsion: m.nineDim.torsion9D, damped: m.nineDim.rejectionDampedEvents }); },
    deity: () => { h.stepDeity100OmnipotenceEngine(freshObservation() || {}); return observeArchitecture(h.deity100Engine, { implementation: 'local simulation and browser effect model' }); },
    omega: () => { h.stepOmega100OmniscienceEngine(freshObservation() || {}); return observeArchitecture(h.omega100Engine, { implementation: 'local numerical feature model, no omniscience claim' }); },
    morph: () => completed({ ...h.mutateBodyMorphology() }),
    dream: () => { const result = h.consolidateHippocampalDreamReplay(); return { status: result.status || 'completed', reason: result.reason || '', evidence: result }; },
    procreate: { ready: () => h.offspringColony.length < 4 || 'Four offspring already inhabit the shared habitat', run: () => { const result = h.spawnMitosisOffspring(); return completed({ colony: result.colonySize, offspring: result.offspring?.offspringId, body: result.offspring?.bodyCid }); } },
    zalgo: { ready: pageReady, run: async ({ signal }) => { const result = await triggerEldritchZalgoBrowserFuckery(false, { signal }); if (signal.aborted) return blocked('Zalgo action cancelled'); const failure = guestFailure(result, 'Zalgo authority unavailable'); if (failure) return failure; if (!result || result.ok === false) return blocked(result?.reason || 'Zalgo action unavailable'); return { status: result.localMutation ? 'completed' : 'observed', reason: result.reason || '', evidence: { ...baseEvidence(), localMutation: result.localMutation === true, pageApplied: result.pageApplied === true, effect: result.pageApplied ? 'confirmed page glyph and wireframe mutation' : 'local morphology changed; page effect unconfirmed' } }; } },
    neo: { ready: pageReady, run: async ({ signal }) => { const result = await stepNeoMatrixBrowserPuppeteer(false, { coordinated: true, signal }); if (signal.aborted) return blocked('Neo action cancelled'); const failure = guestFailure(result, 'Neo authority unavailable'); if (failure) return failure; if (!result || result.ok === false) return blocked(result?.reason || 'Neo action unavailable'); const unconfirmed = Array.isArray(result.queued) || result.pageEffectsAttempted > result.pageEffectsConfirmed; return { status: unconfirmed ? 'observed' : 'completed', evidence: { ...result, tabs: tabs.length, effect: Array.isArray(result.queued) ? 'requested delegated capabilities; each reports its own outcome' : 'coordinated browser actions; guest confirmations counted separately' } }; } },
    'portal-jump': { intervalMs: 1000, initialDelayMs: 2000, ready: navigationReady, run: portalJump },
    'research-plan': { group: 'planner', timeoutMs: 16000, ready: () => Boolean(freshObservation()) || 'Waiting for observed page context', run: planResearch },
    'epoch-handoff': { ready: () => navigationReady() === true && tabs.length > 1 || 'Requires Auto-Hop, a settled page, and a second existing tab', run: async ({ signal }) => {
      const source = getActiveTab(); const dest = tabs.find(tab => tab.id !== source?.id && tab.domReady);
      if (!source || !dest || signal.aborted || window.alienAutoNavigateLinks === false) return blocked('No other ready tab or Auto-Hop disabled');
      switchTab(dest.id); state.lastNavigation = performance.now(); state.observation = null; h.aliveSelectedDoor = null;
      const outcome = await window.selectAliveGuest(dest.id, { reason: 'alive-coordinator', signal });
      if (outcome.status !== 'completed' || signal.aborted) return blocked(outcome.reason || 'Guest handoff acknowledgement unavailable');
      return completed({ ...outcome.evidence, epoch: outcome.evidence.newEpoch, source: source.id, destination: dest.id });
    } },
    checkpoint,
    onion: () => state.lastBackendProbe ? observed({ ...state.lastBackendProbe, ageMs: Date.now() - state.lastBackendProbe.checkedAt }) : { status: 'unavailable', reason: 'Local Tor backend has not been probed in this session' },
    'deep-dark-dive': { group: 'backend', intervalMs: 15000, initialDelayMs: 1800, run: deepDarkProbe },
    flywire: { manualOnly: false, run: () => completed(h.runFlyWireAblationTest()) },
    'acceptance-gates': { manualOnly: false, run: () => observed(h.evaluateAcceptanceGates()) }
  };
  const controller = window.aliveOverdrive = new window.AliveOverdriveRuntime.Controller({
    adapters, intervalMs: 50, budgetMs: 5, maxInFlight: 2,
    getContext: () => ({ paused: document.hidden || Boolean(window.__aliveCheckpointRestore), tick: h.simulationTick, predictionError: h.worldPredError, observationAgeMs: performance.now() - state.observationAt }),
    onOutcome(id, result) {
      if (id !== 'dom-body' || !Number.isFinite(result.reward) || (authority && !authority.isCurrent(result.evidence?.authority))) return;
      h.aliveNeuralCoupling.feedback(h.worldPredError, h.simulationTick);
      // Reward the actual prediction-error change at an observed page transition.
      const reward = result.reward;
      for (let j = 0; j < h.D_OBS; j++) h.W_critic[j] = Math.max(-2.5, Math.min(2.5, h.W_critic[j] + 0.002 * reward * h.obsVec[j]));
      m.nm.DA = Math.max(0, Math.min(1.25, m.nm.DA + reward * 0.02));
      state.learnedOutcomes++;
    },
    onEvent(event) {
      if (['started', 'stopped', 'suspended', 'resumed'].includes(event.type)) syncWorkerTrainer();
      if (event.type === 'stopped') { research?.cancelPending('Autonomy paused'); saveResearch(); }
      if (event.type === 'stopped' && authority && !authority.snapshot().paused) authority.setPaused(true).catch(() => {});
      window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: event }));
    }
  });
  function syncWorkerTrainer() {
    const trainer = h.bleedingEdge25Engine;
    if (window.__alivePersistenceClosing || window.__aliveCheckpointRestore || document.hidden || !controller.running) {
      trainer?.suspendWorkerTrainer?.(window.__alivePersistenceClosing ? 'shutdown' : window.__aliveCheckpointRestore ? 'checkpoint-restore' : document.hidden ? 'document-hidden' : 'paused');
    } else trainer?.resumeWorkerTrainer?.();
  }
  function resetPresentationClock() {
    if (typeof chromeCrawlerState !== 'undefined' && chromeCrawlerState) {
      chromeCrawlerState.lastPresentationAt = 0;
      chromeCrawlerState.nextPresentationAt = 0;
      chromeCrawlerState.authenticPreviousTime = performance.now();
    }
    state.lastFrame = 0;
  }
  window.startAliveOverdrive = () => {
    if (window.__alivePersistenceClosing) return blocked('Application shutdown is saving the final genome');
    if (window.__aliveCheckpointRestore) return blocked('Checkpoint restoration is in progress');
    clearTimeout(alienBrainTimer); clearInterval(window.__autonomyWatchdogTimer);
    window.__autonomyWatchdogTimer = null;
    alienBrainActive = true; superintelligenceOverdrive = true; neoMatrixOverdriveActive = true; abortAutopilot = false;
    const persona = document.getElementById('alien-persona-select'); if (persona) persona.value = 'superintelligence_overdrive';
    resetPresentationClock();
    controller.start(); updateAlienBrainKpis('ALIVE OVERDRIVE · coordinated');
    window.syncAliveGuestState();
    return controller.snapshot();
  };
  window.syncAliveGuestState = () => {
    syncWorkerTrainer();
    const paused = !controller.running || document.hidden;
    if (authority && authority.snapshot().paused !== paused) {
      authority.setPaused(paused).then(outcome => {
        if (!paused && outcome.status === 'completed' && !authority.snapshot().paused) window.syncAliveGuestState();
      }).catch(() => {});
    }
    for (const tab of tabs) {
      const token = authority?.leaseFor(tab.id);
      if (tab.domReady && tab.wv && isWebviewGuestReady(tab.wv) && token) {
        window.AliveGuestExecution.run(tab.wv, `window.__alivePaused=${paused};window.__humunculusOverdrive=${!!superintelligenceOverdrive};window.__aliveCanvasAnalytics=${!!window.aliveWorkspace?.showCanvasAnalytics()};window.__aliveAllowNavigation=${window.alienAutoNavigateLinks !== false};`,
          { tag: 'alive-state', authorityToken: token, timeoutMs: 500 }).catch(() => {});
      }
    }
  };
  // The recurring badge reads cached document identity only. Full execution and
  // model diagnostics remain explicit and must not be pulled into this getter.
  window.getAliveTransportEvidence = () => {
    const tab = getActiveTab();
    return { lastBackendProbe: state.lastBackendProbe, activeUrl: committedUrl(tab), activeTabId: tab?.id ?? null,
      activeReady: Boolean(committedUrl(tab) && readyPage(tab)), activeLoading: Boolean(tab?.isLoading || tab?.mainFrameNavigating),
      activeLastNavStartTs: Number.isFinite(tab?.lastNavStartTs) ? tab.lastNavStartTs : 0 };
  };
  window.getAliveRuntimeEvidence = () => ({ ...state, ...window.getAliveTransportEvidence(), research: research?.snapshot() || null, observation: state.observation ? { url: state.observation.url, doors: state.observation.doors?.length } : null, authority: authority?.snapshot() || null, pendingGuestExecutions: window.AliveGuestExecution?.pendingCount() || 0, guestExecutions: window.AliveGuestExecution?.pendingSnapshot() || [], guestLifecycle: window.AliveGuestExecution?.lifecycleSnapshot() || [], neuralStepMs: chromeCrawlerState?.lastNeuralStepMs, policyP95Ms: h.p95StepLatencyMs, policySamples: h.policyLatencySamples?.length || 0, autosave: window.aliveAutosave?.snapshot?.() || null, acceptance: h.lastAcceptanceReport });
  window.gigachad?.on?.('alive-genome-close-request', async request => {
    if (window.aliveStartup?.ownsClose?.()) return;
    window.__alivePersistenceClosing = true;
    h.bleedingEdge25Engine?.suspendWorkerTrainer?.('shutdown');
    let result;
    try {
      if (typeof stopAlienBrainAutonomy === 'function') stopAlienBrainAutonomy();
      else controller.stop();
      result = await window.aliveAutosave.flush('shutdown');
      // Prevent pagehide/beforeunload from queuing a newer write after the
      // main process has acknowledged its final physical drain.
      const drain = await window.aliveAutosave.cancelAndDrain('shutdown-settled');
      if (!drain?.settled) result = { status: 'failed', persistenceVerified: false, error: 'Final genome fence did not settle' };
    } catch (error) { result = { status: 'failed', persistenceVerified: false, error: String(error.message || error) }; }
    await window.gigachad.invoke('alive-genome-close-result', { requestId: request?.requestId,
      ownerId: window.aliveGenomePersistence?.snapshot().ownerId, result }).catch(() => {});
  });
  function frame(now) { if (state.lastFrame && !document.hidden) { state.frames.push(now - state.lastFrame); if (state.frames.length > 240) state.frames.shift(); } state.lastFrame = now; requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  let lastSaved = 0;
  setInterval(() => {
    const snap = controller.snapshot();
    window.aliveWorkspace?.updateStatus(snap);
    if (performance.now() - lastSaved > 10000) {
      lastSaved = performance.now();
      try { localStorage.setItem('gigachad_alive_events_v1', JSON.stringify((snap.events || []).slice(-120))); } catch (_) {}
      saveResearch();
    }
  }, 500);
  document.addEventListener('visibilitychange', () => {
    resetPresentationClock();
    if (document.hidden && authority?.snapshot().paused) authority.invalidate('document-hidden').catch(() => {});
    window.syncAliveGuestState();
  });
  window.addEventListener?.('pagehide', saveResearch);
})();
