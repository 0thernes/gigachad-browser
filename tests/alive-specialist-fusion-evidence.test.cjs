'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assessSpecialistFusion } = require('../scripts/alive-specialist-fusion-evidence.cjs');
function sample() {
  const names = ['NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP'];
  const residual = [.04, -.02], baselineLogits = [.1, -.2];
  const actions = baselineLogits.map((x, i) => Math.fround(Math.tanh(x + residual[i])));
  return { simulationTick: 7, specialistFusionHandleEnumerable: false, lastPolicyStep: { observationId: 'obs-7', action: actions.map(x => Number(x.toFixed(3))) },
    specialistFusion: { capturedTick: 7, tick: 7, maxResidual: .08, selectedNames: names,
      sources: names.map(name => ({ name, available: true, selected: true, readout: [.5, -.25], gate: .2, contribution: [.008, -.004], diagnosticallyAblated: false })), residual,
      appliedMotor: { tick: 7, baselineLogits, baselineActions: baselineLogits.map(x => Math.fround(Math.tanh(x))), actions, recorded: [true, true], matchesFusion: [false, false] } } };
}
test('reconstructs actual actor outputs instead of trusting self-reported match flags', () => {
  const result = assessSpecialistFusion(sample()); assert.equal(result.ok, true, result.reasons.join('; ')); assert.deepEqual(result.changedAxes, [0, 1]);
});
test('rejects stale receipts, missing sources, nonfinite values, wrong gates, bounds and unpublished outputs', () => {
  const changes = [
    s => s.specialistFusion.appliedMotor.tick--,
    s => s.specialistFusion.sources.pop(),
    s => s.specialistFusion.sources[0].readout[0] = NaN,
    s => s.specialistFusion.sources[0].gate = .9,
    s => s.specialistFusion.residual[0] = .081,
    s => s.specialistFusion.sources[0].contribution[0] += .001,
    s => s.specialistFusion.appliedMotor.actions[0] += .01,
    s => s.lastPolicyStep.action[0] = 0,
    s => s.specialistFusionHandleEnumerable = true,
    s => s.specialistFusion.sources[0].diagnosticallyAblated = true
  ];
  for (const change of changes) { const s = sample(); change(s); assert.equal(assessSpecialistFusion(s).ok, false); }
});
test('valid zero contribution does not prove an observed motor effect', () => {
  const s = sample(); s.specialistFusion.residual = [0, 0];
  for (const source of s.specialistFusion.sources) { source.readout = [0, 0]; source.contribution = [0, 0]; }
  const m = s.specialistFusion.appliedMotor; m.actions = m.baselineActions.slice(); s.lastPolicyStep.action = m.actions.map(x => Number(x.toFixed(3)));
  const result = assessSpecialistFusion(s); assert.equal(result.ok, false); assert.ok(result.reasons.includes('No measurable actor output change was observed in this snapshot'));
});
