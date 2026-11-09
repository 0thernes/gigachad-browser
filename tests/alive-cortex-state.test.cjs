'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {webcrypto,createHash}=require('node:crypto');
const moduleUnderTest=require('../systems/alive-cortex-state.js');
const codec=require('../systems/alive-learned-state-codec.js'),registry=require('../systems/alive-learned-state-registry.js');
const options={crypto:webcrypto},generation=9;
const adapterPromise=moduleUnderTest.create({registry,codec,...options});
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const START='        const initXavier = (rows, cols) => {',END='        // Sovereign Browser Master Controller Telemetry';
function allocation(text) {
  if(text.split(START).length!==2||text.split(END).length!==2)throw Error('unique cortex allocation anchors required');
  const start=text.indexOf(START),end=text.indexOf(END,start),body=text.slice(start,end);
  if(end<start||body.split('BEGIN ALIVE CORTEX COLD STATE').length!==2||body.split('END ALIVE CORTEX COLD STATE').length!==2)throw Error('complete eager allocation boundary required');
  return Function('hybridQrng',body);
}
const allocate=allocation(source);
function makeRuntime() {
  const h={W_actor:new Float32Array(80),W_critic:new Float32Array(16)};
  allocate.call(h,{u64:()=>1n});return h;
}
const snapshot={creatureId:'cortex-test',policyId:'policy',checkpointId:'checkpoint',logicalTick:35,modelEpoch:4,
  capturedAt:'2026-11-09T00:00:00.000Z',resumeBoundary:'fresh-browser-authority'};
function bytes(view){return Buffer.from(view.buffer,view.byteOffset,view.byteLength);}
function numberBits(number){const b=Buffer.alloc(8);b.writeDoubleLE(number);return b.toString('hex');}
function evidence(h) {
  const result={};
  for(const [root,object]of [['dc',h.deepCortex],['cn',h.connectome512]])for(const name of Object.keys(moduleUnderTest.fieldDispositions[root]).sort()){
    const disposition=moduleUnderTest.fieldDispositions[root][name];
    if(disposition==='primary-owned-identity-alias')continue;
    const value=object[name];
    result[root+'.'+name]=ArrayBuffer.isView(value)?createHash('sha256').update(bytes(value)).digest('hex'):
      typeof value==='number'?numberBits(value):Array.isArray(value)?value.map(v=>typeof v==='number'?numberBits(v):v):value;
  }
  return result;
}
function enrichedRuntime() {
  const h=makeRuntime(),dc=h.deepCortex,cn=h.connectome512;
  new Uint32Array(dc.W_enc1.buffer).set([0,0x80000000,1,0x80000001]);
  dc.W_moe_experts[dc.W_moe_experts.length-1]=.123456789;
  dc.W_stdp_elig[999]=-Math.pow(2,-149); dc.criticValue=-0; cn.meanSynapticWeight=-0;
  dc.rssmH[127]=-.375; dc.b_enc2[1]=.0000123; dc.M_hopfield[32]=-.75;
  dc.hopfieldWritePtr=127;dc.cortexCoverageStep=1023;dc.attentionQkvPhase=767;dc.attentionOutputPhase=511;
  dc.moeExplorationCursor=7;cn.axonalPresynapticCursor=511;
  dc.moeCoverageMasks8[2]=5;dc.moeUniqueParametersVisited=16384;dc.moeParameterCoveragePct=100*16384/524288;
  dc.moeCoveragePhases8[2]=7;dc.moeParameterVisits=32768;
  dc.attentionQkvCoverage768[767]=1;dc.attentionQkvUniqueParameters=16;
  dc.attentionOutputCoverage512[511]=1;dc.attentionOutputUniqueParameters=8;dc.attentionParameterCoveragePct=100*24/16384;
  cn.axonCoverageMasks512[511]=3;cn.uniqueSynapsesTraversed=128;cn.synapseCoveragePct=100*128/262144;
  cn.axonCoveragePhases512[511]=7;cn.synapseVisits=128;
  dc.moeActiveExpertIndices=[2,7];dc.moeActiveGates=[.75,.25];dc.topMoEExperts=['EXP2:HIPPOCAMPAL_MEM','EXP7:SOVEREIGN_MASTER'];
  return h;
}
async function decodeCaptured(captured){return codec.decode(await codec.encode(captured,options),options);}
async function decoded(adapter,h){return decodeCaptured(adapter.capture(h,snapshot,{generation}));}
let retainedHandle;
async function validHandle(){if(!retainedHandle)retainedHandle=await decoded(await adapterPromise,enrichedRuntime());return retainedHandle;}

test('actual allocation classifies all 74 cortex and 21 connectome fields, including eager history and five aliases',async()=>{
  const adapter=await adapterPromise,h=makeRuntime(),captured=adapter.capture(h,snapshot,{generation});
  assert.equal(Object.keys(h.deepCortex).length,74);assert.equal(Object.keys(h.connectome512).length,21);
  for(const [root,object]of [['dc',h.deepCortex],['cn',h.connectome512]])assert.deepEqual(Object.keys(moduleUnderTest.fieldDispositions[root]).sort(),Object.keys(object).sort());
  assert.equal(captured.tensors.length,47);assert.equal(captured.stateManifest.length,43);
  assert.equal(captured.tensors.reduce((n,r)=>n+r.byteLength,0),4994760);
  assert.equal(new Set(captured.tensors.map(r=>r.backingGroup)).size,47);
  assert.equal(captured.tensors.reduce((n,r)=>n+r.paths.length,0),50);
  assert.equal(captured.tensors.filter(r=>r.dtype==='Float32Array').length,40);
  assert.equal(captured.tensors.filter(r=>r.dtype==='Uint8Array').length,7);
  for(const row of captured.tensors){assert.equal(row.backingOffset,0);assert.equal(row.backingByteLength,row.byteLength);}
  const syn=captured.tensors.find(r=>r.id==='dc.W_connectome_synapses'),elig=captured.tensors.find(r=>r.id==='dc.W_stdp_elig');
  assert.deepEqual(syn.paths,[{root:'dc',keys:['W_connectome_synapses']},{root:'cn',keys:['synWeights262K']},{root:'cn',keys:['synapticWeights']}]);
  assert.equal(elig.paths.length,2);assert.ok(!captured.tensors.some(r=>['dc.W_actor','dc.W_critic'].includes(r.id)));
  assert.deepEqual(captured.tensors.find(r=>r.id==='dc.W_attn_out').dimensions,[64,64]);
  assert.deepEqual(captured.tensors.find(r=>r.id==='dc.attentionOutputCoverage512').dimensions,[512]);
  assert.equal(moduleUnderTest.scope.completeApplicationCatalog,false);
});

test('allocation proof fails on missing/doubled anchors and missing eager initialization',()=>{
  assert.throws(()=>allocation(source.replace(START,'')),/anchors/);assert.throws(()=>allocation(source+END),/anchors/);
  assert.throws(()=>allocation(source.replace('BEGIN ALIVE CORTEX COLD STATE','changed marker')),/boundary/);
});

test('exact cold and mature wire restores retain every view/buffer identity and all local scalar/array state',async()=>{
  const adapter=await adapterPromise;
  for(const sourceRuntime of [makeRuntime(),enrichedRuntime()]){
    const handle=await decoded(adapter,sourceRuntime),target=makeRuntime(),before=evidence(target),expected=evidence(sourceRuntime);
    const refs=[];for(const object of [target.deepCortex,target.connectome512])for(const [name,v]of Object.entries(object))if(ArrayBuffer.isView(v))refs.push([object,name,v,v.buffer]);
    const dc=target.deepCortex,cn=target.connectome512,plan=adapter.preflight(handle,target,{generation});
    assert.deepEqual(evidence(target),before);assert.equal(adapter.recheck(plan,target,{generation}).status,'ready');
    const receipt=adapter.apply(plan,target,{generation});
    assert.deepEqual(receipt,{status:'applied',generation,tensorCount:47,tensorBytes:4994760,stateCount:43,scope:moduleUnderTest.scope.kind,readbackVerified:true});
    assert.deepEqual(evidence(target),expected);assert.equal(target.deepCortex,dc);assert.equal(target.connectome512,cn);
    for(const [object,name,view,buffer]of refs){assert.equal(object[name],view);assert.equal(object[name].buffer,buffer);}
    for(const [root,a,b]of [['dc',sourceRuntime.deepCortex,target.deepCortex],['cn',sourceRuntime.connectome512,target.connectome512]])
      for(const [name,disposition]of Object.entries(moduleUnderTest.fieldDispositions[root]))if(disposition==='exact-native-view')assert.ok(bytes(a[name]).equals(bytes(b[name])),root+'.'+name+' raw bytes');
  }
});

test('capture owns exact native bytes and direct metadata before later source mutation',async()=>{
  const adapter=await adapterPromise,h=enrichedRuntime(),expected=evidence(h),captured=adapter.capture(h,snapshot,{generation});
  h.deepCortex.W_moe_experts.fill(7);h.deepCortex.W_enc1.fill(9);h.deepCortex.criticValue=1;h.deepCortex.topMoEExperts[0]='modified';
  h.connectome512.axonCoverageMasks512.fill(255);h.connectome512.neuropilNames[0]='modified';
  const target=makeRuntime(),handle=await decodeCaptured(captured);
  adapter.apply(adapter.preflight(handle,target,{generation}),target,{generation});assert.deepEqual(evidence(target),expected);
});

test('primary bytes remain independently owned: legitimate in-place primary apply does not stale cortex plan',async()=>{
  const adapter=await adapterPromise,target=makeRuntime(),handle=await validHandle(),plan=adapter.preflight(handle,target,{generation});
  target.W_actor.fill(.625);target.W_critic.fill(-.375);
  assert.equal(adapter.recheck(plan,target,{generation}).status,'ready');adapter.apply(plan,target,{generation});
  assert.ok(target.W_actor.every(v=>v===.625));assert.ok(target.W_critic.every(v=>v===-.375));
  assert.equal(target.deepCortex.W_actor,target.W_actor);assert.equal(target.deepCortex.W_critic,target.W_critic);
  const next=adapter.preflight(handle,target,{generation});target.W_actor=target.W_actor.slice();target.deepCortex.W_actor=target.W_actor;
  assert.throws(()=>adapter.apply(next,target,{generation}),/changed since preflight/);
});

test('native view/buffer expandos are ignored without getters or numeric own-key enumeration',async()=>{
  const adapter=await adapterPromise,h=makeRuntime();let calls=0,enumerations=0;
  const getter={configurable:true,get(){calls++;throw Error('excluded native expando must not run');}};
  Object.defineProperty(h.deepCortex.moeCoverageMasks8,'reduce',getter);
  Object.defineProperty(h.connectome512.axonCoverageMasks512,'reduce',getter);
  Object.defineProperty(h.deepCortex.attentionQkvCoverage768,'reduce',getter);
  Object.defineProperty(h.deepCortex.attentionOutputCoverage512,'reduce',getter);
  for(const key of ['buffer','byteLength','length','constructor','toJSON'])Object.defineProperty(h.deepCortex.W_moe_experts,key,getter);
  Object.defineProperty(h.deepCortex.W_moe_experts,Symbol.toStringTag,getter);
  const buffer=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'buffer').get.call(h.deepCortex.W_moe_experts);
  Object.defineProperty(buffer,'byteLength',getter);Object.defineProperty(buffer,'toJSON',getter);
  const original=Reflect.ownKeys;
  try{
    Reflect.ownKeys=function(value){if(ArrayBuffer.isView(value)||value instanceof ArrayBuffer){enumerations++;throw Error('must not enumerate native storage');}return original(value);};
    assert.equal(adapter.capture(h,snapshot,{generation}).tensors.length,47);
  }finally{Reflect.ownKeys=original;}
  assert.equal(calls,0);assert.equal(enumerations,0);
});

test('graph fields, source-proved domains, constants, array shapes and safe counters reject invalid live state',async()=>{
  const adapter=await adapterPromise;
  const cases=[h=>{h.deepCortex.unknown=1;},h=>{delete h.connectome512.synapticWeights;},h=>{h.deepCortex[Symbol('x')]=1;},
    h=>{h.deepCortex.rssmKlDivergence=-.01;},h=>{h.deepCortex.gradNormL2=-.01;},h=>{h.deepCortex.criticValue=1.1;},
    h=>{h.deepCortex.totalParams++;},h=>{h.connectome512.totalSynapses--;},h=>{h.deepCortex.cortexCoverageStep=Number.MAX_SAFE_INTEGER+1;},
    h=>{h.deepCortex.attentionOutputPhase=512;},h=>{h.deepCortex.attentionQkvPhase=768;},h=>{h.deepCortex.hopfieldWritePtr=128;},
    h=>{h.connectome512.axonalPresynapticCursor=512;},h=>{h.deepCortex.moeCoveragePhases8[0]=8;},h=>{h.connectome512.axonCoveragePhases512[0]=8;},
    h=>{h.connectome512.spikes512[0]=2;},h=>{h.connectome512.trace512[0]=1.6;},h=>{h.connectome512.neuropilRates6[0]=-1;},
    h=>{h.deepCortex.attentionOutputCoverage512[0]=2;},h=>{h.deepCortex.attnWeights8[0]=NaN;},
    h=>{h.deepCortex.moeActiveExpertIndices=[1];h.deepCortex.moeActiveGates=[1];},
    h=>{h.deepCortex.moeActiveExpertIndices=[2,2];h.deepCortex.moeActiveGates=[.75,.25];},
    h=>{h.deepCortex.moeActiveExpertIndices=[1,2];h.deepCortex.moeActiveGates=[.2,.8];},
    h=>{h.deepCortex.moeActiveExpertIndices=[1,2];h.deepCortex.moeActiveGates=[.75,.25];},
    h=>{h.deepCortex.topMoEExperts[0]='wrong label';},h=>{h.connectome512.neuropilNames.reverse();},
    h=>{h.deepCortex.W_moe_experts[500000]=Infinity;},h=>{h.deepCortex.moeCoverageScope='a'.repeat(513);},
    h=>{Object.defineProperty(h.deepCortex,'criticValue',{writable:false});}];
  for(const mutate of cases){const h=makeRuntime();mutate(h);assert.throws(()=>adapter.capture(h,snapshot,{generation}));}
  let calls=0;for(const target of ['root','view','state','array']){
    const h=makeRuntime(),getter={configurable:true,get(){calls++;throw Error('getter must not run');}};
    if(target==='root')Object.defineProperty(h,'deepCortex',getter);
    if(target==='view')Object.defineProperty(h.deepCortex,'W_enc1',getter);
    if(target==='state')Object.defineProperty(h.deepCortex,'criticValue',getter);
    if(target==='array')Object.defineProperty(h.deepCortex.topMoEExperts,'0',getter);
    assert.throws(()=>adapter.capture(h,snapshot,{generation}),/own-data/);
  }assert.equal(calls,0);
});

test('standalone topology, fixed native storage and explicit alias identities reject corrupt bindings',async()=>{
  const adapter=await adapterPromise;
  const cases=[h=>{h.deepCortex.W_actor=h.W_actor.slice();},h=>{h.connectome512.synapticWeights=h.deepCortex.W_connectome_synapses.slice();},
    h=>{h.connectome512.eligibilityTraces=h.deepCortex.W_connectome_synapses;},h=>{h.deepCortex.W_prior=h.deepCortex.W_post;},
    h=>{h.deepCortex.W_prior=new Float32Array(h.deepCortex.W_post.buffer);},h=>{h.deepCortex.W_critic_out=new Float32Array(h.W_actor.buffer,0,64);},
    h=>{h.deepCortex.x64=new Float32Array(new SharedArrayBuffer(256));},
    h=>{h.deepCortex.x64=new Float32Array(new ArrayBuffer(256,{maxByteLength:512}));},
    h=>{structuredClone(h.deepCortex.x64.buffer,{transfer:[h.deepCortex.x64.buffer]});},
    h=>{h.deepCortex.x64=new Float64Array(64);},h=>{Object.setPrototypeOf(h.deepCortex.x64,Object.create(Float32Array.prototype));}];
  for(const mutate of cases){const h=makeRuntime();mutate(h);assert.throws(()=>adapter.capture(h,snapshot,{generation}),/Cortex state/);}
});

test('retained coverage bitmaps, unique counts and percentage receipts must agree without inventing phase history',async()=>{
  const adapter=await adapterPromise;
  const cases=[h=>{h.deepCortex.moeUniqueParametersVisited=8192;},h=>{h.deepCortex.moeCoverageMasks8[0]=1;},
    h=>{h.deepCortex.attentionQkvUniqueParameters=16;},h=>{h.deepCortex.attentionOutputUniqueParameters=8;},
    h=>{h.deepCortex.attentionParameterCoveragePct=1;},h=>{h.connectome512.axonCoverageMasks512[0]=1;},h=>{h.connectome512.synapseCoveragePct=1;}];
  for(const mutate of cases){const h=makeRuntime();mutate(h);assert.throws(()=>adapter.capture(h,snapshot,{generation}),/coverage receipts/);}
  const independentPhase=makeRuntime();independentPhase.deepCortex.attentionOutputPhase=270;independentPhase.deepCortex.moeExplorationCursor=4;
  assert.doesNotThrow(()=>adapter.capture(independentPhase,snapshot,{generation}));
});

test('validly sealed incompatible rosters and numeric/receipt corruption reject before destination writes',async()=>{
  const adapter=await adapterPromise;
  const mutations=[c=>{c.tensors.find(r=>r.id==='dc.W_enc1').dimensions=[64,256];},
    c=>{const row=c.tensors.find(r=>r.id==='dc.W_connectome_synapses');row.paths=row.paths.slice(0,2);},
    c=>{c.tensors.find(r=>r.id==='dc.W_prior').backingGroup='wrong';},
    c=>{c.stateValues['dc.rssmKlDivergence']=codec.float64(-.1);},
    c=>{c.stateValues['dc.moeUniqueParametersVisited']=codec.integer(8192);},
    c=>{c.stateValues['dc.moeActiveExpertIndices']={$type:'array',items:[codec.integer(1),codec.integer(2)]};c.stateValues['dc.moeActiveGates']=codec.tagValue([.75,.25]);},
    c=>{c.stateValues['cn.neuropilNames'].items[0]='wrong';},
    c=>{new Float32Array(c.tensors.find(r=>r.id==='dc.W_moe_experts').bytes)[0]=NaN;}];
  for(const mutate of mutations){const c=adapter.capture(makeRuntime(),snapshot,{generation});mutate(c);
    const handle=await decodeCaptured(c),target=makeRuntime(),before=evidence(target);
    assert.throws(()=>adapter.preflight(handle,target,{generation}));assert.deepEqual(evidence(target),before);
  }
});

test('mutable public decoder mirrors never control restored values, validation or architecture',async()=>{
  const adapter=await adapterPromise,h=enrichedRuntime(),expected=evidence(h),handle=await decoded(adapter,h);
  handle.tensors.forEach(r=>new Uint8Array(r.bytes).fill(255));handle.tensors.length=0;handle.stateManifest.length=0;
  handle.stateValues['dc.criticValue']=codec.float64(.9);handle.architecture.fingerprint='0'.repeat(64);
  assert.equal(adapter.validate(handle).status,'validated');const target=makeRuntime();
  adapter.apply(adapter.preflight(handle,target,{generation}),target,{generation});assert.deepEqual(evidence(target),expected);
  assert.throws(()=>adapter.validate({...handle}),/decoder-issued/);
});

test('preflight binds graph roots, all owned tensor bytes, direct descriptors and state-array identity',async()=>{
  const adapter=await adapterPromise,handle=await validHandle();
  const cases=[h=>{h.deepCortex.W_moe_experts[524287]+=.125;},h=>{h.deepCortex.W_stdp_elig[100]=.5;},
    h=>{h.deepCortex.x64=h.deepCortex.x64.slice();},h=>{h.deepCortex.criticValue=-0;},h=>{h.deepCortex.topMoEExperts=h.deepCortex.topMoEExperts.slice();},
    h=>{h.connectome512={...h.connectome512};},h=>{Object.defineProperty(h.deepCortex,'W_enc1',{enumerable:false});},
    h=>{Object.defineProperty(h,'deepCortex',{writable:false});},h=>{Object.setPrototypeOf(h.deepCortex,null);}];
  for(const mutate of cases){const h=makeRuntime(),plan=adapter.preflight(handle,h,{generation});mutate(h);const before=evidence(h);
    assert.throws(()=>adapter.recheck(plan,h,{generation}),/changed since preflight/);assert.throws(()=>adapter.apply(plan,h,{generation}),/changed since preflight/);assert.deepEqual(evidence(h),before);}
});

test('opaque plans enforce runtime/generation, discard, single use and verified rollback after injected write failure',async()=>{
  const adapter=await adapterPromise,h=makeRuntime(),handle=await validHandle(),plan=adapter.preflight(handle,h,{generation});
  assert.ok(Object.isFrozen(plan));assert.equal(Object.hasOwn(plan,'compiledPlan'),false);
  assert.throws(()=>adapter.recheck(plan,h,{generation:generation+1}),/stale or foreign/);
  assert.throws(()=>adapter.recheck(plan,{...h},{generation}),/stale or foreign/);
  assert.equal(adapter.discard(plan),true);assert.equal(adapter.discard(plan),false);assert.throws(()=>adapter.apply(plan,h,{generation}),/stale or foreign/);
  const next=adapter.preflight(handle,h,{generation}),before=evidence(h),names=h.connectome512.neuropilNames;
  const original=Object.defineProperty;let thrown=false;
  try{Object.defineProperty=function(object,key,slot){if(object===h.deepCortex&&key==='gradNormL2'&&!thrown){thrown=true;throw Error('injected publication error');}return original(object,key,slot);};
    assert.throws(()=>adapter.apply(next,h,{generation}),error=>error.rollbackVerified===true&&error.partialApplication===false);
  }finally{Object.defineProperty=original;}
  assert.ok(thrown);assert.deepEqual(evidence(h),before);assert.equal(h.connectome512.neuropilNames,names);
  assert.throws(()=>adapter.apply(next,h,{generation}),/stale or foreign/);
  const success=adapter.preflight(handle,h,{generation});adapter.apply(success,h,{generation});assert.throws(()=>adapter.recheck(success,h,{generation}),/stale or foreign/);
});
