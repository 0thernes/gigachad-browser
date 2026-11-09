'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { create, POST_MODULES, SOURCE_ID, SOURCE_TYPE } = require('../systems/alive-startup-loader.js');
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const primary = () => Object.freeze({ preflight() {}, apply() {}, capture() {}, captureComponents() {}, snapshot() {} });
const main = `const startupLexical = 41; window.mainRuns = (window.mainRuns || 0) + 1;
  function boot() { window.events.push('boot'); window.bootValue = startupLexical + postLexical; }
  window.__aliveStartupRegister(boot);`;

function fixture(options = {}) {
  const events=[],pending=[],nodes=[],listeners=new Map(),closeListeners=new Set(),receipts=[];
  let context, source, fenced=0;
  const state={status:'ready',writeAllowed:true,applicationFailed:false,ownerId:'startup-owner',epoch:0};
  const doc={URL:options.url || 'file:///C:/gigachad/index.html',baseURI:'https://untrusted.example/'};
  function emit(name,event) { for(const listener of listeners.get(name)||[]) listener(event); }
  function execute(code,filename) { try { vm.runInContext(code,context,{filename}); } catch(error) { emit('error',{filename,error,message:error.message,target:win}); } }
  function element(tag) {
    const attrs={},node={tagName:tag.toUpperCase(),ownerDocument:doc,isConnected:false,parentNode:null,textContent:'',style:{},
      setAttribute(key,value){attrs[key]=String(value);},getAttribute(key){return Object.hasOwn(attrs,key)?attrs[key]:null;},hasAttribute(key){return Object.hasOwn(attrs,key);},
      appendChild(child){child.isConnected=true;child.parentNode=node;nodes.push(child);
        if(child.tagName==='SCRIPT'&&child.type==='text/javascript') {
          if(child.hasAttribute('src')) {
            const preparationDocument=child.ownerDocument;
            const entry={node:child,url:child.src,load(code){
              // Prepared classic scripts can execute after removal. Only a
              // changed node document prevents this prepared execution.
              if(child.ownerDocument!==preparationDocument){events.push('retired-script-skipped');return;}
              const relative=POST_MODULES.find(p=>new URL(p,doc.URL).href===child.src);
              const automatic=relative===POST_MODULES[0]?'const postLexical = 1;':
                relative===POST_MODULES[7]&&!options.noAutosave?'window.aliveAutosave=window.testAutosave;window.aliveStartupAutosaveDrain=window.testAutosave.initialDrain;':'';
              execute(code===undefined?automatic:code,child.src);child.onload?.();
            },fail(){child.onerror?.();}};
            pending.push(entry);events.push('load:'+child.src);
          } else { events.push('main');execute(child.textContent,doc.URL); }
        }
        return child;},remove(){node.isConnected=false;node.parentNode=null;}};
    for(const key of ['id','type','src'])Object.defineProperty(node,key,{get(){return attrs[key]||'';},set(value){attrs[key]=String(value);}});
    return node;
  }
  doc.head=element('head');doc.head.isConnected=true;doc.body=element('body');doc.body.isConnected=true;
  doc.implementation={createHTMLDocument(){const retired={defaultView:null,adoptNode(node){
    if(options.adoptFailure)throw Error('Adoption failed');node.remove();node.ownerDocument=retired;return node;
  }};return retired;}};
  doc.createElement=element;
  doc.getElementById=id=>nodes.find(n=>n.isConnected&&n.id===id)||null;
  doc.querySelectorAll=selector=>nodes.filter(n=>n.isConnected&&(selector==='script[src]'?n.tagName==='SCRIPT'&&n.hasAttribute('src'):n.id===SOURCE_ID));
  source=element('script');source.id=SOURCE_ID;source.type=options.type || SOURCE_TYPE;source.textContent=options.main===undefined?main:options.main;
  if(options.remoteSource)source.src='https://untrusted.example/main.js';
  source.isConnected=true;source.parentNode=doc.body;nodes.push(source);
  const testAutosave={initialDrain:options.initialDrain || Promise.resolve({settled:true}),resume(){events.push('resume');return options.resumeResult ?? true;},
    request(reason){events.push('request:'+reason);return true;},cancelAndDrain(reason){events.push('drain:'+reason);return options.closeDrain || Promise.resolve({settled:true});}};
  const win={document:doc,location:{href:doc.URL},events,testAutosave,crypto:{},
    localStorage:{getItem(){assert.fail('The canonical fixture must not read localStorage');}},
    addEventListener(name,listener){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(listener);},
    removeEventListener(name,listener){listeners.get(name)?.delete(listener);},
    gigachad:{on(name,listener){assert.equal(name,'alive-genome-close-request');closeListeners.add(listener);events.push('subscribe');return()=>{events.push('unsubscribe');closeListeners.delete(listener);};},
      async invoke(channel,payload){assert.equal(channel,'alive-genome-close-result');receipts.push(payload);events.push('ack');return {status:'acknowledged'};}},
    aliveGenomePersistence:{initialJSON(storage,key){events.push('read');assert.equal(key,'humunculus_persistent_genome_v1');return options.json??'{"simulationTick":9}';},
      snapshot(){return {...state};},markApplied(success,details){events.push('blocked');assert.equal(success,false);assert.equal(details.hadJSON,true);state.applicationFailed=true;state.writeAllowed=false;},
      async fence({epoch}){events.push('fence');fenced++;state.epoch=epoch;return options.fence || {settled:true,ownerId:state.ownerId,epoch};}},
    AlivePrimaryPolicyState:{},AliveTrainerState:{create(){}},AliveReplayState:{create(){}},AliveLearnedStateRegistry:{},AliveLearnedStateCodec:{}};
  win.window=win;context=vm.createContext(win);
  const prepare=options.prepare || (async args=>{events.push('prepare');assert.equal(args.json,options.json??'{"simulationTick":9}');return primary();});
  win.AlivePrimaryPolicyBootstrap={prepare};
  const loader=create({window:win,document:doc,prepare:options.useGlobalPrepare?undefined:prepare});win.aliveStartup=loader;
  return {win,doc,loader,source,events,pending,state,receipts,closeListeners,
    fenceCount:()=>fenced,close(requestId='close-1'){for(const listener of [...closeListeners])listener({requestId});},
    async loadAll(){await tick();for(let i=0;i<POST_MODULES.length;i++){assert.ok(pending[i],`module ${i} was scheduled`);pending[i].load();await tick();}}};
}

test('prepares before main and serially inserts fixed classic scripts with shared global lexical scope',async()=>{
  const f=fixture();const ready=f.loader.start();assert.equal(f.doc.body.inert,true);
  assert.deepEqual(f.events,['subscribe','read','prepare']);await tick();
  assert.equal(f.win.mainRuns,1);assert.equal(f.pending.length,1);assert.equal(f.win.startupLexical,undefined,'top-level const stays lexical');
  await f.loadAll();assert.equal((await ready).phase,'ready');assert.equal(f.win.bootValue,42);
  assert.equal(f.doc.body.inert,false);assert.equal(f.loader.ownsClose(),false);assert.equal(f.closeListeners.size,0);
  assert.deepEqual(f.pending.map(p=>p.url),POST_MODULES.map(p=>new URL(p,f.doc.URL).href));
  assert.ok(f.pending.every(p=>p.node.type==='text/javascript'&&p.node.async===false));
  assert.deepEqual(f.events.slice(-4),['resume','unsubscribe','request:startup-ready','boot']);
  assert.equal(f.loader.start(),ready,'start is idempotent');
});

test('digest delay holds all main execution and uses captured trusted source after preparation',async()=>{
  const wait=deferred(),f=fixture({prepare:()=>wait.promise});f.loader.start();
  f.source.textContent='throw new Error("mutated source must not run")';await tick();
  assert.equal(f.win.mainRuns,undefined);assert.equal(f.pending.length,0);assert.equal(f.doc.body.inert,true);
  wait.resolve(primary());await f.loadAll();assert.equal((await f.loader.ready).phase,'ready');assert.equal(f.win.bootValue,42);
});

test('forwards primary, trainer, replay, registry, codec, crypto and canonical JSON to preparation',async()=>{
  for(const useGlobalPrepare of [false,true]){
    let received;
    const prepared=primary(),f=fixture({useGlobalPrepare,json:'{"simulationTick":17}',prepare:async args=>{received=args;return prepared;}});
    f.loader.start();await tick();
    assert.deepEqual(Object.keys(received).sort(),['codec','crypto','json','primary','registry','replay','trainer']);
    assert.equal(received.json,'{"simulationTick":17}');
    assert.equal(received.primary,f.win.AlivePrimaryPolicyState);
    assert.equal(received.trainer,f.win.AliveTrainerState);
    assert.equal(received.replay,f.win.AliveReplayState);
    assert.equal(received.registry,f.win.AliveLearnedStateRegistry);
    assert.equal(received.codec,f.win.AliveLearnedStateCodec);
    assert.equal(received.crypto,f.win.crypto);
    assert.equal(f.win.alivePrimaryPolicyBootstrap,prepared);
    assert.equal(typeof f.win.alivePrimaryPolicyBootstrap.captureComponents,'function');
    await f.loadAll();assert.equal((await f.loader.ready).phase,'ready');assert.equal(f.win.bootValue,42);
  }
});

test('missing or non-callable trainer or replay dependency blocks before prepare, main and postmodules',async()=>{
  for(const dependency of ['AliveTrainerState','AliveReplayState']) for(const value of [undefined,null,{}, {create:false}]){
    let prepareCalls=0;
    const f=fixture({prepare:async()=>{prepareCalls++;return primary();}});
    f.win[dependency]=value;
    const result=await f.loader.start();
    assert.equal(result.phase,'failed');assert.equal(prepareCalls,0);
    assert.equal(f.win.mainRuns,undefined);assert.equal(f.pending.length,0);
    assert.equal(f.win.alivePrimaryPolicyBootstrap,undefined);
    assert.equal(f.state.applicationFailed,true);assert.equal(f.state.writeAllowed,false);
    assert.equal(f.doc.body.inert,true);assert.equal(f.loader.ownsClose(),true);
  }
});

test('preparation without callable captureComponents cannot construct or activate the main model',async()=>{
  for(const captureComponents of [undefined,null,false]){
    const f=fixture({prepare:async()=>({...primary(),captureComponents})});
    const result=await f.loader.start();
    assert.equal(result.phase,'failed');assert.match(result.error,/invalid preparation/);
    assert.equal(f.win.mainRuns,undefined);assert.equal(f.pending.length,0);
    assert.equal(f.win.alivePrimaryPolicyBootstrap,undefined);assert.equal(f.state.writeAllowed,false);
    assert.equal(f.doc.body.inert,true);
  }
});

test('corrupt preparation and blocked canonical state fail without constructing a default model',async()=>{
  for(const mode of ['reject','invalid-api','blocked-store']){
    const f=fixture({prepare:async()=>{if(mode==='reject')throw Error('Digest mismatch');if(mode==='invalid-api')return {};assert.fail('blocked store cannot prepare');}});
    if(mode==='blocked-store')f.state.writeAllowed=false;
    const result=await f.loader.start();assert.equal(result.phase,'failed');assert.equal(f.win.mainRuns,undefined);assert.equal(f.pending.length,0);
    assert.equal(f.state.writeAllowed,false);assert.equal(f.doc.body.inert,true);assert.equal(f.loader.ownsClose(),true);
    assert.match(f.doc.getElementById('alive-startup-failure').textContent,/saved genome has been preserved/);
  }
});

test('missing, remote, parser-executable and duplicate main sources fail before preparation',async()=>{
  for(const mode of ['missing','remote','executable','duplicate','remote-document']){
    const f=fixture({remoteSource:mode==='remote',type:mode==='executable'?'text/javascript':SOURCE_TYPE,url:mode==='remote-document'?'https://untrusted.example/index.html':undefined,
      prepare:()=>assert.fail('untrusted source cannot prepare')});
    if(mode==='missing')f.source.remove();
    if(mode==='duplicate'){const extra=f.doc.createElement('script');extra.id=SOURCE_ID;extra.type=SOURCE_TYPE;f.doc.body.appendChild(extra);}
    assert.equal((await f.loader.start()).phase,'failed');assert.equal(f.pending.length,0);
  }
});

test('preexisting parser postmodule duplication is rejected, including an absolute file URL',async()=>{
  const f=fixture({prepare:()=>assert.fail('duplicate module cannot prepare')});
  const duplicate=f.doc.createElement('script');duplicate.src=new URL(POST_MODULES[0],f.doc.URL).href;f.doc.body.appendChild(duplicate);
  const result=await f.loader.start();assert.equal(result.phase,'failed');assert.match(result.error,/parser executable/);
});

test('main must register once and runtime errors after registration prevent every postmodule',async()=>{
  for(const code of ['const neverRegistered=1;','window.__aliveStartupRegister(()=>{});try{window.__aliveStartupRegister(()=>{});}catch(_){}',
    'window.__aliveStartupRegister(()=>{});throw Error("construction failed");']){
    const f=fixture({main:code});assert.equal((await f.loader.start()).phase,'failed');assert.equal(f.pending.length,0);assert.equal(f.doc.body.inert,true);
  }
});

test('a constructor rejecting canonical state prevents postmodules despite registering boot',async()=>{
  const f=fixture({main:'window.aliveGenomePersistence.markApplied(false,{hadJSON:true});window.__aliveStartupRegister(()=>{window.booted=true;});'});
  const result=await f.loader.start();assert.equal(result.phase,'failed');assert.match(result.error,/rejected by the main constructor/);
  assert.equal(f.pending.length,0);assert.equal(f.win.booted,undefined);assert.equal(f.state.applicationFailed,true);
});

test('registration after main execution fails closed even when the caller catches the error',async()=>{
  const f=fixture();f.loader.start();await tick();
  assert.throws(()=>f.win.__aliveStartupRegister(()=>{}),/exactly once/);
  assert.equal((await f.loader.ready).phase,'failed');assert.equal(f.pending[0].node.isConnected,false);
  assert.equal(f.win.bootValue,undefined);assert.equal(f.state.writeAllowed,false);
});

test('module resource failure and module execution failure stop the dependency sequence',async()=>{
  for(const mode of ['resource','execution']){
    const f=fixture();f.loader.start();await tick();
    mode==='resource'?f.pending[0].fail():f.pending[0].load('throw Error("post module threw")');
    assert.equal((await f.loader.ready).phase,'failed');assert.equal(f.pending.length,1);assert.equal(f.win.bootValue,undefined);assert.equal(f.state.writeAllowed,false);
  }
});

test('close before decode fences existing storage, waits for physical drain and reports only unverified',async()=>{
  const preparation=deferred(),fence=deferred(),f=fixture({prepare:()=>preparation.promise,fence:fence.promise});
  f.loader.start();f.close();assert.equal((await f.loader.ready).phase,'cancelled');assert.equal(f.win.__alivePersistenceClosing,true);
  assert.equal(f.fenceCount(),1);assert.equal(f.receipts.length,0);
  preparation.resolve(primary());await tick();assert.equal(f.win.alivePrimaryPolicyBootstrap,undefined);assert.equal(f.win.mainRuns,undefined);
  fence.resolve({settled:true});await tick();assert.equal(f.receipts.length,1);assert.equal(f.receipts[0].requestId,'close-1');assert.equal(f.receipts[0].ownerId,'startup-owner');
  assert.deepEqual(f.receipts[0].result,{status:'unverified',persistenceVerified:false,settled:true,error:'Closed before startup completed; no final model snapshot was saved'});
  f.close();await tick();assert.equal(f.receipts.length,1,'duplicate close requests do not repeat drain or acknowledgement');
});

test('close during postloading cancels the pending script and drains autosave without resuming',async()=>{
  const drain=deferred(),f=fixture({closeDrain:drain.promise});f.loader.start();await tick();
  for(let i=0;i<8;i++){f.pending[i].load();await tick();}
  const lateLoad=f.pending[8].node.onload;f.close();assert.equal((await f.loader.ready).phase,'cancelled');
  assert.equal(f.pending[8].node.isConnected,false);assert.equal(f.events.includes('drain:startup-close'),true);assert.equal(f.fenceCount(),0);
  assert.notEqual(f.pending[8].node.ownerDocument,f.doc);
  f.pending[8].load('window.latePostModuleRan=true;');assert.equal(f.win.latePostModuleRan,undefined);
  assert.equal(f.events.includes('retired-script-skipped'),true);
  lateLoad();await tick();assert.equal(f.win.bootValue,undefined);assert.equal(f.events.includes('resume'),false);assert.equal(f.receipts.length,0);
  drain.resolve({settled:true});await tick();assert.equal(f.receipts[0].result.persistenceVerified,false);assert.equal(f.receipts[0].result.settled,true);
});

test('fixture permits execution of detached prepared scripts, so removal alone cannot satisfy cancellation',async()=>{
  const f=fixture();f.loader.start();await tick();
  f.pending[0].node.remove();f.pending[0].load('window.detachedScriptRan=true;');
  assert.equal(f.win.detachedScriptRan,true);await tick();f.loader.cancel();
  assert.equal((await f.loader.ready).phase,'cancelled');
});

test('failed script retirement is explicit and cannot claim successful early-close settlement',async()=>{
  const f=fixture({adoptFailure:true});f.loader.start();await tick();f.close();await tick();
  assert.equal(f.receipts[0].result.status,'unverified');assert.equal(f.receipts[0].result.persistenceVerified,false);
  assert.equal(f.receipts[0].result.settled,false);assert.match(f.receipts[0].result.error,/retirement failed/);
  assert.match(f.loader.snapshot().retirementError,/Adoption failed/);assert.equal(f.state.writeAllowed,false);
});

test('close while initial autosave drain is pending cannot reopen admission when its old result arrives',async()=>{
  const initial=deferred(),f=fixture({initialDrain:initial.promise});f.loader.start();await f.loadAll();
  assert.equal(f.loader.snapshot().phase,'autosave-drain');assert.equal(f.doc.body.inert,true);f.close();
  initial.resolve({settled:true});await tick();assert.equal((await f.loader.ready).phase,'cancelled');assert.equal(f.events.includes('resume'),false);
  assert.equal(f.events.includes('request:startup-ready'),false);assert.equal(f.win.bootValue,undefined);
});

test('missing or failed autosave barriers keep canonical writes blocked and never invoke boot',async()=>{
  for(const options of [{noAutosave:true},{initialDrain:Promise.resolve({settled:false})},{resumeResult:false}]){
    const f=fixture(options);f.loader.start();await f.loadAll();assert.equal((await f.loader.ready).phase,'failed');
    assert.equal(f.win.bootValue,undefined);assert.equal(f.state.writeAllowed,false);assert.equal(f.loader.ownsClose(),true);
  }
});

test('failed early storage drainage is reported unverified without inventing a persisted receipt',async()=>{
  const f=fixture({prepare:()=>new Promise(()=>{}),fence:Promise.resolve({settled:false,error:'Disk fence failed'})});f.loader.start();f.close();await tick();
  assert.equal(f.receipts[0].result.status,'unverified');assert.equal(f.receipts[0].result.persistenceVerified,false);assert.equal(f.receipts[0].result.settled,false);
  assert.match(f.receipts[0].result.error,/Disk fence failed/);assert.equal(f.loader.snapshot().close.acknowledged,true);
});

test('normal close owns the interval after dependency handoff while boot is awaiting',async()=>{
  const bootWait=deferred(),f=fixture({main:'window.__aliveStartupRegister(()=>window.bootWait);'});f.win.bootWait=bootWait.promise;
  f.loader.start();await f.loadAll();assert.equal(f.loader.snapshot().phase,'booting');assert.equal(f.loader.ownsClose(),false);assert.equal(f.closeListeners.size,0);
  f.win.__alivePersistenceClosing=true;bootWait.resolve();assert.equal((await f.loader.ready).phase,'cancelled');assert.equal(f.receipts.length,0);
});
