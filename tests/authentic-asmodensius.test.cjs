'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {AuthenticAsmodensiusAdapter:Adapter}=require('../systems/authentic-asmodensius-adapter');
const source=require('../systems/generated/authentic-asmodensius');
const input=t=>Float64Array.from({length:16},(_,i)=>.5+.5*Math.sin((t+1)*(i+1)*.031));
const profile={mind:'v40',entropy:'seeded',substrate:'synthetic',noise:'quantum',access:'all'};
const native=a=>JSON.stringify(a._creature.snapshot());
function mutate(state,fn){const data=JSON.parse(state.payload);fn(data);state={...state,payload:JSON.stringify(data)};let h=2166136261;for(let i=0;i<state.payload.length;i++)h=Math.imul(h^state.payload.charCodeAt(i),16777619)>>>0;state.checksum=h.toString(16).padStart(8,'0');return state;}
test('generated bundle and source closure are reproducible and contain original notice',()=>{
  execFileSync(process.execPath,['scripts/build-authentic-asmodensius.js','--check'],{cwd:path.resolve(__dirname,'..')});
  const manifest=require('../systems/generated/authentic-asmodensius.manifest.json');
  assert.equal(manifest.inputs.length,16);assert.equal(manifest.sourceDigest,source.sourceDigest);
  for(const item of manifest.inputs){const bytes=fs.readFileSync(path.resolve(__dirname,'..',item.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);}
  assert.match(manifest.notices[0].text,/Copyright \(c\) 2026 Alex Donahue and Asmodensius contributors/);
  assert.match(fs.readFileSync(path.resolve(__dirname,'../systems/generated/authentic-asmodensius.js'),'utf8'),/Permission is hereby granted, free of charge/);
});
test('adapter executes original Creature001 with identical complete source state',()=>{
  for(const seed of [17,104729,4294967295]){
    const adapter=new Adapter({seed}),original=new source.Creature001(seed,profile);
    for(let t=0;t<240;t++){const x=input(t);adapter.step(x);original.senseLines(Array.from(x));original.step();}
    assert.equal(native(adapter),JSON.stringify(original.snapshot()));
    assert.deepEqual(adapter.readout().motor8,Array.from(original.motor()));
    assert.equal(adapter.readout().simulatedMinutes,240);
  }
});
test('observed chrome input interventions change original state and bounded consumed motor',()=>{
  const a=new Adapter({seed:104729}),b=new Adapter({seed:104729});let changed=0;
  for(let t=0;t<300;t++){
    const observed={width:1280,height:800,x:100+t,y:200,vx:2,vy:-1,tabCount:3,focused:true,loading:false};
    a.step(Adapter.observeChrome(observed));b.step(Adapter.observeChrome({...observed,x:1180-t,y:600,vx:-2,vy:1}));
    if(a.motor2D.some((v,i)=>v!==b.motor2D[i]))changed++;
    assert.ok(a.motor2D.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
  }
  assert.ok(changed>0,'Original motor must respond to actual input intervention');assert.notEqual(native(a),native(b));
});
test('JSON checkpoint exact continuation covers initialization, learning, RNG and one day of source time',()=>{
  for(const ticks of [0,1,100,1500]){
    const a=new Adapter({seed:17});for(let t=0;t<ticks;t++)a.step(input(t));a.advance(73,input(ticks));
    const b=new Adapter({seed:999});assert.equal(b.importState(JSON.parse(JSON.stringify(a.exportState()))),true,b.lastError);
    for(let t=ticks;t<ticks+40;t++){a.step(input(t));b.step(input(t));assert.equal(a.exportState().payload,b.exportState().payload);}
  }
});
test('invalid checkpoints fail atomically, including recalculated-checksum structural attacks',()=>{
  const a=new Adapter({seed:17});for(let i=0;i<20;i++)a.step(input(i));const good=a.exportState();
  const cases=[{}, {...good,schema:'future'}, {...good,sourceDigest:'other'}, {...good,payload:good.payload.slice(1)},
    mutate(good,d=>{delete d.native.org.rate;}),mutate(good,d=>{d.native.org.rate=null;}),
    mutate(good,d=>{d.native.org.rate.v.pop();}),mutate(good,d=>{d.native.org.r.__rng=2**32;}),
    mutate(good,d=>{d.native.org.syn.pre.v[0]=9999;}),mutate(good,d=>{d.native.org.mind.step=7;}),
    mutate(good,d=>{d.native.org.t=1.5;}),mutate(good,d=>{d.native.org.syn.pre.v[0]=.5;})];
  for(const bad of cases){assert.equal(a.importState(bad),false);assert.equal(a.exportState().payload,good.payload);}
});
test('checkpoint continuation preserves sleep-driven developmental pruning and collection state',()=>{
  const a=new Adapter({seed:31}),quiet=new Float64Array(16);
  for(let t=0;t<4000;t++)a.step(quiet);
  assert.equal(a.readout().metrics.asleep,1);assert.ok(a._creature.o.devStats.pruned>0);
  a._creature.o.affect.off.add('mood');
  const b=new Adapter();assert.equal(b.importState(JSON.parse(JSON.stringify(a.exportState()))),true,b.lastError);
  assert.ok(b._creature.o.affect.off.has('mood'));
  for(let t=0;t<100;t++){a.step(quiet);b.step(quiet);}
  assert.equal(a.exportState().payload,b.exportState().payload);
});
test('scheduler retains fraction across checkpoint, pause stops state, long stall has no catch-up burst',()=>{
  const a=new Adapter();a.advance(100,input(0));a.advance(100,input(0));assert.equal(a.readout().simulatedMinutes,0);
  const b=new Adapter();assert.equal(b.importState(a.exportState()),true,b.lastError);a.advance(50,input(0));b.advance(50,input(0));assert.equal(a.readout().simulatedMinutes,1);assert.equal(a.exportState().payload,b.exportState().payload);
  a.setPaused(true);const paused=a.exportState().payload;a.advance(60000,input(1));assert.equal(a.exportState().payload,paused);
  a.setPaused(false);a.advance(60000,input(1));assert.equal(a.readout().simulatedMinutes,1);
});
function addStoredEdge(data) {
  const o=data.native.org,index=o.syn.pre.v.length;
  o.syn.pre.v.push(0);o.syn.post.v.push(16);o.syn.w.v.push(.25);o.syn.plastic.v.push(0);
  o.kind.v.push(0);o.pk.v.push(0);o.mask.v.push(1);o.out[0].push(index);
  if(o.devPruned)o.devPruned.v.push(0);
}
test('saved sparse topology restores independently of genesis and retains exact developmental refinement',()=>{
  const a=new Adapter({seed:1});for(let i=0;i<12;i++)a.step(input(i));
  // Force the actual source refinement into sprouting, which calls its hidden
  // genome/jitter affinity callback rather than only masking weak edges.
  a._creature.o.devTarget=a._creature.o.devSlots.length;
  const cp=mutate(a.exportState(),addStoredEdge),data=JSON.parse(cp.payload);
  a._creature.restore(data.native);
  const b=new Adapter({seed:999});assert.equal(b.importState(cp),true,b.lastError);
  assert.equal(b.exportState().payload,cp.payload);
  for(let i=0;i<80;i++){
    a._creature.o.devRefine();b._creature.o.devRefine();
    a.step(input(i));b.step(input(i));
    assert.equal(a.exportState().payload,b.exportState().payload,'exact stored graph, PRNG and refinement continuation');
  }
  assert.ok(a._creature.o.devStats.sprouted>0);
});
test('graph and hidden-affinity corruption is rejected atomically while non-graph shapes remain strict',()=>{
  const a=new Adapter({seed:17});a.step(input(0));const good=a.exportState();
  const attacks=[d=>d.native.org.syn.post.v.pop(),d=>d.native.org.pk.v.pop(),d=>d.native.org.out[0].push(d.native.org.syn.pre.v.length),
    d=>{const edge=d.native.org.out.find(list=>list.length);edge.push(edge[0]);},d=>d.native.org.inn.pop(),
    d=>d.native.org.devSlots[0][1]=9999,d=>d.developmentAffinity.pop(),d=>d.developmentAffinity[0].values.pop(),
    d=>d.developmentAffinity[0].values[0]=3,d=>d.developmentAffinity[0].start++,d=>d.native.org.rate.v.pop(),
    d=>{d.native.org.devPruned={__ta:'Uint8Array',v:[0]};}];
  for(const attack of attacks){assert.equal(a.importState(mutate(good,attack)),false);assert.equal(a.exportState().payload,good.payload);}
});
test('legacy checkpoint retains its old encoding and refuses incompatible topology without replacement',()=>{
  const a=new Adapter({seed:17});a.step(input(0));const full=a.exportState();
  const legacy=mutate(full,d=>{delete d.developmentAffinity;});
  const b=new Adapter();assert.equal(b.importState(legacy),true,b.lastError);assert.equal(b.exportState().payload,legacy.payload);
  const incompatible=mutate(legacy,addStoredEdge);
  assert.equal(b.importState(incompatible),false);assert.match(b.lastError,/Typed array shape mismatch/);
  assert.equal(b.exportState().payload,legacy.payload,'failed legacy migration must preserve the previously loaded state');
});
test('developmental projection metadata exactly matches the unchanged donor authored connectivity',()=>{
  const donor=fs.readFileSync(path.resolve(__dirname,'../brains/asmodensius-v40/creatures/001/organism/organism.ts'),'utf8');
  const match=donor.match(/const CP:\s*\[Region, Region, number\]\[\]\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match,'The donor projection declaration must remain explicitly reviewable');
  const authored=JSON.parse(match[1]).map(([pre,post])=>[pre,post]);
  assert.equal(authored.length,26);assert.deepEqual(Adapter.developmentProjections,authored);
  assert.ok(Object.isFrozen(Adapter.developmentProjections));
  assert.ok(Adapter.developmentProjections.every(Object.isFrozen));
});

function remapFirstProjection(data,endpoint) {
  const o=data.native.org;
  // All tensors, adjacency and affinity rows stay internally consistent, while
  // CP[0]'s authored SENS -> THAL domain is replaced with HIP endpoints.
  for(const [edge,projection] of o.devSlots){
    if(projection!==0)continue;
    const old=o.syn[endpoint].v[edge],next=96+(old%16);
    const adjacency=endpoint==='pre'?o.out:o.pk.v[edge]!==0?o.inn:null;
    if(adjacency){adjacency[old].splice(adjacency[old].indexOf(edge),1);adjacency[next].push(edge);}
    o.syn[endpoint].v[edge]=next;
  }
  for(const row of data.developmentAffinity||[]){
    if(row.projection!==0)continue;
    if(endpoint==='pre'){row.start=96;row.values=Array(32).fill(.5);}
    else row.post=96+(row.post%16);
  }
}

test('self-consistent projection source and target attacks fail atomically before refinement',()=>{
  const a=new Adapter({seed:17});a.step(input(0));const good=a.exportState();
  for(const endpoint of ['pre','post']){
    for(const legacy of [false,true]){
      const bad=mutate(good,d=>{remapFirstProjection(d,endpoint);if(legacy)delete d.developmentAffinity;});
      assert.equal(a.importState(bad),false,endpoint+' attack, legacy='+legacy);
      assert.match(a.lastError,/violates authored projection 0/);
      assert.equal(a.exportState().payload,good.payload,'rejected domain must not replace live state');
    }
  }
  const selfEdge=mutate(good,d=>{
    const o=d.native.org,[edge]=o.devSlots.find(([,projection])=>projection===3),old=o.syn.pre.v[edge],post=o.syn.post.v[edge];
    o.out[old].splice(o.out[old].indexOf(edge),1);o.out[post].push(edge);o.syn.pre.v[edge]=post;
  });
  assert.equal(a.importState(selfEdge),false);assert.match(a.lastError,/violates authored projection 3/);
  assert.equal(a.exportState().payload,good.payload);
});

test('checkpoint preserves native shared Set identities and later mutation propagation',()=>{
  const a=new Adapter({seed:17});a.step(input(0));
  a._creature.o.bus.off.add('alias-probe');a._creature.o.neo.ctl.add('control-probe');
  const cp=a.exportState(),b=new Adapter();assert.equal(b.importState(cp),true,b.lastError);
  for(const adapter of [a,b]){
    const o=adapter._creature.o;
    for(const part of ['selfM','curv','neo'])assert.equal(o[part].off,o.bus.off);
    for(const part of ['selfM','neo'])assert.equal(o[part].ctl,o.bus.ctl);
    assert.notEqual(o.affect.off,o.bus.off,'independent donor collections must stay independent');
    o.curv.off.add('second-alias-probe');o.bus.ctl.delete('control-probe');
    assert.ok(o.neo.off.has('second-alias-probe'));assert.ok(o.selfM.off.has('second-alias-probe'));
    assert.equal(o.neo.ctl.has('control-probe'),false);assert.equal(o.affect.off.has('second-alias-probe'),false);
  }
  for(let i=1;i<=20;i++){a.step(input(i));b.step(input(i));assert.equal(a.exportState().payload,b.exportState().payload);}
});

test('inconsistent shared Set records and duplicate values are rejected atomically',()=>{
  const a=new Adapter({seed:17});a.step(input(0));a._creature.o.bus.off.add('first');a._creature.o.bus.off.add('second');
  const good=a.exportState();
  for(const mutateValues of [values=>values.push('third'),values=>values.reverse(),values=>values.push(values[0])]){
    const bad=mutate(good,d=>mutateValues(d.sets.find(record=>record.part==='neo'&&record.field==='off').values));
    assert.equal(a.importState(bad),false);assert.match(a.lastError,/collection/);
    assert.equal(a.exportState().payload,good.payload);
    assert.equal(a._creature.o.bus.off,a._creature.o.neo.off);
  }
});

test('legacy recovery prepares an immutable explicit candidate while preserving all known state',()=>{
  const live=new Adapter({seed:17});for(let i=0;i<12;i++)live.step(input(i));live.advance(73,input(12));
  live._creature.o.bus.off.add('known-shared-value');
  const unchanged=live.exportState().payload;
  const legacy=Object.freeze(mutate(live.exportState(),d=>{delete d.developmentAffinity;addStoredEdge(d);}));
  const originalEnvelope=JSON.stringify(legacy),known=JSON.parse(legacy.payload);
  const strict=new Adapter();assert.equal(strict.importState(legacy),false);assert.match(strict.lastError,/Typed array shape mismatch/);
  const prepared=Adapter.prepareLegacyRecovery(legacy);
  assert.equal(prepared.schema,'gigachad.authentic-asmodensius.legacy-recovery.v1');
  assert.equal(prepared.provenance.exactHistoricalContinuation,false);
  assert.equal(prepared.provenance.developmentalAffinity,'reinitialized-from-current-seeded-constructor');
  assert.equal(prepared.provenance.preservedKnownState,true);
  assert.equal(prepared.provenance.sourceEnvelopeChecksum,legacy.checksum);
  assert.ok(prepared.provenance.limitations.some(value=>/V8/.test(value)));
  for(const item of [prepared,prepared.envelope,prepared.provenance,prepared.provenance.profile,prepared.provenance.limitations])assert.ok(Object.isFrozen(item));
  assert.throws(()=>{prepared.envelope.payload='replacement';},TypeError);
  assert.equal(JSON.stringify(legacy),originalEnvelope);assert.equal(live.exportState().payload,unchanged);
  const recovered=JSON.parse(prepared.envelope.payload);assert.ok(recovered.developmentAffinity.length>0);delete recovered.developmentAffinity;
  assert.deepEqual(recovered,known,'saved topology, native state/RNG, collections and adapter fields are unchanged');
  const a=new Adapter(),b=new Adapter();
  for(const target of [a,b]){assert.equal(target.importState(prepared.envelope),true,target.lastError);assert.equal(target.exportState().payload,prepared.envelope.payload);target._creature.o.devTarget=target._creature.o.devSlots.length;}
  for(let i=0;i<30;i++){a._creature.o.devRefine();b._creature.o.devRefine();a.step(input(i));b.step(input(i));assert.equal(a.exportState().payload,b.exportState().payload);}
  assert.ok(a._creature.o.devStats.sprouted>=30,'prepared future refinement remains callable');
});

test('legacy recovery rejects current envelopes and malformed legacy state without mutating callers',()=>{
  const live=new Adapter({seed:17});live.step(input(0));const good=live.exportState(),unchanged=good.payload;
  const legacy=mutate(good,d=>{delete d.developmentAffinity;});
  const attacks=[{},good,{...legacy,sourceDigest:'other'},{...legacy,checksum:'00000000'},
    mutate(legacy,d=>{d.developmentAffinity=null;}),mutate(legacy,d=>{d.unrecognized=1;}),
    mutate(legacy,d=>d.native.org.rate.v.pop()),mutate(legacy,d=>remapFirstProjection(d,'pre')),
    mutate(legacy,d=>remapFirstProjection(d,'post')),mutate(legacy,d=>d.native.org.devSlots[0][1]=26),
    mutate(legacy,d=>d.sets.find(record=>record.part==='neo'&&record.field==='off').values.push('inconsistent'))];
  for(const invalid of attacks){const before=JSON.stringify(invalid);assert.throws(()=>Adapter.prepareLegacyRecovery(invalid));assert.equal(JSON.stringify(invalid),before);assert.equal(live.exportState().payload,unchanged);}
});

test('browser bundle runs without Node integration and renderer maps output into actual velocity',()=>{
  const context=vm.createContext({console,performance});
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../systems/generated/authentic-asmodensius.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../systems/authentic-asmodensius-adapter.js'),'utf8'),context);
  assert.equal(vm.runInContext('typeof require',context),'undefined');
  assert.equal(vm.runInContext('const a=new AuthenticAsmodensiusAdapter(); a.step(new Float64Array(16).fill(.5)); a.readout().simulatedMinutes',context),1);
  const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
  const start=html.indexOf('            const rHub = h.trainableAlifeNeuralHub;');const end=html.indexOf('            ent.x = Math.max',start);
  assert.ok(start>=0&&end>start);const fragment=html.slice(start,end);
  const run=motor=>{const c={h:{trainableAlifeNeuralHub:{learnedMotorThrust2D:[0,0]},authenticAsmodensius:{motor2D:motor,paused:false}},ei:0,ent:{vx:0,vy:0},dx:0,dy:0,dist:1,eSpeed:1,sepX:0,sepY:0,st:{tick:0},Math};vm.runInNewContext(fragment,c);return c.ent;};
  const noOutput=run([0,0]),output=run([.5,-.5]);assert.ok(output.vx>noOutput.vx&&output.vy<noOutput.vy);
});
