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

test('runProvenanceEval renders 5-seed research provenance and contradiction tracking in section 13', async () => {
  const { window, dom } = load();
  window.AliveResearchProvenanceEvaluator = {
    run: async () => ({
      summary: {
        provBeatCitationSeeds: 5,
        provBeatNaiveSeeds: 5,
        exactContradictionRecallSeeds: 5,
        zeroHallucinationSeeds: 5,
        pairedDeltas: {
          provVsCitationScoreGain: { mean: 62.29 },
          provVsNaiveScoreGain: { mean: 74.16 }
        },
        byPipeline: {
          'ungrounded-freeform': { compositeScore: { mean: 12.10 }, claimPrecisionPct: { mean: 33.3 }, contradictionRecallPct: { mean: 0 }, hallucinationRatePct: { mean: 66.7 }, meanSourceQuality: { mean: 0.35 } },
          'naive-concatenator': { compositeScore: { mean: 25.54 }, claimPrecisionPct: { mean: 66.7 }, contradictionRecallPct: { mean: 0 }, hallucinationRatePct: { mean: 33.3 }, meanSourceQuality: { mean: 0.52 } },
          'citation-only-filter': { compositeScore: { mean: 37.41 }, claimPrecisionPct: { mean: 100.0 }, contradictionRecallPct: { mean: 0 }, hallucinationRatePct: { mean: 0.0 }, meanSourceQuality: { mean: 0.72 } },
          'provenance-contradiction-writer': { compositeScore: { mean: 99.70 }, claimPrecisionPct: { mean: 100.0 }, contradictionRecallPct: { mean: 100.0 }, hallucinationRatePct: { mean: 0.0 }, meanSourceQuality: { mean: 0.97 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runProvenanceEval();
  assert.equal(report.summary.provBeatCitationSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · prov vs citation +62.3 (5/5)')), 'provenance summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('provenance-contradicti')), 'provenance synthesizer rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runFaultRecovery renders 5-seed browser navigation and fault recovery in section 14', async () => {
  const { window, dom } = load();
  window.AliveBrowserFaultRecovery = {
    run: async () => ({
      summary: {
        fullBeatCircuitSeeds: 5,
        fullBeatNaiveSeeds: 5,
        exact100CompletionSeeds: 5,
        zeroDuplicateDomSeeds: 5,
        pairedDeltas: {
          fullVsCircuitReliabilityGain: { mean: 56.25 },
          fullVsNaiveReliabilityGain: { mean: 93.12 }
        },
        byController: {
          'unbuffered-naive-nav': { reliabilityScore: { mean: 6.88 }, workflowCompletionPct: { mean: 12.5 }, faultRecoveryPct: { mean: 0 }, duplicateDomMutations: { mean: 6 }, wastedRetryRequests: { mean: 0 } },
          'retry-without-backoff': { reliabilityScore: { mean: 12.50 }, workflowCompletionPct: { mean: 43.8 }, faultRecoveryPct: { mean: 35.7 }, duplicateDomMutations: { mean: 6 }, wastedRetryRequests: { mean: 21 } },
          'circuit-breaker-only': { reliabilityScore: { mean: 43.75 }, workflowCompletionPct: { mean: 56.3 }, faultRecoveryPct: { mean: 50.0 }, duplicateDomMutations: { mean: 6 }, wastedRetryRequests: { mean: 2 } },
          'full-fault-tolerant-navigator': { reliabilityScore: { mean: 100.0 }, workflowCompletionPct: { mean: 100.0 }, faultRecoveryPct: { mean: 100.0 }, duplicateDomMutations: { mean: 0 }, wastedRetryRequests: { mean: 0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runFaultRecovery();
  assert.equal(report.summary.fullBeatCircuitSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · full vs circuit +56.3 (5/5)')), 'fault recovery summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-fault-tolerant-na')), 'fault recovery controller rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runSustainedPerf renders 5-seed 60Hz latency, memory bounds and hidden overhead in section 15', async () => {
  const { window, dom } = load();
  window.AliveSustainedPerformanceQualifier = {
    run: async () => ({
      summary: {
        boundedBeatEagerSeeds: 5,
        boundedBeatNoTimeoutSeeds: 5,
        sub16msP99Seeds: 5,
        zeroPostWarmupGrowthSeeds: 5,
        zeroHiddenOverheadSeeds: 5,
        pairedDeltas: {
          boundedVsEagerQualificationGain: { mean: 75.0 },
          boundedVsNoTimeoutQualificationGain: { mean: 63.3 }
        },
        byRegime: {
          'unbounded-eager-all-lanes': { qualificationScore: { mean: 25.0 }, p99Ms: { mean: 31.8 }, postWarmupMemoryGrowthEntries: { mean: 240 }, hiddenPanelDrawCalls: { mean: 2 }, adapterRecoveryPct: { mean: 100 } },
          'unbounded-history-no-eviction': { qualificationScore: { mean: 42.0 }, p99Ms: { mean: 8.4 }, postWarmupMemoryGrowthEntries: { mean: 240 }, hiddenPanelDrawCalls: { mean: 2 }, adapterRecoveryPct: { mean: 100 } },
          'no-adapter-timeout-guard': { qualificationScore: { mean: 36.7 }, p99Ms: { mean: 23.5 }, postWarmupMemoryGrowthEntries: { mean: 0 }, hiddenPanelDrawCalls: { mean: 0 }, adapterRecoveryPct: { mean: 0 } },
          'bounded-phase-ordered-60hz': { qualificationScore: { mean: 100.0 }, p99Ms: { mean: 5.42 }, postWarmupMemoryGrowthEntries: { mean: 0 }, hiddenPanelDrawCalls: { mean: 0 }, adapterRecoveryPct: { mean: 100 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runSustainedPerf();
  assert.equal(report.summary.boundedBeatEagerSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · bounded vs eager +75.0 (5/5)')), 'sustained perf summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('bounded-phase-ordered-')), 'sustained perf regime rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runReleaseAudit renders 5-seed Phase I integrated release audit and 8 PDF Gates in section 16', async () => {
  const { window, dom } = load();
  window.AliveIntegratedReleaseAudit = {
    run: async () => ({
      summary: {
        verifiedPassCount: 9,
        totalAuditedPasses: 9,
        verifiedGateCount: 8,
        totalPdfGates: 8,
        phase2TorMeshReady: true,
        phase1FrozenDigestSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        gateAudits: [
          { gateId: 'G1-Continuous-36-Faculties', passRef: 1, passedSeeds: 5, verified: true },
          { gateId: 'G2-Unseen-Holdout-Generalization', passRef: 2, passedSeeds: 5, verified: true },
          { gateId: 'G3-38-Condition-Causal-Ablations', passRef: 3, passedSeeds: 5, verified: true },
          { gateId: 'G4-Bit-Exact-Restart-Equivalence', passRef: 4, passedSeeds: 5, verified: true },
          { gateId: 'G5-Continual-Morphology-Transfer', passRef: 5, passedSeeds: 5, verified: true },
          { gateId: 'G6-Colony-Role-Differentiation', passRef: 6, passedSeeds: 5, verified: true },
          { gateId: 'G7-Grounded-Provenance-Synthesis', passRef: 7, passedSeeds: 5, verified: true },
          { gateId: 'G8-Fault-Recovery-60Hz-Qualification', passRef: 9, passedSeeds: 5, verified: true }
        ]
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runReleaseAudit();
  assert.equal(report.summary.verifiedGateCount, 8);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('Passes 9/9 verified · PDF Gates 8/8 promoted')), 'release audit summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('G1-Continuous-36-Facul')), 'release audit gate rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runTorHybridMesh renders 5-seed Tor Hybrid Synergy Mesh session isolation and zero-leak metrics in section 17', async () => {
  const { window, dom } = load();
  window.AliveTorHybridMesh = {
    run: async () => ({
      summary: {
        fullBeatPartitionedSeeds: 5,
        fullBeatNaiveSocksSeeds: 5,
        zeroLeakSeeds: 5,
        exactFailClosedSeeds: 5,
        pairedDeltas: {
          fullVsPartitionedIsolationGain: { mean: 68.0 },
          fullVsNaiveSocksIsolationGain: { mean: 100.0 }
        },
        byArchitecture: {
          'shared-session-direct': { isolationScore: { mean: 0 }, fpdIsolationPct: { mean: 0 }, totalLeaks: { mean: 60 }, distinctFpdCircuits: { mean: 0 }, failClosedPct: { mean: 0 } },
          'naive-socks-proxy-only': { isolationScore: { mean: 0 }, fpdIsolationPct: { mean: 20 }, totalLeaks: { mean: 48 }, distinctFpdCircuits: { mean: 1 }, failClosedPct: { mean: 0 } },
          'partitioned-storage-no-socks-auth': { isolationScore: { mean: 32.0 }, fpdIsolationPct: { mean: 80 }, totalLeaks: { mean: 12 }, distinctFpdCircuits: { mean: 1 }, failClosedPct: { mean: 0 } },
          'full-tor-hybrid-synergy-mesh': { isolationScore: { mean: 100.0 }, fpdIsolationPct: { mean: 100 }, totalLeaks: { mean: 0 }, distinctFpdCircuits: { mean: 5 }, failClosedPct: { mean: 100 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runTorHybridMesh();
  assert.equal(report.summary.fullBeatPartitionedSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · full vs partitioned +68.0 (5/5)')), 'Tor hybrid mesh summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-tor-hybrid-synerg')), 'Tor hybrid mesh architecture rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runTorCircuits renders 5-seed Tor ControlPort stream attribution and NEWNYM path diversity in section 18', async () => {
  const { window, dom } = load();
  window.AliveTorCircuitController = {
    run: async () => ({
      summary: {
        fullBeatNewnymOnlySeeds: 5,
        fullBeatPassiveSeeds: 5,
        exact100AttributionSeeds: 5,
        zeroSybilPathSeeds: 5,
        zeroDirtyReuseSeeds: 5,
        pairedDeltas: {
          fullVsNewnymOnlyObservabilityGain: { mean: 59.0 },
          fullVsPassiveObservabilityGain: { mean: 92.0 }
        },
        byController: {
          'unmonitored-blind-socks': { observabilityScore: { mean: 0 }, streamAttributionPct: { mean: 0 }, sybilRejectionPct: { mean: 0 }, dirtyCircuitReusesAfterNewnym: { mean: 12 } },
          'passive-controlport-observer': { observabilityScore: { mean: 8.0 }, streamAttributionPct: { mean: 100 }, sybilRejectionPct: { mean: 0 }, dirtyCircuitReusesAfterNewnym: { mean: 12 } },
          'newnym-without-path-diversity': { observabilityScore: { mean: 41.0 }, streamAttributionPct: { mean: 100 }, sybilRejectionPct: { mean: 0 }, dirtyCircuitReusesAfterNewnym: { mean: 0 } },
          'full-controlport-circuit-governor': { observabilityScore: { mean: 100.0 }, streamAttributionPct: { mean: 100 }, sybilRejectionPct: { mean: 100 }, dirtyCircuitReusesAfterNewnym: { mean: 0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runTorCircuits();
  assert.equal(report.summary.fullBeatNewnymOnlySeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · full vs newnym-only +59.0 (5/5)')), 'Tor circuit controller summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-controlport-circu')), 'Tor circuit controller rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runOnionV3Verifier renders 5-seed RFC 7686 and Tor v3 .onion cryptographic verification in section 19', async () => {
  const { window, dom } = load();
  window.AliveOnionV3Verifier = {
    run: async () => ({
      summary: {
        fullBeatChecksumOnlySeeds: 5,
        fullBeatRegexOnlySeeds: 5,
        zeroFalsePositiveSeeds: 5,
        zeroRfc7686LeakSeeds: 5,
        pairedDeltas: {
          fullVsChecksumOnlySecurityGain: { mean: 44.0 },
          fullVsRegexOnlySecurityGain: { mean: 88.0 }
        },
        byVerifier: {
          'clearnet-dns-passthrough': { securityScore: { mean: 0 }, validAcceptancePct: { mean: 100 }, adversarialRejectionPct: { mean: 0 }, falsePositives: { mean: 12 } },
          'regex-length-56-only': { securityScore: { mean: 12.0 }, validAcceptancePct: { mean: 100 }, adversarialRejectionPct: { mean: 33.3 }, falsePositives: { mean: 8 } },
          'checksum-without-descriptor-sig': { securityScore: { mean: 56.0 }, validAcceptancePct: { mean: 100 }, adversarialRejectionPct: { mean: 66.7 }, falsePositives: { mean: 4 } },
          'full-rfc7686-v3-onion-verifier': { securityScore: { mean: 100.0 }, validAcceptancePct: { mean: 100 }, adversarialRejectionPct: { mean: 100 }, falsePositives: { mean: 0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runOnionV3Verifier();
  assert.equal(report.summary.fullBeatChecksumOnlySeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · full vs checksum-only +44.0 (5/5)')), 'Onion v3 verifier summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-rfc7686-v3-onion-')), 'Onion v3 verifier rows drawn');
  window.aliveFabricVisualizer.destroy();
});

test('runTorShield renders 5-seed Tor anti-fingerprinting and cross-origin unlinkability in section 20', async () => {
  const { window, dom } = load();
  window.AliveTorFingerprintShield = {
    run: async () => ({
      summary: {
        fullBeatGlobalNoiseSeeds: 5,
        fullBeatNativeSeeds: 5,
        zeroCrossOriginLinkSeeds: 5,
        zeroStaticEntropySeeds: 5,
        pairedDeltas: {
          fullVsGlobalNoiseAnonymityGain: { mean: 100.0 },
          fullVsNativeAnonymityGain: { mean: 100.0 }
        },
        byShield: {
          'unprotected-native-chromium': { anonymityScore: { mean: 0 }, crossOriginUnlinkabilityPct: { mean: 0 }, anonymitySetUniformityPct: { mean: 0 }, staticSurfaceEntropyBits: { mean: 2.58 } },
          'ua-header-spoof-only': { anonymityScore: { mean: 0 }, crossOriginUnlinkabilityPct: { mean: 0 }, anonymitySetUniformityPct: { mean: 0 }, staticSurfaceEntropyBits: { mean: 2.58 } },
          'static-global-noise-injection': { anonymityScore: { mean: 0 }, crossOriginUnlinkabilityPct: { mean: 0 }, anonymitySetUniformityPct: { mean: 0 }, staticSurfaceEntropyBits: { mean: 2.58 } },
          'full-tor-letterbox-fpd-shield': { anonymityScore: { mean: 100.0 }, crossOriginUnlinkabilityPct: { mean: 100 }, anonymitySetUniformityPct: { mean: 100 }, staticSurfaceEntropyBits: { mean: 0.0 } }
        }
      }
    })
  };
  window.toggleAliveFabricPanel(true);
  const report = await window.aliveFabricVisualizer.runTorShield();
  assert.equal(report.summary.fullBeatGlobalNoiseSeeds, 5);
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('5 seeds · full vs global-noise +100.0 (5/5)')), 'Tor fingerprint shield summary drawn');
  assert.ok(dom.calls.some(c => c[0] === 'fillText' && String(c[1]).includes('full-tor-letterbox-fpd')), 'Tor fingerprint shield rows drawn');
  window.aliveFabricVisualizer.destroy();
});











