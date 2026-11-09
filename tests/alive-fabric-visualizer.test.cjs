'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Controller } = require('../systems/alive-overdrive-runtime.js');
const { SynapticFabric } = require('../systems/alive-synaptic-fabric.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'systems', 'alive-fabric-visualizer.js'), 'utf8');

function fakeDocument() {
  const byId = new Map();
  const calls = [];
  function element(tag) {
    const node = {
      tagName: tag.toUpperCase(), children: [], style: {}, dataset: {}, attributes: {}, hidden: false, textContent: '',
      clientWidth: 700, width: 0, height: 0, listeners: {},
      setAttribute(name, value) { this.attributes[name] = String(value); },
      append(...items) { for (const item of items) { this.children.push(item); if (item.id) byId.set(item.id, item); } },
      appendChild(item) { this.append(item); return item; },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      getContext() {
        return new Proxy({ calls }, { get(target, key) {
          if (key in target) return target[key];
          return (...args) => { calls.push([String(key), args]); return { width: 10 }; };
        }, set(target, key, value) { target[key] = value; return true; } });
      }
    };
    Object.defineProperty(node, 'id', { get() { return this._id || ''; }, set(value) { this._id = value; byId.set(value, this); } });
    Object.defineProperty(node, 'innerHTML', { set() { throw new Error('innerHTML is forbidden (TrustedHTML CSP)'); } });
    return node;
  }
  const body = element('body');
  const bar = element('div'); bar.id = 'alive-runtime-bar';
  return { calls, body, bar, document: { body, createElement: element, getElementById: id => byId.get(id) || null } };
}

function load({ withRuntime = true } = {}) {
  const dom = fakeDocument();
  const intervals = [];
  const window = { document: dom.document, devicePixelRatio: 1, setInterval: (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; }, clearInterval() {} };
  let fabric = null;
  if (withRuntime) {
    let now = 0;
    const controller = new Controller({ clock: () => now, capabilities: [{ id: 'dom-body', label: 'dom', mode: 'action', intervalMs: 1000, initialDelayMs: 0 }, { id: 'reasoning', label: 'r', mode: 'observe', intervalMs: 1000, initialDelayMs: 5000 }],
      adapters: { 'dom-body': () => ({ evidence: { n: now } }), reasoning: () => ({ status: 'observed', evidence: 1 }) }, onEvent: e => fabric && fabric.handleEvent(e) });
    fabric = new SynapticFabric({ controller, edges: [['dom-body', 'reasoning', 0.5]], clock: () => now });
    controller.start({ automatic: false });
    controller.tick();
    window.aliveOverdrive = controller;
    window.aliveFabric = { snapshot: () => fabric.snapshot() };
    window.humunculusRuntime = {
      agentId: 'creature-1', worldPredError: 0.21, offspringColony: [{ offspringId: 'child-a', fitness: 2.1 }],
      trainableAlifeNeuralHub: { totalBackpropStepsTrained: 10 }, connectome512: { stdpUpdatesCount: 5 },
      neuralSubstrateTelemetry: { sltcMeanTauMs: 2.84, ssmSpectralRadiusRho: 0.97, label: 'not numeric' },
      aliveNeuralCoupling: { snapshot: () => ({ steps: 3, feedbackUpdates: 1, lastReward: 0.01, trainableParameters: 408,
        sources: [{ id: 'brain1Asmodensius', available: true, gate: 0.6 }, { id: 'precision-f64', available: false, gate: 0.5 }] }) }
    };
  }
  window.window = window;
  vm.runInNewContext(source, { window, setInterval: window.setInterval, clearInterval: window.clearInterval });
  return { window, dom, intervals };
}

test('the panel button mounts on the runtime bar and opens a data panel without innerHTML', async () => {
  const { window, dom } = load();
  await new Promise(resolve => setImmediate(resolve));
  const button = dom.document.getElementById('alive-fabric-button');
  assert.ok(button, 'Fabric button mounted');
  assert.equal(window.toggleAliveFabricPanel(true), true);
  const panel = dom.document.getElementById('alive-fabric-panel');
  assert.equal(panel.hidden, false);
  assert.ok(dom.calls.some(([name]) => name === 'arc'), 'graph nodes drawn');
  assert.ok(dom.calls.some(([name, args]) => name === 'fillText' && String(args[0]).includes('faculties')), 'graph metrics labelled');
  assert.ok(dom.calls.some(([name, args]) => name === 'fillText' && String(args[0]) === 'brain1Asmodensius'), 'brain streams listed');
  assert.equal(window.toggleAliveFabricPanel(false), false);
});

test('sampling records only measured numeric series and marks absent sources as absent', () => {
  const { window } = load();
  window.aliveFabricVisualizer.sample();
  window.aliveFabricVisualizer.sample();
  const series = window.aliveFabricVisualizer.series();
  assert.equal(series.get('world pred error').at(-1), 0.21);
  assert.ok(series.has('substrate:sltcMeanTauMs'));
  assert.ok(!series.has('substrate:label'), 'non-numeric telemetry is not plotted');
  assert.equal(series.get('research frontier').at(-1), null, 'missing research policy stays null, not zero');
  assert.equal(series.get('hub backprop/s').at(-1), 0, 'rates are differences of measured counters');
});

test('without a runtime the charts report absence instead of inventing values', () => {
  const { window, dom } = load({ withRuntime: false });
  window.toggleAliveFabricPanel(true);
  const texts = dom.calls.filter(([name]) => name === 'fillText').map(([, args]) => String(args[0]));
  assert.ok(texts.some(text => /not attached/.test(text)));
  assert.ok(texts.some(text => /not installed/.test(text)));
  assert.ok(!dom.calls.some(([name]) => name === 'arc'));
});

test('sampling is bounded and drawing only runs while the panel is open', () => {
  const { window, intervals } = load();
  assert.ok(intervals.some(item => item.ms === 1000), '1 Hz sampler');
  for (let i = 0; i < 600; i++) window.aliveFabricVisualizer.sample();
  for (const ring of window.aliveFabricVisualizer.series().values()) assert.ok(ring.length <= 240);
  assert.ok(!intervals.some(item => item.ms === 250));
  window.toggleAliveFabricPanel(true);
  assert.ok(intervals.some(item => item.ms === 250), '4 Hz draw only after opening');
});
