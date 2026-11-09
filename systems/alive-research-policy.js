/* Bounded, outcome-trained navigation policy. The small neural ranker learns
 * discovery yield from verified page arrivals; it is not a language model.
 * Candidate generation and URL guards are explicit heuristics. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveResearchPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const INPUT = 16, HIDDEN = 12, VERSION = 1;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const bounded = (value, fallback, low, high) => Math.floor(clamp(finite(value, fallback), low, high));
  const short = (value, length = 200) => String(value || '').slice(0, length);
  const STOP = new Set('the and for that this with from are was were have has not but what all when can more will into about which their there been one would other some time only over such make like after most made many before must through where much your should because each just those people how too little state good used work last need see use two may first new between main page edit view history search menu skip contents article talk read tools privacy policy terms cookie login sign account share comment reply'.split(' '));
  const TOPICS = Object.freeze(['outsider art archives', 'forgotten computer networks', 'cryptographic puzzles', 'experimental web art', 'strange natural phenomena', 'unusual historical manuscripts', 'folklore field recordings', 'obsolete media archives', 'mathematical curiosities', 'artificial life experiments', 'signal mysteries', 'underground zines',
    'numbers stations shortwave', 'lost media investigations', 'liminal spaces photography', 'abandoned places exploration', 'declassified government documents', 'unexplained disappearances', 'cryptids folklore', 'internet mysteries unsolved', 'occult manuscripts grimoires', 'creepy old websites', 'cold war secret projects', 'anomalous radio signals']);
  function words(value) { return Array.from(new Set((short(value, 12000).toLowerCase().match(/[a-z][a-z0-9-]{3,30}/g) || []).filter(w => !STOP.has(w)))).slice(0, 80); }
  function hash(value) { let result = 2166136261; for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619); return result >>> 0; }
  function explorationEvidence(value) {
    if (!value || !['exploring', 'exhausted', 'blocked', 'yielding'].includes(value.phase) ||
        !Number.isSafeInteger(value.observations) || value.observations < 1 || value.observations > 1e9 ||
        !Number.isSafeInteger(value.stagnantObservations) || value.stagnantObservations < 0 || value.stagnantObservations > value.observations ||
        !Number.isFinite(value.scrollY) || value.scrollY < 0 || !Number.isFinite(value.maxScroll) || value.maxScroll < 0) return null;
    // An exhausted claim must agree with measured viewport geometry. A blocked
    // claim needs repeated no-progress observations, not one command attempt.
    if (value.phase === 'exhausted' && value.scrollY + 8 < value.maxScroll ||
        value.phase === 'blocked' && value.stagnantObservations < 2) return null;
    return { phase: value.phase, observations: value.observations, stagnantObservations: value.stagnantObservations };
  }
  function localHost(host) {
    const name = host.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (!name || name === 'localhost' || /\.(localhost|local|internal|lan|test|invalid)$/.test(name) || !name.includes('.') && !name.includes(':')) return true;
    if (name.includes(':')) return true; // IPv6 literals are unnecessary discovery targets.
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
      const octets = name.split('.').map(Number);
      return octets[0] === 0 || octets[0] === 10 || octets[0] === 127 || octets[0] >= 224 ||
        octets[0] === 169 && octets[1] === 254 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31 ||
        octets[0] === 192 && (octets[1] === 168 || octets[1] === 0) || octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127 || octets[0] === 198 && [18, 19].includes(octets[1]);
    }
    return false;
  }
  function normalizeURL(raw, base) {
    try {
      if (typeof raw !== 'string' || raw.length > 2048) return null;
      const url = base ? new URL(raw, base) : new URL(raw);
      // Normalize the DNS root suffix before deciding transport. Otherwise
      // "service.onion." could evade the onion-only route requirement.
      url.hostname = url.hostname.toLowerCase().replace(/\.$/, '');
      if (!/^https?:$/.test(url.protocol) || url.username || url.password || localHost(url.hostname) || url.port && !['80', '443'].includes(url.port)) return null;
      const onion = /\.onion$/i.test(url.hostname);
      if (onion && !/^[a-z2-7]{56}\.onion$/i.test(url.hostname)) return null;
      let path; try { path = decodeURIComponent(url.pathname); } catch (_) { return null; }
      if (/\.(?:exe|msi|zip|gz|tar|7z|rar|dmg|pkg|deb|rpm|iso|bat|cmd|ps1|sh|scr|jar)(?:$|\/)/i.test(path) || /(?:^|\/)(?:logout|log-out|signin|sign-in|signup|register|checkout|cart|delete|remove|unsubscribe|settings|account)(?:\/|$)/i.test(path)) return null;
      const queryKeys = Array.from(url.searchParams.keys());
      for (const key of queryKeys) {
        if (/^(?:token|access_token|api_key|apikey|password|passwd|session|sessionid|auth|authorization|signature|sig|key)$/i.test(key)) return null;
        if (/^(?:action|do|op|cmd)$/i.test(key) && /(?:delete|remove|logout|edit|post|submit|write|save|buy)/i.test(url.searchParams.get(key))) return null;
        if (/^(?:utm_.+|fbclid|gclid|msclkid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
      }
      url.hash = '';
      url.searchParams.sort();
      return { url: url.href, domain: url.hostname.replace(/^www\./, ''), onion };
    } catch (_) { return null; }
  }
  function makeModel() {
    const model = { inputWeights: new Float32Array(INPUT * HIDDEN), hiddenBias: new Float32Array(HIDDEN), outputWeights: new Float32Array(HIDDEN), outputBias: new Float32Array(1), counters: new Float64Array(4) };
    for (let i = 0; i < model.inputWeights.length; i++) model.inputWeights[i] = Math.sin((i + 1) * 2.399963) * .12;
    for (let i = 0; i < HIDDEN; i++) model.outputWeights[i] = Math.cos(i * 1.618 + .5) * .12;
    return model;
  }
  function forward(model, features) {
    const hidden = new Float32Array(HIDDEN);
    let value = model.outputBias[0];
    for (let j = 0; j < HIDDEN; j++) {
      let sum = model.hiddenBias[j];
      for (let i = 0; i < INPUT; i++) sum += model.inputWeights[j * INPUT + i] * features[i];
      hidden[j] = Math.tanh(sum);
      value += hidden[j] * model.outputWeights[j];
    }
    return { hidden, value: Math.tanh(value) };
  }
  function train(model, features, reward) {
    const { hidden, value } = forward(model, features);
    const error = value - reward, gradient = clamp(error * (1 - value * value), -1, 1), rate = .035;
    for (let j = 0; j < HIDDEN; j++) {
      const hiddenGradient = gradient * model.outputWeights[j] * (1 - hidden[j] * hidden[j]);
      for (let i = 0; i < INPUT; i++) model.inputWeights[j * INPUT + i] = clamp(model.inputWeights[j * INPUT + i] - rate * hiddenGradient * features[i], -3, 3);
      model.hiddenBias[j] = clamp(model.hiddenBias[j] - rate * hiddenGradient, -3, 3);
      model.outputWeights[j] = clamp(model.outputWeights[j] - rate * gradient * hidden[j], -3, 3);
    }
    model.outputBias[0] = clamp(model.outputBias[0] - rate * gradient, -3, 3);
    model.counters[0]++;
    model.counters[1] = reward;
    model.counters[2] = error * error;
    model.counters[3] += Math.abs(gradient);
    return { reward, loss: error * error, prediction: value, updates: model.counters[0] };
  }
  class ResearchPolicy {
    constructor(options = {}) {
      this.now = options.now || (() => Date.now());
      this.maxCandidates = bounded(options.maxCandidates, 384, 16, 1024);
      this.maxHistory = bounded(options.maxHistory, 256, 16, 1024);
      this.maxConcepts = bounded(options.maxConcepts, 512, 32, 2048);
      // Defaults stay conservative for library callers. The floors are low enough
      // that the live browser can configure a fast forager: a page whose content
      // and links have settled, or whose viewport is exhausted, may be left after
      // ~1-2 s instead of being held for a fixed reading period.
      this.minDwellMs = bounded(options.minDwellMs, 15000, 1500, 60000);
      this.maxDwellMs = bounded(options.maxDwellMs, 45000, this.minDwellMs, 180000);
      this.loadTimeoutMs = bounded(options.loadTimeoutMs, 25000, 3000, this.maxDwellMs);
      this.settledDwellMs = bounded(options.settledDwellMs, 6000, 1000, this.minDwellMs);
      this.model = makeModel();
      this.frontier = new Map(); this.visits = new Map(); this.domains = new Map(); this.concepts = new Map(); this.redirects = new Map();
      this.recentPages = []; this.selections = new Map(); this.pending = null; this.lastDecision = null; this.lastReadiness = null;
      this.observations = 0; this.sequence = 0; this.queryCursor = 0; this.queryMemory = new Set(); this.stall = null;
      this.pageProgress = null; this.navigationRecovery = null;
    }
    _trim(map, limit) { while (map.size > limit) map.delete(map.keys().next().value); }
    enqueue(candidates, context = {}) {
      let added = 0;
      for (const input of Array.isArray(candidates) ? candidates.slice(0, 256) : []) {
        if (!input || typeof input !== 'object') continue;
        const parsed = normalizeURL(input.url || input.href, context.baseURL);
        if (!parsed || this.visits.has(parsed.url) || this.redirects.has(parsed.url) || this.frontier.has(parsed.url)) continue;
        const source = ['observed-link', 'catalog', 'search'].includes(input.source || context.source) ? input.source || context.source : 'catalog';
        const sourceURL = normalizeURL(input.discoveredFrom || context.discoveredFrom || '');
        const candidate = { ...parsed, title: short(input.title || input.text || parsed.domain), source,
          discoveredFrom: sourceURL?.url || null, query: short(input.query || ''), discoveredAt: this.now(),
          salience: clamp(finite(input.score) / 12, 0, 1), failures: 0, retryAfter: 0 };
        this.frontier.set(parsed.url, candidate); added++;
      }
      this._trim(this.frontier, this.maxCandidates);
      return { added, frontierCount: this.frontier.size };
    }
    expandQueries({ concepts = [], engines = [] } = {}) {
      const terms = words((Array.isArray(concepts) ? concepts : []).join(' '));
      const remembered = Array.from(this.concepts).sort((a, b) => a[1] - b[1]).slice(0, 8).map(item => item[0]);
      const vocabulary = terms.length ? terms : remembered;
      const providers = engines.filter(engine => engine && typeof engine.buildUrl === 'function').slice(0, 24);
      if (!providers.length) return { added: 0, query: null, implementation: 'heuristic concept/topic query synthesis' };
      let added = 0, lastQuery = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const cursor = this.queryCursor++, topic = TOPICS[Math.floor(cursor / providers.length) % TOPICS.length];
        const term = vocabulary.length ? vocabulary[Math.floor(cursor / (TOPICS.length * providers.length)) % vocabulary.length] : '';
        const query = (term + ' ' + topic).trim();
        const provider = providers[cursor % providers.length];
        const key = short(provider.name, 80) + ':' + query;
        if (this.queryMemory.has(key)) continue;
        let url; try { url = provider.buildUrl(query); } catch (_) { continue; }
        const result = this.enqueue([{ url, title: `${short(provider.name, 60)}: ${query}`, source: 'search', query }]);
        this.queryMemory.add(key); this._trim(this.queryMemory, 256);
        added += result.added; lastQuery = query;
      }
      return { added, query: lastQuery, implementation: 'heuristic concept/topic query synthesis' };
    }
    _features(candidate, context) {
      const current = normalizeURL(context.currentUrl || ''), terms = words((context.concepts || []).join(' '));
      const anchorWords = words(candidate.title + ' ' + candidate.query), unseen = anchorWords.filter(term => !this.concepts.has(term)).length;
      const domainCount = this.domains.get(candidate.domain) || 0;
      const recent = this.recentPages.slice(-8).filter(page => page.domain === candidate.domain).length;
      const features = new Float32Array(INPUT);
      features.set([1, 1 / (1 + domainCount), unseen / Math.max(1, anchorWords.length),
        terms.filter(term => anchorWords.includes(term)).length / Math.max(1, terms.length), candidate.source === 'observed-link' ? 1 : 0,
        candidate.source === 'search' ? 1 : 0, candidate.source === 'catalog' ? 1 : 0,
        candidate.salience, candidate.domain !== current?.domain ? 1 : 0, candidate.onion ? 1 : 0,
        recent / 8, clamp((this.now() - candidate.discoveredAt) / 3600000, 0, 1), candidate.failures / 3,
        Math.min(1, candidate.title.length / 100), Math.min(1, new URL(candidate.url).pathname.split('/').length / 8),
        clamp(finite(context.predictionError), 0, 1)]);
      return features;
    }
    choose(context = {}) {
      const now = this.now(), current = normalizeURL(context.currentUrl || ''), preferred = normalizeURL(context.preferredUrl || ''), tor = context.tor || {};
      const torReady = tor.available === true && tor.proxyApplied === true && Number.isFinite(tor.checkedAt) && now >= tor.checkedAt && now - tor.checkedAt < 60000;
      let best = null;
      for (const candidate of this.frontier.values()) {
        if (candidate.url === current?.url || this.visits.has(candidate.url) || this.redirects.has(candidate.url) || candidate.retryAfter > now || candidate.failures >= 3 || candidate.onion && !torReady) continue;
        if (this.pending?.url === candidate.url) continue;
        if (typeof context.isAllowed === 'function' && !context.isAllowed(candidate)) continue;
        const features = this._features(candidate, context), prediction = forward(this.model, features).value;
        // These priors ensure exploration before any training data exists. The
        // learned prediction contributes to ranking but cannot defeat URL guards.
        const recent = this.recentPages.slice(-3).filter(page => page.domain === candidate.domain).length;
        const exploration = .14 / Math.sqrt(1 + (this.domains.get(candidate.domain) || 0));
        const score = prediction * .8 + features[1] * .55 + features[2] * .4 + features[3] * .25 +
          features[4] * .45 + features[7] * .2 + features[8] * .35 + exploration - recent * .65 - candidate.failures * .6 + (preferred?.url === candidate.url ? .15 : 0);
        if (!best || score > best.score || score === best.score && candidate.url < best.url) best = { ...candidate, features: Array.from(features), score, predictedYield: prediction };
      }
      if (!best) return null;
      const selectionId = `research-${++this.sequence}`;
      const reason = `${best.source}; ${this.domains.has(best.domain) ? 'previously explored domain' : 'new domain'}; learned yield ${best.predictedYield.toFixed(3)}`;
      const result = { ...best, selectionId, reason, selection: 'adaptive frontier / outcome-trained neural ranker', at: now };
      this.selections.set(selectionId, result); this._trim(this.selections, 16);
      this.lastDecision = { url: best.url, reason, score: best.score, at: now };
      return { ...result, features: result.features.slice() };
    }
    markDispatched(pick, { tabId } = {}) {
      const selected = this.selections.get(pick?.selectionId);
      if (!selected || selected.url !== pick.url || this.pending) return { status: 'blocked', reason: 'No matching selection or another navigation is pending' };
      this.pending = { ...selected, features: selected.features.slice(), tabId, dispatchedAt: this.now() };
      this.navigationRecovery = null;
      this.selections.delete(pick.selectionId);
      return { status: 'dispatched', url: selected.url, selectionId: selected.selectionId };
    }
    ingest(observation, options = {}) {
      if (options.verified !== true || !observation || /^proprioceptiveHold/.test(observation.domWeirdAction || '')) return { status: 'rejected', reason: 'Requires a verified current-document observation' };
      const parsed = normalizeURL(observation.url || '');
      if (!parsed) return { status: 'rejected', reason: 'Observation URL is outside public discovery scope' };
      if (this.navigationRecovery?.tabId === options.tabId) this.navigationRecovery = null;
      const now = this.now(), concepts = words((options.concepts || []).join(' ') + ' ' + short(observation.title) + ' ' + (Array.isArray(observation.specimens) ? observation.specimens.slice(0, 24).map(value => short(value, 240)).join(' ') : ''));
      const excerpt = short(observation.researchExcerpt, 2000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
      const fingerprint = hash(parsed.url + ':' + short(observation.domMerkleRootHex) + ':' + concepts.join('|') + ':' + excerpt).toString(16);
      const old = this.visits.get(parsed.url);
      const added = this.enqueue((observation.doors || []).slice(0, 128), { baseURL: parsed.url, discoveredFrom: parsed.url, source: 'observed-link' });
      // Departure responds to acknowledged page content, not movement of the
      // creature/colliders or changing internal concepts. This state is transient
      // and bound to the current tab/document; persisted visits cannot shorten
      // the reading time of a newly loaded document.
      const contentFingerprint = hash(short(observation.title) + ':' + excerpt).toString(16);
      const exploration = explorationEvidence(observation.exploration);
      const progress = this.pageProgress;
      const sameDocument = progress && progress.url === parsed.url && progress.tabId === options.tabId &&
        progress.documentStartedAt === options.documentStartedAt;
      if (!sameDocument) {
        this.pageProgress = { url: parsed.url, tabId: options.tabId, documentStartedAt: options.documentStartedAt,
          firstObservedAt: now, lastObservedAt: now, lastProgressAt: now, contentFingerprint,
          observations: 1, unchangedObservations: 0, discoveredLinks: added.added, exploration };
      } else {
        const advanced = progress.contentFingerprint !== contentFingerprint || added.added > 0;
        progress.lastObservedAt = now; progress.observations++; progress.discoveredLinks += added.added;
        progress.unchangedObservations = advanced ? 0 : progress.unchangedObservations + 1;
        if (advanced) progress.lastProgressAt = now;
        progress.contentFingerprint = contentFingerprint;
        progress.exploration = exploration;
      }
      const requested = normalizeURL(options.requestedUrl || '');
      const matchesPending = this.pending && this.pending.tabId === options.tabId && (this.pending.url === parsed.url || requested?.url === this.pending.url);
      if (old?.fingerprint === fingerprint) {
        let learning = null;
        // A newly dispatched URL can redirect to previously observed content.
        // Acknowledge that actual arrival, penalize its lack of discovery yield,
        // and do not misclassify it later as a network timeout.
        if (matchesPending) {
          learning = train(this.model, this.pending.features, -.25);
          if (this.pending.url !== parsed.url) { this.redirects.set(this.pending.url, parsed.url); this._trim(this.redirects, this.maxHistory); }
          this.frontier.delete(this.pending.url); this.pending = null;
        }
        return { status: 'duplicate', ...added, learned: Boolean(learning), learning };
      }
      const unseen = concepts.filter(term => !this.concepts.has(term)).length;
      const newDomain = !this.domains.has(parsed.domain);
      const record = { ...parsed, title: short(observation.title), at: now, fingerprint, concepts: concepts.slice(0, 20), excerpt,
        source: 'verified page observation', contentScope: 'Observed page text; claims have not been fact-checked' };
      this.visits.delete(parsed.url); this.visits.set(parsed.url, record); this._trim(this.visits, this.maxHistory);
      if (!old) { this.domains.set(parsed.domain, (this.domains.get(parsed.domain) || 0) + 1); this._trim(this.domains, this.maxHistory); }
      for (const term of concepts) { this.concepts.set(term, (this.concepts.get(term) || 0) + 1); }
      this._trim(this.concepts, this.maxConcepts);
      this.frontier.delete(parsed.url); this.observations++;
      this.recentPages.push(record); if (this.recentPages.length > 32) this.recentPages.shift();
      let learning = null;
      // requestedUrl is accepted only from the host's main-frame redirect event,
      // after it matched this pending navigation. Same-tab coincidence is not proof.
      if (matchesPending) {
        const reward = clamp(.15 + .35 * unseen / Math.max(1, concepts.length) + .2 * (newDomain ? 1 : 0) +
          .2 * Math.min(1, added.added / 8) + .1 * clamp(finite(options.predictionProgress), -1, 1) - (old ? .3 : 0), -1, 1);
        learning = train(this.model, this.pending.features, reward);
        if (this.pending.url !== parsed.url) { this.redirects.set(this.pending.url, parsed.url); this._trim(this.redirects, this.maxHistory); this.frontier.delete(this.pending.url); record.requestedUrl = this.pending.url; }
        this.pending = null;
      }
      return { status: 'observed', ...added, newConcepts: unseen, newDomain, learned: Boolean(learning), learning, provenance: record };
    }
    failNavigation({ tabId, url, reason = 'navigation failed' } = {}) {
      const normalized = normalizeURL(url || '');
      if (!this.pending || this.pending.tabId !== tabId || normalized?.url !== this.pending.url) return { status: 'ignored', reason: 'Failure does not match the dispatched navigation' };
      const pending = this.pending, candidate = this.frontier.get(pending.url);
      if (candidate) { candidate.failures++; candidate.retryAfter = this.now() + Math.min(300000, 30000 * Math.pow(2, candidate.failures - 1)); }
      const learning = train(this.model, pending.features, -.75);
      this.pending = null;
      return { status: 'failed', url: pending.url, reason: short(reason), learned: true, learning };
    }
    cancelPending(reason = 'navigation superseded') {
      const pending = this.pending; this.pending = null;
      this.navigationRecovery = null;
      return { status: pending ? 'cancelled' : 'idle', reason, url: pending?.url || null, learned: false };
    }
    evaluate(samples) {
      if (!Array.isArray(samples) || !samples.length || samples.length > 256) throw new Error('Evaluation requires 1–256 held-out feature/reward samples');
      let squaredError = 0, absoluteError = 0;
      for (const sample of samples) {
        if (!Array.isArray(sample?.features) || sample.features.length !== INPUT || sample.features.some(value => typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1) || !Number.isFinite(sample.reward) || Math.abs(sample.reward) > 1) throw new Error('Invalid evaluation sample');
        const error = forward(this.model, sample.features).value - sample.reward;
        squaredError += error * error; absoluteError += Math.abs(error);
      }
      return { sampleCount: samples.length, meanSquaredError: squaredError / samples.length, meanAbsoluteError: absoluteError / samples.length,
        modelUpdates: this.model.counters[0], scope: 'Caller-supplied held-out navigation utility samples; no model updates during evaluation' };
    }
    navigationReadiness(input = {}) {
      const now = this.now(), current = String(input.currentUrl || '');
      if (!this.stall || this.stall.url !== current) this.stall = { url: current, since: now };
      const started = finite(input.lastStartedAt, this.pending?.dispatchedAt ?? this.stall.since);
      const readyAt = finite(input.lastReadyAt, started);
      const dwellMs = Math.max(0, now - (input.pageReady ? readyAt : started));
      const progress = this.pageProgress, normalized = normalizeURL(current);
      const currentProgress = progress && progress.url === normalized?.url && progress.tabId === input.tabId &&
        progress.documentStartedAt === input.lastStartedAt && now >= progress.lastObservedAt && now - progress.lastObservedAt <= 5000;
      const explored = currentProgress && ['exhausted', 'blocked'].includes(progress.exploration?.phase);
      const settled = currentProgress && (explored || progress.unchangedObservations >= 2 && now - progress.lastProgressAt >= 3500);
      const targetDwellMs = settled ? this.settledDwellMs : this.minDwellMs;
      let reason = '', recovery = false;
      if (input.enabled === false) reason = 'Auto-Hop is off';
      else if (input.paused) reason = 'Autonomy is paused';
      else if (input.pinned || input.protectedPage) reason = 'Current page is protected from autonomous replacement';
      else if (Number.isFinite(input.lastUserNavAt) && now - input.lastUserNavAt < 15000) reason = 'Respecting recent user navigation';
      else if (currentProgress && progress.exploration?.phase === 'yielding') reason = 'Respecting current page interaction';
      if (!reason && this.navigationRecovery?.url === current && this.navigationRecovery.tabId === input.tabId &&
          this.navigationRecovery.documentStartedAt === input.lastStartedAt && now - this.navigationRecovery.at <= this.loadTimeoutMs) recovery = true;
      // The dispatch deadline must survive redirects and repeated load-start
      // events. Checking it after the loading/reading guards can postpone it
      // indefinitely, making a redirecting page monopolize the creature.
      if (!reason && this.pending && now - this.pending.dispatchedAt >= this.loadTimeoutMs) {
        this.failNavigation({ tabId: this.pending.tabId, url: this.pending.url, reason: 'No verified destination observation before deadline' });
        // Readiness is checked once by the scheduler and again on dispatch.
        // Retain this document-bound recovery after settling the pending credit.
        this.navigationRecovery = { url: current, tabId: input.tabId, documentStartedAt: input.lastStartedAt, at: now };
        recovery = true;
      }
      if (!reason && !recovery && (!input.pageReady || input.isLoading)) {
        if (now - started >= this.loadTimeoutMs) recovery = true;
        else reason = 'Waiting for page readiness within loading deadline';
      } else if (!reason && !recovery && dwellMs < targetDwellMs) reason = 'Reading the current page before departure';
      if (!reason && this.pending) {
        reason = 'Waiting for the dispatched destination observation';
      }
      this.lastReadiness = { ready: !reason, reason: reason || (recovery ? 'Recovering from a stalled or unobserved page' : dwellMs >= this.maxDwellMs ? 'Maximum dwell reached; exploring next frontier' : settled ? 'Verified content and links settled; exploring next frontier' : 'Ready for a new observed or discovered destination'),
        recovery, dwellMs, targetDwellMs, progress: currentProgress ? { observations: progress.observations, unchangedObservations: progress.unchangedObservations,
          quietMs: Math.max(0, now - progress.lastProgressAt), discoveredLinks: progress.discoveredLinks,
          explorationPhase: progress.exploration?.phase || null } : null };
      return { ...this.lastReadiness, progress: this.lastReadiness.progress && { ...this.lastReadiness.progress } };
    }
    snapshot() {
      return { implementation: 'online 16×12×1 tanh navigation ranker', queryImplementation: 'heuristic observed-concept/topic synthesis',
        frontierCount: this.frontier.size, visitedPages: this.visits.size, visitedDomains: this.domains.size,
        observations: this.observations, modelUpdates: this.model.counters[0], lastReward: this.model.counters[1], lastLoss: this.model.counters[2],
        pending: this.pending ? { url: this.pending.url, dispatchedAt: this.pending.dispatchedAt, tabId: this.pending.tabId } : null,
        lastDecision: this.lastDecision && { ...this.lastDecision }, lastReadiness: this.lastReadiness && { ...this.lastReadiness, progress: this.lastReadiness.progress && { ...this.lastReadiness.progress } },
        recentPages: this.recentPages.slice(-8).map(page => ({ ...page, concepts: page.concepts.slice(), excerpt: short(page.excerpt, 240) })),
        memoryLimits: { frontier: this.maxCandidates, history: this.maxHistory, concepts: this.maxConcepts },
        scope: 'Local navigation utility learning; no language comprehension, sentience, general intelligence, or Tor reachability claim' };
    }
    exportState() {
      return { version: VERSION, model: Object.fromEntries(Object.entries(this.model).map(([key, value]) => [key, Array.from(value)])),
        frontier: Array.from(this.frontier.values()).map(value => ({ ...value })), visits: Array.from(this.visits.values()).map(value => ({ ...value, concepts: value.concepts.slice() })),
        domains: Array.from(this.domains), concepts: Array.from(this.concepts), redirects: Array.from(this.redirects), observations: this.observations,
        sequence: this.sequence, queryCursor: this.queryCursor, queryMemory: Array.from(this.queryMemory) };
    }
    restoreState(record) {
      // Validate all tensors and bounded metadata before mutating any live state.
      if (!record || record.version !== VERSION || !record.model || !Array.isArray(record.frontier) || record.frontier.length > 1024 || !Array.isArray(record.visits) || record.visits.length > 1024) throw new Error('Unsupported or oversized research state');
      for (const [key, value] of Object.entries(this.model)) {
        const data = record.model[key];
        if (!Array.isArray(data) || data.length !== value.length || data.some(number => typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > (key === 'counters' ? 1e12 : 3))) throw new Error('Invalid research model tensor: ' + key);
      }
      for (const key of ['domains', 'concepts']) if (!Array.isArray(record[key]) || record[key].length > 2048 || record[key].some(entry => !Array.isArray(entry) || typeof entry[0] !== 'string' || entry[0].length > 253 || !Number.isFinite(entry[1]) || entry[1] < 0 || entry[1] > 1e9)) throw new Error('Invalid research memory: ' + key);
      if (!Array.isArray(record.queryMemory) || record.queryMemory.length > 256 || record.queryMemory.some(value => typeof value !== 'string' || value.length > 300)) throw new Error('Invalid query memory');
      if (record.frontier.some(candidate => candidate?.salience !== undefined && (typeof candidate.salience !== 'number' || !Number.isFinite(candidate.salience) || candidate.salience < 0 || candidate.salience > 1))) throw new Error('Invalid frontier salience');
      if (record.redirects !== undefined && (!Array.isArray(record.redirects) || record.redirects.length > 1024 || record.redirects.some(entry => !Array.isArray(entry) || !normalizeURL(entry[0]) || !normalizeURL(entry[1])))) throw new Error('Invalid redirect memory');
      for (const key of ['observations', 'sequence', 'queryCursor']) if (!Number.isSafeInteger(record[key]) || record[key] < 0 || record[key] > 1e12) throw new Error('Invalid research counter');
      const restored = new ResearchPolicy({ now: this.now, maxCandidates: this.maxCandidates, maxHistory: this.maxHistory, maxConcepts: this.maxConcepts });
      // enqueue bounds one incoming observation to 256 candidates. A checkpoint
      // contains the complete bounded frontier (384 by default), so restore it
      // in bounded batches instead of silently dropping all entries after 256.
      for (let offset = 0; offset < record.frontier.length; offset += 256) restored.enqueue(record.frontier.slice(offset, offset + 256));
      for (const candidate of record.frontier) {
        const normalized = normalizeURL(candidate?.url || ''), target = normalized && restored.frontier.get(normalized.url);
        if (target) {
          // Export persists normalized salience, not the original DOM score.
          // Re-enqueueing alone would divide an absent score and silently erase
          // this input to both the neural ranker and the exploration prior.
          target.salience = clamp(finite(candidate.salience), 0, 1);
          target.failures = bounded(candidate.failures, 0, 0, 3);
          target.retryAfter = clamp(finite(candidate.retryAfter), 0, this.now() + 300000);
          target.discoveredAt = clamp(finite(candidate.discoveredAt), 0, this.now());
        }
      }
      for (const visit of record.visits) {
        const parsed = normalizeURL(visit?.url || ''); if (!parsed) continue;
        restored.visits.set(parsed.url, { ...parsed, title: short(visit.title), at: clamp(finite(visit.at), 0, this.now()), fingerprint: short(visit.fingerprint, 16), concepts: words((Array.isArray(visit.concepts) ? visit.concepts : []).join(' ')).slice(0, 20), excerpt: short(visit.excerpt, 2000), source: 'restored verified page record', contentScope: 'Observed page text; claims have not been fact-checked' });
        restored.frontier.delete(parsed.url);
      }
      this.frontier = restored.frontier; this.visits = restored.visits; this._trim(this.visits, this.maxHistory);
      this.domains = new Map(record.domains); this._trim(this.domains, this.maxHistory);
      this.concepts = new Map(record.concepts); this._trim(this.concepts, this.maxConcepts);
      this.redirects = new Map(record.redirects || []); this._trim(this.redirects, this.maxHistory);
      for (const [key, value] of Object.entries(this.model)) value.set(record.model[key]);
      this.observations = record.observations; this.sequence = record.sequence; this.queryCursor = record.queryCursor; this.queryMemory = new Set(record.queryMemory);
      this.recentPages = Array.from(this.visits.values()).slice(-32); this.pending = null; this.selections.clear(); this.lastDecision = null;
      this.pageProgress = null; this.lastReadiness = null; this.stall = null; this.navigationRecovery = null;
      return { status: 'restored', modelUpdates: this.model.counters[0], frontierCount: this.frontier.size };
    }
  }
  return { create: options => new ResearchPolicy(options), ResearchPolicy, normalizeURL, dimensions: Object.freeze({ input: INPUT, hidden: HIDDEN, output: 1, parameters: INPUT * HIDDEN + HIDDEN + HIDDEN + 1 }) };
});
