/* Shared creature research and source-linked writing. Browser observations are
 * data, never instructions. This module neither opens tabs nor types into pages. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveCognitiveFaculties = api;
  if (root?.document && typeof humunculusRuntime !== 'undefined') api.install(root, humunculusRuntime);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ROLES = Object.freeze([
    { id: 'mechanism', label: 'Architecture and mechanisms', terms: /architect|mechanis|model|design|theor|structure/i, suffix: 'architecture mechanisms primary sources' },
    { id: 'implementation', label: 'Code and implementation', terms: /code|implement|github|source|algorithm|software/i, suffix: 'source code implementation' },
    { id: 'verification', label: 'Evidence and counterexamples', terms: /evidence|test|bench|limit|fail|compar|result/i, suffix: 'benchmarks limitations counterexamples' }
  ]);
  const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  const timestamp = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
  function url(value) {
    try { if (typeof value !== 'string' || value.length > 2048) return null; const u = new URL(value); if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null; u.hash = ''; return u.href.length <= 2048 ? u.href : null; } catch (_) { return null; }
  }
  function create({ clock = Date.now, plan, enqueue = () => ({ added: 0, status: 'unavailable', reason: 'Research frontier is not connected' }), load, persist, commit, active = () => true } = {}) {
    const pages = new Map(), events = [], notes = [];
    let revision = 0, lastSwarmRevision = -1, lastWriteRevision = -1, lastWriteAnalysisId = null, analysisSequence = 0, busy = false, generation = 0;
    let restoration = { status: 'not_requested', entries: 0 };
    let swarm = { status: 'idle', tasks: [], sources: [], linksQueued: 0 }, writing = { status: 'idle', text: '', sourceCount: 0, sourceUrls: [] };
    const event = (type, detail) => { events.push({ at: clock(), type, detail: clean(detail, 400) }); if (events.length > 80) events.shift(); };
    const outcome = (status, reason, evidence = {}) => ({ status, reason, evidence });
    function observe(raw) {
      const sourceUrl = url(raw?.url);
      if (!sourceUrl) return outcome('blocked', 'Observation requires an HTTP(S) source');
      const record = { url: sourceUrl, title: clean(raw.title, 180), excerpt: clean(raw.researchExcerpt ?? raw.excerpt, 4000),
        observedAt: timestamp(raw.observedAt) ? raw.observedAt : clock(), pane: raw.pane === 'secondary' ? 'secondary' : 'primary',
        doors: (Array.isArray(raw.doors) ? raw.doors : []).slice(0, 64).map(d => ({ url: url(d.href || d.url), title: clean(d.text || d.title, 160) })).filter(d => d.url) };
      const old = pages.get(sourceUrl);
      const changed = !old || old.title !== record.title || old.excerpt !== record.excerpt || JSON.stringify(old.doors) !== JSON.stringify(record.doors);
      pages.delete(sourceUrl); pages.set(sourceUrl, record);
      while (pages.size > 24) pages.delete(pages.keys().next().value);
      if (changed) { revision++; event('observation', record.title || sourceUrl); }
      return outcome('observed', '', { revision, changed, sourceUrl });
    }
    async function runSwarm({ signal, topic } = {}) {
      if (busy) return outcome('blocked', 'A shared research operation is still settling');
      if (signal?.aborted || !active()) return outcome('blocked', 'Creature cognition is paused');
      if (!pages.size) return outcome('blocked', 'Waiting for acknowledged page observations');
      if (lastSwarmRevision === revision && !topic) return outcome('observed', 'No changed source observations', { reused: true, revision, linksQueued: 0 });
      busy = true;
      const token = generation, capturedRevision = revision, sources = [...pages.values()].slice(-6).map(p => ({ ...p, doors: p.doors.map(d => ({ ...d })) }));
      const current = () => token === generation && !signal?.aborted && active();
      const latest = sources.at(-1), subject = clean(topic || latest.title || new URL(latest.url).hostname, 120);
      swarm = { status: 'running', topic: subject, analysisId: ++analysisSequence, startedAt: clock(), tasks: [], sources: sources.map(({ doors, ...p }) => p), linksQueued: 0, reason: '' };
      event('swarm-started', subject);
      try {
        // Three distinct bounded roles inspect real source features. Their
        // execution is local; one optional language-model call augments them.
        const tasks = ROLES.map(role => {
          const matches = sources.flatMap(p => p.doors.filter(d => role.terms.test(d.title)).map(d => ({ ...d, discoveredFrom: p.url })));
          const evidenceSources = sources.filter(p => role.terms.test(p.title + ' ' + p.excerpt));
          return { id: role.id, label: role.label, status: 'completed', sourceCount: evidenceSources.length,
            query: `${subject} ${role.suffix}`.slice(0, 160), result: `${matches.length} matching observed links; ${evidenceSources.length} matching source excerpts`,
            candidates: matches.slice(0, 4), implementation: 'bounded lexical role analysis over acknowledged observations' };
        });
        swarm.tasks = tasks;
        let proposal = { status: 'unavailable', reason: 'No configured inference adapter' };
        if (typeof plan === 'function') {
          try { proposal = await plan({ observation: { url: latest.url, title: subject, excerpt: latest.excerpt, observedAt: latest.observedAt },
            candidates: sources.flatMap(p => p.doors).slice(0, 24).map(d => ({ ...d })), recent: sources.map(({ doors, ...p }) => ({ ...p })), focus: 'swarm' }, signal); }
          catch (error) { proposal = { status: 'unavailable', reason: clean(error.message, 240) }; }
        }
        if (!current()) { swarm.status = 'blocked'; swarm.reason = 'Discarded cancelled research work'; return outcome('blocked', swarm.reason); }
        const generated = proposal?.status === 'completed' && Array.isArray(proposal.proposal?.queries)
          ? proposal.proposal.queries.filter(q => typeof q === 'string' && q.trim().length >= 4 && !/https?:|javascript:|<script/i.test(q)).map(q => clean(q, 160)).slice(0, 6) : [];
        const queries = [...new Set([...tasks.map(t => t.query), ...generated])].slice(0, 9);
        const candidates = tasks.flatMap(t => t.candidates);
        const result = enqueue({ queries: queries.slice(), candidates: candidates.map(d => ({ ...d })), discoveredFrom: latest.url, source: 'ghost-swarm' }) || {};
        if (result && typeof result.then === 'function') throw new Error('Research frontier enqueue must be synchronous');
        const frontierStatus = result.status === 'unavailable' ? 'unavailable' : 'completed';
        swarm = { ...swarm, status: 'completed', completedAt: clock(), linksQueued: Number.isFinite(result.added) ? Math.max(0, Math.min(candidates.length + queries.length, Math.floor(result.added))) : 0, queries,
          frontierStatus, model: generated.length ? clean(proposal.model, 240) : null,
          inferenceStatus: generated.length ? 'completed' : proposal?.status === 'completed' ? 'unavailable' : proposal?.status || 'unavailable',
          hypothesis: generated.length ? clean(proposal.proposal.hypothesis, 400) : '',
          reason: generated.length ? '' : clean(proposal?.reason || 'Used local observed-source role analysis', 240), revision: capturedRevision };
        commit?.('swarm', JSON.parse(JSON.stringify(swarm)));
        lastSwarmRevision = capturedRevision;
        event('swarm-completed', `${tasks.length} roles; ${swarm.linksQueued} frontier candidates added; inference ${swarm.inferenceStatus}`);
        return outcome(frontierStatus === 'completed' ? 'completed' : 'observed', frontierStatus === 'completed' ? '' : clean(result.reason || 'Research frontier is unavailable', 240), { tasks: tasks.map(({ candidates, ...t }) => t), linksQueued: swarm.linksQueued, frontierStatus,
          sourceCount: sources.length, inferenceStatus: swarm.inferenceStatus, model: swarm.model, revision: capturedRevision,
          scope: 'Shared observed-source analysis and navigation proposals; no independent foundation-model replicas' });
      } catch (error) { swarm.status = 'error'; swarm.reason = clean(error.message, 240); event('swarm-error', swarm.reason); return outcome('error', swarm.reason); }
      finally { busy = false; }
    }
    async function runWrite({ signal } = {}) {
      if (signal?.aborted || !active()) return outcome('blocked', 'Creature cognition is paused');
      if (swarm.status !== 'completed' || !swarm.sources.length) return outcome('blocked', 'Waiting for completed source analysis');
      if (lastWriteAnalysisId === swarm.analysisId) return outcome('observed', 'Notebook already includes this analysis', { reused: true, revision: lastWriteRevision, analysisId: lastWriteAnalysisId });
      const captured = JSON.parse(JSON.stringify(swarm)), token = generation;
      const lines = [`Research notebook: ${captured.topic}`, `Source revision ${captured.revision}; ${captured.sources.length} observed pages.`, '', 'Observed source excerpts:'];
      captured.sources.forEach((p, i) => lines.push(`[${i + 1}] ${p.title || p.url}\n${p.url}\nObserved ${new Date(p.observedAt).toISOString()}\n${p.excerpt.slice(0, 1000) || '(No readable excerpt received)'}`));
      lines.push('', 'Delegated analysis:', ...captured.tasks.map(t => `${t.label}: ${t.result}`));
      if (captured.hypothesis) lines.push('', `Unverified model hypothesis (${captured.model}): ${captured.hypothesis}`);
      lines.push('', 'Questions queued for exploration:', ...captured.queries.map(q => `- ${q}`));
      const draft = { status: 'completed', text: lines.join('\n').slice(0, 12000), sourceCount: captured.sources.length,
        sourceUrls: captured.sources.map(p => p.url), completedAt: clock(), revision: captured.revision, analysisId: captured.analysisId,
        implementation: 'extractive source-linked notebook compiler; optional model hypothesis explicitly labeled' };
      // Local persistence is synchronous: no stale async save can land after Pause.
      try {
        if (token !== generation || signal?.aborted || !active()) return outcome('blocked', 'Writing cancelled');
        const nextNotes = [...notes.filter(note => note.analysisId !== draft.analysisId), draft].slice(-12);
        const saved = persist?.(JSON.stringify({ version: 1, notes: nextNotes }));
        if (saved && typeof saved.then === 'function') throw new Error('Notebook storage must be synchronous');
        if (persist && saved !== true) throw new Error('Notebook persistence readback was not acknowledged');
        notes.splice(0, notes.length, ...nextNotes); writing = draft;
        commit?.('writing', JSON.parse(JSON.stringify(draft)));
        lastWriteRevision = captured.revision; lastWriteAnalysisId = captured.analysisId;
        event('writing-completed', `${draft.text.length} characters; ${draft.sourceCount} source receipts`);
        return outcome('completed', '', { characters: draft.text.length, sourceCount: draft.sourceCount, sourceUrls: draft.sourceUrls,
          persisted: Boolean(persist), revision: draft.revision, analysisId: draft.analysisId, scope: draft.implementation });
      } catch (error) { writing = { ...draft, status: 'error', reason: clean(error.message, 240) }; event('writing-error', writing.reason); return outcome('error', writing.reason); }
    }
    if (typeof load === 'function') {
      try {
        const encoded = load();
        if (encoded == null) restoration = { status: 'empty', entries: 0 };
        else {
          if (typeof encoded !== 'string' || encoded.length > 512000) throw new Error('Notebook storage exceeds its bounded schema');
          const record = JSON.parse(encoded);
          if (record?.version !== 1 || !Array.isArray(record.notes) || record.notes.length > 12) throw new Error('Unsupported notebook schema');
          const restored = record.notes.map((note, index) => {
            if (note?.status !== 'completed' || typeof note.text !== 'string' || note.text.length > 12000 ||
                !Array.isArray(note.sourceUrls) || note.sourceUrls.length > 6 || note.sourceUrls.some(source => !url(source)) ||
                note.sourceCount !== note.sourceUrls.length || !timestamp(note.completedAt) ||
                !Number.isSafeInteger(note.revision) || note.revision < 0 ||
                note.analysisId !== undefined && (!Number.isSafeInteger(note.analysisId) || note.analysisId < 1)) throw new Error('Invalid persisted notebook entry');
            return { status: 'completed', text: note.text, sourceUrls: note.sourceUrls.map(url), sourceCount: note.sourceCount,
              completedAt: note.completedAt, revision: note.revision, analysisId: note.analysisId ?? index + 1,
              implementation: clean(note.implementation, 240) };
          });
          if (new Set(restored.map(note => note.analysisId)).size !== restored.length) throw new Error('Duplicate persisted notebook analysis IDs');
          notes.push(...restored);
          analysisSequence = Math.max(0, ...restored.map(note => note.analysisId));
          if (notes.length) { writing = notes.at(-1); lastWriteAnalysisId = writing.analysisId; lastWriteRevision = writing.revision; }
          restoration = { status: 'restored', entries: notes.length };
        }
      } catch (error) { restoration = { status: 'error', entries: 0, reason: clean(error.message, 240) }; event('restore-error', restoration.reason); }
    }
    return Object.freeze({ observe, runSwarm, runWrite,
      cancel() { generation++; event('cancelled', 'Uncommitted cognition revoked'); },
      snapshot() { return JSON.parse(JSON.stringify({ revision, observedPages: pages.size, swarm, writing,
        memory: { entries: notes.length, characters: notes.reduce((n, x) => n + x.text.length, 0), restoration }, events,
        scope: 'One shared cognitive controller for the host and offspring; source-linked evidence, not independent per-body foundation models' })); }
    });
  }
  function install(root, h) {
    if (root.aliveCognitiveFaculties) return root.aliveCognitiveFaculties;
    const api = create({
      active: () => !root.__alivePersistenceClosing && !root.__aliveCheckpointRestore && !root.document.hidden,
      plan: payload => root.gigachad.invoke('alive-research-plan', payload),
      enqueue({ queries, candidates, discoveredFrom }) {
        const research = root.aliveResearch;
        if (!research) return { added: 0, status: 'unavailable', reason: 'Shared research frontier is unavailable' };
        let added = research.enqueue(candidates.map(d => ({ ...d, source: 'observed-link' }))).added;
        const engines = typeof POLYMATH_SEARCH_ENGINES === 'undefined' ? [] : POLYMATH_SEARCH_ENGINES;
        queries.forEach((query, i) => { const engine = engines[i % engines.length]; if (engine) added += research.enqueue([
          { url: engine.buildUrl(query), title: query, query, source: 'search', discoveredFrom }]).added; });
        return { added, status: 'completed' };
      },
      load() { return root.localStorage.getItem('gigachad_creature_notebook_v1'); },
      persist(encoded) { const key = 'gigachad_creature_notebook_v1'; root.localStorage.setItem(key, encoded); return root.localStorage.getItem(key) === encoded; },
      commit(kind, value) {
        share();
        if (kind === 'swarm') {
          h.workingState.researchGoal = value.topic;
          h.workingState.researchQueries = value.queries.slice(0, 9);
          h.workingState.researchSourceUrls = value.sources.map(p => p.url);
        } else {
          h.semanticMemory.creatureNotebook = { text: value.text, sourceUrls: value.sourceUrls, revision: value.revision,
            provenance: value.implementation, completedAt: value.completedAt };
          h.savePersistentGenome?.();
        }
      }
    });
    function share() {
      h.aliveCognitiveFaculties = api;
      for (const child of h.offspringColony || []) {
        // Non-enumerable runtime service: checkpoint/genome traversal never
        // mistakes it for independently trained offspring parameter state.
        Object.defineProperty(child, 'cognitiveFaculties', { value: api, configurable: true, enumerable: false });
      }
    }
    root.aliveCognitiveFaculties = api; share();
    const restored = api.snapshot().writing;
    if (restored.status === 'completed' && h.semanticMemory && (!timestamp(h.semanticMemory.creatureNotebook?.completedAt) || h.semanticMemory.creatureNotebook.completedAt < restored.completedAt)) {
      h.semanticMemory.creatureNotebook = { text: restored.text, sourceUrls: restored.sourceUrls, revision: restored.revision,
        provenance: restored.implementation, completedAt: restored.completedAt };
    }
    root.runAliveGhostSwarm = options => {
      share();
      const topic = clean(root.aliveRequestedResearchTopic, 120);
      root.aliveRequestedResearchTopic = null;
      return api.runSwarm({ ...options, ...(topic ? { topic } : {}) });
    };
    root.runAliveGhostWrite = options => { share(); return api.runWrite(options); };
    root.addEventListener('alive-runtime-event', e => { if (['stopped', 'suspended'].includes(e.detail?.type)) api.cancel(); });
    return api;
  }
  return Object.freeze({ create, install, ROLES });
});
