/* Consolidated browser chrome. Existing action elements remain the single handler source. */
(function installAliveWorkspace(root) {
  'use strict';
  function describeRuntime(state) {
    const jobs = state?.jobs || [];
    const completed = jobs.filter(job => job.completedCount > 0).length;
    const issues = jobs.filter(job => ['blocked', 'unavailable', 'error', 'timeout'].includes(job.status)).length;
    const phase = !state?.running ? 'Paused' : state.suspended ? 'Suspended · host hidden or paused' : 'Running';
    const held = state?.health?.awaitingSettlement || 0;
    return `${phase} · ${completed}/${jobs.length} exercised${state?.inFlight ? ` · ${state.inFlight} executing` : ''}${held ? ` · ${held} awaiting settlement` : ''}${issues ? ` · ${issues} need attention` : ''}`;
  }
  function describeGuestCleanup(authority) {
    const cleanup = authority?.cleanup;
    if (cleanup?.status === 'pending') return `Guest cleanup pending · attempt ${cleanup.attempt || 1}/${cleanup.maxAttempts || 3}`;
    if (cleanup?.status === 'blocked') return `Guest cleanup blocked · ${cleanup.unresolved?.length || 0} documents unresolved${cleanup.rawDrained === false ? ' · raw work unsettled' : ''}`;
    return '';
  }
  function describeCapability(job, state) {
    if (!job) return 'Not registered';
    const operation = state?.executions?.find(item => item.id === job.id);
    if (operation) return `${operation.timedOut ? 'Timed out' : operation.cancelled ? 'Cancelled' : 'Executing'} · ${(operation.elapsedMs / 1000).toFixed(1)}s${operation.timedOut || operation.cancelled ? ' · awaiting settlement' : ''}`;
    const count = `${job.completedCount} ${job.mode === 'observe' ? 'observations' : 'outcomes'}`;
    if (job.waitingFor?.length) return `Waiting for ${job.waitingFor.join(', ')} · ${count}`;
    if (['error', 'timeout'].includes(job.status) && state?.running && !state.suspended && Number.isFinite(job.nextDueAt)) {
      return `${job.status === 'timeout' ? 'Timed out' : 'Error'} · retry in ${Math.max(0, Math.ceil((job.nextDueAt - (state.sampledAt || 0)) / 1000))}s · ${count}`;
    }
    return `${job.status} · ${count}${job.manualOnly ? ' · on demand' : ''}`;
  }
  function describeResearch(research) {
    if (!research) return 'Research observations have not started.';
    const progress = `${research.visitedPages || 0} pages · ${research.visitedDomains || 0} domains · ${research.frontierCount || 0} candidates · ${research.modelUpdates || 0} navigation-ranker updates`;
    const readiness = research.lastReadiness?.ready === false ? ` · Waiting: ${research.lastReadiness.reason || 'navigation prerequisites'}`
      : research.lastReadiness?.recovery ? ` · Recovery: ${research.lastReadiness.reason || 'finding a fresh destination'}` : '';
    const url = String(research.pending?.url || '');
    const target = url.length > 160 ? url.slice(0, 157) + '…' : url;
    return `${progress}${readiness}${target ? ` · Opening ${target}` : ''}`;
  }
  function isVerifiedOnion(probe, activeUrl, documentState = {}) {
    const route = probe?.navigation;
    if (!route?.onion || route.networkVerified !== true || route.status !== 'loaded' ||
        !/^SOCKS5\s+/.test(route.proxyRoute || '') || documentState.activeLoading || documentState.activeReady === false) return false;
    try {
      const current = new URL(activeUrl), recorded = new URL(route.url);
      current.hash = ''; recorded.hash = '';
      if (!current.hostname.endsWith('.onion') || current.href !== recorded.href) return false;
    } catch (_) { return false; }
    return !(Number.isFinite(documentState.activeLastNavStartTs) && documentState.activeLastNavStartTs > 0 &&
      (!Number.isFinite(route.observedAt) || route.observedAt < documentState.activeLastNavStartTs));
  }
  function describeTransport(probe, activeUrl, documentState = {}) {
    const route = probe?.navigation;
    const client = probe?.managedTor;
    let clientState = '';
    if (client && !(client.status === 'ready' && client.bootstrapped === true)) {
      const progress = Number.isFinite(client.bootstrapProgress) ? Math.max(0, Math.min(100, Math.floor(client.bootstrapProgress))) : 0;
      if (['starting', 'bootstrapping'].includes(client.status)) clientState = `Tor bootstrap ${progress}%`;
      else {
        const label = ({ timeout: 'bootstrap timeout', error: 'client error', unavailable: 'client unavailable',
          disabled: 'client disabled', stopping: 'client stopping', stopped: 'client stopped', idle: 'client idle',
          ready: 'bootstrap unconfirmed' })[client.status] || 'client state unavailable';
        const error = String(client.lastError || '').replace(/\s+/g, ' ').trim();
        clientState = `Tor ${label}${error ? `: ${error.length > 96 ? error.slice(0, 93) + '…' : error}` : ''}`;
      }
    }
    const withClient = text => clientState ? `${clientState} · ${text}` : text;
    if (activeUrl !== undefined) {
      let current = null, recorded = null;
      try { current = new URL(activeUrl); current.hash = ''; } catch (_) {}
      try { recorded = new URL(route?.url); recorded.hash = ''; } catch (_) {}
      if (!current || !recorded || current.href !== recorded.href) {
        return withClient(current?.hostname?.endsWith('.onion') ? 'Onion · awaiting verified load' : 'Web · no current onion load');
      }
    }
    if (route?.onion && (documentState.activeLoading || documentState.activeReady === false ||
      Number.isFinite(documentState.activeLastNavStartTs) && documentState.activeLastNavStartTs > 0 &&
      (!Number.isFinite(route.observedAt) || route.observedAt < documentState.activeLastNavStartTs))) {
      return withClient('Onion · awaiting verified load');
    }
    if (route?.onion && route.networkVerified === true && route.status === 'loaded' && /^SOCKS5\s+/.test(route.proxyRoute || '')) return withClient('Onion loaded · SOCKS5');
    if (route?.onion && route.networkVerified === true && route.status === 'loaded') return withClient('Onion loaded · route unverified');
    if (route?.onion && route.status === 'failed') return withClient('Onion failed');
    if (route?.onion) return withClient('Onion · awaiting verified load');
    if (probe?.socksHandshakeVerified && probe?.torPacApplied) return withClient('SOCKS route ready');
    if (probe?.socksHandshakeVerified) return withClient('SOCKS verified · route pending');
    return withClient('Web · onion unverified');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { describeRuntime, describeGuestCleanup, describeCapability, describeResearch, describeTransport, isVerifiedOnion };
  if (!root.document || root.aliveWorkspace) return;
  const doc = root.document;
  let analytics = false;
  let snapshot = null;
  let filter = 'all';
  let returnFocus = null;
  let restoringCheckpoint = false;
  let checkpointResult = null;
  const sources = [
    '#alien-brain-drawer .drawer-header button[onclick]',
    '#alife-habitat-strip button[onclick]',
    '#host-alife-hud-bar button[onclick]',
    '#alien-brain-drawer button[onclick]',
    '#tools-ribbon button[onclick]'
  ];
  const aliases = {
    triggerHumunculusMitosis: 'Procreate / Mitosis Split',
    mutateHumunculusBody: 'Mutate Body / Eldritch Morph',
    runHippocampalDreamReplay: 'Dream SWS / Dream Replay',
    triggerPrimarkDecursiveSelfDeduplicationBurst: 'Decursive DSD-24',
    triggerDeepDarkWebExpedition: 'Onion / Deep Dark Dive',
    runHumunculusPracticeEpisode: 'Train Policy',
    checkpointOrRollbackHumunculus: 'Checkpoint CID',
    trigger9dParasiteSoulSurge: '9D Soul Surge',
    triggerHybridBornGroverCollapse: 'Grover Collapse',
    spawnAlienRabbitHoleTab: 'Portal Jump / Concept Dive',
    triggerEmergentConceptDive: 'Portal Jump / Concept Dive',
    performWeirdAlienDomExperiment: 'Spawn DOM Body',
    feedCreatureFromHabitatBar: 'Feed',
    cycleCreatureSwarmFormation: 'Formation',
    triggerDeity100ApotheosisPulse: 'Deity 100',
    triggerEldritchZalgoBrowserFuckery: 'Zalgo Fuckery',
    triggerNeoMatrixOmnipotenceOverdrive: 'Neo Matrix',
    runFlyWireAblationBenchmark: 'FlyWire A/B',
    triggerHumunculusEpochHandoff: 'Epoch Handoff',
    runHumunculusAcceptanceSuite: '8 PDF Gates'
  };
  const viewNames = {
    brainfusion: '14 Brain × 7 Precision', aottotgot: 'AoT · ToT · GoT',
    omniscience100: 'Omega 100', decursive: 'DSD-24 state',
    metacognition: 'Cl(4,0) Metacognition', deepdark: 'Deep / Dark substrate',
    deity100: 'Deity 100 state'
  };
  const tierNames = [
    'Macro · 14 Regions / RIM Router', 'Meso · 112 sLTC × SSM / Apical NMDA',
    'Micro · Moonlab Q3 / QGTL / QRNG / Eshkol / FlyWire Ising',
    'Body + Curriculum · Stages A–F / Viscera',
    '512-CONN × 262K-SYN × sLTC / SSM × Onion',
    'DSD-24 × Cl(4,0) × Millennium'
  ];
  const capabilityIds = {
    checkpointOrRollbackHumunculus: 'checkpoint', trigger9dParasiteSoulSurge: 'soul-surge',
    triggerHybridBornGroverCollapse: 'grover-collapse', spawnAlienRabbitHoleTab: 'portal-jump',
    triggerEmergentConceptDive: 'portal-jump',
    performWeirdAlienDomExperiment: 'dom-body', triggerPrimarkDecursiveSelfDeduplicationBurst: 'decursive',
    feedCreatureFromHabitatBar: 'feed', cycleCreatureSwarmFormation: 'formation',
    triggerHumunculusMitosis: 'procreate', mutateHumunculusBody: 'morph',
    runHippocampalDreamReplay: 'dream', triggerDeity100ApotheosisPulse: 'deity',
    triggerEldritchZalgoBrowserFuckery: 'zalgo', triggerNeoMatrixOmnipotenceOverdrive: 'neo',
    runHumunculusPracticeEpisode: 'train-policy', runFlyWireAblationBenchmark: 'flywire',
    triggerHumunculusEpochHandoff: 'epoch-handoff', runHumunculusAcceptanceSuite: 'acceptance-gates',
    triggerDeepDarkWebExpedition: 'deep-dark-dive'
  };
  const terminalIds = { brainfusion: 'brains-precision', aottotgot: 'reasoning', omniscience100: 'omega', deepdark: 'onion' };
  const tierIds = ['macro', 'meso', 'micro', 'body-curriculum', 'connectome', 'millennium'];
  const skip = /^(?:toggleSuperintelligenceOverdrive|toggleAlienBrainAutonomy|toggleHostAlifeHudPre|cycleHostTerminalViewMode|toggleLeftOmniDock)\(/;
  const el = (tag, attrs, text) => {
    const node = doc.createElement(tag);
    for (const [name, value] of Object.entries(attrs || {})) node.setAttribute(name, value);
    if (text != null) node.textContent = text;
    return node;
  };
  const button = (label, attrs, click) => {
    const node = el('button', { type: 'button', ...attrs }, label);
    node.addEventListener('click', click);
    return node;
  };

  function closeInspectors() {
    doc.querySelectorAll('#workspace > .overlay-drawer').forEach(node => {
      node.style.display = 'none';
      node.classList.remove('open');
    });
    const lab = doc.getElementById('alife-left-omni-dock');
    if (lab) lab.style.display = 'none';
  }
  function closePanels(focus = false) {
    const panel = doc.getElementById('alive-controls-panel');
    if (panel) panel.hidden = true;
    closeInspectors();
    updatePanelButtons();
    if (focus && returnFocus?.isConnected) returnFocus.focus();
  }
  function updatePanelButtons() {
    const controls = doc.getElementById('alive-controls-panel');
    const inspector = doc.getElementById('alien-brain-drawer');
    const logs = doc.getElementById('alife-left-omni-dock');
    doc.getElementById('alive-controls-button')?.setAttribute('aria-expanded', String(!controls?.hidden));
    doc.getElementById('alive-inspect-button')?.setAttribute('aria-expanded', String(inspector?.style.display === 'flex'));
    doc.getElementById('alive-logs-button')?.setAttribute('aria-expanded', String(logs?.style.display === 'flex'));
  }
  function openPanel(which) {
    const controls = doc.getElementById('alive-controls-panel');
    const target = doc.getElementById(which === 'controls' ? 'alive-controls-panel' : which === 'logs' ? 'alife-left-omni-dock' : 'alien-brain-drawer');
    if (!target) return;
    const wasOpen = which === 'controls' ? !controls.hidden : target.style.display === 'flex';
    returnFocus = doc.activeElement;
    closePanels();
    if (!wasOpen) {
      if (which === 'controls') {
        controls.hidden = false;
        doc.getElementById('alive-control-search').focus();
      } else if (which === 'logs') target.style.display = 'flex';
      else if (typeof root.toggleDrawer === 'function') root.toggleDrawer('alien-brain-drawer');
    }
    updatePanelButtons();
    updateStatus(root.aliveOverdrive?.snapshot?.());
  }
  function inspectAction(source) {
    closePanels();
    const inspector = doc.getElementById('alien-brain-drawer');
    if (inspector?.style.display !== 'flex' && typeof root.toggleDrawer === 'function') root.toggleDrawer('alien-brain-drawer');
    source.click();
    updatePanelButtons();
  }
  function collectActions() {
    const actions = new Map();
    for (const selector of sources) {
      for (const source of doc.querySelectorAll(selector)) {
        const handler = (source.getAttribute('onclick') || '').replace(/\s+/g, '');
        if (!handler || skip.test(handler) || handler === "toggleDrawer('alien-brain-drawer')") continue;
        const name = handler.split('(')[0];
        // Alias controls dispatch to one existing handler, preserving arguments and return behavior.
        const key = name === 'triggerEmergentConceptDive' ? 'spawnAlienRabbitHoleTab' : Object.hasOwn(aliases, name) ? name : handler;
        if (actions.has(key)) continue;
        const terminal = handler.match(/^setHumunculusTerminalView\(['"]([^'"]+)/);
        const tier = handler.match(/^setHybridMeshZoomTier\((\d+)/);
        const browser = source.closest('#tools-ribbon') !== null;
        let label = aliases[name] || source.textContent.trim().replace(/DSD-16/g, 'DSD-24');
        if (terminal) label = viewNames[terminal[1]] || label.replace(/^\[|\]$/g, '');
        if (tier) label = tierNames[Number(tier[1]) - 1] || label;
        const capabilityId = capabilityIds[name] || (terminal ? terminalIds[terminal[1]] : tier ? tierIds[Number(tier[1]) - 1] : null);
        actions.set(key, { source, label, key, capabilityId, category: terminal || tier ? 'inspect' : browser ? 'browser' : 'actions', inspect: Boolean(terminal || tier) });
      }
    }
    actions.set('alive-research-plan', { source: { title: 'Use the configured language model to propose a research query from current observations' }, label: 'Research planner · configured language model', key: 'alive-research-plan', capabilityId: 'research-plan', category: 'actions', inspect: false });
    return [...actions.values()];
  }
  function runCapability(action) {
    if (action.capabilityId && root.aliveOverdrive && typeof root.aliveOverdrive.request === 'function') {
      try {
        const outcome = root.aliveOverdrive.request(action.capabilityId);
        if (outcome === false) {
          const job = root.aliveOverdrive.snapshot().jobs.find(item => item.id === action.capabilityId);
          doc.getElementById('alive-runtime-status').textContent = `${action.label}: ${job?.lastError || job?.status || 'not queued'}`;
        }
        Promise.resolve(outcome).catch(error => {
          const status = doc.getElementById('alive-runtime-status');
          if (status) status.textContent = `${action.label}: ${error.message}`;
        });
        return true;
      } catch (error) {
        const status = doc.getElementById('alive-runtime-status');
        if (status) status.textContent = `${action.label}: ${error.message}`;
        return true;
      }
    }
    return false;
  }
  let actions = [];
  let lastAttentionMembership = '';
  const attentionMembership = () => (snapshot?.jobs || []).filter(job => ['blocked', 'unavailable', 'error', 'timeout'].includes(job.status) || job.waitingFor?.length).map(job => job.id).sort().join('|');
  function renderActions() {
    const list = doc.getElementById('alive-capability-list');
    if (!list) return;
    const query = (doc.getElementById('alive-control-search')?.value || '').trim().toLowerCase();
    const visible = actions.filter(action => (filter === 'all' || action.category === filter || filter === 'attention' && snapshot?.jobs?.some(job => job.id === action.capabilityId && (['blocked', 'unavailable', 'error', 'timeout'].includes(job.status) || job.waitingFor?.length))) && `${action.label} ${action.source.title} ${action.key}`.toLowerCase().includes(query));
    const fragment = doc.createDocumentFragment();
    for (const action of visible) {
      const entry = button('', { 'data-action-key': action.key, ...(action.capabilityId ? { 'data-capability-id': action.capabilityId } : {}), title: action.source.title || action.label }, () => {
        if (action.inspect) {
          runCapability(action);
          inspectAction(action.source);
        }
        else {
          // Close first: tool drawers opened by this action must not stack with this panel.
          closePanels();
          if (!runCapability(action)) action.source.click?.();
          updatePanelButtons();
        }
      });
      entry.append(el('span', { class: 'alive-action-label' }, action.label));
      const job = snapshot?.jobs?.find(item => item.id === action.capabilityId);
      entry.append(el('span', { class: 'alive-action-kind' }, job ? describeCapability(job, snapshot) : action.inspect ? 'Inspect live state' : action.category === 'browser' ? 'Browser tool' : 'Run action'));
      fragment.append(entry);
    }
    if (!visible.length) fragment.append(el('p', { class: 'alive-panel-description' }, 'No matching controls. Try another name.'));
    list.replaceChildren(fragment);
    lastAttentionMembership = attentionMembership();
    doc.getElementById('alive-control-feedback').textContent = `${visible.length} controls · duplicates combined`;
  }
  let lastLogJSON = '';
  function updateCheckpointControl() {
    const restore = doc.getElementById('alive-restore-checkpoint');
    const hint = doc.getElementById('alive-restore-hint');
    if (!restore || !hint) return;
    const state = root.aliveOverdrive?.snapshot?.(false) || snapshot;
    const unavailable = typeof root.restoreAliveCheckpoint !== 'function' || !state;
    const authority = root.aliveAuthority?.snapshot?.();
    const active = state?.running || state?.inFlight > 0 || state?.queued > 0 || authority?.transitioning || authority?.manuals ||
      ['pending', 'blocked'].includes(authority?.cleanup?.status) || authority?.cleanup?.unresolved?.length;
    restore.disabled = Boolean(unavailable || active || restoringCheckpoint);
    restore.textContent = restoringCheckpoint ? 'Verifying checkpoint…' : 'Restore latest checkpoint';
    hint.textContent = restoringCheckpoint ? 'Verifying saved tensors and restoring the model.'
      : unavailable ? 'Checkpoint restore is unavailable.'
      : active ? 'Pause the runtime and wait for operations to settle before restoring.'
      : 'Restore the latest saved model tensors, body, and policy identity.';
  }
  async function restoreCheckpoint() {
    const feedback = doc.getElementById('alive-restore-result');
    const state = root.aliveOverdrive?.snapshot?.(false);
    if (restoringCheckpoint || !state || state.running || state.inFlight > 0 || state.queued > 0) {
      feedback.textContent = 'Restore blocked: pause the runtime and wait for operations to settle.';
      updateCheckpointControl();
      return;
    }
    if (typeof root.restoreAliveCheckpoint !== 'function') {
      feedback.textContent = 'Checkpoint restore is unavailable.';
      updateCheckpointControl();
      return;
    }
    restoringCheckpoint = true;
    checkpointResult = null;
    feedback.textContent = '';
    updateCheckpointControl();
    try {
      const result = await root.restoreAliveCheckpoint();
      checkpointResult = result;
      if (result?.status === 'completed') {
        const evidence = result.evidence || {};
        feedback.textContent = `Restored ${evidence.tensorCount ?? 'saved'} tensors. CID: ${evidence.cid || 'not returned'}. ${evidence.scope || ''}`;
      } else {
        feedback.textContent = `Restore ${result?.status || 'did not complete'}: ${result?.reason || 'No completion evidence was returned.'}`;
      }
    } catch (error) {
      checkpointResult = { status: 'error', reason: error.message || String(error) };
      feedback.textContent = `Restore failed: ${checkpointResult.reason}`;
    } finally {
      restoringCheckpoint = false;
      updateCheckpointControl();
      renderCoordinatorLog();
    }
  }
  function renderCoordinatorLog() {
    const target = doc.getElementById('alive-coordinator-evidence');
    const lab = doc.getElementById('alife-left-omni-dock');
    if (!target || lab?.style.display !== 'flex' || !snapshot) return;
    const bounded = {
      running: snapshot.running, inFlight: snapshot.inFlight, queued: snapshot.queued,
      cycles: snapshot.cycleCount, metrics: snapshot.metrics, health: snapshot.health, executions: snapshot.executions,
      research: root.aliveResearch?.snapshot?.() || root.aliveResearchPolicy?.snapshot?.() || null,
      autosave: root.aliveAutosave?.snapshot?.() || null,
      ...(checkpointResult ? { checkpointRestore: checkpointResult } : {}),
      jobs: (snapshot.jobs || []).map(job => ({ id: job.id, status: job.status, runs: job.runCount, completed: job.completedCount, durationMs: job.lastDurationMs, evidenceAt: job.evidenceAt, lastSuccessfulAt: job.lastSuccessfulAt, waitingFor: job.waitingFor, evidence: job.evidence, error: job.lastError || undefined })),
      events: (snapshot.events || []).slice(-24)
    };
    const encoded = JSON.stringify(bounded, null, 2);
    if (encoded !== lastLogJSON) { target.textContent = encoded; lastLogJSON = encoded; }
  }
  function updateStatus(next) {
    if (next) snapshot = next;
    const status = doc.getElementById('alive-runtime-status');
    const run = doc.getElementById('alive-run-button');
    if (!status || !run) return;
    const legacy = doc.getElementById('alien-kpi-state')?.textContent || '';
    const running = snapshot ? Boolean(snapshot.running ?? snapshot.active ?? snapshot.enabled) : /LIVE|ACTIVE|RUNNING|OVERDRIVE|●/.test(legacy) && !/PAUSE|STOP|READY/.test(legacy);
    run.textContent = running ? 'Pause' : 'Start overdrive';
    run.dataset.running = String(running);
    run.setAttribute('aria-pressed', String(running));
    const jobs = snapshot?.jobs || [];
    const autosave = root.aliveAutosave?.snapshot?.();
    const saveFailed = ['failed', 'verification-failed', 'reported-failure'].includes(autosave?.lastOutcome);
    status.textContent = snapshot?.summary || (snapshot
      ? describeRuntime(snapshot)
      : running ? 'Autonomous runtime active' : 'Runtime paused');
    status.title = snapshot?.detail || legacy;
    const guestAuthority = root.aliveAuthority?.snapshot?.();
    const cleanupStatus = describeGuestCleanup(guestAuthority);
    if (cleanupStatus) {
      status.textContent += ' · ' + cleanupStatus;
      status.title += ' · ' + (guestAuthority.cleanup.reason || cleanupStatus);
    }
    if (saveFailed) {
      status.textContent += ' · Save needs attention';
      status.title = autosave.lastError || 'The latest model autosave did not complete successfully. See Logs.';
    }
    if (!doc.getElementById('alive-controls-panel')?.hidden && jobs.length) {
      if (filter === 'attention' && lastAttentionMembership !== attentionMembership()) renderActions();
      for (const entry of doc.querySelectorAll('#alive-capability-list [data-capability-id]')) {
        const job = jobs.find(item => item.id === entry.dataset.capabilityId);
        const kind = entry.querySelector('.alive-action-kind');
        if (job && kind) {
          kind.textContent = describeCapability(job, snapshot);
          kind.title = job.lastError || '';
          entry.dataset.outcome = job.status;
        }
      }
    }
    const summary = doc.getElementById('alive-capability-summary');
    if (summary && snapshot) {
      const automatic = snapshot.health?.automaticCapabilities ?? jobs.filter(job => !job.manualOnly).length;
      summary.textContent = `${automatic} automatic capabilities · ${jobs.filter(job => job.mode === 'observe').length} state observers · ${jobs.filter(job => job.mode === 'diagnostic').length} diagnostics`;
      summary.title = 'An exercised capability returned an outcome. This count does not establish that its scientific claim passed a test.';
    }
    const researchStatus = doc.getElementById('alive-research-status');
    if (researchStatus) {
      const research = root.aliveResearch?.snapshot?.() || root.aliveResearchPolicy?.snapshot?.();
      researchStatus.textContent = describeResearch(research);
      researchStatus.title = [research?.lastReadiness?.reason || research?.lastDecision?.reason,
        research?.pending?.url].filter(Boolean).join(' · ') || 'Observed navigation and online ranking evidence';
    }
    const transport = doc.getElementById('alive-transport-status');
    if (transport) {
      const evidence = root.getAliveTransportEvidence?.();
      const probe = evidence?.lastBackendProbe;
      const activeUrl = typeof evidence?.activeUrl === 'string' ? evidence.activeUrl : '';
      transport.textContent = describeTransport(probe, activeUrl, evidence || {});
      transport.title = [probe?.managedTor ? `Managed Tor: ${probe.managedTor.status} · bootstrap ${probe.managedTor.bootstrapProgress ?? 'unknown'}%` : '',
        probe?.managedTor?.lastError, probe?.navigation?.url || 'No onion navigation recorded', probe?.scope].filter(Boolean).join(' · ');
      transport.dataset.verified = String(isVerifiedOnion(probe, activeUrl, evidence || {}));
    }
    renderCoordinatorLog();
    updateCheckpointControl();
    updatePanelButtons();
  }

  function mount() {
    const workspace = doc.getElementById('workspace');
    if (!workspace || doc.getElementById('alive-runtime-bar')) return;
    doc.body.classList.add('alive-workspace');
    doc.getElementById('ai-sidebar')?.classList.add('collapsed');
    closeInspectors();
    const bar = el('div', { id: 'alive-runtime-bar', role: 'toolbar', 'aria-label': 'Creature runtime' });
    bar.append(el('span', { class: 'alive-brand' }, 'ALIVE'));
    bar.append(button('Start overdrive', { id: 'alive-run-button', title: 'Start or pause the unified creature runtime' }, () => {
      const controller = root.aliveOverdrive;
      const active = controller?.snapshot ? Boolean(controller.snapshot().running) : doc.getElementById('alive-run-button').dataset.running === 'true';
      const toggle = active && typeof root.stopAlienBrainAutonomy === 'function' ? root.stopAlienBrainAutonomy
        : !active && typeof root.startAliveOverdrive === 'function' ? root.startAliveOverdrive
        : root.toggleSuperintelligenceOverdrive;
      if (typeof toggle === 'function') Promise.resolve().then(() => toggle()).then(() => updateStatus(controller?.snapshot?.())).catch(error => {
        doc.getElementById('alive-runtime-status').textContent = `Runtime error: ${error.message}`;
      });
    }));
    bar.append(el('span', { id: 'alive-runtime-status' }, 'Connecting runtime…'));
    bar.append(el('span', { id: 'alive-transport-status', title: 'Transport and observed onion-load evidence' }, 'Web · onion unverified'));
    bar.append(button('Controls', { id: 'alive-controls-button', 'aria-controls': 'alive-controls-panel', 'aria-expanded': 'false', title: 'All creature capabilities and browser tools (Alt+Shift+C)' }, () => openPanel('controls')));
    bar.append(button('Inspect', { id: 'alive-inspect-button', 'aria-controls': 'alien-brain-drawer', 'aria-expanded': 'false', title: 'Inspect the live model, body, learning, and six architecture tiers' }, () => openPanel('inspect')));
    bar.append(button('Logs', { id: 'alive-logs-button', 'aria-controls': 'alife-left-omni-dock', 'aria-expanded': 'false', title: 'Open activity and model telemetry beside the page' }, () => openPanel('logs')));
    bar.append(button('Clear view', { id: 'alive-clear-button', title: 'Close control panels and analytics; keep creatures visible' }, () => {
      closePanels();
      doc.getElementById('ai-sidebar')?.classList.add('collapsed');
      analytics = false;
      doc.getElementById('alive-analytics-option').checked = false;
      doc.dispatchEvent(new CustomEvent('alive-workspace-analytics', { detail: { enabled: false } }));
      root.syncAliveGuestState?.();
    }));
    workspace.before(bar);

    const panel = el('aside', { id: 'alive-controls-panel', 'aria-label': 'Creature capabilities' });
    panel.hidden = true;
    const heading = el('div', { class: 'alive-panel-heading' });
    heading.append(el('h2', {}, 'Creature controls'));
    heading.append(button('×', { 'aria-label': 'Close creature controls' }, () => closePanels(true)));
    panel.append(heading, el('p', { class: 'alive-panel-description' }, 'Capabilities share the live model and execute at bounded cadences. Pause controls autonomous work.'));
    panel.append(el('p', { id: 'alive-capability-summary', class: 'alive-panel-description' }, 'Waiting for capability state…'));
    panel.append(el('p', { id: 'alive-research-status', class: 'alive-panel-description' }, 'Research observations have not started.'));
    const search = el('input', { id: 'alive-control-search', type: 'search', placeholder: 'Find a capability…', 'aria-label': 'Search creature capabilities and browser tools' });
    search.addEventListener('input', renderActions);
    panel.append(search);
    const filters = el('div', { class: 'alive-control-filters', 'aria-label': 'Capability filters' });
    for (const [value, label] of [['all', 'All'], ['actions', 'Actions'], ['inspect', 'Model'], ['browser', 'Browser'], ['attention', 'Attention']]) {
      filters.append(button(label, { 'aria-pressed': String(value === 'all') }, event => {
        filter = value;
        for (const item of filters.children) item.setAttribute('aria-pressed', String(item === event.currentTarget));
        renderActions();
      }));
    }
    panel.append(filters);
    const options = el('div', { class: 'alive-options' });
    const autoHop = el('input', { id: 'alive-autohop-option', type: 'checkbox' });
    const originalHop = doc.getElementById('habitat-autonav-chk');
    autoHop.checked = originalHop?.checked ?? false;
    autoHop.addEventListener('change', () => {
      if (originalHop) { originalHop.checked = autoHop.checked; originalHop.dispatchEvent(new Event('change', { bubbles: true })); }
      root.syncAliveGuestState?.();
    });
    const autoHopLabel = el('label'); autoHopLabel.append(autoHop, doc.createTextNode('Allow autonomous link navigation')); options.append(autoHopLabel);
    const canvasAnalytics = el('input', { id: 'alive-analytics-option', type: 'checkbox' });
    canvasAnalytics.addEventListener('change', () => {
      analytics = canvasAnalytics.checked;
      doc.dispatchEvent(new CustomEvent('alive-workspace-analytics', { detail: { enabled: analytics } }));
      root.syncAliveGuestState?.();
    });
    const analyticsLabel = el('label'); analyticsLabel.append(canvasAnalytics, doc.createTextNode('Show analytics over the creature canvas')); options.append(analyticsLabel);
    panel.append(options, el('div', { id: 'alive-capability-list' }), el('div', { id: 'alive-control-feedback', role: 'status' }));
    workspace.append(panel);
    const lab = doc.getElementById('alife-left-omni-dock');
    if (lab) {
      const evidence = el('details', { id: 'alive-coordinator-log' });
      evidence.open = true;
      evidence.append(el('summary', {}, 'Overdrive · outcomes & evidence'));
      const restoreTools = el('div', { class: 'alive-checkpoint-tools' });
      restoreTools.append(button('Restore latest checkpoint', { id: 'alive-restore-checkpoint', 'aria-describedby': 'alive-restore-hint' }, restoreCheckpoint));
      restoreTools.append(el('p', { id: 'alive-restore-hint' }));
      restoreTools.append(el('p', { id: 'alive-restore-result', role: 'status' }));
      evidence.append(restoreTools);
      evidence.append(el('pre', { id: 'alive-coordinator-evidence', 'aria-label': 'Bounded overdrive outcomes and event log' }, 'Waiting for runtime status…'));
      lab.prepend(evidence);
    }
    actions = collectActions();
    renderActions();
    updateStatus();
    // Existing runtime state drives the button; no separate timer or animation loop.
    const legacyState = doc.getElementById('alien-kpi-state');
    if (legacyState) new MutationObserver(() => updateStatus()).observe(legacyState, { childList: true, subtree: true, characterData: true });
    doc.addEventListener('keydown', event => {
      if (event.altKey && event.shiftKey && event.code === 'KeyC') { event.preventDefault(); openPanel('controls'); }
      else if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); closePanels(true); }
    });
    doc.addEventListener('alive-overdrive-status', event => updateStatus(event.detail));
  }
  root.aliveWorkspace = Object.freeze({
    showCanvasAnalytics: () => analytics,
    updateStatus,
    openPanel,
    closePanels,
    getCapabilities: () => actions.map(({ key, label, category, capabilityId }) => ({ key, label, category, capabilityId }))
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(typeof window === 'object' ? window : globalThis);
