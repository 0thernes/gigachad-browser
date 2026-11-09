'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../systems/alive-autonomic-core.js');

const BASE = {
  now: 1000, predictionError: 0.5, predictionErrorPrev: 0.5,
  conceptsOnPage: 10, newConceptsOnPage: 2, newDomainRatio: 0.5, frontierCount: 40,
  explorationPhase: 'exploring', stagnantObservations: 0, unchangedObservations: 0,
  msSinceNewConcept: 0, dwellMs: 0, referenceDwellMs: 12000,
  atp: 0.9, glucose: 0.8, cortisol: 0.2, agRP: 0.4, sleepDebt: 0.1, NE: 0.45, DA: 0.5
};
const withSignals = extra => core.evaluate({ ...BASE, ...extra });
const inUnit = value => Number.isFinite(value) && value >= 0 && value <= 1;

test('every drive and output is finite and bounded for an empty input', () => {
  const state = core.evaluate({});
  for (const [name, value] of Object.entries(state.drives)) {
    assert.ok(inUnit(value), `${name} out of range: ${value}`);
  }
  assert.ok(inUnit(state.tempo) && inUnit(state.couplingGain) && inUnit(state.restlessness));
  assert.equal(state.version, core.VERSION);
});

test('hostile inputs degrade to neutral instead of propagating NaN', () => {
  const hostile = {};
  for (const key of Object.keys(BASE)) hostile[key] = NaN;
  hostile.explorationPhase = { toString() { return 'exploring'; } };
  const state = core.evaluate(hostile);
  for (const [name, value] of Object.entries(state.drives)) {
    assert.ok(inUnit(value), `${name} became ${value}`);
  }
  assert.ok(Number.isFinite(core.intervalFor(state, 'dom-body', NaN)));
  assert.ok(inUnit(core.urgency(state, 'dom-body')));
});

test('an exhausted page raises satiation and signals departure', () => {
  const state = withSignals({ explorationPhase: 'exhausted', unchangedObservations: 3, msSinceNewConcept: 20000 });
  assert.ok(state.drives.satiation >= 0.6, `satiation ${state.drives.satiation}`);
  assert.equal(state.departure, true);
  assert.ok(state.dwellScale < 1, 'dwell should shorten when the page is spent');
});

test('measured learning keeps the creature on the page', () => {
  const learning = withSignals({ explorationPhase: 'exhausted', unchangedObservations: 3,
    predictionErrorPrev: 0.60, predictionError: 0.35 });
  assert.equal(learning.departure, false, 'should not leave a page it is still learning from');
  assert.ok(learning.drives.learningProgress > 0.56);
});

test('user interaction forces a quiet, yielding state', () => {
  const busy = withSignals({ explorationPhase: 'exhausted', msSinceNewConcept: 30000, NE: 1, DA: 1 });
  const yielded = withSignals({ explorationPhase: 'exhausted', msSinceNewConcept: 30000, NE: 1, DA: 1, userActive: true });
  assert.equal(yielded.yielding, true);
  assert.equal(yielded.departure, false, 'must never navigate away under the user');
  assert.ok(yielded.tempo <= 0.2 && yielded.tempo < busy.tempo);
  assert.ok(yielded.restlessness <= 0.15);
  assert.equal(yielded.dwellScale, 1, 'yielding keeps the configured reading time');
});

test('depleted energy slows tempo even when aroused', () => {
  const fed = withSignals({ atp: 1, glucose: 1, NE: 0.9, DA: 0.9, msSinceNewConcept: 15000 });
  const starved = withSignals({ atp: 0.02, glucose: 0.02, cortisol: 0.9, NE: 0.9, DA: 0.9, msSinceNewConcept: 15000 });
  assert.ok(starved.tempo < fed.tempo, `starved ${starved.tempo} >= fed ${fed.tempo}`);
  assert.ok(starved.drives.energy < fed.drives.energy);
});

test('intervalFor compresses toward the floor but never below it or above base', () => {
  const calm = core.evaluate({ ...BASE, NE: 0, DA: 0, atp: 0.3 });
  const driven = withSignals({ explorationPhase: 'exhausted', msSinceNewConcept: 60000, NE: 1, DA: 1,
    newConceptsOnPage: 10, conceptsOnPage: 10, newDomainRatio: 1, frontierCount: 400 });
  for (const id of core.capabilities) {
    const base = 1400;
    const floor = Math.min(core.profile(id).floorMs, base);
    for (const state of [calm, driven]) {
      const ms = core.intervalFor(state, id, base);
      assert.ok(ms >= floor && ms <= base, `${id}: ${ms} outside [${floor}, ${base}]`);
    }
    assert.ok(core.intervalFor(driven, id, base) <= core.intervalFor(calm, id, base),
      `${id} should not get slower when driven`);
  }
});

test('an unknown capability still returns a usable bounded interval', () => {
  const state = withSignals({});
  const ms = core.intervalFor(state, 'not-a-capability', 5000);
  assert.ok(Number.isFinite(ms) && ms > 0 && ms <= 5000);
  assert.ok(inUnit(core.urgency(state, 'not-a-capability')));
});

test('scheduler profile stays inside the Controller clamps', () => {
  for (const state of [core.evaluate({}), withSignals({ NE: 1, DA: 1, explorationPhase: 'exhausted', msSinceNewConcept: 60000 })]) {
    const p = core.schedulerProfile(state);
    assert.ok(p.intervalMs >= 16 && p.intervalMs <= 1000);
    assert.ok(p.budgetMs >= 1 && p.budgetMs <= 25);
    assert.ok(p.maxInFlight >= 1 && p.maxInFlight <= 4);
    assert.ok(p.maxStartsPerTick >= 1 && p.maxStartsPerTick <= 8);
    for (const value of Object.values(p)) assert.ok(Number.isInteger(value));
  }
});

test('motor gains never drop below the current shipped values', () => {
  const quiet = core.evaluate({ ...BASE, NE: 0, DA: 0, atp: 0, glucose: 0, userActive: true });
  const g = core.motorGains(quiet);
  assert.ok(g.fusionLimit >= 0.08, `fusionLimit ${g.fusionLimit}`);
  assert.ok(g.couplingMotor >= 0.025, `couplingMotor ${g.couplingMotor}`);
  assert.ok(g.learnedThrustPrimary >= 0.55);
  assert.ok(g.learnedThrustSwarm >= 0.35);
});

test('motor gains stay inside the clamps the motor path relies on', () => {
  const driven = withSignals({ NE: 1, DA: 1, atp: 1, glucose: 1, explorationPhase: 'exhausted', msSinceNewConcept: 60000 });
  const g = core.motorGains(driven);
  assert.ok(g.fusionLimit <= 0.42, `fusionLimit ${g.fusionLimit}`);
  assert.ok(g.couplingMotor <= 0.18, `couplingMotor ${g.couplingMotor}`);
  assert.ok(g.learnedThrustPrimary <= 0.95 && g.learnedThrustSwarm <= 0.70);
});

test('evaluate is pure: the same signals give the same result', () => {
  const a = core.evaluate(BASE);
  const b = core.evaluate(BASE);
  assert.deepEqual(a.drives, b.drives);
  assert.equal(a.tempo, b.tempo);
});

test('smoothing damps a step change and counts observations', () => {
  const calm = core.evaluate({ ...BASE, NE: 0, DA: 0 });
  const spike = { ...BASE, NE: 1, DA: 1, explorationPhase: 'exhausted', msSinceNewConcept: 60000 };
  const unsmoothed = core.evaluate(spike);
  const smoothedState = core.evaluate(spike, calm);
  assert.ok(smoothedState.tempo < unsmoothed.tempo, 'a single spike must not jump straight to full tempo');
  assert.equal(smoothedState.observations, calm.observations + 1, 'observations advance once per evaluation');
});

test('describe never throws and reports an unevaluated state honestly', () => {
  assert.match(core.describe(null), /has not been evaluated/);
  assert.match(core.describe(withSignals({})), /tempo \d+% · restlessness \d+%/);
  assert.match(core.describe(withSignals({ userActive: true })), /yielding to the user/);
});
