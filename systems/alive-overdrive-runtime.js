/* Cooperative orchestration for the existing creature engines and browser actuators.
 * An adapter finishing is recorded as an execution, not a proof of intelligence,
 * consciousness, benchmark qualification, or availability of an external backend.
 */
(function (scope) {
  'use strict';
  // The shared browser event channel also carries guest-authority receipts.
  // Object ownership plus operation IDs distinguish scheduler settlements from
  // same-named external events and from replayed prior executions.
  const emittedEvents = new WeakMap();

  const capability = (id, label, mode, intervalMs, initialDelayMs, aliases = []) =>
    Object.freeze({ id, label, mode, intervalMs, initialDelayMs, aliases: Object.freeze(aliases), manualOnly: mode === 'diagnostic' });
  const CAPABILITIES = Object.freeze([
    capability('brains-precision', '14 Brain × 7 Precision', 'observe', 1200, 0, ['14 Brain x 7 Precision']),
    capability('dom-body', 'Spawn DOM Body / Step Episode', 'action', 1400, 100, ['Spawn DOM Body', 'Step Episode']),
    capability('macro', 'Macro · 14 regions / RIM router', 'observe', 1200, 150, ['Macro 14 Regions / RIM Router']),
    capability('meso', 'Meso · 112 sLTC × SSM / apical NMDA', 'observe', 1200, 200, ['Meso 112 sLTC x SSM / Apical NMDA']),
    capability('micro', 'Micro · Moonlab Q3 / QGTL / QRNG / Eshkol / FlyWire Ising', 'observe', 1800, 250, ['Micro Moonlab Q3 / QGTL / QRNG / Eshkol / FlyWire Ising']),
    capability('body-curriculum', 'Body + Curriculum · stages A–F / viscera', 'observe', 1500, 300, ['Body + Curriculum Stages A-F / Viscera']),
    capability('connectome', '512-CONN × 262K-SYN × sLTC / SSM × .Onion', 'observe', 1800, 350, ['512-CONN x 262K-SYN x sLTC / SSM x Onion']),
    capability('millennium', 'DSD-24 × Cl(4,0) × Millennium', 'observe', 1800, 400, ['DSD-24 x CI(4,0) x Millenium']),
    capability('reasoning', 'AoT · ToT · GoT', 'observe', 1500, 450, ['AoT ToT GoT']),
    capability('memory', 'Memory 4 Tier', 'observe', 1800, 500, ['Four-tier memory']),
    capability('metacognition', 'Cl(4,0) Metacognition', 'observe', 1800, 550, ['CI (4,0) Metacognition', 'CI(4,0) Metacognition']),
    capability('train-policy', 'Train Policy', 'action', 10000, 1800),
    capability('grover-collapse', 'Grover Collapse', 'action', 6500, 2300),
    capability('decursive', 'Decursive DSD-24', 'action', 12000, 3000),
    capability('feed', 'Feed', 'action', 14000, 3800),
    capability('formation', 'Formation', 'action', 18000, 4500),
    capability('soul-surge', '9D Soul Surge', 'action', 24000, 5200),
    capability('deity', 'Deity 100', 'action', 10000, 6000, ['Diety 100']),
    capability('research-plan', 'Research planner · configured language model', 'action', 45000, 6000),
    capability('omega', 'Omega 100', 'action', 10000, 6600),
    capability('morph', 'Eldritch Morph / Mutate Body', 'action', 24000, 7500, ['Eldritch Morph', 'Mutate Body', 'Body Metamorph']),
    capability('dream', 'Dream SWS / Dream Replay', 'action', 28000, 8500, ['Dream SWS', 'Dream Replay', 'Dream Reply']),
    capability('ghost-swarm', 'Ghost Swarm', 'action', 45000, 9000),
    capability('procreate', 'Procreate / Mitosis Split', 'action', 35000, 10000, ['Procreate', 'Mitosis Split', 'Procreate / Mitosis']),
    capability('zalgo', 'Zalgo Fuckery', 'action', 22000, 12000),
    capability('ghost-write', 'Ghost Write', 'action', 60000, 12000, ['Ghostwriter']),
    capability('neo', 'Neo Matrix', 'action', 24000, 14000),
    capability('warp-dom', 'Warp DOM', 'action', 30000, 16000),
    capability('portal-jump', 'Portal Jump / Concept Drive', 'action', 30000, 18000, ['Portal Jump', 'Concept Drive', 'Concept Dive']),
    capability('epoch-handoff', 'Epoch Handoff', 'action', 45000, 22000, ['Handoff m6']),
    capability('checkpoint', 'Checkpoint CID', 'action', 60000, 25000),
    capability('onion', 'Onion', 'observe', 5000, 700),
    capability('deep-dark-dive', 'Deep Dark Dive / Drive', 'action', 45000, 28000, ['Deep Dark Dive', 'Deep Dark Drive', 'Onion / Deep Dark Drive']),
    capability('flywire', 'FlyWire A/B', 'diagnostic', 120000, 35000, ['Flywire M8']),
    capability('learning-five-seed', 'Learning 5-Seed', 'diagnostic', 300000, 40000, ['Learning five independent seeds']),
    capability('acceptance-gates', '8 PDF Gates', 'diagnostic', 180000, 45000, ['8 Gates P.22'])
  ]);

  const clamp = (value, fallback, low, high) => Number.isFinite(Number(value))
    ? Math.max(low, Math.min(high, Number(value))) : fallback;
  // Never retain full model arrays, DOM snapshots, or adapter-owned mutable objects.
  function summarize(value, depth = 0) {
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (typeof value === 'string') return value.slice(0, 480);
    if (typeof value === 'bigint') return value.toString();
    if (value === undefined) return null;
    if (depth >= 3) return '[nested data]';
    if (Array.isArray(value) || ArrayBuffer.isView(value)) return Array.from({ length: Math.min(12, value.length || 0) }, (_, i) => summarize(value[i], depth + 1));
    if (typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value).slice(0, 24)) result[key] = summarize(value[key], depth + 1);
      return result;
    }
    return String(value).slice(0, 480);
  }

  class Controller {
    constructor(options = {}) {
      this.clock = options.clock || (() => typeof performance !== 'undefined' ? performance.now() : Date.now());
      this.setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
      this.clearTimer = options.clearTimer || (id => clearTimeout(id));
      this.intervalMs = clamp(options.intervalMs, 50, 16, 1000);
      this.budgetMs = clamp(options.budgetMs, 5, 1, 25);
      this.maxInFlight = Math.floor(clamp(options.maxInFlight, 1, 1, 4));
      this.reservedLocalSlots = Math.floor(clamp(options.reservedLocalSlots, 0, 0, this.maxInFlight - 1));
      this.backgroundGroups = new Set(Array.isArray(options.backgroundGroups) ? options.backgroundGroups : []);
      this.maxStartsPerTick = Math.floor(clamp(options.maxStartsPerTick, 2, 1, 8));
      this.eventLimit = Math.floor(clamp(options.eventLimit, 160, 20, 500));
      this.getContext = options.getContext || (() => ({}));
      this.onEvent = options.onEvent;
      this.onOutcome = options.onOutcome;
      this.running = false;
      this.suspended = false;
      this.automatic = true;
      this.generation = 0;
      this.operationSequence = 0;
      emittedEvents.set(this, new WeakSet());
      this.cycleCount = 0;
      this.timer = null;
      this.requests = new Set();
      this.inFlight = new Map();
      this.events = [];
      this.metrics = { ticks: 0, overBudgetTicks: 0, syncDurationMs: 0, maxSyncDurationMs: 0 };
      this.jobs = new Map();
      this.aliases = new Map();
      for (const definition of options.capabilities || CAPABILITIES) {
        if (!definition.id || this.jobs.has(definition.id)) throw new Error('Capability IDs must be present and unique');
        const supplied = (options.adapters || {})[definition.id];
        const adapter = typeof supplied === 'function' ? { run: supplied } : (supplied || {});
        const job = {
          ...definition, adapter,
          intervalMs: clamp(adapter.intervalMs, definition.intervalMs || 5000, 100, 3600000),
          initialDelayMs: clamp(adapter.initialDelayMs, definition.initialDelayMs || 0, 0, 3600000),
          manualOnly: adapter.manualOnly === undefined ? Boolean(definition.manualOnly) : Boolean(adapter.manualOnly),
          group: adapter.group || (definition.mode === 'observe' ? 'observe' : 'mutation'),
          timeoutMs: clamp(adapter.timeoutMs, 15000, 100, 120000),
          status: typeof adapter.run === 'function' ? 'idle' : 'unavailable',
          runCount: 0, completedCount: 0, errorCount: 0, consecutiveErrors: 0,
          lastStartedAt: null, lastCompletedAt: null, lastSuccessfulAt: null, evidenceAt: null, lastDurationMs: null,
          syncDurationMs: 0, nextDueAt: Infinity, evidence: null,
          lastError: typeof adapter.run === 'function' ? '' : 'No runtime adapter registered'
        };
        this.jobs.set(job.id, job);
        for (const name of [job.id, job.label, ...(job.aliases || [])]) {
          if (typeof name !== 'string' || !name.trim()) continue;
          const alias = name.trim().toLowerCase();
          if (this.aliases.has(alias) && this.aliases.get(alias) !== job.id) throw new Error(`Ambiguous overdrive capability alias: ${name}`);
          this.aliases.set(alias, job.id);
        }
      }
    }

    _emit(type, id, detail = {}, operation = null) {
      const event = Object.freeze({ ...summarize(detail), at: this.clock(), type, id,
        source: 'alive-overdrive', generation: operation?.generation ?? this.generation, runId: operation?.runId ?? null });
      emittedEvents.get(this).add(event);
      this.events.push(event);
      if (this.events.length > this.eventLimit) this.events.splice(0, this.events.length - this.eventLimit);
      if (typeof this.onEvent === 'function') {
        try { this.onEvent(event); } catch (_) { /* UI/log delivery must not kill scheduling. */ }
      }
      return event;
    }

    ownsEvent(event) { return Boolean(event && typeof event === 'object' && emittedEvents.get(this)?.has(event)); }

    start({ automatic = true } = {}) {
      if (this.running) return this.snapshot();
      this.running = true;
      this.automatic = automatic;
      this.generation++;
      const now = this.clock();
      for (const job of this.jobs.values()) {
        job.nextDueAt = now + job.initialDelayMs;
        if (!this.inFlight.has(job.id)) job.status = typeof job.adapter.run === 'function' ? 'idle' : 'unavailable';
      }
      this._emit('started', null, { generation: this.generation });
      if (automatic) this._schedule();
      return this.snapshot();
    }

    stop() {
      this.running = false;
      this.generation++;
      this.requests.clear();
      if (this.timer !== null) this.clearTimer(this.timer);
      this.timer = null;
      for (const [id, token] of this.inFlight) {
        token.cancelled = true;
        token.abort.abort();
        this.jobs.get(id).status = 'stopped';
      }
      for (const job of this.jobs.values()) if (job.status === 'queued') job.status = 'stopped';
      // Keep unresolved operations occupying their slots until they actually settle.
      // Racing a timeout and deleting the lock would let repeated starts pile up work.
      this._emit('stopped', null, { unresolvedOperations: this.inFlight.size });
      return this.snapshot();
    }

    request(id) {
      id = this.aliases.get(String(id).trim().toLowerCase()) || id;
      const job = this.jobs.get(id);
      if (!job) throw new Error(`Unknown overdrive capability: ${id}`);
      if (typeof job.adapter.run !== 'function') {
        this._emit('unavailable', id, { reason: job.lastError });
        return false;
      }
      if (this.inFlight.has(id)) return false;
      this.requests.add(id); // one coalesced request per capability
      job.status = 'queued';
      if (this.automatic) this._schedule();
      return true;
    }

    _needsPump() {
      return this.running || this.requests.size > 0 || Array.from(this.inFlight.values()).some(t => !t.cancelled);
    }

    _schedule() {
      if (this.timer !== null || !this.automatic || !this._needsPump()) return;
      this.timer = this.setTimer(() => {
        this.timer = null;
        this.tick();
        this._schedule();
      }, this.intervalMs);
    }

    tick() {
      const tickStart = this.clock();
      this.metrics.ticks++;
      for (const [id, token] of this.inFlight) {
        const job = this.jobs.get(id);
        if (!token.cancelled && !token.timedOut && tickStart - token.startedAt >= job.timeoutMs) {
          token.timedOut = true;
          token.abort.abort();
          job.status = 'timeout';
          job.lastError = `Exceeded ${job.timeoutMs} ms; awaiting settlement before retry`;
          job.errorCount++;
          job.consecutiveErrors++;
          this._emit('timeout', id, { reason: job.lastError }, token);
        }
      }
      if (!this.running && this.requests.size === 0) return { started: 0, inFlight: this.inFlight.size };
      let context;
      try { context = this.getContext() || {}; }
      catch (error) {
        this._emit('context-error', null, { reason: String(error && error.message || error) });
        return { started: 0, inFlight: this.inFlight.size };
      }
      if (this.suspended !== (context.paused === true)) {
        this.suspended = context.paused === true;
        this._emit(this.suspended ? 'suspended' : 'resumed', null, { reason: this.suspended ? 'Host is hidden or temporarily paused' : '' });
      }
      if (this.suspended) return { started: 0, inFlight: this.inFlight.size, suspended: true };
      // Read host state even when every execution slot is occupied. Otherwise a
      // stalled adapter can make a hidden host appear to be actively running.
      if (this.inFlight.size >= this.maxInFlight) return { started: 0, inFlight: this.inFlight.size };
      const candidates = Array.from(this.jobs.values()).filter(job =>
        typeof job.adapter.run === 'function' && !this.inFlight.has(job.id) &&
        (this.requests.has(job.id) || (this.running && !job.manualOnly && job.nextDueAt <= tickStart))
      ).sort((a, b) => Number(this.requests.has(b.id)) - Number(this.requests.has(a.id)) || a.nextDueAt - b.nextDueAt);
      let started = 0;
      for (const job of candidates) {
        if (this.inFlight.size >= this.maxInFlight || started >= this.maxStartsPerTick || this.clock() - tickStart >= this.budgetMs) break;
        if (Array.from(this.inFlight.values()).some(token => token.group === job.group)) continue;
        // Slow provider work may retain locks after a deadline. Keep capacity
        // for perception/local actions without discarding unresolved operations.
        if (this.backgroundGroups.has(job.group) && Array.from(this.inFlight.values()).filter(token => this.backgroundGroups.has(token.group)).length >= this.maxInFlight - this.reservedLocalSlots) continue;
        let ready = true;
        try { if (typeof job.adapter.ready === 'function') ready = job.adapter.ready(context); }
        catch (error) { ready = String(error && error.message || error); }
        if (ready !== true) {
          const reason = typeof ready === 'string' ? ready : 'Waiting for prerequisites';
          const changed = job.status !== 'blocked' || job.lastError !== reason;
          job.status = 'blocked';
          job.lastError = reason;
          job.nextDueAt = tickStart + Math.max(1000, job.intervalMs);
          this.requests.delete(job.id);
          if (changed) this._emit('blocked', job.id, { reason });
          continue;
        }
        this._launch(job, context);
        started++;
      }
      const elapsed = Math.max(0, this.clock() - tickStart);
      this.metrics.syncDurationMs = elapsed;
      this.metrics.maxSyncDurationMs = Math.max(this.metrics.maxSyncDurationMs, elapsed);
      if (elapsed > this.budgetMs) this.metrics.overBudgetTicks++;
      this.cycleCount++;
      return { started, inFlight: this.inFlight.size, syncDurationMs: elapsed };
    }

    _launch(job, context) {
      const startedAt = this.clock();
      const token = { generation: this.generation, runId: ++this.operationSequence, startedAt, group: job.group, abort: new AbortController(), cancelled: false, timedOut: false };
      this.requests.delete(job.id);
      this.inFlight.set(job.id, token);
      job.status = 'running';
      job.runCount++;
      job.lastStartedAt = startedAt;
      job.lastError = '';
      this._emit('running', job.id, {}, token);
      let operation;
      try { operation = job.adapter.run({ signal: token.abort.signal, now: startedAt, context, id: job.id }); }
      catch (error) { operation = Promise.reject(error); }
      job.syncDurationMs = Math.max(0, this.clock() - startedAt);
      // Async JavaScript cannot preempt a synchronous adapter. Measure and expose
      // overruns honestly, reduce its future cadence, and yield before the next job.
      Promise.resolve(operation).then(result => this._settle(job, token, result, null, context),
        error => this._settle(job, token, null, error, context));
    }

    _settle(job, token, result, error, context) {
      if (this.inFlight.get(job.id) !== token) return;
      this.inFlight.delete(job.id);
      if (token.cancelled || token.generation !== this.generation) {
        if (this.running) { job.status = 'idle'; job.nextDueAt = this.clock() + job.intervalMs; }
        this._schedule();
        return;
      }
      const now = this.clock();
      job.lastCompletedAt = now;
      job.lastDurationMs = Math.max(0, now - token.startedAt);
      if (error || token.timedOut) {
        if (!token.timedOut) {
          job.errorCount++;
          job.consecutiveErrors++;
          job.status = 'error';
          job.lastError = String(error && error.message || error).slice(0, 480);
          this._emit('error', job.id, { reason: job.lastError }, token);
        }
        job.nextDueAt = now + Math.min(120000, job.intervalMs * Math.pow(2, Math.min(4, job.consecutiveErrors)));
      } else {
        const outcome = result && typeof result === 'object' ? result : { evidence: result };
        const statuses = ['completed', 'observed', 'blocked', 'unavailable', 'error', 'timeout'];
        job.status = outcome.status === undefined ? 'completed' : (statuses.includes(outcome.status) ? outcome.status : 'error');
        job.evidence = summarize(outcome.evidence === undefined ? result : outcome.evidence);
        job.evidenceAt = now;
        job.lastError = String(outcome.reason || (job.status === 'error' ? 'Adapter returned an error or unknown outcome status' : job.status === 'timeout' ? 'Adapter reported that its deadline expired' : '')).slice(0, 480);
        if (job.status === 'completed' || job.status === 'observed') {
          job.completedCount++;
          job.consecutiveErrors = 0;
          job.lastSuccessfulAt = now;
        } else if (job.status === 'error' || job.status === 'timeout') {
          job.errorCount++;
          job.consecutiveErrors++;
        }
        const slowFactor = Math.max(1, Math.min(8, job.syncDurationMs / this.budgetMs));
        // Structured adapter failures must have the same retry semantics as
        // thrown errors. Backends commonly return a failure instead of throwing.
        const failed = job.status === 'error' || job.status === 'timeout';
        const errorFactor = failed ? Math.pow(2, Math.min(4, job.consecutiveErrors)) : 1;
        job.nextDueAt = now + (failed
          ? Math.min(120000, job.intervalMs * Math.max(slowFactor, errorFactor))
          : job.intervalMs * slowFactor);
        this._emit(job.status, job.id, { evidence: job.evidence, reason: job.lastError, durationMs: job.lastDurationMs, syncDurationMs: job.syncDurationMs }, token);
        if (typeof this.onOutcome === 'function' && (job.status === 'completed' || job.status === 'observed')) {
          try { this.onOutcome(job.id, { status: job.status, evidence: job.evidence, reward: Number.isFinite(outcome.reward) ? outcome.reward : null }, context); }
          catch (feedbackError) { this._emit('feedback-error', job.id, { reason: String(feedbackError && feedbackError.message || feedbackError) }, token); }
        }
      }
      this._schedule();
    }

    snapshot(includeEvents = true) {
      const now = this.clock();
      const executions = Array.from(this.inFlight, ([id, token]) => ({
        id, runId: token.runId, generation: token.generation, group: token.group, startedAt: token.startedAt, elapsedMs: Math.max(0, now - token.startedAt),
        cancelled: token.cancelled, timedOut: token.timedOut
      }));
      const due = job => this.requests.has(job.id) || (this.running && !this.suspended && !job.manualOnly && job.nextDueAt <= now);
      const waitingFor = job => {
        if (this.inFlight.has(job.id) || !due(job) || typeof job.adapter.run !== 'function') return [];
        const sameLane = executions.filter(execution => execution.group === job.group);
        const background = executions.filter(execution => this.backgroundGroups.has(execution.group));
        const reservationBlocked = this.backgroundGroups.has(job.group) && background.length >= this.maxInFlight - this.reservedLocalSlots;
        return (sameLane.length ? sameLane : this.inFlight.size >= this.maxInFlight ? executions : reservationBlocked ? background : []).map(execution => execution.id);
      };
      const waiting = Array.from(this.jobs.values()).filter(job => waitingFor(job).length > 0);
      const timedOut = executions.filter(execution => execution.timedOut).length;
      const issues = Array.from(this.jobs.values()).filter(job => ['blocked', 'unavailable', 'error', 'timeout'].includes(job.status)).length;
      return {
        running: this.running, suspended: this.suspended, generation: this.generation, cycleCount: this.cycleCount,
        inFlight: this.inFlight.size, queued: this.requests.size,
        budgetMs: this.budgetMs, intervalMs: this.intervalMs,
        maxInFlight: this.maxInFlight, reservedLocalSlots: this.reservedLocalSlots, backgroundGroups: Array.from(this.backgroundGroups),
        sampledAt: now, executions,
        health: {
          state: !this.running ? 'paused' : this.suspended ? 'suspended' : timedOut ? 'stalled' : issues ? 'degraded' : 'running',
          awaitingSettlement: executions.filter(execution => execution.timedOut || execution.cancelled).length,
          waitingCapabilities: waiting.length, issues,
          automaticCapabilities: Array.from(this.jobs.values()).filter(job => !job.manualOnly && typeof job.adapter.run === 'function').length
        },
        metrics: { ...this.metrics },
        jobs: Array.from(this.jobs.values(), job => ({
          id: job.id, label: job.label, mode: job.mode, aliases: job.aliases || [], manualOnly: job.manualOnly,
          status: job.status, runCount: job.runCount, completedCount: job.completedCount, errorCount: job.errorCount,
          lastStartedAt: job.lastStartedAt, lastCompletedAt: job.lastCompletedAt, lastSuccessfulAt: job.lastSuccessfulAt,
          evidenceAt: job.evidenceAt, lastDurationMs: job.lastDurationMs,
          syncDurationMs: job.syncDurationMs, nextDueAt: Number.isFinite(job.nextDueAt) ? job.nextDueAt : null,
          group: job.group, waitingFor: waitingFor(job),
          overdueMs: due(job) && Number.isFinite(job.nextDueAt) ? Math.max(0, now - job.nextDueAt) : 0,
          evidence: summarize(job.evidence), lastError: job.lastError
        })),
        ...(includeEvents ? { events: this.events.map(event => ({ ...event })) } : {})
      };
    }
  }

  const api = { Controller, CAPABILITIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (scope) scope.AliveOverdriveRuntime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
