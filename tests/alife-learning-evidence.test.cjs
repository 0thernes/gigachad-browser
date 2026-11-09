'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { install, evaluatePolicy, worldMse, trainWorld, flywireBenchmark } = require('../systems/alife-learning-evidence');

function fixture() {
  return {
    D_OBS:16,D_ACT:5,D_MORPH:6,stageIdx:0,simulationTick:0,
    W_actor:new Float32Array(80),W_actor_frozen:new Float32Array(80),W_metamorph:new Float32Array(30),W_world:new Float32Array(256),
    obsVec:new Float32Array(16),morphVec:new Float32Array(6).fill(.5),
    mesh:{viscera:{sleepS:.5}},worldPredError:.42,p95StepLatencyMs:1,policyLatencySamples:[],policyCid:'initial',
    flywireConnectome:{epgCompass:new Float32Array(16)},
    stepClosedLoop(){this.simulationTick++;this.obsVec.fill(.1+this.simulationTick*.0001);},
    mintCid(prefix,salt){return `${prefix}-${salt}`;},saveCheckpoint(){},renderRetroTerminalOverlay(){}
  };
}

function observedStep(h, overrides = {}) {
  return h.stepClosedLoop({ sensorValidityMask: 0b1111 }, { source: 'observed-page', tabId: 'fixture-tab',
    url: 'https://fixture.invalid/page', observedAt: h.simulationTick + 1, ...overrides });
}

test('identical policy weights produce identical independently repeated holdout returns',()=>{
  const h=fixture(), dimensions={actions:5,observations:16};
  const before=evaluatePolicy(h.W_actor,h.W_metamorph,h.morphVec,dimensions);
  const after=evaluatePolicy(new Float32Array(h.W_actor),h.W_metamorph,h.morphVec,dimensions);
  assert.deepEqual(after,before);
  assert.equal(after.seeds.length,5);
  assert.ok(after.returns.every(x=>x>0&&x<=1));
});

test('training measures holdout and retention and commits or restores exactly by measured result',()=>{
  const h=fixture();install(h);
  const report=h.runPracticeAndHeldOutEval().evalReport;
  const computed=(report.candidate.meanReturn-report.baseline.meanReturn)/Math.abs(report.baseline.meanReturn)*100;
  assert.ok(Math.abs(report.heldOutDeltaPct-computed)<.000001);
  assert.equal(report.promoted,computed>0&&report.retentionPct>=95);
  assert.ok(report.candidate.seeds.every(seed=>!report.trainingSeeds.includes(seed)));
  assert.ok(report.retentionCandidate.seeds.every(seed=>!report.candidate.seeds.includes(seed)&&!report.trainingSeeds.includes(seed)));
  assert.ok(h.W_actor.some(x=>x!==0));
  assert.equal(report.trainingProcedure.candidateRuns,1);
  assert.deepEqual(report.trainingProcedure.trajectorySeeds,[7,19,43]);
  assert.deepEqual(report.trainingProcedure.independentTrainingSeeds,[]);
  assert.equal(report.trainingProcedure.changedConditionSuite,false);
  assert.match(report.trainingSeedScope,/sequential trajectories/);
});

test('dream replay requires actual observations and does not invent episodes or reduce a metric by constant',()=>{
  const h=fixture();const evidence=install(h);
  const empty=h.consolidateHippocampalDreamReplay();
  assert.equal(empty.status,'blocked');assert.equal(empty.replayedEpisodes,0);
  assert.equal(h.worldPredError,.42);
  for(let i=0;i<20;i++)observedStep(h);
  const heldout=evidence.transitions.filter((_,i)=>i%4===0);
  const previous=worldMse(h.W_world,heldout,16);
  const result=h.consolidateHippocampalDreamReplay();
  assert.equal(result.beforeErr,previous);
  assert.equal(result.afterErr,worldMse(h.W_world,heldout,16));
  assert.equal(result.replayedEpisodes+result.heldoutTransitions,19);
  assert.ok(result.afterErr<result.beforeErr);
  assert.equal(h.worldPredError,.42,'online metric must not be replaced with incomparable replay MSE');
});

test('replay transition storage remains bounded and retained observations are immutable copies',()=>{
  const h=fixture();const e=install(h);
  for(let i=0;i<300;i++)observedStep(h);
  assert.equal(e.transitions.length,128);
  const last=e.transitions.at(-1).nextObservation.slice();
  h.obsVec.fill(99);
  assert.deepEqual(e.transitions.at(-1).nextObservation,last);
});

test('guest handoffs and restored authority epochs cannot invent cross-context replay transitions',()=>{
  const h=fixture();h.authorityEpoch=4;const e=install(h);
  observedStep(h);observedStep(h);
  assert.equal(e.transitions.length,1);
  observedStep(h,{tabId:'second-pane'});
  assert.equal(e.transitions.length,1,'selecting another tab is not a measured transition of the prior guest');
  observedStep(h,{tabId:'second-pane'});
  assert.equal(e.transitions.length,2);
  h.authorityEpoch=5;
  observedStep(h,{tabId:'second-pane'});
  assert.equal(e.transitions.length,2,'checkpoint restore or a new document epoch breaks temporal continuity');
  observedStep(h,{tabId:'second-pane'});
  assert.equal(e.transitions.length,3);
  assert.equal(e.continuityBreaks,2);
  assert.equal(e.recordedTransitions,3);
  for(const transition of e.transitions){
    assert.equal(transition.from.tabId,transition.to.tabId);
    assert.equal(transition.from.authorityEpoch,transition.to.authorityEpoch);
  }
  assert.deepEqual(e.transitions.map(item=>item.transitionId),[0,1,2]);
  assert.equal(e.transitions[0].from.authorityEpoch,4,'earlier valid replay episodes remain retained');
  assert.equal(e.transitions[2].from.authorityEpoch,5);
});

test('sliding replay windows preserve heldout membership and use the declared pairs for evaluation',()=>{
  const h=fixture(),e=install(h);
  for(let i=0;i<99;i++)observedStep(h);
  const first=e.transitions.slice(-96),membership=new Map(first.map(item=>[item.transitionId,item.replayPartition]));
  const originalHeldout=first.filter(item=>item.replayPartition==='heldout');
  assert.equal(originalHeldout.length,24);
  h.consolidateHippocampalDreamReplay();
  observedStep(h);
  const shifted=e.transitions.slice(-96);
  for(const item of shifted)if(membership.has(item.transitionId))assert.equal(item.replayPartition,membership.get(item.transitionId));
  const heldout=shifted.filter(item=>item.replayPartition==='heldout');
  const training=shifted.filter(item=>item.replayPartition==='training');
  assert(training.every(item=>!originalHeldout.includes(item)),'a heldout transition cannot become a training sample after a one-frame shift');
  const before=worldMse(h.W_world,heldout,16);
  const expected=new Float32Array(h.W_world);trainWorld(expected,training,16);
  const candidate=worldMse(expected,heldout,16);
  const result=h.consolidateHippocampalDreamReplay();
  assert.equal(result.beforeErr,before);assert.equal(result.candidateErr,candidate);
  assert.equal(result.heldoutTransitions,heldout.length);assert.equal(result.replayedEpisodes,training.length);
  assert.match(result.partition,/stable transition-id/);
  assert.match(result.scope,/not an independent generalization benchmark/);
});

test('untagged simulation and proprioception steps cannot manufacture observed dream episodes',()=>{
  const h=fixture(),e=install(h);
  for(let i=0;i<20;i++)h.stepClosedLoop({specimensCount:8,doorsCount:8,nearestDistPx:44,cursorDistPx:76,sensorValidityMask:0b1111});
  assert.equal(h.simulationTick,20,'ordinary model stepping remains operational');
  assert.equal(e.transitions.length,0);assert.equal(e.observedPageFrames,0);
  assert.equal(e.ignoredUnobservedSteps,20);
  assert.equal(h.consolidateHippocampalDreamReplay().status,'blocked');
  observedStep(h);const first=Array.from(h.obsVec);
  h.stepClosedLoop({sensorValidityMask:0b1111});
  observedStep(h,{url:'https://fixture.invalid/next'});
  assert.equal(e.transitions.length,1);
  assert.deepEqual(e.transitions[0].observation,first,'replay links actual observed frames, excluding the intermediate synthetic state');
  assert.equal(e.transitions[0].source,'observed guest-page transition');
  assert.equal(e.transitions[0].from.url,'https://fixture.invalid/page');
  assert.equal(e.transitions[0].to.url,'https://fixture.invalid/next');
});

test('invalid provenance, duplicate observations, and nonfinite observed state never enter replay',()=>{
  const h=fixture();
  h.stepClosedLoop=function(data={}){this.simulationTick++;this.obsVec.fill(data.value??0.2);};
  const e=install(h);
  const valid={source:'observed-page',tabId:'fixture-tab',url:'https://fixture.invalid/',observedAt:10};
  for(const context of [{...valid,tabId:''},{...valid,url:''},{...valid,observedAt:NaN},{...valid,observedAt:-1}])
    h.stepClosedLoop({sensorValidityMask:15},context);
  h.stepClosedLoop({sensorValidityMask:0},valid);
  h.stepClosedLoop({sensorValidityMask:15,value:NaN},valid);
  assert.equal(e.observedPageFrames,0);assert.equal(e.rejectedObservationFrames,6);
  h.stepClosedLoop({sensorValidityMask:15},valid);
  h.stepClosedLoop({sensorValidityMask:15},valid);
  h.stepClosedLoop({sensorValidityMask:15},{...valid,observedAt:9});
  assert.equal(e.observedPageFrames,1);assert.equal(e.transitions.length,0);
  h.stepClosedLoop({sensorValidityMask:15},{...valid,observedAt:11});
  assert.equal(e.observedPageFrames,2);assert.equal(e.transitions.length,1);
  assert.equal(e.transitions[0].from.observedAt,10);assert.equal(e.transitions[0].to.observedAt,11);
});

test('world gradient is driven by observation pairs and reduces measured pair error',()=>{
  const weights=new Float32Array(4),pairs=[{observation:[.2,.7],nextObservation:[.6,.1]}];
  const before=worldMse(weights,pairs,2);trainWorld(weights,pairs,2);
  assert.ok(worldMse(weights,pairs,2)<before);
  assert.ok(weights[0]>weights[2]);
});

test('FlyWire comparison has equal capacity, no minimum win, and leaves the live ring unchanged',()=>{
  const initial=Float32Array.from({length:16},(_,i)=>Math.sin(i)*.2);
  const before=Array.from(initial),result=flywireBenchmark(initial);
  assert.deepEqual(Array.from(initial),before);
  assert.equal(result.capacity,16);assert.equal(result.steps,48);
  assert.ok(Math.abs(result.advantagePct-(result.intactTrackScorePct-result.ablatedTrackScorePct))<.000002);
  assert.ok(result.advantagePct<14.5,'must not impose the previous 14.5 percent floor');
});

test('acceptance gates require their actual evidence and never qualify unknown controls',()=>{
  const h=fixture();install(h);const report=h.evaluateAcceptanceGates();
  assert.equal(report.passedCount,0);assert.equal(report.releaseQualified,false);
  assert.ok(report.gates.every(x=>x.status==='NOT_RUN'&&!x.passed));
  h.policyLatencySamples=Array(40).fill(1);
  const after=h.evaluateAcceptanceGates();
  assert.equal(after.passedCount,0);assert.equal(after.allPassed,false);
  const latency=after.gates.find(x=>x.id==='G2');
  assert.equal(latency.status,'NOT_RUN');assert.equal(latency.evidenceLevel,'partial');
  assert.equal(latency.diagnostics.p95Ms,1);
  assert.equal(latency.diagnostics.controlDeadlineMissFraction,null);
  assert.equal(after.gates.find(x=>x.id==='G3').status,'NOT_RUN');
});

test('low p95 cannot pass PDF responsive control or invent chosen-rate deadline evidence',()=>{
  const h=fixture();install(h);
  h.policyLatencySamples=[...Array(98).fill(1),11,12];
  h.p95StepLatencyMs=0.01; // A stale aggregate must not replace the observed sample distribution.
  const gate=h.evaluateAcceptanceGates().gates.find(x=>x.id==='G2');
  assert.equal(gate.passed,false);assert.equal(gate.status,'NOT_RUN');
  assert.equal(gate.diagnostics.sampleCount,100);
  assert.equal(gate.diagnostics.p95Ms,1);
  assert.equal(gate.diagnostics.stepsOver10Ms,2);
  assert.equal(gate.diagnostics.stepDurationOver10MsFraction,.02);
  assert.equal(gate.diagnostics.controlDeadlineMissFraction,null);
  assert.equal(gate.diagnostics.chosenControlRateHz,null);
  assert.equal(gate.diagnostics.renderingLoadDefinition,null);
  assert.equal(gate.diagnostics.queueMeasurements,null);
  assert.equal(gate.diagnostics.deviceMemoryMeasurements,null);
  assert.match(gate.requiredEvidence,/<1% deadline misses/);
});

test('invalid timing samples remain excluded and empty diagnostics never report initialized latency',()=>{
  const h=fixture();install(h);
  h.policyLatencySamples=[NaN,Infinity,-1];h.p95StepLatencyMs=1.42;
  let gate=h.evaluateAcceptanceGates().gates.find(x=>x.id==='G2');
  assert.equal(gate.diagnostics.p95Ms,null);
  assert.equal(gate.diagnostics.sampleCount,0);
  assert.equal(gate.diagnostics.rejectedSamples,3);
  assert.equal(gate.diagnostics.stepDurationOver10MsFraction,null);
  h.policyLatencySamples=[...Array(40).fill(20),NaN];
  gate=h.evaluateAcceptanceGates().gates.find(x=>x.id==='G2');
  assert.equal(gate.diagnostics.p95Ms,20);
  assert.equal(gate.diagnostics.stepDurationOver10MsFraction,1);
  assert.equal(gate.status,'NOT_RUN','a failed partial diagnostic is not a completed full gate');
});

test('promoted single-candidate policy and repeated training calls cannot pass the independent-seed learning gate',()=>{
  const h=fixture();install(h);
  const first=h.runPracticeAndHeldOutEval().evalReport;
  assert.equal(first.promoted,true,'fixture improves in its scoped simulated comparison');
  assert.equal(first.candidate.seeds.length,5);
  for(let i=0;i<5;i++)h.runPracticeAndHeldOutEval();
  const report=h.evaluateAcceptanceGates(),gate=report.gates.find(x=>x.id==='G4');
  assert.equal(report.passedCount,0);assert.equal(report.releaseQualified,false);
  assert.equal(gate.status,'NOT_RUN');assert.equal(gate.evidenceLevel,'partial');
  assert.equal(gate.diagnostics.trainingProcedure.candidateRuns,1);
  assert.equal(gate.diagnostics.trainingProcedure.evaluationSeeds.length,5);
  assert.deepEqual(gate.diagnostics.trainingProcedure.independentTrainingSeeds,[]);
  assert.equal(gate.diagnostics.trainingProcedure.changedConditionSuite,false);
  assert.match(gate.requiredEvidence,/five independent training seeds/);
});
