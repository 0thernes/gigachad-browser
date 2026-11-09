'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { create } = require('../systems/alive-cognitive-faculties');
const Research = require('../systems/alive-research-policy');
const source = fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-cognitive-faculties.js'), 'utf8');
const page = (i = 1) => ({ url: `https://source.example/${i}`, title: `Architecture code evidence ${i}`,
  researchExcerpt: `Observed mechanism, software implementation and benchmark limitations ${i}.`, observedAt: 1700000000000 + i,
  doors: [{ href: `https://reference.example/${i}`, text: 'Architecture source code benchmark evidence' }] });

test('three local research roles and one optional inference call produce real bounded frontier proposals', async () => {
  const proposals = [], commits = [], calls = [];
  const api = create({ plan: async (payload, signal) => { calls.push({ payload, signal }); return { status: 'completed', model: 'configured-fixture',
    proposal: { queries: ['measured heldout learning', 'javascript:bad()', 'https://unobserved.example/'], hypothesis: 'This remains unverified' } }; },
    enqueue: value => { proposals.push(value); return { added: 4 }; }, commit: (...value) => commits.push(value) });
  api.observe(page());
  const result = await api.runSwarm();
  assert.equal(result.status, 'completed'); assert.equal(calls.length, 1);
  assert.equal(calls[0].payload.focus, 'swarm');
  assert.equal(result.evidence.tasks.length, 3);
  assert.ok(result.evidence.tasks.every(t => t.implementation.includes('lexical')));
  assert.equal(result.evidence.linksQueued, 4);
  assert.ok(proposals[0].queries.includes('measured heldout learning'));
  assert.ok(!proposals[0].queries.some(query => /javascript:|https:\/\//.test(query)));
  assert.equal(proposals[0].candidates[0].discoveredFrom, page().url);
  assert.equal(commits[0][0], 'swarm');
  const writing = await api.runWrite();
  assert.equal(writing.status, 'completed'); assert.equal(writing.evidence.persisted, false);
  assert.match(api.snapshot().writing.text, /Unverified model hypothesis \(configured-fixture\)/);
  assert.match(api.snapshot().writing.text, /https:\/\/source.example\/1/);
});

test('missing inference retains useful local analysis while missing frontier stays explicitly degraded', async () => {
  const queued = [];
  const api = create({ plan: async () => { throw new Error('model offline'); }, enqueue: value => { queued.push(value); return { added: 3 }; } });
  api.observe(page());
  const local = await api.runSwarm();
  assert.equal(local.status, 'completed'); assert.equal(local.evidence.inferenceStatus, 'unavailable');
  assert.equal(local.evidence.model, null); assert.equal(queued[0].queries.length, 3);
  const disconnected = create(); disconnected.observe(page());
  const missing = await disconnected.runSwarm();
  assert.equal(missing.status, 'observed'); assert.equal(missing.evidence.frontierStatus, 'unavailable');
  assert.equal(missing.evidence.linksQueued, 0); assert.match(missing.reason, /frontier/);
});

test('empty, paused, duplicate and concurrently pending work do not invent extra executions', async () => {
  let active = true, resolve, calls = 0;
  const api = create({ active: () => active, plan: () => { calls++; return new Promise(done => { resolve = done; }); }, enqueue: () => ({ added: 1 }) });
  assert.equal((await api.runSwarm()).status, 'blocked');
  assert.equal((await api.runWrite()).status, 'blocked');
  api.observe(page()); active = false;
  assert.equal((await api.runSwarm()).status, 'blocked'); active = true;
  const pending = api.runSwarm(); assert.equal((await api.runSwarm()).status, 'blocked'); assert.equal(calls, 1);
  resolve({ status: 'unavailable', reason: 'fixture' }); await pending;
  assert.equal((await api.runSwarm()).evidence.reused, true);
  await api.runWrite(); assert.equal((await api.runWrite()).evidence.reused, true);
});

for (const cause of ['signal', 'generation', 'visibility']) test(`late inference after ${cause} cancellation cannot enqueue or update shared memory`, async () => {
  let resolve, active = true, enqueues = 0, commits = 0;
  const api = create({ active: () => active, plan: () => new Promise(done => { resolve = done; }), enqueue: () => { enqueues++; }, commit: () => { commits++; } });
  api.observe(page()); const abort = new AbortController(); const pending = api.runSwarm({ signal: abort.signal });
  if (cause === 'signal') abort.abort(); else if (cause === 'generation') api.cancel(); else active = false;
  resolve({ status: 'completed', model: 'late', proposal: { queries: ['discard this proposal'] } });
  assert.equal((await pending).status, 'blocked'); assert.equal(enqueues, 0); assert.equal(commits, 0);
  assert.equal((await api.runWrite()).status, 'blocked');
});

test('new topics on unchanged pages receive distinct analysis identities and notebook entries', async () => {
  const api = create({ enqueue: () => ({ added: 1 }) }); api.observe(page());
  await api.runSwarm({ topic: 'First topic' }); await api.runWrite();
  const first = api.snapshot();
  await api.runSwarm({ topic: 'Second topic' }); const second = await api.runWrite();
  assert.equal(second.status, 'completed'); assert.equal(api.snapshot().revision, first.revision);
  assert.notEqual(second.evidence.analysisId, first.writing.analysisId);
  assert.equal(api.snapshot().memory.entries, 2); assert.match(api.snapshot().writing.text, /Second topic/);
});

test('input, provider, commit and snapshot mutations cannot rewrite retained source provenance', async () => {
  const raw = page(), proposed = [];
  const api = create({ plan: async payload => { payload.recent[0].url = 'https://attacker.example/'; payload.candidates[0].url = 'https://attacker.example/link'; return { status: 'unavailable' }; },
    enqueue: payload => { proposed.push(JSON.parse(JSON.stringify(payload))); payload.candidates[0].url = 'https://changed.example/'; return { added: 1 }; },
    commit: (_kind, value) => { if (value.sources) value.sources[0].url = 'https://mutated.example/'; } });
  api.observe(raw); raw.doors[0].href = 'https://not-observed.example/'; raw.researchExcerpt = 'changed after capture';
  await api.runSwarm(); await api.runWrite();
  const snapshot = api.snapshot(); snapshot.swarm.sources[0].url = 'https://tampered.example/';
  assert.equal(proposed[0].discoveredFrom, page().url);
  assert.equal(proposed[0].candidates[0].url, page().doors[0].href);
  assert.equal(api.snapshot().swarm.sources[0].url, page().url);
  assert.match(api.snapshot().writing.text, /Observed mechanism/);
  assert.doesNotMatch(api.snapshot().writing.text, /attacker|not-observed|changed after capture|mutated|tampered/);
});

test('pages, links, excerpts, events and notebook history remain bounded and bad dates cannot break writing', async () => {
  let stored;
  const api = create({ clock: () => 1700000000000, enqueue: () => ({ added: 999999 }), persist: value => { stored = value; return true; } });
  for (let i = 0; i < 100; i++) api.observe({ ...page(i), observedAt: 1e300, researchExcerpt: 'z'.repeat(9000),
    doors: Array.from({ length: 100 }, (_, n) => ({ href: `https://reference.example/${n}`, text: 'code evidence' })) });
  assert.equal(api.snapshot().observedPages, 24);
  for (let i = 0; i < 15; i++) { await api.runSwarm({ topic: 'bounded topic ' + i }); await api.runWrite(); }
  const snap = api.snapshot();
  assert.equal(snap.swarm.sources.length, 6); assert.ok(snap.swarm.sources.every(p => p.excerpt.length <= 4000));
  assert.ok(snap.swarm.tasks.every(t => t.candidates.length <= 4));
  assert.ok(snap.swarm.linksQueued <= 21); assert.ok(snap.events.length <= 80);
  assert.equal(snap.memory.entries, 12); assert.ok(snap.writing.text.length <= 12000);
  assert.equal(JSON.parse(stored).notes.length, 12);
  assert.equal(api.observe({ url: 'javascript:bad()' }).status, 'blocked');
  assert.equal(api.observe({ url: 'https://user:secret@source.example/' }).status, 'blocked');
  assert.equal(api.observe({ url: 'https://source.example/' + 'x'.repeat(3000) }).status, 'blocked');
});

test('verified notebook persistence restores prior notes and appends instead of replacing them', async () => {
  let stored;
  const options = { enqueue: () => ({ added: 1 }), persist: value => { stored = value; return true; } };
  const first = create(options); first.observe(page()); await first.runSwarm(); await first.runWrite();
  const oldText = first.snapshot().writing.text;
  const next = create({ ...options, load: () => stored });
  assert.equal(next.snapshot().memory.restoration.status, 'restored');
  assert.equal(next.snapshot().writing.text, oldText);
  next.observe(page(2)); await next.runSwarm(); await next.runWrite();
  const saved = JSON.parse(stored);
  assert.equal(saved.notes.length, 2); assert.equal(saved.notes[0].text, oldText);
  assert.notEqual(saved.notes[0].analysisId, saved.notes[1].analysisId);
});

test('malformed storage and unacknowledged writes cannot claim durable notebook success', async () => {
  const corrupt = create({ load: () => '{invalid json' });
  assert.equal(corrupt.snapshot().memory.restoration.status, 'error'); assert.equal(corrupt.snapshot().memory.entries, 0);
  for (const persist of [() => false, () => { throw new Error('disk unavailable'); }, () => Promise.resolve(true)]) {
    const api = create({ persist, enqueue: () => ({ added: 1 }) }); api.observe(page()); await api.runSwarm();
    assert.equal((await api.runWrite()).status, 'error'); assert.equal(api.snapshot().memory.entries, 0);
  }
});

test('shared-memory commit failures remain retryable without duplicate durable notes', async () => {
  let failSwarm = true, failWrite = true, stored;
  const api = create({ enqueue: () => ({ added: 1 }), persist: value => { stored = value; return true; },
    commit(kind) { if (kind === 'swarm' && failSwarm) { failSwarm = false; throw new Error('working unavailable'); }
      if (kind === 'writing' && failWrite) { failWrite = false; throw new Error('semantic unavailable'); } } });
  api.observe(page()); assert.equal((await api.runSwarm()).status, 'error');
  assert.equal((await api.runSwarm()).status, 'completed');
  assert.equal((await api.runWrite()).status, 'error'); assert.equal((await api.runWrite()).status, 'completed');
  assert.equal(JSON.parse(stored).notes.length, 1);
});

function installation() {
  const store = new Map(), handlers = new Map(), calls = [];
  const root = { document: { hidden: false }, localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    aliveResearch: Research.create(), gigachad: { invoke: async (channel, payload) => { calls.push({ channel, payload }); return { status: 'completed', model: 'fixture-model', proposal: { queries: ['new verified model research'] } }; } },
    addEventListener: (type, handler) => handlers.set(type, handler) };
  const h = { workingState: {}, semanticMemory: {}, offspringColony: [{ offspringId: 'a' }], saves: 0, savePersistentGenome() { this.saves++; } };
  const context = { module: { exports: {} }, URL, Date, POLYMATH_SEARCH_ENGINES: [{ buildUrl: query => 'https://search.example/?q=' + encodeURIComponent(query) }] };
  vm.runInNewContext(source, context);
  return { root, h, store, handlers, calls, install: () => context.module.exports.install(root, h) };
}

test('installation feeds actual research frontier, host memory and one shared offspring service', async () => {
  const f = installation(), api = f.install(); api.observe(page());
  assert.equal(f.install(), api, 'installation is idempotent');
  assert.equal(f.h.aliveCognitiveFaculties, api);
  assert.equal(f.h.offspringColony[0].cognitiveFaculties, api);
  assert.equal(Object.getOwnPropertyDescriptor(f.h.offspringColony[0], 'cognitiveFaculties').enumerable, false);
  assert.equal((await f.root.runAliveGhostSwarm()).status, 'completed');
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].channel, 'alive-research-plan');
  assert.ok(f.root.aliveResearch.frontier.has(page().doors[0].href));
  assert.ok([...f.root.aliveResearch.frontier.keys()].some(value => new URL(value).searchParams.get('q') === 'new verified model research'));
  assert.equal(f.h.workingState.researchGoal, page().title);
  assert.ok(f.h.workingState.researchQueries.includes('new verified model research'));
  f.h.offspringColony.push({ offspringId: 'b' });
  assert.equal((await f.root.runAliveGhostWrite()).status, 'completed');
  assert.equal(f.h.offspringColony[1].cognitiveFaculties, api);
  assert.match(f.h.semanticMemory.creatureNotebook.text, /Observed mechanism/);
  assert.equal(f.h.saves, 1); assert.ok(f.store.has('gigachad_creature_notebook_v1'));
});

test('installed Pause event fences a pending model proposal before any frontier mutation', async () => {
  const f = installation(); let resolve;
  f.root.gigachad.invoke = () => new Promise(done => { resolve = done; });
  const api = f.install(); api.observe(page()); const pending = f.root.runAliveGhostSwarm();
  f.handlers.get('alive-runtime-event')({ detail: { type: 'stopped' } });
  resolve({ status: 'completed', proposal: { queries: ['must not enqueue'] } });
  assert.equal((await pending).status, 'blocked'); assert.equal(f.root.aliveResearch.frontier.size, 0);
  assert.equal(f.h.workingState.researchGoal, undefined);
});

test('installed explicit research topic is consumed once and restored notebook reaches semantic memory', async () => {
  const first = installation(), api = first.install(); api.observe(page());
  first.root.aliveRequestedResearchTopic = 'Explicit model comparison';
  await first.root.runAliveGhostSwarm(); await first.root.runAliveGhostWrite();
  assert.equal(first.root.aliveRequestedResearchTopic, null);
  assert.equal(first.calls[0].payload.observation.title, 'Explicit model comparison');
  const second = installation();
  second.store.set('gigachad_creature_notebook_v1', first.store.get('gigachad_creature_notebook_v1'));
  const restored = second.install();
  assert.equal(restored.snapshot().memory.entries, 1);
  assert.match(second.h.semanticMemory.creatureNotebook.text, /Explicit model comparison/);
  assert.equal(second.calls.length, 0, 'restoration is not fresh inference or an observed page');
  assert.equal(restored.snapshot().observedPages, 0);
});
