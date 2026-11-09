'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Controller } = require('../systems/alive-overdrive-runtime.js');
const { SynapticFabric } = require('../systems/alive-synaptic-fabric.js');
const { createRates, concurrentPeaks } = require('../systems/alive-fabric-visualizer.js');

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
      remove() { byId.delete(this.id); },
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
  const listeners = new Map();
  return { calls, body, bar, document: { body, hidden: false, createElement: element, getElementById: id => byId.get(id) || null,
    addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type), fire: type => listeners.get(type)?.() } };
}

function load({ withRuntime = true } = {}) {
  const dom = fakeDocument();
  const intervals = [];
  let now = 0;
  const window = { document: dom.document, devicePixelRatio: 1, performance: { now: () => now }, setInterval: (fn, ms) => { intervals.push({ fn, ms, active: true }); return intervals.length; }, clearInterval(id) { if (intervals[id - 1]) intervals[id - 1].active = false; } };
  let fabric = null;
  if (withRuntime) {
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
  return { window, dom, intervals, advance: (ms = 1000) => { now += ms; }, setTime: value => { now = value; } };
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
  const { window, advance } = load();
  window.toggleAliveFabricPanel(true);
  advance();
  window.aliveFabricVisualizer.sample();
  const series = window.aliveFabricVisualizer.series();
  assert.equal(series.get('world pred error').at(-1), 0.21);
  assert.ok(series.has('substrate:sltcMeanTauMs'));
  assert.ok(!series.has('substrate:label'), 'non-numeric telemetry is not plotted');
  assert.equal(series.get('research frontier').at(-1), null, 'missing research policy stays null, not zero');
  assert.equal(series.get('hub backprop/s').at(-1), 0, 'unchanged counter over measured elapsed time yields zero');
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
  const { window, intervals, advance } = load();
  assert.ok(!intervals.some(item => item.ms === 1000), 'closed panel does not sample');
  window.toggleAliveFabricPanel(true);
  assert.ok(intervals.some(item => item.ms === 1000 && item.active), 'one Hz visible sampler');
  for (let i = 0; i < 600; i++) { advance(); window.aliveFabricVisualizer.sample(); }
  for (const ring of window.aliveFabricVisualizer.series().values()) assert.ok(ring.length <= 240);
  assert.ok(!intervals.some(item => item.ms === 250));
  window.toggleAliveFabricPanel(false);
  assert.ok(!intervals.some(item => item.active), 'closing clears owned sampler');
});

test('concurrency bins measure actual simultaneous intervals, including zero and end-before-start ties', () => {
  assert.deepEqual(concurrentPeaks([], 500, 500, 1), { values: [0], peak: 0 });
  assert.deepEqual(concurrentPeaks([{ start: 0, end: 10 }, { start: 20, end: 30 }], 500, 500, 1), { values: [1], peak: 1 });
  assert.deepEqual(concurrentPeaks([{ start: 0, end: 10 }, { start: 10, end: 20 }], 500, 500, 1), { values: [1], peak: 1 });
  assert.deepEqual(concurrentPeaks([{ start: 0, end: 20 }, { start: 10, end: 30 }], 500, 500, 1), { values: [2], peak: 2 });
  assert.deepEqual(concurrentPeaks([{ start: -10, end: 10 }, { start: 10, end: null }, { start: 30, end: 30 }], 40, 40, 4), { values: [1, 1, 1, 1], peak: 1 });
});

test('counter rates divide by actual elapsed seconds and distinguish first/reset/missing/duplicate samples', () => {
  const rates = createRates();
  assert.equal(rates.read('updates', 10, 0), null);
  assert.equal(rates.read('updates', 16, 2000), 3);
  assert.equal(rates.read('updates', 18, 2000), null, 'duplicate timestamp cannot create a rate or advance baseline');
  assert.equal(rates.read('updates', 18, 3000), 2);
  assert.equal(rates.read('updates', 1, 4000), null, 'counter reset is not a measured zero rate');
  assert.equal(rates.read('updates', 3, 5000), 2);
  assert.equal(rates.read('updates', undefined, 6000), null);
  assert.equal(rates.read('updates', 8, 7000), null, 'missing measurement breaks the rate baseline');
  assert.equal(rates.read('updates', 9, 6500), null, 'clock reversal does not advance baseline');
  assert.equal(rates.read('updates', 10, 8000), 2);
  rates.reset(); assert.equal(rates.read('updates', 20, 9000), null);
});

test('visible lifecycle uses elapsed rates, throttles toggles, and disposes owned timers', () => {
  const { window, dom, intervals, advance } = load();
  window.aliveFabricVisualizer.sample(); assert.equal(window.aliveFabricVisualizer.series().size, 0);
  window.toggleAliveFabricPanel(true); const first = window.aliveFabricVisualizer.series().get('hub backprop/s'); assert.deepEqual(Array.from(first), [null]);
  window.humunculusRuntime.trainableAlifeNeuralHub.totalBackpropStepsTrained = 16;
  advance(2000); window.aliveFabricVisualizer.sample(); assert.equal(window.aliveFabricVisualizer.series().get('hub backprop/s').at(-1), 3);
  window.toggleAliveFabricPanel(true); window.aliveFabricVisualizer.sample(); assert.equal(window.aliveFabricVisualizer.series().get('hub backprop/s').length, 2);
  const draws = dom.calls.length;
  dom.document.hidden = true; dom.document.fire('visibilitychange'); advance(); window.aliveFabricVisualizer.sample();
  assert.equal(dom.calls.length, draws); assert.ok(!intervals.some(item => item.active));
  dom.document.hidden = false; dom.document.fire('visibilitychange'); assert.equal(window.aliveFabricVisualizer.series().get('hub backprop/s').at(-1), null);
  window.aliveFabricVisualizer.destroy(); assert.ok(!intervals.some(item => item.active)); advance(); window.aliveFabricVisualizer.sample(); assert.equal(window.toggleAliveFabricPanel(true), false);
});

test('workspace registration is used for a docked exclusive panel when provided', () => {
  const { window, dom } = load(); const calls = [];
  window.aliveWorkspace = { registerPanel(id, panel, close) { calls.push(['register', id]); dom.body.appendChild(panel); this.close = close; }, prepareExternalPanel(id) { calls.push(['prepare', id]); }, unregisterPanel(id) { calls.push(['unregister', id]); } };
  window.toggleAliveFabricPanel(true); assert.deepEqual(calls.slice(0, 2), [['register', 'fabric'], ['prepare', 'fabric']]);
  window.aliveWorkspace.close(); assert.equal(window.aliveFabricVisualizer.isOpen(), false);
  window.aliveWorkspace.destroy?.();
  window.aliveFabricVisualizer.destroy(); assert.deepEqual(calls.at(-1), ['unregister', 'fabric']);
});

test('runBenchmark renders 5-seed unseen holdout metrics and colony role lenses in section 8', async () => {
  const { window, dom } = load();
  window.aliveFabric.creatureLenses = () => [
    { index: 0, name: 'Primary Homunculus', stage: 'HOST', lensId: 'mechanism', lensLabel: 'Architecture', nodeUtility: 0.72, gateActivation: 0.64, activation: 0.69 },
    { index: 1, name: 'Spawn Alpha', stage: 'B', lensId: 'implementation', lensLabel: 'Code', nodeUtility: 0.58, gateActivation: 0.51, activation: 0.55 }
  ];
  window.AliveUnseenTaskBenchmark = {
    run: async () => ({
      summary: {
        learningBeatFrozenSeeds: 5,
        fabricBeatLearningSeeds: 5,
        pairedDeltas: {
          learningVsFrozenReward: { mean: 12.45 },
          fabricVsLearningReward: { mean: 5.82 }
        },
        byController: {
          heuristic: { unseenHoldoutReward: { mean: -4.99, ci95: [-4.99, -4.99] }, unseenTargetRecall: { mean: 0.25 }, unseenTrapAvoidance: { mean: 0.25 } },
          frozen: { unseenHoldoutReward: { mean: -4.99, ci95: [-4.99, -4.99] }, unseenTargetRecall: { mean: 0.25 }, unseenTrapAvoidance: { mean: 0.25 } },
          learning: { unseenHoldoutReward: { mean: 7.46, ci95: [6.06, 8.86] }, unseenTargetRecall: { mean: 0.72 }, unseenTrapAvoidance: { mean: 0.70 } },
          'fabric-coupled': { unseenHoldoutReward: { mean: 13.28, ci95: [13.04, 13.52] }, unseenTargetRecall: { mean: 0.80 }, unseenTrapAvoidance: { mean: 1.0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runBenchmark();
  assert.equal(report.summary.learningBeatFrozenSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · learn vs frozen')), 'benchmark summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('Colony specialized role lenses (2)')), 'colony lenses drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runAblations renders 38-condition 5-seed architecture ablation deltas in section 9', async () => {
  const { window, dom } = load();
  window.AliveArchitectureAblations = {
    run: async () => ({
      summary: {
        all14BrainsGroupDelta: { mean: 0.00747 },
        all7PrecisionGroupDelta: { mean: 0.00505 },
        allReasoningGroupMarginLoss: { mean: 1.9584 }
      },
      ablations: {
        brains: {
          brain1Asmodensius: { id: 'brain1Asmodensius', sensoryDeltaL2: { mean: 0.00062 }, nonZeroSeeds: 5 },
          'all-14-brains': { id: 'all-14-brains', sensoryDeltaL2: { mean: 0.00747 }, nonZeroSeeds: 5 }
        },
        precision: {
          'precision-f64': { id: 'precision-f64', tier: 'precision', sensoryDeltaL2: { mean: 0.00051 }, nonZeroSeeds: 5 },
          'all-7-precision': { id: 'all-7-precision', tier: 'precision', sensoryDeltaL2: { mean: 0.00505 }, nonZeroSeeds: 5 }
        },
        strataAndSpecialists: {
          'micro-ising': { id: 'micro-ising', tier: 'strata', sensoryDeltaL2: { mean: 0.00048 }, nonZeroSeeds: 5 },
          NMDA_sLTC_Sheet: { id: 'NMDA_sLTC_Sheet', tier: 'specialist-fusion', residualDeltaL2: { mean: 0.142 }, nonZeroSeeds: 5 }
        },
        reasoning: {
          'AoT-contractor': { id: 'AoT-contractor', marginLoss: { mean: 0.42 }, nonZeroSeeds: 5 },
          'all-aot-tot-got': { id: 'all-aot-tot-got', marginLoss: { mean: 1.9584 }, nonZeroSeeds: 5 }
        },
        fabricPathways: {
          'ghost-swarm-role-coupling': { id: 'ghost-swarm-role-coupling', holdoutRewardLossWhenAblated: { mean: 6.11 }, nonZeroSeeds: 5 }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runAblations();
  assert.equal(report.summary.all14BrainsGroupDelta.mean, 0.00747);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('38 conditions × 5 seeds')), 'ablations summary drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runRestartEquivalence renders 5-seed SHA-256 restart equivalence and 6-domain necessity in section 10', async () => {
  const { window, dom } = load();
  window.AliveRestartEquivalence = {
    run: async () => ({
      summary: {
        exactRestartEquivalenceSeeds: 5,
        all6DomainsNecessaryOn5Seeds: true,
        fullRestoreStateL2Drift: { mean: 0 },
        fullRestoreMaxAbsError: { mean: 0 },
        fullRestoreMotorL2Drift: { mean: 0 },
        domainNecessity: {
          optimizer: { domain: 'optimizer', stateL2DriftWhenOmitted: { mean: 0.401297 }, motorL2DriftWhenOmitted: { mean: 0.044986 }, divergingSeeds: 5 },
          recurrent: { domain: 'recurrent', stateL2DriftWhenOmitted: { mean: 0.219802 }, motorL2DriftWhenOmitted: { mean: 0.013094 }, divergingSeeds: 5 },
          replay: { domain: 'replay', stateL2DriftWhenOmitted: { mean: 0.003593 }, motorL2DriftWhenOmitted: { mean: 0.000055 }, divergingSeeds: 5 },
          rng: { domain: 'rng', stateL2DriftWhenOmitted: { mean: 0.180905 }, motorL2DriftWhenOmitted: { mean: 0.013302 }, divergingSeeds: 5 },
          curriculum: { domain: 'curriculum', stateL2DriftWhenOmitted: { mean: 2.533151 }, motorL2DriftWhenOmitted: { mean: 0.909875 }, divergingSeeds: 5 },
          synapticFabric: { domain: 'synapticFabric', stateL2DriftWhenOmitted: { mean: 0.047257 }, motorL2DriftWhenOmitted: { mean: 0.094744 }, divergingSeeds: 5 }
        }
      },
      runs: [
        {
          seed: 19013,
          finalDigestMatch: true,
          finalRestoredDigestSha256: '24e4ee93d4d3e3fa27dff71efda83a4d4be745b90243eb0eb6e1298a6507d18c',
          fullRestoreL2Drift: 0,
          fullRestoreMotorL2Drift: 0,
          finalCurriculumStage: 'F',
          finalReplayOccupancy: 12,
          finalPrngDraws: 228
        }
      ]
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runRestartEquivalence();
  assert.equal(report.summary.exactRestartEquivalenceSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · exact SHA-256 restart equivalence 5/5')), 'restart equivalence summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('omit-optimizer')), 'leave-one-domain-out rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runContinualTransfer renders 5-seed 4-phase continual retention and morphology transfer in section 11', async () => {
  const { window, dom } = load();
  window.AliveContinualMorphologyTransfer = {
    run: async () => ({
      summary: {
        fullBeatNaiveRetentionSeeds: 5,
        fullReducedForgettingSeeds: 5,
        metamorphBeatNaiveTransferSeeds: 5,
        fullBeatFrozenAllSeeds: 5,
        pairedDeltas: {
          fullVsNaiveRetentionGainPct: { mean: 23.72 },
          fullVsNaiveForgettingReduction: { mean: 0.1729 }
        },
        byController: {
          'frozen-baseline': {
            finalAllTasksMeanReturn: { mean: 0.399 },
            priorTaskRetentionPct: { mean: 100.0 },
            catastrophicForgetting: { mean: 0.0 },
            unseenMorphHoldoutReturn: { mean: 0.473 },
            phaseCurves: [{ meanAllTasksReturn: { mean: 0.399 } }, { meanAllTasksReturn: { mean: 0.399 } }]
          },
          'naive-continual': {
            finalAllTasksMeanReturn: { mean: 0.601 },
            priorTaskRetentionPct: { mean: 71.7 },
            catastrophicForgetting: { mean: 0.213 },
            unseenMorphHoldoutReturn: { mean: 0.501 },
            phaseCurves: [{ meanAllTasksReturn: { mean: 0.51 } }, { meanAllTasksReturn: { mean: 0.601 } }]
          },
          'metamorph-transfer-only': {
            finalAllTasksMeanReturn: { mean: 0.601 },
            priorTaskRetentionPct: { mean: 71.5 },
            catastrophicForgetting: { mean: 0.215 },
            unseenMorphHoldoutReturn: { mean: 0.529 },
            phaseCurves: [{ meanAllTasksReturn: { mean: 0.52 } }, { meanAllTasksReturn: { mean: 0.601 } }]
          },
          'full-continual-living': {
            finalAllTasksMeanReturn: { mean: 0.735 },
            priorTaskRetentionPct: { mean: 95.4 },
            catastrophicForgetting: { mean: 0.040 },
            unseenMorphHoldoutReturn: { mean: 0.652 },
            phaseCurves: [{ meanAllTasksReturn: { mean: 0.56 } }, { meanAllTasksReturn: { mean: 0.735 } }]
          }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runContinualTransfer();
  assert.equal(report.summary.fullBeatNaiveRetentionSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · retention gain +23.7% (5/5)')), 'continual transfer summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-continual-liv')), 'continual controller rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runColonyFitness renders 5-seed colony differentiation, state separation and population fitness in section 12', async () => {
  const { window, dom } = load();
  window.AliveColonyPopulationFitness = {
    run: async () => ({
      summary: {
        diffBeatSolitarySeeds: 5,
        diffBeatCloneSeeds: 5,
        diffBeatGreedySeeds: 5,
        allStateAuditsPassed: true,
        pairedDeltas: {
          diffVsSolitaryFitnessGain: { mean: 3.79 },
          diffVsCloneFitnessGain: { mean: 1.68 }
        },
        byRegime: {
          'solitary-host': { populationSize: 1, uniqueRolesAssigned: 1, populationFitness: { mean: 2.40 }, nicheCoveragePct: { mean: 2.8 }, collisionPenaltyTotal: { mean: 0 }, starvationEvents: { mean: 0 } },
          'undifferentiated-clone-colony': { populationSize: 5, uniqueRolesAssigned: 1, populationFitness: { mean: 4.51 }, nicheCoveragePct: { mean: 92.0 }, collisionPenaltyTotal: { mean: 8.04 }, starvationEvents: { mean: 0 } },
          'unbounded-greedy-colony': { populationSize: 5, uniqueRolesAssigned: 1, populationFitness: { mean: 2.58 }, nicheCoveragePct: { mean: 55.2 }, collisionPenaltyTotal: { mean: 6.24 }, starvationEvents: { mean: 78 } },
          'differentiated-role-colony': { populationSize: 5, uniqueRolesAssigned: 5, populationFitness: { mean: 6.19 }, nicheCoveragePct: { mean: 100.0 }, collisionPenaltyTotal: { mean: 0 }, starvationEvents: { mean: 0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runColonyFitness();
  assert.equal(report.summary.diffBeatSolitarySeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · diff vs solitary +3.79 (5/5)')), 'colony fitness summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('differentiated-role-co')), 'colony regime rows drawn');
  window.aliveFabricVisualizer.destroy();
});



