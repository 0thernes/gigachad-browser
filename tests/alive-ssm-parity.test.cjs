'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const parity=require('../scripts/alive-ssm-parity.cjs');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const extracted=parity.extractBlock(source),execute=parity.compileBlock(extracted.block);
const cases=parity.makeCases([{id:'zero',seed:1,steps:1},{id:'bounded-random',seed:0x12345678,steps:4},{id:'saturated-action',seed:0x55aa55aa,steps:2}]);
let reference;
test.before(()=>{reference=parity.runPythonReference(cases).cases;});

test('production CPU block is extracted unchanged with exactly one ordered marker pair',()=>{
  assert.equal(source.slice(source.indexOf(parity.START),source.indexOf(parity.END)),extracted.block);
  for(const marker of [parity.METHOD,parity.START,parity.END]){
    assert.throws(()=>parity.extractBlock(source.replace(marker,marker+' changed').replace(marker,'missing-anchor')),/exactly one/);
    assert.throws(()=>parity.extractBlock(source+'\n'+marker),/exactly one/);
  }
  assert.throws(()=>parity.extractBlock(parity.END+'\n'+parity.METHOD+'\n'+parity.START),/order/);
});
test('small actual CPU run agrees with independent native equations including FP32 stores',()=>{
  const result=parity.compareTraces(cases.map(c=>parity.runCase(c,execute)),reference);
  assert.equal(result.ok,true,JSON.stringify(result.firstFailures));assert.equal(result.compared,7*576);
  assert.equal(result.nonFinite,0);
});
test('independent comparison rejects an injected arithmetic discrepancy',()=>{
  const altered=extracted.block.replace('dtStep * actProj128[i] * 0.35','dtStep * actProj128[i] * 0.85');
  assert.notEqual(altered,extracted.block);
  const result=parity.compareTraces(cases.map(c=>parity.runCase(c,parity.compileBlock(altered))),reference);
  assert.equal(result.ok,false);assert.ok(result.mismatches>0);assert.ok(result.firstFailures.some(x=>x.field==='H'));
});
test('nonfinite inputs, outputs and incorrect shapes cannot pass',()=>{
  const malformed=structuredClone(cases[1]);malformed.frames[0].z[0]=NaN;
  assert.throws(()=>parity.runCase(malformed,execute),/nonfinite/);
  for(const value of [NaN,Infinity,-Infinity]){
    const actual=cases.map(c=>parity.runCase(c,execute));actual[0].traces[0].H[0]=value;
    const result=parity.compareTraces(actual,reference);assert.equal(result.ok,false);assert.equal(result.nonFinite,1);
  }
  const actual=cases.map(c=>parity.runCase(c,execute));actual[1].traces[0].delta.pop();
  assert.equal(parity.compareTraces(actual,reference).ok,false);
});
test('zero input reaches explicit rounded softplus delta and exact zero state/output',()=>{
  const step=parity.runCase(cases[0],execute).traces[0];
  assert.ok(step.delta.every(x=>x===Math.fround(Math.log(2)*.085)));
  for(const key of ['actProj128','H','prevValidH','predZ','reconstructedStream64'])assert.ok(step[key].every(x=>x===0));
});
test('declared cases are deterministic and include recurrence, clamps, threshold and cancellation',()=>{
  assert.deepEqual(parity.makeCases(),parity.makeCases());
  assert.equal(parity.CASES.length,9);assert.ok(parity.CASES.find(c=>c.id==='long-sequence').steps>=512);
  for(const id of ['selective-clamps','mouse-threshold','near-zero','saturated-action','cancelling-dot-products'])assert.ok(parity.CASES.some(c=>c.id===id));
  assert.deepEqual(parity.TOLERANCE,{absolute:1e-4,relative:1e-3,rule:'abs(actual-reference) <= absolute + relative*abs(reference); every value must be finite'});
});
