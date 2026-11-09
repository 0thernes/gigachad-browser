/* Bounded selection-dependent readouts of existing local numerical engines.
 * This is a heuristic fusion rule, not a trained RIMs or Option-Critic router.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveSpecialistFusion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NAMES = Object.freeze(['NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP']);
  const DIM = 16, LIMIT = 0.08;
  const installed = new WeakMap();
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const vector = value => Array.isArray(value) || ArrayBuffer.isView(value) && typeof value.length === 'number';
  const tickValid = value => Number.isSafeInteger(value) && value >= 0;
  const scope = 'Selected existing numerical readouts add a bounded two-motor residual. Scores are heuristic; no new learned weights, task advantage, trained RIMs or Option-Critic claim.';

  function install(host) {
    if (!host || typeof host !== 'object') throw new TypeError('Specialist fusion requires a host object');
    if (installed.has(host)) return installed.get(host);
    if (Object.prototype.hasOwnProperty.call(host, 'aliveSpecialistFusion')) throw new TypeError('Host already has a different specialist fusion property');
    const reads = new Float64Array(10), available = new Uint8Array(5), selected = new Uint8Array(5);
    const gates = new Float64Array(5), contributions = new Float64Array(10), ablated = new Uint8Array(5);
    const residual = new Float64Array(2);
    const motorLogits = [null, null], motorBaseline = [null, null], motorActions = [null, null];
    const motorRecorded = [false, false], motorMatches = [null, null];
    let capturedTick = null, fusedTick = null, motorTick = null, rejections = 0, lastRejection = '';

    function resetMotor() {
      motorTick = null;
      for (let axis = 0; axis < 2; axis++) {
        motorLogits[axis] = motorBaseline[axis] = motorActions[axis] = motorMatches[axis] = null;
        motorRecorded[axis] = false;
      }
    }
    function resetFusion() {
      selected.fill(0); gates.fill(0); contributions.fill(0); ablated.fill(0); residual.fill(0);
      fusedTick = null; resetMotor();
    }
    function reject(reason) { rejections++; lastRejection = reason; return false; }
    function project(source, model, first, end, predictionResidual = false) {
      const obs = model.obsVec, weights = model.W_actor, predicted = model.predObsVec;
      if (model.D_OBS !== undefined && model.D_OBS !== DIM || !vector(obs) || obs.length < DIM ||
          !vector(weights) || weights.length < 2 * DIM || predictionResidual && (!vector(predicted) || predicted.length < DIM)) return;
      for (let axis = 0; axis < 2; axis++) {
        let sum = 0;
        for (let j = first; j < end; j++) {
          if (!finite(obs[j]) || !finite(weights[axis * DIM + j]) || predictionResidual && !finite(predicted[j])) return;
          const value = predictionResidual ? predicted[j] - obs[j] : obs[j];
          sum += weights[axis * DIM + j] * value;
        }
        if (!finite(sum)) return;
        reads[source * 2 + axis] = Math.tanh(sum);
      }
      available[source] = 1;
    }
    function capture(model, fwStep) {
      resetFusion(); reads.fill(0); available.fill(0); capturedTick = null;
      if (!model || !tickValid(model.simulationTick)) return reject('Capture requires a valid simulation tick');
      capturedTick = model.simulationTick;
      project(0, model, 2, 7);
      project(1, model, 0, DIM, true);
      const steering = fwStep?.pfnSteering;
      if (vector(steering) && steering.length >= 2 && finite(steering[0]) && finite(steering[1])) {
        reads[4] = Math.tanh(steering[0]); reads[5] = Math.tanh(steering[1]); available[2] = 1;
      }
      project(3, model, 12, 14);
      project(4, model, 8, 11);
      // A partially valid two-axis projection is never exposed as a real readout.
      for (let source = 0; source < 5; source++) if (!available[source]) reads.fill(0, source * 2, source * 2 + 2);
      lastRejection = '';
      return available.some(Boolean);
    }
    // Returned storage is borrowed and reused. Copy it if it must outlive a call.
    // diagnosticMask zeroes contributions AFTER normalization, preserving gates
    // for causal ablations. It does not disable or modify any underlying engine.
    function fuse(selectedNames, scores, tick, diagnosticMask) {
      resetFusion();
      if (!tickValid(tick) || capturedTick === null || tick !== capturedTick) {
        reject('Fusion requires a capture from the same simulation tick'); return residual;
      }
      if (diagnosticMask !== undefined && diagnosticMask !== null && (!vector(diagnosticMask) || diagnosticMask.length !== 5 ||
          Array.from(diagnosticMask).some(value => value !== true && value !== false && value !== 0 && value !== 1))) {
        reject('Diagnostic mask must contain exactly five boolean or 0/1 entries'); return residual;
      }
      if (Array.isArray(selectedNames)) {
        // Public inputs cannot turn this five-source operation into an unbounded scan.
        for (let i = 0; i < Math.min(32, selectedNames.length); i++) {
          const source = NAMES.indexOf(selectedNames[i]);
          if (source >= 0) selected[source] = 1;
        }
      }
      let largest = 0;
      for (let source = 0; source < 5; source++) {
        const score = vector(scores) ? scores[source] : undefined;
        if (selected[source] && available[source] && finite(score) && score > 0) { gates[source] = score; largest = Math.max(largest, score); }
      }
      // Scale first so even several Number.MAX_VALUE scores cannot overflow.
      let denominator = 0;
      if (largest > 0) for (let source = 0; source < 5; source++) { gates[source] /= largest; denominator += gates[source]; }
      for (let source = 0; source < 5; source++) {
        gates[source] = denominator > 0 ? gates[source] / denominator : 0;
        ablated[source] = diagnosticMask && (diagnosticMask[source] === false || diagnosticMask[source] === 0) ? 1 : 0;
        for (let axis = 0; axis < 2; axis++) {
          const index = source * 2 + axis;
          contributions[index] = ablated[source] ? 0 : LIMIT * gates[source] * reads[index];
          residual[axis] += contributions[index];
        }
      }
      for (let axis = 0; axis < 2; axis++) residual[axis] = Math.max(-LIMIT, Math.min(LIMIT, residual[axis]));
      fusedTick = tick; lastRejection = '';
      return residual;
    }
    function recordMotor(index, baselineLogit, appliedFloat32Action, tick) {
      if ((index !== 0 && index !== 1) || !tickValid(tick) || tick !== capturedTick || tick !== fusedTick ||
          !finite(baselineLogit) || !finite(appliedFloat32Action) || Math.abs(appliedFloat32Action) > 1) {
        return reject('Motor receipt requires finite values and the current successful fusion tick');
      }
      motorTick = tick;
      motorLogits[index] = baselineLogit;
      motorBaseline[index] = Math.fround(Math.tanh(baselineLogit));
      motorActions[index] = appliedFloat32Action;
      motorRecorded[index] = true;
      motorMatches[index] = appliedFloat32Action === Math.fround(Math.tanh(baselineLogit + residual[index]));
      return true;
    }
    function snapshot() {
      return { capturedTick, tick: fusedTick,
        selectedNames: NAMES.filter((_, source) => selected[source]),
        sources: NAMES.map((name, source) => ({ name, available: Boolean(available[source]), selected: Boolean(selected[source]),
          readout: [reads[source * 2], reads[source * 2 + 1]], gate: gates[source],
          contribution: [contributions[source * 2], contributions[source * 2 + 1]], diagnosticallyAblated: Boolean(ablated[source]) })),
        residual: Array.from(residual), sum: Array.from(residual), maxResidual: LIMIT, rejections, lastRejection, scope,
        appliedMotor: { tick: motorTick, baselineLogits: motorLogits.slice(), baselineActions: motorBaseline.slice(),
          actions: motorActions.slice(), recorded: motorRecorded.slice(), matchesFusion: motorMatches.slice() } };
    }
    const api = Object.freeze({ capture, fuse, recordMotor, snapshot });
    Object.defineProperty(host, 'aliveSpecialistFusion', { value: api, enumerable: false, writable: false, configurable: false });
    installed.set(host, api);
    return api;
  }
  return Object.freeze({ install, sourceNames: NAMES, maxResidual: LIMIT });
});
