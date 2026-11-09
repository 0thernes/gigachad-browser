'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Controller } = require('../systems/alive-overdrive-runtime.js');
const adapters = fs.readFileSync(path.join(__dirname, '../systems/alive-overdrive-adapters.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const first = '    function stopAlienBrainAutonomy() {', next = '    async function feedCreatureFromHabitatBar(options = {}) {';
const begin = index.indexOf(first), end = index.indexOf(next, begin);
assert.ok(begin >= 0 && end > begin && index.indexOf(first, begin + first.length) < 0, 'Unique production stop function boundaries');
const stopSource = index.slice(begin, end);
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const settle = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };

// Full production adapters and Controller route the lifecycle events. The
// trainer is a contract double; actual worker generations/messages/termination
// are tested separately against the production engine by its owning suite.
function fixture(options = {}) {
  const events=[],documentListeners=new Map(),bridgeListeners=new Map(),timers=new Map();let timerId=0;
  const trainer={active:true,suspendWorkerTrainer(reason){this.active=false;events.push('trainer-suspend:'+reason);return {status:'suspended'};},
    resumeWorkerTrainer(){this.active=true;events.push('trainer-resume');return {status:'ready'};}};
  class DeterministicController extends Controller {
    constructor(settings){super({...settings,capabilities:[],clock:()=>100,setTimer:fn=>{timers.set(++timerId,fn);return timerId;},clearTimer:id=>timers.delete(id)});}
  }
  const record={cid:'checkpoint-existing',manifest:{scope:'fixture tensor subset',metadata:{agentId:'creature-existing',
    body:{bodyCid:'restored-body'},policyCid:'restored-policy',stageIdx:2,authorityEpoch:8}}};
  let openRequest,readRequest,applied=0;
  const db={close(){events.push('db-close');},transaction(){return {objectStore(){return {get(){events.push('db-get');readRequest={};return readRequest;}};}};}};
  const h={bleedingEdge25Engine:trainer,agentId:'creature-existing',authorityEpoch:3,simulationTick:7,worldPredError:.2,
    bodyRecipe:{bodyCid:'old-body'},policyCid:'old-policy',stageIdx:0,
    savePersistentGenome(){events.push('legacy-save');}};
  const autosave={cancelAndDrain(reason){events.push('autosave-drain:'+reason);assert.equal(trainer.active,false,'Trainer must be suspended before storage drainage');return options.drain || Promise.resolve({settled:true});},
    resume(){events.push('autosave-resume');return true;},flush(reason){events.push('autosave-flush:'+reason);assert.equal(trainer.active,false,'Trainer must be suspended before capture/flush');return options.flush || Promise.resolve({status:'persisted',persistenceVerified:true});},
    cancel(){events.push('autosave-cancel');},snapshot(){return {};}};
  const context={humunculusRuntime:h,hybridBrainMesh:{},AliveOverdriveRuntime:{Controller:DeterministicController},
    AliveNeuralCoupling:{install(){events.push('coupling-install');}},AliveAutosave:{install(){events.push('autosave-install');return autosave;}},
    AliveCheckpoints:{async verify(){events.push('checkpoint-verify');assert.equal(trainer.active,false);if(options.verify)return options.verify;return {verified:true};},
      preflight(){events.push('checkpoint-preflight');assert.equal(trainer.active,false);},applyVerified(){events.push('checkpoint-apply');assert.equal(trainer.active,false);applied++;return {tensorCount:1};}},
    aliveGenomePersistence:{snapshot:()=>({ownerId:'fixture-owner'})},
    indexedDB:{open(){events.push('db-open');assert.equal(trainer.active,false,'Trainer suspension must precede the first database await');openRequest={};return openRequest;}},
    performance:{now:()=>100},Date,ArrayBuffer,Float32Array,Uint8Array,AbortController,structuredClone,
    document:{hidden:Boolean(options.hidden),addEventListener(name,listener){documentListeners.set(name,listener);},getElementById(){return null;}},
    dispatchEvent(event){events.push('controller-event:'+event.detail.type);},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
    requestAnimationFrame(){},setInterval(){},clearInterval(){events.push('clear-interval');},clearTimeout(){events.push('clear-timeout');},addEventListener(){},
    tabs:[],getActiveTab:()=>null,isWebviewGuestReady:()=>false,alienBrainTimer:null,alienBrainActive:false,
    superintelligenceOverdrive:false,neoMatrixOverdriveActive:false,abortAutopilot:false,alienAutoNavigateLinks:true,
    updateAlienBrainKpis(){events.push('kpis');},
    gigachad:{on(name,listener){bridgeListeners.set(name,listener);return()=>bridgeListeners.delete(name);},
      async invoke(channel,payload){assert.equal(channel,'alive-genome-close-result');events.push('close-ack');context.closeReceipt=payload;return {status:'acknowledged'};}}};
  context.window=context;
  if(options.startupOwned)context.aliveStartup={ownsClose:()=>true};
  vm.createContext(context);vm.runInContext(adapters,context,{filename:'alive-overdrive-adapters.js'});
  vm.runInContext(stopSource,context,{filename:'index.html:stopAlienBrainAutonomy'});
  return {context,h,trainer,events,record,autosave,controller:context.aliveOverdrive,applied:()=>applied,
    hidden(value){context.document.hidden=value;documentListeners.get('visibilitychange')();},
    close(){return bridgeListeners.get('alive-genome-close-request')({requestId:'close-request'});},
    async openDatabase(){assert.ok(openRequest);openRequest.result=db;openRequest.onsuccess();await settle();},
    async readCheckpoint(){assert.ok(readRequest);readRequest.result=record;readRequest.onsuccess();await settle();}};
}

test('adapter startup suspends the trainer before coupling or autosave installation',()=>{
  const f=fixture({startupOwned:true});
  assert.deepEqual(f.events.slice(0,4),['trainer-suspend:startup','coupling-install','autosave-install','autosave-drain:startup-hydration']);
  assert.equal(f.trainer.active,false);assert.equal(f.controller.running,false);assert.equal(f.events.includes('trainer-resume'),false);
});

test('real controller start/stop and suspension events govern trainer admission',()=>{
  const f=fixture();f.events.length=0;
  f.controller.start({automatic:false});assert.equal(f.trainer.active,true);assert.ok(f.events.includes('controller-event:started'));
  f.context.document.hidden=true;f.controller.tick();assert.equal(f.controller.suspended,true);assert.equal(f.trainer.active,false);
  assert.ok(f.events.includes('controller-event:suspended'));assert.ok(f.events.includes('trainer-suspend:document-hidden'));
  f.context.document.hidden=false;f.controller.tick();assert.equal(f.controller.suspended,false);assert.equal(f.trainer.active,true);
  assert.ok(f.events.includes('controller-event:resumed'));
  f.controller.stop();assert.equal(f.trainer.active,false);assert.ok(f.events.includes('trainer-suspend:paused'));
});

test('visibility events never resume a paused trainer and resume a running trainer only when visible',()=>{
  const f=fixture();f.events.length=0;f.hidden(true);f.hidden(false);
  assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  f.context.startAliveOverdrive();assert.equal(f.controller.running,true);assert.equal(f.trainer.active,true);
  f.hidden(true);assert.equal(f.trainer.active,false);f.hidden(false);assert.equal(f.trainer.active,true);
  f.context.stopAlienBrainAutonomy();f.events.length=0;f.hidden(true);f.hidden(false);
  assert.equal(f.controller.running,false);assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
});

test('sync and start wrappers cannot reopen training while hidden, restoring, or closing',()=>{
  const hidden=fixture({hidden:true});hidden.context.startAliveOverdrive();
  assert.equal(hidden.controller.running,true);assert.equal(hidden.trainer.active,false);
  for(const flag of ['__aliveCheckpointRestore','__alivePersistenceClosing']){
    const f=fixture();f.context[flag]=true;f.events.length=0;
    assert.equal(f.context.startAliveOverdrive().status,'blocked');assert.equal(f.controller.running,false);
    // A direct controller start still flows through the production onEvent guard.
    f.controller.start({automatic:false});f.context.syncAliveGuestState();
    assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  }
});

test('actual host stop suspends training before stopping the controller and remains suspended',()=>{
  const f=fixture();f.context.startAliveOverdrive();f.events.length=0;
  f.context.stopAlienBrainAutonomy();
  assert.equal(f.events[0],'trainer-suspend:paused');
  assert.ok(f.events.indexOf('trainer-suspend:paused')<f.events.indexOf('controller-event:stopped'));
  assert.equal(f.controller.running,false);assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  assert.equal(f.context.alienBrainActive,false);assert.equal(f.context.superintelligenceOverdrive,false);
});

test('normal close suspends training before the first final flush and keeps it closed across awaits',async()=>{
  const flush=deferred(),f=fixture({flush:flush.promise});f.context.startAliveOverdrive();f.events.length=0;
  const closing=f.close();assert.equal(f.context.__alivePersistenceClosing,true);assert.equal(f.trainer.active,false);
  assert.equal(f.events[0],'trainer-suspend:shutdown');assert.ok(f.events.indexOf('trainer-suspend:shutdown')<f.events.indexOf('autosave-flush:shutdown'));
  f.context.syncAliveGuestState();f.hidden(false);assert.equal(f.context.startAliveOverdrive().status,'blocked');assert.equal(f.trainer.active,false);
  assert.equal(f.events.includes('close-ack'),false);flush.resolve({status:'persisted',persistenceVerified:true});await closing;
  assert.ok(f.events.indexOf('autosave-drain:shutdown-settled')>f.events.indexOf('autosave-flush:shutdown'));
  assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);assert.equal(f.context.closeReceipt.requestId,'close-request');
});

test('startup-owned close is left to the loader without duplicate adapter flush or acknowledgement',async()=>{
  const f=fixture({startupOwned:true});f.events.length=0;await f.close();
  assert.deepEqual(f.events,[]);assert.equal(f.context.closeReceipt,undefined);assert.equal(f.trainer.active,false);
});

test('checkpoint restore suspends before its first await and remains suspended after successful restoration',async()=>{
  const verify=deferred(),drain=deferred(),f=fixture({verify:verify.promise,drain:drain.promise});
  // Simulate the old independently running worker while the host is paused.
  f.trainer.resumeWorkerTrainer();f.events.length=0;
  const restoring=f.context.restoreAliveCheckpoint();
  assert.equal(f.events[0],'trainer-suspend:checkpoint-restore');assert.equal(f.events[1],'db-open');
  assert.equal(f.trainer.active,false);assert.equal(f.context.__aliveCheckpointRestore,true);
  f.context.syncAliveGuestState();assert.equal(f.events.includes('trainer-resume'),false);
  await f.openDatabase();await f.readCheckpoint();assert.equal(f.applied(),0);assert.ok(f.events.includes('checkpoint-verify'));
  verify.resolve({verified:true});await settle();assert.ok(f.events.includes('autosave-drain:checkpoint-restore'));assert.equal(f.applied(),0);
  f.hidden(false);assert.equal(f.trainer.active,false);drain.resolve({settled:true});
  assert.equal((await restoring).status,'completed');assert.equal(f.applied(),1);assert.equal(f.context.__aliveCheckpointRestore,false);
  assert.equal(f.h.policyCid,'restored-policy');assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  f.context.startAliveOverdrive();assert.equal(f.trainer.active,true,'Only an explicit visible start reopens trainer admission');
});

test('checkpoint failures do not implicitly resume training and running restore is rejected before mutation',async()=>{
  const verify=deferred(),f=fixture({verify:verify.promise});
  const restoring=f.context.restoreAliveCheckpoint();await f.openDatabase();await f.readCheckpoint();
  verify.reject(Error('Checkpoint hash mismatch'));await assert.rejects(restoring,/Checkpoint hash mismatch/);
  assert.equal(f.context.__aliveCheckpointRestore,false);assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  f.context.startAliveOverdrive();f.events.length=0;
  assert.equal((await f.context.restoreAliveCheckpoint()).status,'blocked');assert.equal(f.trainer.active,true);assert.equal(f.events.length,0);assert.equal(f.applied(),0);
});

test('shutdown during checkpoint verification prevents restore and does not resume the trainer',async()=>{
  const verify=deferred(),f=fixture({verify:verify.promise});
  const restoring=f.context.restoreAliveCheckpoint();await f.openDatabase();await f.readCheckpoint();
  await f.close();verify.resolve({verified:true});assert.equal((await restoring).status,'blocked');
  assert.equal(f.applied(),0);assert.equal(f.trainer.active,false);assert.equal(f.events.includes('trainer-resume'),false);
  assert.equal(f.context.__aliveCheckpointRestore,false);assert.equal(f.context.__alivePersistenceClosing,true);
});
