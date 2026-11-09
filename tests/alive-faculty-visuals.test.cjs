'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { create, fields, trace, timeline, age, number, LIMITS } = require('../systems/alive-faculty-visuals');

class Node {
  constructor(tag, doc) { this.tagName = tag; this.doc = doc; this.children = []; this.attributes = {}; this.listeners = new Map(); this.style = {}; this.hidden = false; this.open = false; this._text = ''; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set innerHTML(_) { throw new Error('HTML interpolation is forbidden in evidence UI'); }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'value') this.value = String(value); }
  getAttribute(key) { return this.attributes[key]; }
  append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  fire(name, data = {}) { for (const fn of this.listeners.get(name) || []) fn({ target: this, currentTarget: this, preventDefault() {}, ...data }); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  get isConnected() { return this === this.doc.body || this === this.doc.head || Boolean(this.parent?.isConnected); }
  focus() { this.doc.activeElement = this; }
}
function fixture() {
  const doc = { hidden: false, activeElement: null, listeners: new Map(), readyState: 'complete' };
  Object.assign(doc, {
    createElement: tag => new Node(tag, doc), createElementNS: (_, tag) => new Node(tag, doc),
    addEventListener: Node.prototype.addEventListener, removeEventListener: Node.prototype.removeEventListener, fire: Node.prototype.fire,
    getElementById(id) { const walk = node => node.attributes.id === id ? node : node.children.map(walk).find(Boolean); return walk(doc.body) || walk(doc.head); }
  });
  doc.body = new Node('body', doc); doc.head = new Node('head', doc);
  const bar = doc.createElement('div'); bar.setAttribute('id', 'alive-runtime-bar'); doc.body.append(bar);
  const clear = doc.createElement('button'); clear.setAttribute('id', 'alive-clear-button'); bar.append(clear);
  let now = 1700000000000, calls = 0, tensorCalls = 0, nextTimer = 0;
  const timers = new Map();
  const state = {
    sampledAt: 5000, running: true, suspended: false, inFlight: 0, queued: 0, health: { issues: 0 }, metrics: { ticks: 4 },
    jobs: [{ id: 'macro', label: 'Macro & RIM', status: 'observed', group: 'observe', completedCount: 1, evidenceAt: 4000, lastDurationMs: 0.2, evidence: { weights: { count: 32, mean: 0 }, active: false } }],
    events: [{ at: 4000, type: 'completed', id: 'macro' }]
  };
  const faculty = { observedPages: 0, memory: { entries: 0 }, swarm: { status: 'completed', topic: '<img src=x onerror=bad()>', linksQueued: 0, completedAt: now, tasks: [{ id: 'verify', label: 'Verify', status: 'completed', sourceCount: 1, result: '<script>bad()</script>' }], sources: [{ url: 'javascript:alert(1)', title: 'Untrusted', excerpt: '<b>text only</b>' }] }, writing: { status: 'completed', text: '<script>draft</script>', sourceCount: 1, completedAt: now }, events: [{ at: now - 500, type: 'draft', detail: 'done' }] };
  const tensors = { sampledAt: now, scope: 'Full inspected array with limited excerpt.', rows: [{ id: 'actor', owner: 'controller', length: 20, dtype: 'Float32Array', inspection: 'full', mean: .2, min: -.1, max: .4, changedValues: null, sample: [0, .1] }] };
  const root = { document: doc, Date: { now: () => now }, setTimeout(fn, ms) { assert.equal(ms, 1000); const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    aliveOverdrive: { snapshot() { calls++; return state; } }, aliveCognitiveFaculties: { snapshot: () => faculty }, getAliveTensorEvidence() { tensorCalls++; return tensors; }, getAliveRuntimeEvidence: () => ({ acceptance: { G1: 'NOT_RUN' } }) };
  const ui = create(root);
  return { doc, root, ui, state, faculty, tensors, timers, calls: () => calls, tensorCalls: () => tensorCalls, advance() { now += 1000; const ready = [...timers.values()]; timers.clear(); for (const fn of ready) fn(); } };
}
function nodes(root, tag) { const result = []; const walk = node => { if (node.tagName === tag) result.push(node); for (const child of node.children) walk(child); }; walk(root); return result; }

test('bounded evidence flattening preserves zero, false, missing fields and detects cycles', () => {
  const object = { zero: 0, false: false, unknown: null, nested: { value: -1 } }; object.self = object;
  assert.deepEqual(fields(object).map(row => row.value), [0, false, null, -1, '[circular reference]']);
  assert.equal(fields(Array.from({ length: 1000 }, (_, i) => i), 8).length, 8);
  assert.equal(number(null), 'unmeasured'); assert.equal(number(0), '0');
  assert.equal(age(1000, null), 'age unavailable'); assert.equal(age(1000, 2000), 'age unavailable'); assert.equal(age(1000, 0), '1s ago');
});

test('charts use actual finite observed values with zero-range and missing data handled honestly', () => {
  assert.deepEqual(trace([]), { points: '', min: null, max: null, samples: 0 });
  const actual = trace([{ at: 1000, value: 0 }, { at: 2000, value: 2 }, { at: 3000, value: NaN }]);
  assert.equal(actual.samples, 2); assert.equal(actual.min, 0); assert.equal(actual.max, 2);
  assert.match(actual.points, /^6\.00,72\.00 534\.00,6\.00$/);
  assert.equal(trace([{ at: 1, value: 0 }]).points, '270.00,39.00');
});

test('event timeline explicitly converts monotonic runtime clock and retains wall-clock faculty receipts', () => {
  assert.deepEqual(timeline({ sampledAt: 500, events: [{ at: 200, type: 'completed' }, { at: 501, type: 'future' }] }, { events: [{ at: 950, type: 'draft' }] }, 1000).map(event => [event.at, event.type]), [[700, 'completed'], [950, 'draft']]);
  assert.equal(timeline({ events: [{ at: 10 }] }, null, 1000).length, 0);
  assert.equal(timeline(null, { events: Array.from({ length: 300 }, (_, at) => ({ at })) }, 1000).length, LIMITS.events);
});

test('panel performs no background snapshots while closed or hidden and never owns more than one timer', () => {
  const f = fixture(); assert.equal(f.calls(), 0); assert.equal(f.tensorCalls(), 0); assert.equal(f.timers.size, 0);
  f.ui.sample(); assert.equal(f.calls(), 0);
  f.ui.open(); f.ui.open(); assert.equal(f.calls(), 1); assert.equal(f.timers.size, 1);
  f.advance(); assert.equal(f.calls(), 2); assert.equal(f.timers.size, 1);
  f.doc.hidden = true; f.doc.fire('visibilitychange'); assert.equal(f.timers.size, 0); f.ui.sample(); assert.equal(f.calls(), 2);
  f.doc.hidden = false; f.doc.fire('visibilitychange'); assert.equal(f.calls(), 2); assert.equal(f.timers.size, 1);
  f.advance(); assert.equal(f.calls(), 3); f.ui.sample(); assert.equal(f.calls(), 3, 'explicit refresh is also limited to one read per second');
  f.doc.getElementById('alive-clear-button').fire('click'); assert.equal(f.timers.size, 0); assert.equal(f.doc.getElementById('alive-evidence-panel').hidden, true);
  f.ui.destroy(); assert.equal(f.doc.getElementById('alive-evidence-panel'), undefined); assert.equal(f.doc.getElementById('alive-evidence-button'), undefined);
  f.doc.fire('visibilitychange'); assert.equal(f.timers.size, 0);
});

test('production panel renders source text safely and preserves expanded task and model inspection while updating', () => {
  const f = fixture(); f.ui.open(); const panel = f.doc.getElementById('alive-evidence-panel');
  assert.match(panel.textContent, /<img src=x onerror=bad\(\)>/); assert.match(panel.textContent, /<script>draft<\/script>/); assert.equal(nodes(panel, 'script').length, 0); assert.equal(nodes(panel, 'a').length, 0);
  assert.match(panel.textContent, /NOT_RUN/); assert.match(panel.textContent, /Float32Array\[20\]/); assert.match(panel.textContent, /changedValuesunavailable/);
  const tensor = nodes(panel, 'details').find(node => node.children[0]?.textContent.startsWith('actor ·'));
  assert.equal(nodes(tensor, 'select')[0].value, 'mean', 'tensor chart begins with measured values rather than allocated length');
  const macro = nodes(panel, 'details').find(node => node.children[0]?.textContent.startsWith('Macro & RIM'));
  const verify = nodes(panel, 'details').find(node => node.children[0]?.textContent.startsWith('Verify'));
  macro.open = true; verify.open = true; f.state.jobs[0].evidence.weights.mean = .3; f.advance();
  assert.equal(nodes(panel, 'details').includes(macro), true); assert.equal(macro.open, true); assert.equal(verify.open, true);
  assert.match(macro.textContent, /0\.3/); assert.match(panel.textContent, /2 display samples/);
});

test('missing providers remain unavailable, errors remain visible and Escape restores focus', () => {
  const f = fixture(), toggle = f.doc.getElementById('alive-evidence-button'); toggle.focus();
  f.root.aliveOverdrive.snapshot = () => { throw new Error('fixture unavailable'); }; delete f.root.aliveCognitiveFaculties; delete f.root.getAliveTensorEvidence;
  f.ui.open(); const panel = f.doc.getElementById('alive-evidence-panel'); assert.match(panel.textContent, /Runtime read failed: fixture unavailable/); assert.match(panel.textContent, /Tensor inspection hook unavailable/); assert.match(panel.textContent, /No source-bound draft/);
  f.doc.fire('keydown', { key: 'Escape' }); assert.equal(panel.hidden, true); assert.equal(f.doc.activeElement, toggle); assert.equal(f.timers.size, 0);
});

test('numeric display history is bounded and removed tensor rows do not retain stale evidence', () => {
  const f = fixture(); f.ui.open(); for (let i = 0; i < 75; i++) f.advance();
  const panel = f.doc.getElementById('alive-evidence-panel'); assert.match(panel.textContent, /60 display samples/); assert.doesNotMatch(panel.textContent, /61 display samples/);
  f.tensors.rows = []; f.state.jobs = []; f.advance(); assert.equal(f.ui.snapshot().capabilities, 0); assert.doesNotMatch(panel.textContent, /Float32Array\[20\]/);
});

test('all returned tensor rows are reachable through pagination and filtering before the display cap', () => {
  const f = fixture();
  f.tensors.rows = Array.from({ length: LIMITS.tensors + 1 }, (_, index) => ({ id: index === LIMITS.tensors ? 'tail-synapses' : `array-${index}`, owner: 'controller', dtype: 'Float32Array', length: 1, mean: index, inspection: 'full' }));
  f.ui.open(); const panel = f.doc.getElementById('alive-evidence-panel');
  assert.equal(f.ui.snapshot().tensors, LIMITS.tensors); assert.equal(f.ui.snapshot().tensorTotal, LIMITS.tensors + 1);
  nodes(panel, 'button').find(node => node.textContent === 'Next tensors').fire('click');
  assert.equal(f.ui.snapshot().tensorPage, 2); assert.match(panel.textContent, /tail-synapses/);
  const search = f.doc.getElementById('alive-evidence-search'); search.value = 'tail-synapses'; search.fire('input');
  assert.equal(f.ui.snapshot().tensors, 1); assert.equal(f.ui.snapshot().tensorPage, 1); assert.match(panel.textContent, /1 match filter/);
  assert.equal(f.calls(), 1, 'paging and filtering reuse snapshots'); assert.equal(f.tensorCalls(), 1);
});
