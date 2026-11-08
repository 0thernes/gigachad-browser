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
