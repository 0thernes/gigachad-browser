'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const fusion = require('../systems/alive-specialist-fusion.js');
const checkpoints = require('../systems/alive-checkpoints.js');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = source.indexOf('      stepClosedLoop(domTelemetry = {}) {');
const end = source.indexOf('\n      // Self-Directed Learning-Progress Curriculum', start);
assert.ok(start > 0 && end > start, 'execute the full production closed-loop method');
const names = ['NMDA_sLTC_Sheet','Dreamer_WorldModel','FlyWire_Connectome','QGTL_Grover_Q3','Allostatic_AgRP'];

function fixture({ overdrive = false, persona = 'jester_evaluator' } = {}) {
  const calls = { mesh:0, morphology:0, flywire:0, deepCortex:0, render:0 };
  const personaSelect = { value: persona };
  let clock = 100;
  const run = vm.runInNewContext('({' + source.slice(start,end) + '}).stepClosedLoop', {
    performance:{ now:()=>clock+=.5 },
    document:{ getElementById:()=>personaSelect },
    superintelligenceOverdrive:overdrive,
    HUMUNCULUS_SPECIALISTS:names,
    HUMUNCULUS_STAGES:'ABCDEF'.split('').map(code=>({code,name:code,skill:'fixture-'+code}))
  });
  const mesh = { macroRate:Float32Array.from({length:14},(_,i)=>.15+.025*i),
    viscera:{glc:.8,atp:.7,agRP:.6},nm:{DA:.6,ACh:.5},
    kappa:.3,qgtTrace:1.2,berry01:-.4,iitPhi:.2,criticalitySigma:1.1,feltKappa:.1,
    step(){calls.mesh++;} };
  const h = { D_OBS:16,D_ACT:5,D_MORPH:6,simulationTick:0,mesh,stageIdx:0,
    obsVec:new Float32Array(16),predObsVec:Float32Array.from({length:16},(_,i)=>.4-i*.015),
    W_actor:Float32Array.from({length:80},(_,i)=>((i%7)-3)*.12),
    W_metamorph:Float32Array.from({length:30},(_,i)=>((i%3)-1)*.04),morphVec:new Float32Array(6).fill(.3),
    W_world:new Float32Array(256),worldPredError:.4,worldPredErrorEMA:.45,
    specialistScores:new Float32Array(5),activeSpecialists:[],
    bodyLevels:{level2Expression:{}},bodyRecipe:{limbCount:6,bodyCid:'body',rayCount:16},
    agentId:'fixture',authorityEpoch:1,schemaVersion:1,policyCid:'policy',checkpointCid:'checkpoint',
    semanticMemory:{domainFacts:{}},bioAudioEnabled:false,deadlineMisses:0,
    updateMorphologyVector(){calls.morphology++;},
    stepFlyWireConnectome(){calls.flywire++;return {headingAngleRad:.2,headingErr:.3,pfnSteering:new Float32Array([.6,-.3])};},
    stepDeepCortex185K(){calls.deepCortex++;return {};},
    renderRetroTerminalOverlay(){calls.render++;}, stepClosedLoop:run };
  return {h,calls,personaSelect};
}

function attachDiagnostic(h, { selected, mask } = {}) {
  // The production method remains unchanged. This wrapper changes only the
  // diagnostic selection/mask supplied at the actual fusion boundary.
  const api = fusion.install({});
  const observed = {};
  Object.defineProperty(h,'aliveSpecialistFusion',{enumerable:false,value:{
    capture(model,fw){observed.predictionBeforeUpdate=Array.from(model.predObsVec);return api.capture(model,fw);},
    fuse(current,scores,tick){observed.productionSelection=current.slice();return api.fuse(selected===undefined?current:selected,scores,tick,mask);},
    recordMotor(...args){return api.recordMotor(...args);},snapshot(){return api.snapshot();}
  }});
  return {api,observed};
}
function run(h){return h.stepClosedLoop({specimensCount:5,doorsCount:6,nearestDistPx:90,cursorDistPx:120,sensorValidityMask:15});}

test('Explorer and Allostatic personas consume their declared bounded readouts and change actual motors only',()=>{
  const explorer=fixture({persona:'maximum_joker'}),allostatic=fixture({persona:'hellraiser_evaluator'});
  const a=attachDiagnostic(explorer.h),b=attachDiagnostic(allostatic.h);
  const left=run(explorer.h),right=run(allostatic.h);
  for(const [f,d,expected] of [
    [explorer,a,['QGTL_Grover_Q3','Dreamer_WorldModel','FlyWire_Connectome']],
    [allostatic,b,['Allostatic_AgRP','Dreamer_WorldModel','NMDA_sLTC_Sheet']]
  ]){
    assert.deepEqual(Array.from(f.h.activeSpecialists),expected);
    assert.deepEqual(Array.from(d.observed.productionSelection),expected);
    const snapshot=d.api.snapshot();
    assert.deepEqual(snapshot.selectedNames,names.filter(name=>expected.includes(name)));
    for(const item of snapshot.sources){
      assert.equal(item.available,true);
      assert.equal(item.selected,expected.includes(item.name));
      if(item.selected)assert.ok(item.gate>0&&item.contribution.some(value=>value!==0));
      else {assert.equal(item.gate,0);assert.ok(item.contribution.every(value=>value===0));}
    }
    assert.ok(snapshot.residual.every(value=>Number.isFinite(value)&&Math.abs(value)<=.08));
    assert.deepEqual(snapshot.appliedMotor.matchesFusion,[true,true]);
  }
  assert.notDeepEqual(Array.from(left.policyStep.action.slice(0,2)),Array.from(right.policyStep.action.slice(0,2)));
  assert.deepEqual(Array.from(left.policyStep.action.slice(2)),Array.from(right.policyStep.action.slice(2)));
  assert.deepEqual(explorer.calls,allostatic.calls);
  assert.deepEqual(explorer.calls,{mesh:1,morphology:1,flywire:1,deepCortex:1,render:1});
  assert.deepEqual(Array.from(explorer.h.W_world),Array.from(allostatic.h.W_world));
  assert.deepEqual(Array.from(explorer.h.predObsVec),Array.from(allostatic.h.predObsVec));
  assert.equal(explorer.h.worldPredError,allostatic.h.worldPredError);
  assert.equal(explorer.h.stageIdx,allostatic.h.stageIdx);
});

test('persona selection changes live while other profiles retain ranked selection and existing stage behavior',()=>{
  const f=fixture({persona:'maximum_joker'});attachDiagnostic(f.h);run(f.h);
  f.personaSelect.value='hellraiser_evaluator';run(f.h);
  assert.deepEqual(Array.from(f.h.activeSpecialists),['Allostatic_AgRP','Dreamer_WorldModel','NMDA_sLTC_Sheet']);
  assert.equal(f.h.simulationTick,2);
  for(const [persona,expectedStage] of [['jester_evaluator',1],['xeno_scientist',2],['9d_parasite_soul',3]]){
    const other=fixture({persona});attachDiagnostic(other.h);other.h.simulationTick=3;run(other.h);
    const expected=names.map((name,i)=>({name,score:other.h.specialistScores[i]})).sort((a,b)=>b.score-a.score).slice(0,3).map(row=>row.name);
    assert.deepEqual(Array.from(other.h.activeSpecialists),expected,persona);
    assert.equal(other.h.stageIdx,expectedStage,persona);
  }
  for(const persona of ['maximum_joker','hellraiser_evaluator']){
    const other=fixture({persona});attachDiagnostic(other.h);other.h.simulationTick=3;run(other.h);
    assert.equal(other.h.stageIdx,1,'new selections retain the normal stage switch: '+persona);
  }
});

test('global Overdrive consumes all five readouts regardless of selected profile and its own profile enables all five',()=>{
  for(const persona of ['maximum_joker','hellraiser_evaluator','jester_evaluator','xeno_scientist','9d_parasite_soul','superintelligence_overdrive']){
    const {h}=fixture({overdrive:true,persona}),{api}=attachDiagnostic(h);run(h);
    assert.deepEqual(Array.from(h.activeSpecialists),names,persona);
    assert.ok(api.snapshot().sources.every(item=>item.available&&item.selected&&item.gate>0),persona);
  }
  const {h}=fixture({persona:'superintelligence_overdrive'}),{api}=attachDiagnostic(h);run(h);
  assert.deepEqual(Array.from(h.activeSpecialists),names);
  assert.deepEqual(api.snapshot().appliedMotor.matchesFusion,[true,true]);
});

test('both selector copies describe heuristic motor readouts without promising additional audit or veto mechanisms',()=>{
  for(const [persona,readouts] of [['maximum_joker',/QGTL \+ Dreamer \+ FlyWire/],['hellraiser_evaluator',/AgRP \+ Dreamer \+ NMDA/]]){
    const labels=Array.from(source.matchAll(new RegExp('<option value="'+persona+'">([^<]+)</option>','g')),match=>match[1]);
    assert.equal(labels.length,2);
    for(const label of labels){assert.match(label,/Heuristic/);assert.match(label,readouts);assert.doesNotMatch(label,/Strict|Held-Out|Veto|Free-Won|High Novelty/);}
  }
});

test('changing only the selected specialist changes the actual PolicyStep motor output',()=>{
  const first=fixture(),second=fixture();
  const a=attachDiagnostic(first.h,{selected:[names[0]]}),b=attachDiagnostic(second.h,{selected:[names[2]]});
  const left=run(first.h),right=run(second.h);
  assert.notDeepEqual(Array.from(left.policyStep.action.slice(0,2)),Array.from(right.policyStep.action.slice(0,2)));
  assert.deepEqual(Array.from(left.policyStep.action.slice(2)),Array.from(right.policyStep.action.slice(2)),'unconsumed action channels retain their original computation');
  assert.deepEqual(first.calls,second.calls);
  assert.deepEqual(first.calls,{mesh:1,morphology:1,flywire:1,deepCortex:1,render:1});
  assert.deepEqual(Array.from(first.h.W_world),Array.from(second.h.W_world),'selection must not change world training or engine cadence');
  for(const result of [a,b]){
    const s=result.api.snapshot();assert.equal(s.capturedTick,1);assert.equal(s.tick,1);
    assert.equal(s.appliedMotor.tick,1);
    assert.deepEqual(s.appliedMotor.recorded,[true,true]);
    assert.deepEqual(s.appliedMotor.matchesFusion,[true,true]);
  }
});

test('empty selection and fixed-gate full ablation exactly recover the existing actor result',()=>{
  const baseline=fixture(),empty=fixture(),ablated=fixture();
  attachDiagnostic(empty.h,{selected:[]});
  const d=attachDiagnostic(ablated.h,{selected:names,mask:[0,0,0,0,0]});
  const expected=Array.from(run(baseline.h).policyStep.action);
  assert.deepEqual(Array.from(run(empty.h).policyStep.action),expected);
  assert.deepEqual(Array.from(run(ablated.h).policyStep.action),expected);
  const s=d.api.snapshot();
  assert.ok(s.sources.every(item=>item.gate>0),'ablation removes contributions while retaining actual selected gates');
  assert.deepEqual(s.residual,[0,0]);
  assert.deepEqual(s.appliedMotor.actions,s.appliedMotor.baselineActions);
  assert.deepEqual(baseline.calls,empty.calls);assert.deepEqual(baseline.calls,ablated.calls);
});

test('actual Overdrive routes all five computed readouts and records unrounded applied motors',()=>{
  const {h}=fixture({overdrive:true});const {api,observed}=attachDiagnostic(h);
  const result=run(h),s=api.snapshot();
  assert.deepEqual(Array.from(h.activeSpecialists),names);
  assert.deepEqual(Array.from(observed.productionSelection),names);
  assert.ok(s.sources.every(item=>item.available&&item.selected&&item.gate>0));
  assert.ok(Math.abs(s.sources.reduce((sum,item)=>sum+item.gate,0)-1)<1e-12);
  assert.ok(s.residual.every(value=>Number.isFinite(value)&&Math.abs(value)<=.08));
  assert.deepEqual(s.appliedMotor.matchesFusion,[true,true]);
  assert.deepEqual(Array.from(result.policyStep.action.slice(0,2)),s.appliedMotor.actions.map(value=>Number(value.toFixed(3))));
  assert.notDeepEqual(observed.predictionBeforeUpdate,Array.from(h.predObsVec),'readouts were captured before the existing world update');
  assert.ok(s.sources.find(item=>item.name===names[1]).readout.some(value=>value!==0));
});

test('Overdrive keeps computed geometry and integration features while applying intentional control gains',()=>{
  const {h}=fixture({overdrive:true});attachDiagnostic(h);
  const before={integration:h.mesh.iitPhi,qgtTrace:h.mesh.qgtTrace};
  run(h);
  assert.equal(h.mesh.iitPhi,before.integration,'enabling a mode cannot manufacture near-perfect integration evidence');
  assert.equal(h.mesh.qgtTrace,before.qgtTrace,'computed geometry must not be replaced by an advertised floor');
  assert.equal(h.mesh.nm.DA,1.18,'intentional controller modulation remains separate from observed features');
  assert.equal(h.mesh.nm.ACh,1.12);
  assert.deepEqual(Array.from(h.activeSpecialists),names);
});

test('installing and exercising fusion adds no checkpoint tensors or enumerable runtime state',()=>{
  const {h}=fixture();
  const roster=()=>checkpoints.capture({model:h},{}).tensors.map(t=>({group:t.group,path:t.path,type:t.type,length:t.length}));
  const before=roster(),keys=Object.keys(h);
  fusion.install(h);run(h);
  assert.deepEqual(roster(),before);
  assert.equal(Object.prototype.propertyIsEnumerable.call(h,'aliveSpecialistFusion'),false);
  assert.equal(keys.includes('aliveSpecialistFusion'),false);
  assert.equal(Object.keys(h).includes('aliveSpecialistFusion'),false);
});
