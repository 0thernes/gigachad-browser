'use strict';

// Serializable verification observer. Raw model bytes are owned before either
// engine read API runs. The private semantic clock necessarily uses the explicit
// engine API; the returned weight projection is never the independent byte oracle.
function captureTrainerHydration(runtime) {
  const own = (object, key) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error('Trainer observation requires own data: ' + key);
    return descriptor.value;
  };
  const method = (object, key) => {
    for (let node = object, depth = 0; node && depth < 8; node = Object.getPrototypeOf(node), depth++) {
      const descriptor = Object.getOwnPropertyDescriptor(node, key);
      if (!descriptor) continue;
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value') || typeof descriptor.value !== 'function') throw new Error('Trainer observation requires a data method: ' + key);
      return descriptor.value;
    }
    throw new Error('Trainer observation method missing: ' + key);
  };
  const proto = Object.getPrototypeOf(Float32Array.prototype);
  const read = (view, key) => Object.getOwnPropertyDescriptor(proto, key).get.call(view);
  const bytesOf = view => {
    if (Object.getOwnPropertyDescriptor(proto, Symbol.toStringTag).get.call(view) !== 'Float32Array' ||
        read(view, 'length') !== 16 || read(view, 'byteLength') !== 64 || read(view, 'byteOffset') !== 0) throw new Error('Trainer observation requires standalone Float32[16]');
    const buffer = read(view, 'buffer');
    if (Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get.call(buffer) !== 64 ||
        Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get.call(buffer)) throw new Error('Trainer observation requires fixed nonshared backing');
    for (let i = 0; i < 16; i++) if (!Number.isFinite(view[i])) throw new Error('Trainer observation contains nonfinite weights');
    return new Uint8Array(buffer).slice();
  };
  const equal = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
  const integer = value => Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0;
  const engine = own(runtime, 'bleedingEdge25Engine'), view = own(engine, 'W_hyper_u');
  const bytes = bytesOf(view); // MUST precede production capture/read callbacks.
  const captured = method(engine, 'captureCommittedTrainerState').call(engine);
  if (own(captured, 'schemaVersion') !== 1 || own(captured, 'kernelId') !== 'bleeding-hyper-worker-v1' ||
      !equal(bytes, bytesOf(own(captured, 'weights')))) throw new Error('Private trainer capture disagrees with pre-callback direct bytes');
  const committedEpoch = own(captured, 'committedEpoch'), timeoutMs = own(captured, 'timeoutMs');
  const state = method(engine, 'workerTrainerSnapshot').call(engine);
  const active = own(state, 'active'), generation = own(state, 'generation');
  const pendingJobId = own(state, 'pendingJobId'), pendingTargetEpoch = own(state, 'pendingTargetEpoch');
  if (!integer(committedEpoch) || !Number.isInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 30000 ||
      typeof active !== 'boolean' || !integer(generation) || own(state, 'committedEpoch') !== committedEpoch || own(state, 'timeoutMs') !== timeoutMs ||
      (pendingJobId !== null && !integer(pendingJobId)) || (pendingTargetEpoch !== null && !integer(pendingTargetEpoch))) throw new Error('Invalid or inconsistent private trainer metadata');
  if (own(runtime, 'bleedingEdge25Engine') !== engine || own(engine, 'W_hyper_u') !== view || !equal(bytes, bytesOf(view))) throw new Error('Trainer changed during its read API observation');
  let binary = ''; for (const value of bytes) binary += String.fromCharCode(value);
  return { schema: 'gigachad.trainer-hydration-evidence.v1', byteOrder: new Uint8Array(new Uint16Array([1]).buffer)[0] === 1 ? 'LE' : 'BE',
    weightsBase64: btoa(binary), byteLength: 64, committedEpoch, timeoutMs, active, generation, pendingJobId, pendingTargetEpoch,
    applied: own(state, 'applied'), submitted: own(state, 'submitted'), privateProjectionMatchesDirectBytes: true,
    scope: 'Direct W_hyper_u bytes owned before production reads; private clock/configuration and admission observed through explicit engine APIs, not independently accessible private memory' };
}

// Verification only. The capture function has no module-scope dependencies:
// inject its .toString() immediately AFTER the real constructor load call.
// Never replace loadPersistentGenome/importState with this evidence helper.
function captureGenomeHydration(runtime) {
  const captureHub = null; // Embedded direct hub observer below.
  const captureReplay = null; // Embedded direct replay observer below.
  const capturePrimaryPolicy = null; // Embedded independent observer below.
  const captureTrainer = null; // Embedded direct trainer observer below.
  const get = path => path.split('.').reduce((value, key) => value?.[key], runtime);
  const groups = [
    ['', ['W_actor', 'W_metamorph', 'W_critic', 'W_world', 'W_actor_frozen', 'W_world_frozen']],
    ['trainableAlifeNeuralHub.', ['W_perc_enc', 'W_perc_dec', 'W_dyn1', 'W_dyn2', 'W_diff1', 'W_diff2', 'W_gen1', 'W_gen2', 'W_disc1', 'W_disc2', 'W_aware16']],
    ['deepWebAndSltcConnectomeEngine.', ['sltcWeights64', 'sltcRecWeights64', 'sltcBias64']],
    ['aotTotGotEngine.', ['W_aot_contractor', 'W_tot_branch4x16x16', 'W_got_attn']]
  ];
  const arrays = {}, errors = [];
  // Own hub and replay directly before any production or metadata callbacks.
  // An initial malformed hub must remain a failure even if later callbacks heal it.
  let hubEvidence = null, hubCaptureError = null;
  try {
    hubEvidence = captureHub(runtime);
    if (!hubEvidence || hubEvidence.ok !== true) hubCaptureError = String(hubEvidence?.reason || 'Initial hub observation failed');
  }
  catch (error) { hubCaptureError = String(error.message || error); }
  // Replay must precede every callback. Even the trainer's metadata read is
  // a production callback that could mutate or repair the live replay ring.
  // Retain this first owned observation or failure; never retry after callbacks.
  let replayEvidence = null, replayCaptureError = null;
  try {
    replayEvidence = captureReplay(runtime);
    if (!replayEvidence || replayEvidence.ok !== true) replayCaptureError = String(replayEvidence?.reason || 'Initial replay observation failed');
  }
  catch (error) { replayCaptureError = String(error.message || error); }
  // Establish the independent byte/alias observation before any production
  // exporter or codec callback can mutate (or repair) the runtime. Legacy-only
  // runtimes may not implement this subset, so retain failure separately until
  // the payload declares primary state; never retry after calling the exporter.
  let primaryPolicyEvidence = null, primaryPolicyCaptureError = null;
  try { primaryPolicyEvidence = capturePrimaryPolicy(runtime); }
  catch (error) { primaryPolicyCaptureError = String(error.message || error); }
  // Observe trainer bytes before even diagnostic metadata serialization, which
  // can invoke a user-defined toJSON callback on an otherwise ordinary record.
  let trainerEvidence = null, trainerCaptureError = null;
  try { trainerEvidence = captureTrainer(runtime); }
  catch (error) { trainerCaptureError = String(error.message || error); }
  for (const [prefix, names] of groups) for (const name of names) {
    const path = prefix + name, values = get(path);
    if (!ArrayBuffer.isView(values) || values instanceof DataView) { arrays[path] = null; continue; }
    if (values.byteLength > 32 * 1024 * 1024) { arrays[path] = { error: 'Array exceeds capture bound' }; continue; }
    const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    arrays[path] = { type: values.constructor.name, length: values.length, byteLength: values.byteLength, base64: btoa(binary) };
  }
  // Own all direct scalar/metadata evidence before the production diagnostic.
  // Merely retaining object references here would still permit export-time
  // mutation to change the later JSON copy.
  const fields = {};
  for (const name of ['authorityEpoch', 'simulationTick', 'policyCid', 'checkpointCid', 'bodyRecipe', 'offspringColony',
    'episodicMemory', 'semanticMemory', 'proceduralMemory', 'handoffLedger', 'dreamReplaysCount', 'pelletsEatenCount',
    'horizontalTransfersCount', 'personality', 'emotionState', 'morphogenesis', 'cognitiveCortex']) fields[name] = runtime[name];
  fields.visitedUrls = Array.from(runtime.visitedUrlTabooSet || []);
  fields.clickedAnchors = Array.from(runtime.clickedAnchorTabooSet || []);
  fields.swarmFormation = runtime.swarmCollective?.formationMode;
  fields.sovereignStats = {};
  for (const name of ['commandsExecutedCount', 'vaultEngramsCrystallized', 'bookmarksAutonomouslyPinned',
    'maxsmartDossiersSynthesized', 'vibeCssMutationsCount', 'emergentQueriesInjected']) fields.sovereignStats[name] = runtime.sovereignMaster?.[name];
  fields.causalPropositions = runtime.causalGraph?.propositions;
  fields.trainableHub = {};
  for (const name of ['totalBackpropStepsTrained', 'ideasSynthesizedCount', 'dreamConsolidationSteps']) fields.trainableHub[name] = runtime.trainableAlifeNeuralHub?.[name];
  const capturedFields = JSON.parse(JSON.stringify(fields));
  const agentIdObserved = runtime.agentId, allowedFormations = Array.from(runtime.SWARM_FORMATIONS || []);
  const byteOrder = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1 ? 'LE' : 'BE';
  let encodedJSON = null, primaryDiagnosticOmitted = false, trainerDiagnosticOmitted = false, replayDiagnosticOmitted = false, hubDiagnosticOmitted = false;
  try {
    const codec = globalThis.AliveGenomeCodec || globalThis.window?.AliveGenomeCodec;
    if (!codec || typeof runtime.capturePersistentGenomePayload !== 'function') throw new Error('Legacy capture/codec unavailable');
    const payload = runtime.capturePersistentGenomePayload();
    let diagnostic = payload;
    const omitted = new Set();
    for (const [field, markerName, label, captureError] of [
      ['primaryPolicyState', '__alive_genome_primary_state_v1__', 'primary', primaryPolicyCaptureError],
      ['trainerCommittedState', '__alive_genome_trainer_state_v1__', 'trainer', trainerCaptureError],
      ['replayMemoryState', '__alive_genome_replay_state_v1__', 'replay', replayCaptureError],
      ['hubMemoryState', '__alive_genome_hub_state_v1__', 'hub', hubCaptureError]
    ]) {
      const member = Object.getOwnPropertyDescriptor(payload, field);
      if (!member) continue;
      if (!Object.prototype.hasOwnProperty.call(member, 'value') || !member.enumerable) throw new Error(label + ' payload must be an enumerable own data field');
      if (captureError !== null) throw new Error('Initial ' + label + ' capture failed: ' + captureError);
      const wrapper = member.value;
      const marker = wrapper && typeof wrapper === 'object' && Object.getOwnPropertyDescriptor(wrapper, markerName);
      if (marker) {
        const captured = Object.getOwnPropertyDescriptor(wrapper, 'captured');
        if (!Object.prototype.hasOwnProperty.call(marker, 'value') || marker.value !== true || !marker.enumerable ||
            !captured || !Object.prototype.hasOwnProperty.call(captured, 'value') || !captured.enumerable ||
            !captured.value || typeof captured.value !== 'object' || Array.isArray(captured.value) ||
            Reflect.ownKeys(wrapper).length !== 2) throw new Error('Invalid pending ' + label + ' marker');
        // Remove only the recognized pending marker from a shallow copy for
        // the legacy export diagnostic. Never edit the actual capture payload.
        omitted.add(field);
      } else {
        const schema = wrapper && typeof wrapper === 'object' && Object.getOwnPropertyDescriptor(wrapper, 'schema');
        if (!schema || !Object.prototype.hasOwnProperty.call(schema, 'value') || schema.value !== 'gigachad.learned-state.v1') throw new Error('Unrecognized ' + label + ' exact-state wrapper');
      }
    }
    if (omitted.size) {
      diagnostic = {};
      for (const key of Reflect.ownKeys(payload)) if (!omitted.has(key)) Object.defineProperty(diagnostic, key, Object.getOwnPropertyDescriptor(payload, key));
    }
    primaryDiagnosticOmitted = omitted.has('primaryPolicyState'); trainerDiagnosticOmitted = omitted.has('trainerCommittedState');
    replayDiagnosticOmitted = omitted.has('replayMemoryState');
    hubDiagnosticOmitted = omitted.has('hubMemoryState');
    encodedJSON = codec.encode(diagnostic);
  } catch (error) { errors.push(String(error.message || error)); }
  return { schema: 'gigachad.genome-hydration-evidence.v1',
    byteOrder, encodedJSON, arrays, primaryPolicyEvidence, primaryPolicyCaptureError, primaryDiagnosticOmitted,
    trainerEvidence, trainerCaptureError, trainerDiagnosticOmitted, replayEvidence, replayCaptureError, replayDiagnosticOmitted,
    hubEvidence, hubCaptureError, hubDiagnosticOmitted, fields: capturedFields,
    agentIdObserved, allowedFormations, errors,
    scope: 'Immediate post-load observation before subsequent model steps; legacy fields plus exact primary, committed trainer, bounded replay and declared hub subsets when present, not the entire runtime' };
}

// Preserve the existing self-contained .toString()(runtime) injection contract.
// Embed maintained verification code instead of requiring renderer globals.
const primaryEvidence = require('./alive-primary-policy-evidence.cjs');
const replayOracle = require('./alive-replay-state-evidence.cjs');
const { captureReplayHydration } = replayOracle;
const hubOracle = require('./alive-hub-state-evidence.cjs');
const { captureHubHydration } = hubOracle;
captureGenomeHydration = new Function('return (' + captureGenomeHydration.toString().replace(
  'const captureHub = null; // Embedded direct hub observer below.',
  'const captureHub = (' + captureHubHydration.toString() + ');').replace(
  'const captureReplay = null; // Embedded direct replay observer below.',
  'const captureReplay = (' + captureReplayHydration.toString() + ');').replace(
  'const capturePrimaryPolicy = null; // Embedded independent observer below.',
  'const capturePrimaryPolicy = (' + primaryEvidence.capturePrimaryPolicyEvidence.toString() + ');').replace(
  'const captureTrainer = null; // Embedded direct trainer observer below.',
  'const captureTrainer = (' + captureTrainerHydration.toString() + ');') + ');')();

// The legacy loader retains the destination's counter when Number(saved) is
// falsy. Observe that destination before load rather than guessing its seed.
// This tiny helper is also serializable into an isolated verification host.
function captureGenomeInitialState(runtime) {
  const trainableHub = {};
  for (const key of ['totalBackpropStepsTrained', 'ideasSynthesizedCount', 'dreamConsolidationSteps']) {
    trainableHub[key] = runtime.trainableAlifeNeuralHub?.[key];
  }
  return { schema: 'gigachad.genome-initial-state-evidence.v1', trainableHub };
}

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const trainerOracle = require('./alive-trainer-state-evidence.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function assessTrainerHydration(sealedWire, evidence, { requireInactive = false } = {}) {
  try {
    if (evidence?.schema !== 'gigachad.trainer-hydration-evidence.v1' || evidence.byteOrder !== 'LE' ||
        evidence.byteLength !== 64 || evidence.privateProjectionMatchesDirectBytes !== true ||
        typeof evidence.weightsBase64 !== 'string' || evidence.weightsBase64.length !== 88 || typeof evidence.active !== 'boolean') throw new Error('Invalid direct trainer observation');
    const bytes = Buffer.from(evidence.weightsBase64, 'base64');
    if (bytes.length !== 64 || bytes.toString('base64') !== evidence.weightsBase64) throw new Error('Invalid trainer byte encoding');
    const result = trainerOracle.assessTrainerStateEvidence(JSON.stringify(sealedWire), { weights: bytes, committedEpoch: evidence.committedEpoch, timeoutMs: evidence.timeoutMs });
    const inactive = evidence.active === false && evidence.pendingJobId === null && evidence.pendingTargetEpoch === null;
    if (requireInactive && !inactive) return { ...result, ok: false, status: 'trainer-admission-open', differences: [...(result.differences || []), { id: 'trainerAdmission', kind: 'active-or-pending-at-hydration' }] };
    return { ...result, inactive, clockEvidence: 'Explicit private-state engine read API; independent direct tensor bytes crosschecked before and after callback' };
  } catch (error) { return { ok: false, status: 'invalid-trainer-observation', reason: String(error.message), differences: [{ id: 'trainerCommittedState', kind: 'invalid-observation' }] }; }
}
function assessReplayHydration(sealedWire, evidence, { expectedSnapshot } = {}) {
  try { return replayOracle.assessReplayStateEvidence(JSON.stringify(sealedWire), evidence, { expectedSnapshot }); }
  catch (error) {
    return { ok: false, status: 'invalid-replay-evidence', reason: String(error.message || error),
      arraysChecked: 0, elementsChecked: 0, elementsDifferent: 0, comparedBytes: 0, comparedStates: 0,
      differences: [{ id: 'replayMemoryState', kind: 'invalid-evidence' }] };
  }
}
function assessHubHydration(sealedWire, evidence, { expectedSnapshot } = {}) {
  try { return hubOracle.assessHubStateEvidence(JSON.stringify(sealedWire), evidence, { expectedSnapshot }); }
  catch (error) {
    return { ok: false, status: 'invalid-hub-evidence', reason: String(error.message || error),
      arraysChecked: 0, elementsChecked: 0, elementsDifferent: 0, comparedBytes: 0, comparedStates: 0,
      differences: [{ id: 'hubMemoryState', kind: 'invalid-evidence' }] };
  }
}
const HUB = ['W_perc_enc', 'W_perc_dec', 'W_dyn1', 'W_dyn2', 'W_diff1', 'W_diff2', 'W_gen1', 'W_gen2', 'W_disc1', 'W_disc2', 'W_aware16'];
const SLTC = ['sltcWeights64', 'sltcRecWeights64', 'sltcBias64'];
const AOT = ['W_aot_contractor', 'W_tot_branch4x16x16', 'W_got_attn'];
// Independent schema constants from the current legacy import contract, not
// production importer/codec calls. Third member is the actual destination type.
const PORTED_ARRAYS = {
  councilConsensusMotor2D: [-1, 1, 32], asmodensiusRlsW8x2: [-5, 5, 64], asmodensiusRlsP8x8: [-50, 50, 64],
  asmodensiusQ3Angles6: [-Math.PI, Math.PI, 64], glitchlingCerebellar2x2: [-1.2, 1.2, 32],
  glitchlingDeltaNetS8x8: [-2, 2, 32], glitchlingWSite16: [.05, .99, 32], cqmSuperMindOrganW30x8: [-1.8, 1.8, 32],
  apexHydraReadoutW11x4: [-2, 2, 32], xenomimicW1_6x8: [-2, 2, 32], xenomimicB1_8: [-1.5, 1.5, 32],
  xenomimicW2_8x5: [-2, 2, 32], xenomimicB2_5: [-1.5, 1.5, 32], xylosEdgeWeight192: [-1.5, 1.5, 32],
  xylosResidualSlope8: [.2, 2, 32], xylosResidualIntercept8: [-.5, .5, 32], mechalogodromSubBrainW10x8: [-2, 2, 32],
  mechalogodromBiPooTraces10: [-2, 2, 32], dabusAutoassoc8x8: [-1.8, 1.8, 32], dabusHotCritic8: [-1.5, 1.5, 32],
  dabusChainStage1_8x8: [-1.8, 1.8, 32], dabusChainStage2_8x8: [-1.8, 1.8, 32], graphCrystalW6x6: [-1.8, 1.8, 32],
  tsotchkeDaleRaw16x16: [.01, 1.5, 32, true], tsotchkeStpResource16: [.05, 1, 32, true],
  tsotchkeDdimLatent16: [-1, 1, 32], consortiumW10x8: [-1.8, 1.8, 32], thingmakerMorph8x8: [-1.8, 1.8, 32]
};
const PORTED_SCALARS = {
  apexHydraChirikovTheta: [-2 * Math.PI, 2 * Math.PI], apexHydraChirikovP: [-2 * Math.PI, 2 * Math.PI],
  xenomimicMimicPolarity: [-1, 1], glyphFastWeightEnergy: [0, 5], glyphPredictorLoss: [0, 5], dabusCuspXi: [-1.2, 1.2],
  graphCrystalLouvainQ: [0, 1], blackHoleEvaporationFraction: [0, .9999], blackHoleMassM: [1.2, 4],
  blackHoleSpinA: [.05, 3.5], blackHoleChargeQ: [.05, 1.8], blackHolePageEntropy: [0, 500]
};
const canonical = value => JSON.stringify(value, (_key, item) => item && !Array.isArray(item) && typeof item === 'object'
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const digest = value => hash(canonical(value) ?? '<undefined>');
function assessGenomeHydration(expectedRawJSON, snapshot, { initialState } = {}) {
  const comparisons = [], differences = [], excluded = [], inconclusive = [];
  const record = (path, expected, actual, rule) => {
    const ok = isDeepStrictEqual(expected, actual);
    const result = { path, ok, rule, expectedSHA256: digest(expected), actualSHA256: digest(actual) };
    comparisons.push(result); if (!ok) differences.push({ path, kind: 'value-mismatch' });
  };
  const omit = (path, reason) => excluded.push({ path, reason });
  let expected, encoded;
  try {
    if (typeof expectedRawJSON !== 'string' || Buffer.byteLength(expectedRawJSON) > 32 * 1024 * 1024) throw new Error('Expected JSON missing or exceeds 32MiB');
    expected = JSON.parse(expectedRawJSON);
    if (!expected || typeof expected !== 'object' || Array.isArray(expected)) throw new Error('Expected genome must be an object');
    if (snapshot?.schema !== 'gigachad.genome-hydration-evidence.v1' || !['LE', 'BE'].includes(snapshot.byteOrder)) throw new Error('Unsupported capture schema/byte order');
    if (snapshot.errors?.length) throw new Error('Capture errors: ' + snapshot.errors.join('; '));
    encoded = JSON.parse(snapshot.encodedJSON);
  } catch (error) { return { ok: false, status: 'invalid-evidence', reason: error.message }; }
  const hasPrimary = Object.prototype.hasOwnProperty.call(expected, 'primaryPolicyState');
  const hasTrainer = Object.prototype.hasOwnProperty.call(expected, 'trainerCommittedState');
  const hasReplay = Object.prototype.hasOwnProperty.call(expected, 'replayMemoryState');
  const hasHub = Object.prototype.hasOwnProperty.call(expected, 'hubMemoryState');
  const fields = snapshot.fields || {}, plans = [
    ...(!hasPrimary ? [...['W_actor', 'W_metamorph', 'W_critic', 'W_world'].map(key => [key, key]),
      ['W_actor_frozen', 'W_actor'], ['W_world_frozen', 'W_world']] : []),
    ...(!hasHub ? HUB.map(key => ['trainableAlifeNeuralHub.' + key, 'trainableHub.' + key]) : []),
    ...SLTC.map(key => ['deepWebAndSltcConnectomeEngine.' + key, 'sltcLearned.' + key]),
    ...AOT.map(key => ['aotTotGotEngine.' + key, 'aotTotGotLearned.' + key])
  ];
  let elementsChecked = 0, elementsDifferent = 0, arraysChecked = 0;
  let primaryPolicy = null;
  if (hasPrimary) {
    primaryPolicy = primaryEvidence.assessPrimaryPolicyEvidence(expected.primaryPolicyState, snapshot.primaryPolicyEvidence);
    comparisons.push(...primaryPolicy.comparisons);
    differences.push(...primaryPolicy.differences);
    arraysChecked += primaryPolicy.arraysChecked;
    elementsChecked += primaryPolicy.elementsChecked;
    elementsDifferent += primaryPolicy.elementsDifferent;
    omit('legacy W_actor/W_metamorph/W_critic/W_world compatibility copies', 'Exact primaryPolicyState is authoritative; frozen baselines use their own saved bytes');
  }
  let trainer = null;
  if (hasTrainer) {
    trainer = assessTrainerHydration(expected.trainerCommittedState, snapshot.trainerEvidence, { requireInactive: true });
    if (snapshot.trainerCaptureError) differences.push({ path: 'trainerCommittedState', kind: 'initial-capture-failed' });
    comparisons.push({ path: 'trainerCommittedState', ok: trainer.ok, rule: 'Independent64-byte wire comparison plus API-observed private epoch/configuration and suspended admission',
      expectedBytesSHA256: trainer.actual?.weightsSHA256 || null, actualBytesSHA256: trainer.expectedWeightsSHA256 || null });
    if (!trainer.ok) differences.push(...(trainer.differences || [{ id: 'trainerCommittedState', kind: trainer.status }]).map(item => ({ ...item, path: 'trainer.' + (item.id || 'state') })));
    if (trainer.comparedBytes === 64) { arraysChecked++; elementsChecked += 16; elementsDifferent += trainer.differingFloat32Values || 0; }
    record('paired-exact-snapshot', expected.primaryPolicyState?.snapshot, expected.trainerCommittedState?.snapshot, 'Both exact components must belong to the identical snapshot');
    if (!hasPrimary) differences.push({ path: 'primaryPolicyState', kind: 'trainer-requires-primary' });
    for (const [outer, inner] of [['simulationTick', 'logicalTick'], ['policyCid', 'policyId'], ['checkpointCid', 'checkpointId']]) {
      record('trainer.snapshot.' + inner, expected[outer], expected.trainerCommittedState?.snapshot?.[inner], 'Exact component metadata binds to the outer persisted snapshot');
    }
  }
  let replay = null;
  if (hasReplay) {
    replay = assessReplayHydration(expected.replayMemoryState, snapshot.replayEvidence,
      { expectedSnapshot: expected.primaryPolicyState?.snapshot });
    if (snapshot.replayCaptureError) differences.push({ path: 'replayMemoryState', kind: 'initial-capture-failed' });
    comparisons.push({ path: 'replayMemoryState', ok: replay.ok && !snapshot.replayCaptureError,
      rule: 'Independent occupied replay bytes, finite Float64 priorities, dense physical slot order and insertion cursor observed before all callbacks',
      arraysChecked: replay.arraysChecked || 0, elementsChecked: replay.elementsChecked || 0,
      comparedBytes: replay.comparedBytes || 0, comparedStates: replay.comparedStates || 0 });
    if (!replay.ok) differences.push(...(replay.differences?.length ? replay.differences : [{ id: 'replayMemoryState', kind: replay.status }])
      .map(item => ({ ...item, path: 'replay.' + (item.id || 'state') })));
    arraysChecked += replay.arraysChecked || 0;
    elementsChecked += replay.elementsChecked || 0;
    elementsDifferent += replay.elementsDifferent || 0;
    if (!hasPrimary) differences.push({ path: 'primaryPolicyState', kind: 'replay-requires-primary' });
    if (!hasTrainer) differences.push({ path: 'trainerCommittedState', kind: 'replay-requires-trainer' });
    record('replay-paired-primary-snapshot', expected.primaryPolicyState?.snapshot, expected.replayMemoryState?.snapshot,
      'Replay and primary must share all seven snapshot identity fields');
    record('replay-paired-trainer-snapshot', expected.trainerCommittedState?.snapshot, expected.replayMemoryState?.snapshot,
      'Replay and trainer must share all seven snapshot identity fields');
    for (const [outer, inner] of [['simulationTick', 'logicalTick'], ['policyCid', 'policyId'], ['checkpointCid', 'checkpointId'],
      ...(Object.prototype.hasOwnProperty.call(expected, 'agentId') ? [['agentId', 'creatureId']] : [])]) {
      record('replay.snapshot.' + inner, expected[outer], expected.replayMemoryState?.snapshot?.[inner],
        'Exact replay snapshot metadata binds to the outer persisted identity');
    }
    if (Object.prototype.hasOwnProperty.call(encoded, 'replayMemoryState')) {
      const diagnostic = assessReplayHydration(encoded.replayMemoryState, snapshot.replayEvidence,
        { expectedSnapshot: expected.replayMemoryState?.snapshot });
      comparisons.push({ path: 'replayMemoryState.exportDiagnostic', ok: diagnostic.ok,
        rule: 'A retained sealed replay diagnostic must independently validate and match the original direct observation' });
      if (!diagnostic.ok) differences.push({ path: 'replayMemoryState.exportDiagnostic', kind: diagnostic.status || 'invalid-sealed-diagnostic' });
    }
  } else if (snapshot.replayDiagnosticOmitted || Object.prototype.hasOwnProperty.call(encoded, 'replayMemoryState')) {
    // Legacy hydration remains valid without replay, but a new replay-bearing
    // export must not be silently presented as verified by a legacy-only input.
    omit('replayMemoryState', 'No replay component in the saved input; current replay is outside this hydration claim');
  }
  let hub = null;
  if (hasHub) {
    hub = assessHubHydration(expected.hubMemoryState, snapshot.hubEvidence,
      { expectedSnapshot: expected.primaryPolicyState?.snapshot });
    if (snapshot.hubCaptureError) differences.push({ path: 'hubMemoryState', kind: 'initial-capture-failed' });
    comparisons.push({ path: 'hubMemoryState', ok: hub.ok && !snapshot.hubCaptureError,
      rule: 'Independent declared hub bytes, exact mixed arena/aliases and scalar state observed before all callbacks',
      arraysChecked: hub.arraysChecked || 0, elementsChecked: hub.elementsChecked || 0,
      comparedBytes: hub.comparedBytes || 0, comparedStates: hub.comparedStates || 0 });
    if (!hub.ok) differences.push(...(hub.differences?.length ? hub.differences : [{ id: 'hubMemoryState', kind: hub.status }])
      .map(item => ({ ...item, path: 'hub.' + (item.id || 'state') })));
    arraysChecked += hub.arraysChecked || 0;
    elementsChecked += hub.elementsChecked || 0;
    elementsDifferent += hub.elementsDifferent || 0;
    for (const [field, present] of [['primaryPolicyState', hasPrimary], ['trainerCommittedState', hasTrainer], ['replayMemoryState', hasReplay]]) {
      if (!present) differences.push({ path: field, kind: 'hub-requires-' + field });
      record('hub-paired-' + field + '-snapshot', expected[field]?.snapshot, expected.hubMemoryState?.snapshot,
        'Hub and each required exact component must share all seven snapshot identity fields');
    }
    for (const [outer, inner] of [['simulationTick', 'logicalTick'], ['policyCid', 'policyId'], ['checkpointCid', 'checkpointId'],
      ...(Object.prototype.hasOwnProperty.call(expected, 'agentId') ? [['agentId', 'creatureId']] : [])]) {
      record('hub.snapshot.' + inner, expected[outer], expected.hubMemoryState?.snapshot?.[inner],
        'Exact hub snapshot metadata binds to the outer persisted identity');
    }
    if (Object.prototype.hasOwnProperty.call(encoded, 'hubMemoryState')) {
      const diagnostic = assessHubHydration(encoded.hubMemoryState, snapshot.hubEvidence,
        { expectedSnapshot: expected.hubMemoryState?.snapshot });
      comparisons.push({ path: 'hubMemoryState.exportDiagnostic', ok: diagnostic.ok,
        rule: 'A retained sealed hub diagnostic must independently validate and match the original direct observation' });
      if (!diagnostic.ok) differences.push({ path: 'hubMemoryState.exportDiagnostic', kind: diagnostic.status || 'invalid-sealed-diagnostic' });
    }
    omit('legacy trainableHub arrays and counters', 'Exact hubMemoryState is authoritative after legacy load; rounded arrays and truthy-counter fallback copies are not the restored exact state');
  } else if (snapshot.hubDiagnosticOmitted || Object.prototype.hasOwnProperty.call(encoded, 'hubMemoryState')) {
    omit('hubMemoryState', 'No hub component in the saved input; current exact hub export is outside this hydration claim');
  }
  const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
  for (const [runtimePath, storedPath] of plans) {
    const values = get(expected, storedPath), actual = snapshot.arrays?.[runtimePath];
    if (values === undefined && storedPath.includes('.') && expected[storedPath.split('.')[0]] == null) { omit(runtimePath, 'Optional stored engine absent'); continue; }
    if (!Array.isArray(values)) { differences.push({ path: runtimePath, kind: 'stored-array-missing' }); continue; }
    if (!actual || actual.type !== 'Float32Array' || actual.length !== values.length || actual.byteLength !== values.length * 4 ||
        typeof actual.base64 !== 'string' || actual.byteLength > 32 * 1024 * 1024) { differences.push({ path: runtimePath, kind: 'captured-array-type-or-shape' }); continue; }
    const actualBytes = Buffer.from(actual.base64, 'base64');
    if (actualBytes.length !== actual.byteLength || actualBytes.toString('base64') !== actual.base64) { differences.push({ path: runtimePath, kind: 'invalid-byte-encoding' }); continue; }
    const expectedBytes = Buffer.alloc(values.length * 4); let unknown = 0, changed = 0;
    for (let i = 0; i < values.length; i++) {
      const number = Number(values[i]);
      if (!Number.isFinite(number)) { unknown++; continue; }
      const clamped = number < -5 ? -5 : number > 5 ? 5 : number;
      snapshot.byteOrder === 'LE' ? expectedBytes.writeFloatLE(clamped, i * 4) : expectedBytes.writeFloatBE(clamped, i * 4);
      elementsChecked++;
      if (!expectedBytes.subarray(i * 4, i * 4 + 4).equals(actualBytes.subarray(i * 4, i * 4 + 4))) changed++;
    }
    arraysChecked++; elementsDifferent += changed;
    comparisons.push({ path: runtimePath, ok: !changed && !unknown, length: values.length, elementsCompared: values.length - unknown,
      differingElements: changed, unknownInitializerElements: unknown, expectedBytesSHA256: unknown ? null : hash(expectedBytes), actualBytesSHA256: hash(actualBytes),
      rule: 'Number coercion, finite clamp [-5,5], exact IEEE754 Float32 bytes; frozen mirrors use the same restored source' });
    if (changed) differences.push({ path: runtimePath, kind: 'float32-byte-mismatch', count: changed });
    if (unknown) inconclusive.push({ path: runtimePath, reason: 'Nonfinite source leaves initializer bytes unchanged; no pre-load baseline', count: unknown });
  }
  record('authorityEpoch', (Number(expected.authorityEpoch) || 1) + 1, fields.authorityEpoch, 'loader epoch increment');
  for (const key of ['simulationTick', 'dreamReplaysCount', 'pelletsEatenCount', 'horizontalTransfersCount']) record(key, Number(expected[key]) || 0, fields[key], 'Number(value) || 0');
  for (const key of ['policyCid', 'checkpointCid']) {
    if (expected[key]) record(key, String(expected[key]), fields[key], 'truthy stored identity'); else omit(key, 'Absent/falsy stored identity retains initializer');
  }
  for (const key of ['bodyRecipe', 'semanticMemory', 'proceduralMemory', 'personality', 'emotionState', 'morphogenesis', 'cognitiveCortex']) {
    if (!expected[key] || typeof expected[key] !== 'object') { omit(key, 'No stored object; initializer retained'); continue; }
    for (const [member, value] of Object.entries(expected[key])) {
      if (key === 'cognitiveCortex' && member === 'realizationLedger' && !Array.isArray(value)) { omit(`${key}.${member}`, 'Non-array ledger retains initializer'); continue; }
      record(`${key}.${member}`, key === 'cognitiveCortex' && member === 'realizationLedger' ? value.slice(-36) : value,
        fields[key]?.[member], 'persisted shallow-merge member; realization ledger retains last36');
    }
  }
  for (const [key, limit, first] of [['offspringColony', 4, true], ['episodicMemory', 40], ['handoffLedger', 16], ['causalPropositions', 72]]) {
    if (!Array.isArray(expected[key]) || key === 'causalPropositions' && !expected[key].length) { omit(key, 'Missing/empty causal input retains initializer'); continue; }
    record(key, first ? expected[key].slice(0, limit) : expected[key].slice(-limit), fields[key], `loader retains ${first ? 'first' : 'last'}${limit}; direct runtime capture avoids writer truncation`);
  }
  for (const key of ['visitedUrls', 'clickedAnchors']) {
    if (!Array.isArray(expected[key])) { omit(key, 'No saved set entries'); continue; }
    const selected = Array.from(new Set(expected[key].slice(-200)));
    const actual = fields[key] || [], retained = actual.filter(value => selected.includes(value));
    record(key, selected, retained, 'last200 saved entries added to insertion-ordered set; preexisting initializer entries excluded');
  }
  if (expected.swarmFormation && snapshot.allowedFormations?.includes(expected.swarmFormation)) record('swarmFormation', expected.swarmFormation, fields.swarmFormation, 'allowed persisted formation');
  else omit('swarmFormation', 'Missing or unsupported saved formation retains initializer');
  if (expected.sovereignStats) for (const key of ['commandsExecutedCount', 'vaultEngramsCrystallized', 'bookmarksAutonomouslyPinned', 'maxsmartDossiersSynthesized', 'vibeCssMutationsCount', 'emergentQueriesInjected']) {
    record('sovereignStats.' + key, Number(expected.sovereignStats[key]) || (key === 'emergentQueriesInjected' ? 1 : 0), fields.sovereignStats?.[key], 'documented scalar fallback');
  }
  if (!hasHub && expected.trainableHub) for (const key of ['totalBackpropStepsTrained', 'ideasSynthesizedCount', 'dreamConsolidationSteps']) {
    const saved = Number(expected.trainableHub[key]);
    if (saved) {
      record('trainableHub.' + key, saved, fields.trainableHub?.[key], 'truthy Number(saved) replaces the destination counter');
    } else if (initialState?.schema === 'gigachad.genome-initial-state-evidence.v1' &&
        Object.hasOwn(initialState.trainableHub || {}, key) && Number.isFinite(initialState.trainableHub[key])) {
      record('trainableHub.' + key, initialState.trainableHub[key], fields.trainableHub?.[key], 'falsy Number(saved) retains the observed pre-load counter');
    } else {
      inconclusive.push({ path: 'trainableHub.' + key, reason: 'Falsy saved counter retains initializer; no valid pre-load counter evidence' });
    }
  }
  if (expected.portedPantheonLearned) {
    const saved = expected.portedPantheonLearned, actual = encoded.portedPantheonLearned || {}, known = new Set(['version', 'asmodensiusRlsW16x2']);
    record('ported.version', 'PORTED_14_BRAINS_V1', actual.version, 'exported learned-state schema');
    for (const [key, [min, max, bits, absolute]] of Object.entries(PORTED_ARRAYS)) {
      known.add(key); const values = key === 'asmodensiusRlsW8x2' ? saved[key] || saved.asmodensiusRlsW16x2 : saved[key];
      if (!Array.isArray(values) || values.some(value => !Number.isFinite(Number(value)))) { inconclusive.push({ path: 'ported.' + key, reason: 'Missing/nonfinite learned array retains initializer' }); continue; }
      const normalized = values.map(value => {
        const n = absolute ? Math.abs(Number(value)) : Number(value), clipped = Math.max(min, Math.min(max, n));
        const restored = bits === 32 ? Math.fround(clipped) : clipped;
        // This optional engine is observed through its exported JSON contract;
        // JSON represents either zero sign as0. The23 raw destinations above
        // still compare signed zero bit-for-bit.
        return restored === 0 ? 0 : restored;
      });
      record('ported.' + key, normalized, actual[key], `independent ${bits}-bit import coercion/clamp${absolute ? '/absolute' : ''}; full-precision exported values`);
      if (key === 'asmodensiusRlsW8x2') record('ported.asmodensiusRlsW16x2', normalized, actual.asmodensiusRlsW16x2, 'historical export alias of W8x2');
    }
    for (const [key, [min, max]] of Object.entries(PORTED_SCALARS)) {
      known.add(key);
      if (Number.isFinite(saved[key])) record('ported.' + key, Math.max(min, Math.min(max, saved[key])) || 0, actual[key], 'independent finite scalar clamp; JSON zero normalization');
      else omit('ported.' + key, 'Nonfinite/absent scalar retains initializer');
    }
    for (const key of ['stepCount', 'totalOnlinePlasticUpdates']) {
      known.add(key); record('ported.' + key, Number.isFinite(saved[key]) && saved[key] >= 0 ? Math.floor(saved[key]) : 0, actual[key], 'startup0, nonnegative counter floor/max');
    }
    known.add('graphCrystalGoapPlan');
    if (typeof saved.graphCrystalGoapPlan === 'string' && saved.graphCrystalGoapPlan.length > 0 && saved.graphCrystalGoapPlan.length <= 64) record('ported.graphCrystalGoapPlan', saved.graphCrystalGoapPlan, actual.graphCrystalGoapPlan, 'valid nonempty plan <=64 characters');
    else omit('ported.graphCrystalGoapPlan', 'Invalid plan retains initializer');
    known.add('glyphFp16FastSlots16');
    if (Array.isArray(saved.glyphFp16FastSlots16) && saved.glyphFp16FastSlots16.length === 16 && saved.glyphFp16FastSlots16.every(value => Number.isFinite(Number(value)))) {
      const normalized = saved.glyphFp16FastSlots16.map(value => {
        const bits = Number(value) & 65535, exp = bits >>> 10 & 31, mant = bits & 1023;
        if (exp === 31) return 0;
        const magnitude = exp ? 2 ** (exp - 15) * (1 + mant / 1024) : 2 ** -14 * mant / 1024;
        // Nearest-even binary16 representation of +/-1.8 is +/-0x3f33.
        return magnitude > 1.8 ? (bits & 32768) | 0x3f33 : bits;
      });
      record('ported.glyphFp16FastSlots16', normalized, actual.glyphFp16FastSlots16, 'U16 bits, nonfinite half->0, magnitude clamp1.8 rounded to nearest-even half');
    } else inconclusive.push({ path: 'ported.glyphFp16FastSlots16', reason: 'Missing or invalid16-slot payload' });
    for (const key of Object.keys(saved)) if (!known.has(key)) omit('ported.' + key, 'Not covered by the declared learned-state import schema');
  } else omit('portedPantheonLearned', 'Optional stored federation absent');
  if (expected.authenticAsmodensius) {
    const envelope = expected.authenticAsmodensius;
    let checksum = 2166136261;
    if (typeof envelope.payload === 'string') for (let i = 0; i < envelope.payload.length; i++) checksum = Math.imul(checksum ^ envelope.payload.charCodeAt(i), 16777619) >>> 0;
    record('authentic.checksum', (checksum >>> 0).toString(16).padStart(8, '0'), envelope.checksum, 'independent UTF16 FNV1a checksum, not authentication');
    record('authenticAsmodensius', envelope, encoded.authenticAsmodensius, 'exact exported envelope/payload including negative-zero markers, sets, native state and RNG');
  } else omit('authenticAsmodensius', 'Optional stored authentic adapter absent');
  omit('savedAt', 'Capture time changes; not a restored model field');
  omit('agentId', 'Observed but not present in legacy persisted schema; no identity-hydration claim');
  omit('other runtime tensors/scalars and non-exported ported state', 'Not restored by this legacy payload; no full-model replay claim');
  const ok = !differences.length && !inconclusive.length;
  return { ok, status: differences.length ? 'mismatch' : inconclusive.length ? 'incomplete-evidence' : 'passed-covered-contract',
    expectedJSONSHA256: hash(expectedRawJSON), capturedJSONSHA256: hash(snapshot.encodedJSON), arraysChecked, elementsChecked, elementsDifferent,
    comparisonCount: comparisons.length, differenceCount: differences.length, differences: differences.slice(0, 24),
    inconclusive, comparisons, excluded, primaryPolicy, trainer, replay, hub,
    scope: hasHub ? 'Immediate exact primary, committed trainer, occupied replay and declared hub hydration plus remaining legacy checks; direct hub/replay evidence precedes callbacks; other runtime state and next-update equivalence are outside this claim' : hasReplay
      ? 'Immediate exact primary, committed trainer and occupied replay hydration plus declared legacy checks; replay observes dense physical records/cursor before callbacks; omitted cadence, RNG and other model state prevent a full-runtime continuation claim' : hasTrainer
      ? 'Immediate exact primary plus committed trainer hydration (734 Float32 values and private clock/configuration) plus declared legacy checks; clock uses explicit engine API; not full runtime continuation' : hasPrimary
      ? 'Immediate hydration: authoritative exact six primary tensors/declared aliases plus17 legacy Float32 destinations when present and declared persisted fields; not full runtime continuation'
      : 'Immediate legacy hydration, exact23 Float32 destinations when present plus declared persisted fields and exported engine state; not arbitrary runtime replay' };
}

module.exports = { captureGenomeHydration, captureGenomeInitialState, assessGenomeHydration, captureTrainerHydration, assessTrainerHydration,
  captureReplayHydration, assessReplayHydration, captureHubHydration, assessHubHydration };
