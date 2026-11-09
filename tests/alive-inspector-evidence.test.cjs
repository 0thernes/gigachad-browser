'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = source.indexOf('      formatRetroTerminalText(modeOverride) {');
const end = source.indexOf('\n      renderRetroTerminalOverlay(', start);
assert.ok(start > 0 && end > start);
const format = vm.runInNewContext('({' + source.slice(start, end) + '}).formatRetroTerminalText', {
  HUMUNCULUS_STAGES:[{}], superintelligenceOverdrive:false, alienBrainActive:false,
  document:{getElementById(){return null;}}
});
const render = (mode, state = {}) => format.call({stageIdx:0,mesh:{},...state},mode);

test('missing brain snapshots show unavailable values without invented scientific outputs',()=>{
  const text=render('brainfusion');
  assert.match(text,/state=unavailable/);assert.match(text,/MinSR norm=unmeasured/);
  assert.match(text,/source corpus=unmeasured neurons\/unmeasured edges/);
  assert.match(text,/RLS=unmeasured/);assert.match(text,/projection \(not IIT Phi\)=unmeasured/);
  assert.doesNotMatch(text,/0\.0137|0\.0142|0\.99|84\.4|FORAGE_PORTAL_SYNTHESIS|undefined|NaN/);
});

test('partial brain snapshots retain measured zero and false values while absent fields stay unmeasured',()=>{
  const be={precisionExecutionEvidence:()=>({kernelsCompleted:true}),multiPrecisionSummary:{f64OdeMeanTau:0,fp16CompressionMaxErr:NaN},
    siblingBrainFusion:{asmodensiusState:{gwtIgnitionActive:false,trnWinnerAreaIdx:0},
      multiverse10Pantheon:{latestSnapshot:{stateOrigin:'computed',completedStepCount:4,asmodensius:{rlsMse:0},thalerDabus:{passedAllAblations:false}}}}};
  const text=render('brainfusion',{bleedingEdge25Engine:be});
  assert.match(text,/completed federation steps=4/);assert.match(text,/Float64 tau=0/);
  assert.match(text,/FP16 error=unmeasured/);assert.match(text,/RLS=0/);assert.match(text,/ignition=false/);
  assert.match(text,/local ablation flag=false/);assert.doesNotMatch(text,/undefined|NaN/);
});

test('initialized precision summaries do not display as completed computations',()=>{
  const text=render('brainfusion',{bleedingEdge25Engine:{multiPrecisionSummary:{f64OdeMeanTau:.2913}}});
  assert.match(text,/unavailable: no completed kernel receipt/);assert.match(text,/Float64 tau=unmeasured/);
  assert.doesNotMatch(text,/0\.2913/);
});

test('missing and partial AoT models do not synthesize branch scores, updates or premise arrays',()=>{
  const missing=render('aottotgot');
  assert.match(missing,/MODEL STATE: unavailable/);assert.match(missing,/premises=\[unmeasured\]/);
  assert.match(missing,/local updates=unmeasured/);assert.doesNotMatch(missing,/0xA07F4E12|0\.842|262,144|CURIOSITY_NOVELTY/);
  const partial=render('aottotgot',{aotTotGotEngine:{aotContractionsCount:0,aotPremises4:new Float32Array([0,.5]),gotPlasticityUpdatesCount:0},connectome512:{stdpUpdatesCount:0}});
  assert.match(partial,/contractions=0/);assert.match(partial,/premises=\[0, 0\.5\]/);assert.match(partial,/local updates=0; connectome STDP=0/);
  assert.doesNotMatch(partial,/undefined|NaN/);
});

test('DSD missing state and empty clone histories cannot create invented exuvia telemetry',()=>{
  assert.match(render('decursive'),/DSD MODEL STATE UNAVAILABLE/);
  const empty=render('decursive',{decursiveSelfDeduplicator:{shedExuviaClones:[],totalSelfDeduplicationsCount:0}});
  assert.match(empty,/Shed Exuviae=0/);assert.match(empty,/Total Self-Deduplications=0/);
  assert.match(empty,/no AoT \/ ToT \/ GoT snapshot/);assert.match(empty,/no metacognition snapshot/);
  assert.doesNotMatch(empty,/0x7F4A|0\.82|-0\.57|96\.8|undefined|NaN/);
  const actual=render('decursive',{decursiveSelfDeduplicator:{shedExuviaClones:[{tombstoneHex:'observed-clone',orthoDx:0,orthoDy:-.25}],totalSelfDeduplicationsCount:3}});
  assert.match(actual,/observed-clone/);assert.match(actual,/\(0,-0\.25\)/);
});

test('opening the Deity inspector cannot start or mutate an absent model',()=>{
  let calls=0;
  const text=render('deity100',{stepDeity100OmnipotenceEngine(){calls++;throw Error('inspection must remain read-only');}});
  assert.equal(calls,0);assert.match(text,/UNAVAILABLE/);assert.match(text,/inspection does not start the model/);
});

test('every direct displayed Deity composite identifies a local simulation feature',()=>{
  const lines=source.split('\n').filter(line=>line.includes('supremeDeityIndexPsi')&&line.includes('`'));
  assert(lines.length>=10);
  for(const line of lines)assert.match(line,/LOCAL_SIMULATION_FEATURE|local simulation feature/,line.trim());
  assert.doesNotMatch(source,/dt \? dt\.supremeDeityIndexPsi : 99\.4/);
});

test('missing learning and metacognition states do not print initialized capability or training metrics',()=>{
  const text=render('learning');
  assert.match(text,/LOCAL TRAINING STATE: unavailable/);assert.match(text,/heldOutEval  NOT_RUN/);
  assert.match(text,/backprop steps=unmeasured/);assert.doesNotMatch(text,/0\.042|94\.6|96\.2|PROMOTED/);
  assert.match(render('metacognition'),/SNAPSHOT UNAVAILABLE; proof NOT_RUN/);
});

test('legacy initialized policy promotion is ignored until a real comparison exists and measured losses are retained',()=>{
  const state={lastEvalReport:{candidateId:'invented',heldOutDeltaPct:14.8,retentionPct:98.6,status:'PROMOTED'},
    trainableAlifeNeuralHub:{totalBackpropStepsTrained:0,perceptionLossMse:0},connectome512:{stdpUpdatesCount:0}};
  const before=render('learning',state);
  assert.match(before,/heldOutEval  NOT_RUN/);assert.doesNotMatch(before,/14\.8|98\.6|PROMOTED/);
  assert.match(before,/backprop steps=0/);assert.match(before,/perception loss=0/);
  state.learningEvidence={policyEvaluation:{candidateId:'measured',heldOutDeltaPct:-2.5,retentionPct:94,status:'ROLLED BACK'}};
  const after=render('learning',state);
  assert.match(after,/measured simulated-steering delta=-2\.5%/);assert.match(after,/ROLLED BACK/);
  assert.match(after,/independent webpage generalization NOT_RUN/);
});

test('FlyWire inspector rejects constructor benchmark wins and preserves measured negative ablation differences',()=>{
  const state={flywireConnectome:{epgCompass:new Float32Array(16),intactVsAblatedBenchmark:{trialsRun:1,intactTrackScorePct:94.6,advantagePct:28.4,verdict:'KEEP_SPECIALIST'}}};
  const before=render('flywire',state);
  assert.match(before,/no measured ring comparison/);assert.doesNotMatch(before,/94\.6|28\.4|KEEP_SPECIALIST/);
  state.learningEvidence={flywireEvaluation:{intactTrackScorePct:40,ablatedTrackScorePct:42,intactHeadingErrRad:1,ablatedHeadingErrRad:.9,trialsRun:1,capacity:16,advantagePct:-2,verdict:'NO_INTACT_ADVANTAGE_IN_THIS_SIMULATION'}};
  const after=render('flywire',state);
  assert.match(after,/signed difference=-2 percentage points/);assert.match(after,/NO_INTACT_ADVANTAGE/);
  assert.match(after,/not full FlyWire validation/);
});
