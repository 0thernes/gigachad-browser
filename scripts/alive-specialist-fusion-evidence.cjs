'use strict';

// Independent read-only assessor of actual renderer snapshots. It does not
// install fusion, request a job, modify weights, or trust matchesFusion flags.
const NAMES = ['NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP'];
const LIMIT = .08;
const finiteVector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite);
const near = (a, b, tolerance = 1e-7) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;

function assessSpecialistFusion(snapshot, { requireAllFive = true } = {}) {
  const fusion = snapshot?.specialistFusion, reasons = [];
  const check = (condition, reason) => { if (!condition) reasons.push(reason); };
  check(snapshot?.specialistFusionHandleEnumerable === false, 'Fusion handle must remain outside enumerable checkpoint state');
  if (!fusion) return { ok: false, reasons: [...reasons, 'Actual fusion snapshot missing'] };
  const sources = fusion.sources, tick = snapshot.simulationTick;
  const selectedNames = Array.isArray(fusion.selectedNames) ? fusion.selectedNames : [];
  check(Number.isSafeInteger(tick) && tick > 0 && fusion.capturedTick === tick && fusion.tick === tick, 'Capture and fusion must belong to the current actual policy tick');
  check(near(fusion.maxResidual, LIMIT, 1e-12), 'Unexpected declared motor correction bound');
  check(Array.isArray(sources) && sources.length === 5 && sources.every(s => s && typeof s === 'object') && new Set(sources.map(s => s.name)).size === 5 && NAMES.every(name => sources.some(s => s.name === name)), 'The five declared specialist sources must be unique and complete');
  check(Array.isArray(fusion.selectedNames) && new Set(fusion.selectedNames).size === fusion.selectedNames.length && fusion.selectedNames.every(name => NAMES.includes(name)), 'Selected source identities are malformed');
  const totals = [0, 0]; let gateTotal = 0;
  if (Array.isArray(sources)) for (const source of sources) {
    if (!source || typeof source !== 'object') { check(false, 'Malformed source record'); continue; }
    const selected = selectedNames.includes(source.name);
    check(source.selected === selected, 'Source selection disagrees with selected-name list: ' + source.name);
    check(source.available === true, 'Computed source unavailable: ' + source.name);
    check(source.diagnosticallyAblated === false, 'Normal actual-runtime observation must not use a diagnostic ablation: ' + source.name);
    check(finiteVector(source.readout, 2) && source.readout.every(v => Math.abs(v) <= 1), 'Invalid bounded readout: ' + source.name);
    check(Number.isFinite(source.gate) && source.gate >= 0 && source.gate <= 1 && (selected || source.gate === 0), 'Invalid gate: ' + source.name);
    check(finiteVector(source.contribution, 2), 'Invalid motor contribution: ' + source.name);
    if (requireAllFive) check(selected && source.gate > 0, 'Overdrive must admit every computed specialist: ' + source.name);
    gateTotal += source.gate;
    for (let axis = 0; axis < 2; axis++) {
      const expected = LIMIT * source.gate * source.readout?.[axis];
      check(near(source.contribution?.[axis], expected, 1e-10), 'Contribution differs from independent gate/readout calculation: ' + source.name);
      totals[axis] += source.contribution?.[axis];
    }
  }
  check(near(gateTotal, 1, 1e-10), 'Admitted gates must normalize to one');
  check(finiteVector(fusion.residual, 2) && fusion.residual.every(v => Math.abs(v) <= LIMIT + 1e-12), 'Motor residual exceeds bound or is nonfinite');
  for (let axis = 0; axis < 2; axis++) check(near(fusion.residual?.[axis], Math.max(-LIMIT, Math.min(LIMIT, totals[axis])), 1e-10), 'Residual does not equal the bounded sum of contributions');

  const motor = fusion.appliedMotor;
  check(motor?.tick === tick && Array.isArray(motor?.recorded) && motor.recorded.length === 2 && motor.recorded.every(value => value === true), 'Both actual motor writes must be recorded at the same policy tick');
  for (const key of ['baselineLogits', 'baselineActions', 'actions']) check(finiteVector(motor?.[key], 2), 'Missing finite applied motor values: ' + key);
  const changedAxes = [];
  for (let axis = 0; axis < 2; axis++) {
    const baseline = Math.fround(Math.tanh(motor?.baselineLogits?.[axis]));
    const expected = Math.fround(Math.tanh(motor?.baselineLogits?.[axis] + fusion.residual?.[axis]));
    check(near(motor?.baselineActions?.[axis], baseline), 'Baseline actor receipt is inconsistent');
    check(near(motor?.actions?.[axis], expected), 'Actual Float32 actor write differs from independently reconstructed fused action');
    const publishedExpected=Number.isFinite(motor?.actions?.[axis])?Number(motor.actions[axis].toFixed(3)):NaN;
    check(snapshot.lastPolicyStep?.observationId === 'obs-' + tick && near(snapshot.lastPolicyStep?.action?.[axis], publishedExpected, 1e-12), 'Published PolicyStep does not contain the recorded fused motor output');
    if (Number.isFinite(motor?.actions?.[axis]) && Math.abs(motor.actions[axis] - baseline) > 1e-6) changedAxes.push(axis);
  }
  check(changedAxes.length > 0, 'No measurable actor output change was observed in this snapshot');
  return { ok: reasons.length === 0, reasons, tick, sourceCount: sources?.length || 0, gateTotal, changedAxes,
    residual: fusion.residual || null, scope: 'Current actual-renderer numeric specialist contribution and actor receipt; no task-advantage, learned Option-Critic, or PDF G5 qualification' };
}

module.exports = { assessSpecialistFusion };
