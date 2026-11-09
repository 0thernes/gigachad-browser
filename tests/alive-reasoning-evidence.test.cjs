'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function initial(name) {
  const marker = `this.${name} = `, start = source.indexOf(marker) + marker.length;
  const end = source.indexOf('\n        };', start) + '\n        }'.length;
  assert.ok(start > marker.length && end > start);
  return vm.runInNewContext('(' + source.slice(start, end) + ')', {
    initXavier: (rows, columns) => Float32Array.from({length:rows*columns}, (_,i) => Math.sin(i+1)*.1)
  });
}
function method(name, context = {}) {
  const start = source.indexOf(`      ${name}(`);
  const end = source.indexOf('\n      // =====================================================================', start);
  assert.ok(start > 0 && end > start);
  return vm.runInNewContext('({' + source.slice(start, end) + '}).' + name, context);
}
function metaFixture() {
  let continued = 0;
  const h = {
    multivectorMetacognitionEngine:initial('multivectorMetacognitionEngine'),
    continuousWorldModel:{latentZ64:new Float32Array(64).fill(.2),ssmHiddenH128:new Float32Array(128).fill(.3),predictedZ64:new Float32Array(64).fill(.4),surpriseDeltaPct:.25},
    decursiveSelfDeduplicator:{so64LieGeodesicCurvature:.2,redundancyCloneRatioRho:.3},
    deepCortex:{masterCmd64:new Float32Array(64).fill(.1)},mesh:{viscera:{atp:.8}},
    cognitiveCortex:{lastMeasurement:{shannonEntropyBits:4.5},lastComprehension:{topConcepts:['fixture']}},
    verletPhysics:{jointTorques24:new Float32Array(24)},
    stepNeuralConnectomeAndDeepDarkWeb60Hz(){continued++;}
  };
  const step = method('stepMultivectorMetacognition60Hz', {window:{}});
  return {h, step:(tick,frame)=>step.call(h,tick,frame), continued:()=>continued};
}

test('metacognition initialization claims no proven theorems, explanations or performed motor impulses',()=>{
  const m=initial('multivectorMetacognitionEngine');
  assert.equal(m.deductionTheoremsCount,0);assert.equal(m.deductionHypothesesCount,0);
  assert.equal(m.abductionInferencesCount,0);assert.equal(m.omnipotentActsCount,0);
  assert.equal(m.proofStatus,'NOT_RUN');assert.match(m.featureScope,/not calibrated certainty/);
  assert.match(m.deductionSequentVerdict,/UNVERIFIED/);
  assert.doesNotMatch(m.sixOmniHeadline,/Omniscient=|QED|Omnipotent=/);
});

test('actual metacognition stepping updates neural controls but periodic text only counts generated hypotheses',()=>{
  const f=metaFixture(),m=f.h.multivectorMetacognitionEngine;
  const before=Array.from(f.h.continuousWorldModel.latentZ64);
  f.step(1,30);f.step(2,60);
  assert.equal(m.deductionTheoremsCount,0);assert.equal(m.deductionHypothesesCount,2);
  assert.equal(m.abductionInferencesCount,2);assert.equal(m.omnipotentActsCount,0,'no host impulse was executed');
  assert.equal(m.proofStatus,'NOT_RUN');assert.match(m.deductionSequentVerdict,/UNVERIFIED HYPOTHESIS #2/);
  assert.match(m.abductionBestExplanation,/causality untested/);
  assert.match(m.sixOmniHeadline,/LOCAL META FEATURES/);assert.match(m.sixOmniHeadline,/Proof=NOT_RUN/);
  assert.doesNotMatch(m.sixOmniHeadline+m.deductionSequentVerdict,/Omniscient=|QED|NON_REPETITIVE/);
  assert.notDeepEqual(Array.from(f.h.continuousWorldModel.latentZ64),before);
  assert(f.h.deepCortex.masterCmd64.some(value=>value!==Math.fround(.1)));
  assert(f.h.verletPhysics.jointTorques24.some(value=>value!==0));
  for(const values of [m.cliffordProductOut16,m.metacognitiveGrid8x8,m.omnigradientNaturalGrad64,f.h.continuousWorldModel.latentZ64])assert(Array.from(values).every(Number.isFinite));
  assert.equal(f.continued(),2,'the connected substrate still executes');
});

test('changing only narrative counters has no effect on actual metacognition tensor or motor computation',()=>{
  const a=metaFixture(),b=metaFixture();
  b.h.multivectorMetacognitionEngine.deductionHypothesesCount=500;
  b.h.multivectorMetacognitionEngine.deductionTheoremsCount=999;
  a.step(1,30);b.step(1,30);
  for(const key of ['cliffordMultivector16','cliffordProductOut16','metacognitiveGrid8x8','omnirationalMwuWeights8','omnigradientNaturalGrad64'])
    assert.deepEqual(Array.from(a.h.multivectorMetacognitionEngine[key]),Array.from(b.h.multivectorMetacognitionEngine[key]));
  assert.deepEqual(Array.from(a.h.continuousWorldModel.latentZ64),Array.from(b.h.continuousWorldModel.latentZ64));
  assert.deepEqual(Array.from(a.h.verletPhysics.jointTorques24),Array.from(b.h.verletPhysics.jointTorques24));
});

function logic(rules, concepts=[]) {
  const h={rationalLogicEngine:initial('rationalLogicEngine')};
  return method('runFormalLogicAndDpllSatEngine').call(h,rules,[],concepts);
}
test('initial logic state distinguishes the legacy numeric prior from an unexecuted CNF check',()=>{
  const r=initial('rationalLogicEngine');
  assert.equal(r.dpllSatisfiable,null);assert.equal(r.cnfClausesCount,0);assert.equal(r.booleanVarsCount,0);
  assert.equal(r.clauseSatisfactionPct,null);assert.equal(r.proofStatus,'NOT_RUN');
  assert.match(r.latestProofQED,/NOT_RUN/);assert.doesNotMatch(r.latestProofQED,/Q\.E\.D\./);
});
test('satisfiable encoded rules remain operational without a fabricated conclusion about source text',()=>{
  const r=logic([{p:'a',q:'b'},{p:'unrelated',q:'claim'}]);
  assert.equal(r.dpllSatisfiable,true);assert.equal(r.clauseSatisfactionPct,100);
  assert.equal(r.synthesizedRuleCount,0);assert.equal(r.assumedRootPremise,'a');
  assert.match(r.satVerdict,/SATISFIABLE encoded CNF/);
  assert.match(r.latestProofQED,/Source-text truth and deductive entailment unverified/);
  assert.doesNotMatch(r.latestProofQED,/Q\.E\.D\.|claim=T|CONJUNCTIVE_SYNTHESIS/);
  assert.equal(r.proofStatus,'NOT_RUN');assert.equal(r.inferenceRuleApplied,'DPLL_CNF_SATISFIABILITY_ONLY');
});
test('contradictory encoded rules report UNSAT rather than repaired contradictions or a QED certificate',()=>{
  const r=logic([{p:'a',q:'b'},{p:'a',q:'b',polarity:-1}]);
  assert.equal(r.dpllSatisfiable,false);assert(r.contradictionsDetected>0);
  assert.match(r.satVerdict,/UNSATISFIABLE encoded CNF/);assert.match(r.latestProofQED,/CNF UNSAT/);
  assert.doesNotMatch(r.satVerdict+r.latestProofQED,/ANTINOMY_RESOLVED|tension resolved|Q\.E\.D\./);
  assert.match(r.satVerdict,/no repair or MaxSAT optimum/);assert.equal(r.proofStatus,'NOT_RUN');
});
test('fallback rules are counted as synthetic assumptions rather than discoveries',()=>{
  const r=logic([],['strange','archive','history']);
  assert.equal(r.synthesizedRuleCount,2);assert.equal(r.assumedRootPremise,'strange');
  assert.match(r.latestProofQED,/2 synthetic fallback rules/);assert.match(r.ruleSourceScope,/assumed root premise/);
});
