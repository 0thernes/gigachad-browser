/* Synaptic Fabric: a plastic coupling graph between ALIVE capabilities.
 *
 * Every faculty (brain observers, body actions, ghost faculties, diagnostics)
 * is a node. When a node produces NEW evidence, its outgoing edges pull the
 * faculties it feeds earlier in the shared schedule ("excitation"). When an
 * excited faculty then produces new evidence, that edge is potentiated; when
 * it blocks or fails, the edge is depressed (bounded Hebbian credit). Each
 * node also keeps a utility EWMA (novelty vs. repetition vs. failure) that
 * scales its own cadence within declared bounds.
 *
 * Scope: this is scheduling plasticity. It never invokes an adapter, bypasses
 * readiness checks, execution lanes, Pause, error backoff or manual-only status,
 * and it does not claim causal attribution between the named scientific models.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveSynapticFabric = api;
  if (root && root.document && root.addEventListener && !root.aliveFabric) api.installBrowser(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const STORAGE_KEY = 'gigachad_alive_fabric_v1';
  const DEFAULTS = Object.freeze({
    refractoryMs: 400, refractoryFraction: 0.2, creditWindowFactor: 2,
    learningRate: 0.05, minWeight: 0.02, maxWeight: 0.95, outgoingBudget: 1.5,
    utilityRate: 0.2, cadenceGain: 1, minCadence: 0.5, maxCadence: 2,
    spanLimit: 360, eventLimit: 120
  });
  // Faculties whose pacing is owned by an external policy (navigation dwell,
  // storage cost, language-model cost, long diagnostics). They may excite
  // others but are never pulled earlier or sped up by the fabric.
  const PACED = Object.freeze(['checkpoint', 'acceptance-gates', 'flywire', 'learning-five-seed',
    'research-plan', 'deep-dark-dive', 'epoch-handoff', 'portal-jump']);
  const TERMINAL = Object.freeze(['completed', 'observed', 'blocked', 'unavailable', 'error', 'timeout']);
  const VOLATILE = new Set(['tick', 'at', 'ageMs', 'checkedAt', 'sampledAt', 'durationMs', 'elapsedMs', 'timestamp', 'now', 'observedAt']);
  const COLONY_LENSES = Object.freeze([
    Object.freeze({ id: 'mechanism', label: 'Architecture & Mechanisms', nodes: Object.freeze(['reasoning', 'ghost-swarm', 'macro', 'millennium']), gates: Object.freeze([0, 1, 14, 21]) }),
    Object.freeze({ id: 'implementation', label: 'Code & Implementation', nodes: Object.freeze(['dom-body', 'ghost-write', 'meso', 'connectome']), gates: Object.freeze([2, 5, 16, 22]) }),
    Object.freeze({ id: 'verification', label: 'Evidence & Counterexamples', nodes: Object.freeze(['learning-five-seed', 'acceptance-gates', 'metacognition', 'brains-precision']), gates: Object.freeze([3, 7, 17, 23]) }),
    Object.freeze({ id: 'topology', label: 'Connectome & Memory Topology', nodes: Object.freeze(['flywire', 'memory', 'dream', 'micro']), gates: Object.freeze([6, 9, 18, 22]) }),
    Object.freeze({ id: 'frontier', label: 'Frontier & Anomaly Foraging', nodes: Object.freeze(['research-plan', 'portal-jump', 'deep-dark-dive', 'grover-collapse']), gates: Object.freeze([4, 11, 19, 21]) })
  ]);

  // [from, to, initial weight]. Data-flow motivated: a fresh page observation
  // feeds cognition; cognition feeds ghost faculties; learning feeds replay;
  // physiology feeds body; the macro → meso → micro hierarchy cascades.
  const DEFAULT_EDGES = Object.freeze([
    ['dom-body', 'reasoning', 0.5], ['dom-body', 'macro', 0.4], ['dom-body', 'meso', 0.4],
    ['dom-body', 'connectome', 0.4], ['dom-body', 'brains-precision', 0.4], ['dom-body', 'memory', 0.5],
    ['dom-body', 'metacognition', 0.35], ['dom-body', 'millennium', 0.3], ['dom-body', 'grover-collapse', 0.45],
    ['dom-body', 'ghost-swarm', 0.35], ['dom-body', 'ghost-write', 0.3], ['dom-body', 'decursive', 0.15],
    ['dom-body', 'body-curriculum', 0.2],
    ['grover-collapse', 'ghost-swarm', 0.2], ['grover-collapse', 'reasoning', 0.2],
    ['portal-jump', 'dom-body', 0.6], ['portal-jump', 'ghost-write', 0.25], ['portal-jump', 'memory', 0.25],
    ['research-plan', 'ghost-swarm', 0.4], ['research-plan', 'reasoning', 0.2],
    ['ghost-swarm', 'reasoning', 0.25], ['ghost-swarm', 'memory', 0.2], ['ghost-swarm', 'ghost-write', 0.2],
    ['ghost-write', 'memory', 0.4], ['ghost-write', 'metacognition', 0.25], ['ghost-write', 'reasoning', 0.2],
    ['reasoning', 'ghost-write', 0.3], ['reasoning', 'ghost-swarm', 0.3], ['reasoning', 'metacognition', 0.3],
    ['reasoning', 'millennium', 0.2], ['reasoning', 'neo', 0.1],
    ['memory', 'reasoning', 0.25], ['memory', 'dream', 0.15],
    ['metacognition', 'millennium', 0.3], ['metacognition', 'reasoning', 0.2],
    ['train-policy', 'dream', 0.35], ['train-policy', 'micro', 0.2], ['train-policy', 'meso', 0.2], ['train-policy', 'connectome', 0.2],
    ['dream', 'train-policy', 0.2], ['dream', 'meso', 0.3], ['dream', 'connectome', 0.3], ['dream', 'memory', 0.3],
    ['feed', 'procreate', 0.3], ['feed', 'body-curriculum', 0.35],
    ['procreate', 'formation', 0.4], ['procreate', 'morph', 0.25], ['procreate', 'ghost-swarm', 0.35], ['procreate', 'ghost-write', 0.25],
    ['morph', 'body-curriculum', 0.4], ['morph', 'formation', 0.25], ['morph', 'dom-body', 0.2], ['morph', 'warp-dom', 0.12],
    ['formation', 'body-curriculum', 0.15],
    ['soul-surge', 'millennium', 0.3], ['soul-surge', 'macro', 0.3], ['soul-surge', 'metacognition', 0.2], ['soul-surge', 'zalgo', 0.12],
    ['decursive', 'millennium', 0.35], ['decursive', 'connectome', 0.25],
    ['zalgo', 'dom-body', 0.3], ['zalgo', 'morph', 0.1],
    ['neo', 'dom-body', 0.35], ['warp-dom', 'dom-body', 0.3],
    ['deity', 'omega', 0.3], ['deity', 'macro', 0.15],
    ['omega', 'deity', 0.2], ['omega', 'brains-precision', 0.3], ['omega', 'micro', 0.2],
    ['deep-dark-dive', 'onion', 0.8], ['onion', 'connectome', 0.15],
    ['epoch-handoff', 'dom-body', 0.5], ['epoch-handoff', 'memory', 0.2],
    ['checkpoint', 'memory', 0.15], ['checkpoint', 'connectome', 0.1],
    ['brains-precision', 'macro', 0.35], ['brains-precision', 'micro', 0.3],
    ['macro', 'meso', 0.35], ['meso', 'micro', 0.3], ['meso', 'connectome', 0.25], ['micro', 'brains-precision', 0.15],
    ['connectome', 'reasoning', 0.25], ['connectome', 'meso', 0.15],
    ['millennium', 'metacognition', 0.2], ['millennium', 'soul-surge', 0.15],
    ['body-curriculum', 'train-policy', 0.3], ['body-curriculum', 'morph', 0.15], ['body-curriculum', 'feed', 0.2],
    ['flywire', 'connectome', 0.3], ['acceptance-gates', 'train-policy', 0.1], ['learning-five-seed', 'train-policy', 0.2]
  ]);

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const finite = value => typeof value === 'number' && Number.isFinite(value);

  function evidenceDigest(value) {
    // FNV-1a over a canonical walk that ignores clock-like keys and quantizes
    // numbers to two significant digits, so a timestamp or float drift is not
    // mistaken for new evidence (observed in Electron: unquantized digests
    // made every continuously-evolving observer "novel" and saturated weights).
    const parts = [];
    (function walk(item, depth) {
      if (depth > 4) return;
      if (typeof item === 'number') { parts.push(Number.isFinite(item) ? String(Number(item.toPrecision(2))) : String(item)); return; }
      if (item === null || typeof item !== 'object') { parts.push(String(item)); return; }
      if (Array.isArray(item)) { parts.push('['); for (const entry of item.slice(0, 32)) walk(entry, depth + 1); parts.push(']'); return; }
      for (const key of Object.keys(item).sort().slice(0, 48)) {
        if (VOLATILE.has(key)) continue;
        parts.push(key + ':'); walk(item[key], depth + 1);
      }
    })(value, 0);
    const text = parts.join('|');
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; }
    return hash >>> 0;
  }

  function outcomeSignal(type, novel) {
    if (type === 'completed' || type === 'observed') return novel ? 1 : -0.35;
    if (type === 'blocked' || type === 'unavailable') return -0.2;
    return -0.8; // error, timeout
  }

  class SynapticFabric {
    constructor({ controller, edges = DEFAULT_EDGES, options = {}, clock } = {}) {
      if (!controller || !(controller.jobs instanceof Map)) throw new TypeError('Synaptic Fabric requires a runtime controller with a jobs map');
      this.controller = controller;
      this.options = Object.freeze({ ...DEFAULTS, ...options });
      this.clock = clock || (() => (typeof controller.clock === 'function' ? controller.clock() : Date.now()));
      this.paced = new Set(options.paced || PACED);
      this.nodes = new Map();
      this.edges = [];
      this.outgoing = new Map();
      const seen = new Set();
      for (const [from, to, weight] of edges) {
        const key = from + '>' + to;
        if (from === to || seen.has(key) || !finite(weight)) continue;
        seen.add(key);
        const edge = { from, to, key, initial: clamp(weight, this.options.minWeight, this.options.maxWeight),
          weight: clamp(weight, this.options.minWeight, this.options.maxWeight),
          excitations: 0, potentiations: 0, depressions: 0, lastExcitedAt: null, lastDelta: 0 };
        this.edges.push(edge);
        if (!this.outgoing.has(from)) this.outgoing.set(from, []);
        this.outgoing.get(from).push(edge);
      }
      this.edgeByKey = new Map(this.edges.map(edge => [edge.key, edge]));
      this.ablatedNodes = new Set();
      this.ablatedEdges = new Set();
      this.spans = [];
      this.events = [];
      this.totals = { events: 0, excitations: 0, suppressed: 0, potentiations: 0, depressions: 0, cadenceAdjustments: 0, novel: 0, repeated: 0, foreign: 0, scalings: 0, ablated: 0 };
      this.rates = [];
      this.receivedEvents = new WeakSet();
    }

    setAblation(target, ablated = true) {
      if (typeof target !== 'string' || !target) return false;
      const enable = Boolean(ablated);
      if (target.includes('>')) {
        if (!this.edgeByKey.has(target)) return false;
        if (enable) this.ablatedEdges.add(target); else this.ablatedEdges.delete(target);
        this._log(enable ? 'ablate-edge' : 'restore-edge', { edge: target });
        return true;
      }
      if (!this.controller.jobs.has(target)) return false;
      if (enable) this.ablatedNodes.add(target); else this.ablatedNodes.delete(target);
      this._log(enable ? 'ablate-node' : 'restore-node', { node: target });
      return true;
    }

    clearAblations() {
      this.ablatedNodes.clear();
      this.ablatedEdges.clear();
      return true;
    }

    creatureLenses(colony = [], coupling = null) {
      const members = [{ name: 'Primary Homunculus', stage: 'HOST' }].concat(
        (Array.isArray(colony) ? colony.slice(0, 4) : []).map((c, idx) => ({
          name: c && c.name ? String(c.name) : `Offspring #${idx + 1}`,
          stage: c && c.stage ? String(c.stage) : 'COLONY'
        }))
      );
      const gates = Array.isArray(coupling?.gateValues) ? coupling.gateValues : null;
      return members.map((member, index) => {
        const lens = COLONY_LENSES[index % COLONY_LENSES.length];
        const presentNodes = lens.nodes.filter(id => this.controller.jobs.has(id));
        const nodeUtility = presentNodes.length
          ? presentNodes.reduce((sum, id) => sum + (1 + this.node(id).utility) * 0.5, 0) / presentNodes.length
          : 0.5;
        const validGates = gates ? lens.gates.filter(g => finite(gates[g])) : [];
        const gateActivation = validGates.length
          ? validGates.reduce((sum, g) => sum + clamp(gates[g], 0, 1), 0) / validGates.length
          : 0.5;
        const activation = clamp(nodeUtility * 0.6 + gateActivation * 0.4, 0, 1);
        return {
          index,
          name: member.name,
          stage: member.stage,
          lensId: lens.id,
          lensLabel: lens.label,
          nodes: lens.nodes.slice(),
          gates: lens.gates.slice(),
          nodeUtility,
          gateActivation,
          activation
        };
      });
    }

    node(id) {
      let node = this.nodes.get(id);
      if (!node) {
        node = { id, utility: 0, digest: null, novel: 0, repeated: 0, failures: 0, excitedCount: 0,
          lastExcitedBy: null, lastExcitedAt: null, pending: new Map(), cadence: 1, lastSignal: 0 };
        this.nodes.set(id, node);
      }
      return node;
    }

    cadenceFactor(id) {
      if (this.paced.has(id) || this.ablatedNodes.has(id)) return 1;
      const { cadenceGain, minCadence, maxCadence } = this.options;
      return clamp(Math.pow(2, -cadenceGain * this.node(id).utility), minCadence, maxCadence);
    }

    _log(kind, detail) {
      this.events.push({ at: this.clock(), kind, ...detail });
      if (this.events.length > this.options.eventLimit) this.events.splice(0, this.events.length - this.options.eventLimit);
    }

    _closeSpan(id, runId, generation, at, status) {
      for (let i = this.spans.length - 1; i >= 0; i--) {
        const span = this.spans[i];
        if (span.id === id && span.runId === runId && span.generation === generation && span.end === null) { span.end = at; span.status = status; return true; }
      }
      return false;
    }

    _pushSpan(span) {
      this.spans.push(span);
      if (this.spans.length > this.options.spanLimit) this.spans.splice(0, this.spans.length - this.options.spanLimit);
    }

    handleEvent(event) {
      if (!event || typeof event !== 'object') return;
      // Marker fields aid diagnostics but are not ownership proof: even a clone
      // carrying the exact source/run/generation cannot settle this controller.
      if (event.source !== 'alive-overdrive' || this.controller.ownsEvent?.(event) !== true ||
          event.generation !== this.controller.generation || this.receivedEvents.has(event)) {
        this.totals.foreign++; return;
      }
      this.receivedEvents.add(event);
      const type = event.type, id = event.id;
      const at = finite(event.at) ? event.at : this.clock();
      this.totals.events++;
      if (type === 'started' || type === 'stopped') {
        for (const node of this.nodes.values()) node.pending.clear();
        if (type === 'stopped') for (const span of this.spans) if (span.end === null) { span.end = at; span.status = 'stopped'; }
        return;
      }
      if (!id || !this.controller.jobs.has(id)) return;
      const job = this.controller.jobs.get(id);
      if (type === 'running') {
        if (!Number.isSafeInteger(event.runId) || event.runId < 1) { this.totals.foreign++; return; }
        this._pushSpan({ id, runId: event.runId, generation: event.generation, group: job.group || null, start: at, end: null, status: 'running' });
        return;
      }
      if (!TERMINAL.includes(type)) return;
      const success = type === 'completed' || type === 'observed';
      if (event.runId !== null) {
        if (!Number.isSafeInteger(event.runId) || event.runId < 1 || !this._closeSpan(id, event.runId, event.generation, at, type)) {
          this.totals.foreign++; return;
        }
      } else {
        // Readiness/admission failures are scheduler receipts without an
        // execution. They never consume an already running operation's span.
        if (!['blocked', 'unavailable'].includes(type) || this.spans.some(span => span.id === id && span.end === null)) {
          this.totals.foreign++; return;
        }
        this._pushSpan({ id, runId: null, generation: event.generation, group: job.group || null, start: at, end: at, status: type });
      }
      const node = this.node(id);
      let novel = false;
      if (success) {
        const digest = evidenceDigest(event.evidence === undefined ? null : event.evidence);
        novel = digest !== node.digest;
        node.digest = digest;
        if (novel) { node.novel++; this.totals.novel++; } else { node.repeated++; this.totals.repeated++; }
      } else if (type === 'error' || type === 'timeout') node.failures++;
      const signal = outcomeSignal(type, novel);
      node.lastSignal = signal;
      node.utility = clamp((1 - this.options.utilityRate) * node.utility + this.options.utilityRate * signal, -1, 1);
      this._credit(id, node, signal, at, job);
      if (success) {
        this._adaptCadence(id, job, at);
        if (novel) this._excite(id, at);
      }
    }

    _credit(id, node, signal, at, job) {
      if (!node.pending.size) return;
      const window = this.options.creditWindowFactor * Math.max(100, (job.intervalMs || 1000) * this.cadenceFactor(id));
      const { learningRate, minWeight, maxWeight } = this.options;
      for (const [source, excitedAt] of node.pending) {
        const edge = this.edgeByKey.get(source + '>' + id);
        if (!edge || at - excitedAt > window) continue;
        const room = signal > 0 ? maxWeight - edge.weight : edge.weight - minWeight;
        const delta = learningRate * signal * room;
        edge.weight = clamp(edge.weight + delta, minWeight, maxWeight);
        edge.lastDelta = delta;
        if (delta > 0) { edge.potentiations++; this.totals.potentiations++; this._scale(source); }
        else if (delta < 0) { edge.depressions++; this.totals.depressions++; }
        if (Math.abs(delta) > 1e-6) this._log(delta > 0 ? 'potentiate' : 'depress', { from: source, to: id, weight: edge.weight, delta });
      }
      node.pending.clear();
    }

    _scale(source) {
      // Synaptic scaling: a source's total outgoing weight is bounded by a
      // multiple of its declared total, so potentiating one synapse makes its
      // siblings compete instead of every edge saturating at maxWeight.
      const edges = this.outgoing.get(source) || [];
      const declared = edges.reduce((sum, edge) => sum + edge.initial, 0);
      const budget = Math.max(this.options.minWeight * edges.length, declared * this.options.outgoingBudget);
      const total = edges.reduce((sum, edge) => sum + edge.weight, 0);
      if (total <= budget) return;
      const factor = budget / total;
      for (const edge of edges) edge.weight = clamp(edge.weight * factor, this.options.minWeight, this.options.maxWeight);
      this.totals.scalings = (this.totals.scalings || 0) + 1;
    }

    _adaptCadence(id, job, at) {
      if (this.ablatedNodes.has(id)) { this.node(id).cadence = 1; return; }
      const factor = this.cadenceFactor(id);
      this.node(id).cadence = factor;
      if (factor === 1 || !finite(job.nextDueAt) || job.nextDueAt <= at) return;
      // The controller has just scheduled nextDueAt (including its own slow
      // adapter factor); scale only the remaining delay.
      job.nextDueAt = at + (job.nextDueAt - at) * factor;
      this.totals.cadenceAdjustments++;
    }

    _excite(source, at) {
      if (this.ablatedNodes.has(source)) { this.totals.ablated++; return; }
      const c = this.controller;
      for (const edge of this.outgoing.get(source) || []) {
        if (this.ablatedEdges.has(edge.key) || this.ablatedNodes.has(edge.to)) { this.totals.ablated++; continue; }
        const target = c.jobs.get(edge.to);
        if (!target || this.paced.has(edge.to)) continue;
        const eligible = c.running && !c.suspended && typeof target.adapter?.run === 'function' && !target.manualOnly &&
          !(c.inFlight instanceof Map && c.inFlight.has(edge.to)) && finite(target.nextDueAt) && !(target.consecutiveErrors > 0);
        if (!eligible) { this.totals.suppressed++; continue; }
        const effective = (target.intervalMs || 1000) * this.cadenceFactor(edge.to);
        const refractory = Math.max(this.options.refractoryMs, this.options.refractoryFraction * effective);
        const earliest = Math.max(at, finite(target.lastStartedAt) ? target.lastStartedAt + refractory : at);
        const candidate = Math.max(earliest, target.nextDueAt - edge.weight * effective);
        if (candidate >= target.nextDueAt - 1) { this.totals.suppressed++; continue; }
        const pulledMs = target.nextDueAt - candidate;
        target.nextDueAt = candidate;
        edge.excitations++; edge.lastExcitedAt = at;
        this.totals.excitations++;
        const node = this.node(edge.to);
        node.excitedCount++; node.lastExcitedBy = source; node.lastExcitedAt = at;
        node.pending.set(source, at);
        this._log('excite', { from: source, to: edge.to, weight: edge.weight, pulledMs: Math.round(pulledMs) });
      }
    }

    snapshot() {
      const now = this.clock();
      const ids = Array.from(this.controller.jobs.keys());
      const present = new Set(ids);
      const active = this.edges.filter(edge => present.has(edge.from) && present.has(edge.to));
      const nodes = ids.map(id => {
        const node = this.node(id), job = this.controller.jobs.get(id);
        return { id, label: job.label || id, group: job.group || null, mode: job.mode || null, status: job.status,
          utility: node.utility, cadence: this.cadenceFactor(id), paced: this.paced.has(id), ablated: this.ablatedNodes.has(id),
          baseIntervalMs: job.intervalMs, effectiveIntervalMs: Math.round(job.intervalMs * this.cadenceFactor(id)),
          novel: node.novel, repeated: node.repeated, failures: node.failures, excited: node.excitedCount,
          lastExcitedBy: node.lastExcitedBy, lastExcitedAgoMs: finite(node.lastExcitedAt) ? Math.max(0, now - node.lastExcitedAt) : null,
          inDegree: active.filter(edge => edge.to === id).length, outDegree: active.filter(edge => edge.from === id).length };
      });
      const weights = active.map(edge => edge.weight);
      const meanWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
      return {
        version: VERSION, sampledAt: now, totals: { ...this.totals },
        graph: { nodes: nodes.length, edges: active.length, meanWeight,
          meanUtility: nodes.length ? nodes.reduce((a, n) => a + n.utility, 0) / nodes.length : 0,
          weightDrift: active.reduce((a, edge) => a + Math.abs(edge.weight - edge.initial), 0),
          ablatedNodes: Array.from(this.ablatedNodes),
          ablatedEdges: Array.from(this.ablatedEdges) },
        nodes,
        edges: active.map(edge => ({ from: edge.from, to: edge.to, weight: edge.weight, initial: edge.initial,
          ablated: this.ablatedEdges.has(edge.key),
          excitations: edge.excitations, potentiations: edge.potentiations, depressions: edge.depressions,
          lastExcitedAgoMs: finite(edge.lastExcitedAt) ? Math.max(0, now - edge.lastExcitedAt) : null })),
        spans: this.spans.map(span => ({ ...span })),
        events: this.events.slice(-40).map(event => ({ ...event })),
        scope: 'Scheduling plasticity between capabilities: excitation advances eligible due times, Hebbian credit uses the excited capability\u2019s own next outcome. No adapter is invoked, and no causal or scientific claim is made.'
      };
    }

    exportState() {
      const utilities = {};
      for (const [id, node] of this.nodes) if (finite(node.utility)) utilities[id] = node.utility;
      return { version: VERSION, edges: this.edges.map(edge => ({ from: edge.from, to: edge.to, weight: edge.weight })), utilities };
    }

    importState(record) {
      if (!record || typeof record !== 'object' || record.version !== VERSION || !Array.isArray(record.edges)) {
        return { status: 'rejected', reason: 'Incompatible or malformed fabric record' };
      }
      // Validate everything before applying anything.
      const updates = [];
      for (const entry of record.edges.slice(0, 1024)) {
        const edge = entry && this.edgeByKey.get(String(entry.from) + '>' + String(entry.to));
        if (!edge) continue; // a removed edge is ignored, never invented
        if (!finite(entry.weight)) return { status: 'rejected', reason: 'Non-finite edge weight' };
        updates.push([edge, clamp(entry.weight, this.options.minWeight, this.options.maxWeight)]);
      }
      const utilities = [];
      for (const [id, value] of Object.entries(record.utilities && typeof record.utilities === 'object' ? record.utilities : {}).slice(0, 256)) {
        if (!finite(value)) return { status: 'rejected', reason: 'Non-finite utility' };
        utilities.push([id, clamp(value, -1, 1)]);
      }
      for (const [edge, weight] of updates) edge.weight = weight;
      for (const [id, value] of utilities) this.node(id).utility = value;
      return { status: 'restored', edges: updates.length, utilities: utilities.length };
    }
  }

  function connectivity(ids, edges = DEFAULT_EDGES, paced = PACED) {
    const present = new Set(ids), pacedSet = new Set(paced);
    const inbound = new Map(), outbound = new Map();
    for (const [from, to] of edges) {
      if (!present.has(from) || !present.has(to)) continue;
      outbound.set(from, (outbound.get(from) || 0) + 1);
      inbound.set(to, (inbound.get(to) || 0) + 1);
    }
    return {
      withoutOutput: ids.filter(id => !outbound.get(id)),
      withoutInput: ids.filter(id => !pacedSet.has(id) && !inbound.get(id)),
      pacedTargets: edges.filter(([, to]) => pacedSet.has(to)).map(([from, to]) => from + '>' + to)
    };
  }

  function installBrowser(win) {
    let fabric = null, saveTimer = null, persistence = { status: 'not_saved' };
    const save = () => {
      if (!fabric || !win.localStorage) return;
      try {
        const encoded = JSON.stringify(fabric.exportState());
        win.localStorage.setItem(STORAGE_KEY, encoded);
        if (win.localStorage.getItem(STORAGE_KEY) !== encoded) throw new Error('Fabric readback mismatch');
        persistence = { status: 'saved', at: Date.now(), bytes: encoded.length };
      } catch (error) { persistence = { status: 'error', reason: String(error && error.message || error).slice(0, 160) }; }
    };
    const attach = () => {
      const controller = win.aliveOverdrive;
      if (fabric || !controller || !(controller.jobs instanceof Map)) return Boolean(fabric);
      fabric = new SynapticFabric({ controller });
      try {
        const saved = win.localStorage && win.localStorage.getItem(STORAGE_KEY);
        if (saved) persistence = { ...fabric.importState(JSON.parse(saved)), source: 'localStorage' };
      } catch (error) { persistence = { status: 'error', reason: String(error && error.message || error).slice(0, 160) }; }
      win.addEventListener('alive-runtime-event', event => {
        const detail = event && event.detail;
        if (!detail) return;
        try { fabric.handleEvent(detail); } catch (_) { /* scheduling continues without fabric feedback */ }
        if (detail.type === 'stopped' && controller.ownsEvent?.(detail) === true && detail.generation === controller.generation) save();
      });
      saveTimer = setInterval(save, 30000);
      return true;
    };
    win.aliveFabric = Object.freeze({
      attach,
      snapshot: () => (attach() && fabric ? { ...fabric.snapshot(), persistence: { ...persistence } } : null),
      exportState: () => (fabric ? fabric.exportState() : null),
      setAblation: (target, ablated = true) => (attach() && fabric ? fabric.setAblation(target, ablated) : false),
      clearAblations: () => (attach() && fabric ? fabric.clearAblations() : false),
      creatureLenses: (colony, coupling) => (attach() && fabric ? fabric.creatureLenses(colony, coupling) : []),
      reset: () => { if (!fabric) return false; fabric.clearAblations(); for (const edge of fabric.edges) edge.weight = edge.initial; for (const node of fabric.nodes.values()) node.utility = 0; save(); return true; },
      stop: () => { clearInterval(saveTimer); save(); }
    });
    if (!attach()) {
      let attempts = 0;
      const retry = setInterval(() => { if (attach() || ++attempts > 120) clearInterval(retry); }, 250);
    }
  }

  return Object.freeze({ SynapticFabric, DEFAULT_EDGES, DEFAULTS, PACED, COLONY_LENSES, STORAGE_KEY, evidenceDigest, connectivity, installBrowser });
});
