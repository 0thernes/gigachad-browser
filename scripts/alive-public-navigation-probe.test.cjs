'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {normalizeURL}=require('../systems/alive-research-policy.js');
const {GLOBAL_NAME,GUARD,COMPLETE,ERROR,adaptSmokeSource,createPublicRequestGate,correlateConfirmedArrivals,researchTensorEvidence,capturePauseDiagnostics,assessPauseEvidence,assessPanelReservation}=require('./alive-public-navigation-probe.cjs');
const provider="const fetch = (...args) => SMOKE ? Promise.reject(new Error('Network providers are disabled in isolated smoke mode.')) : globalThis.fetch(...args);";
const source=provider+'\n'+GUARD+'\n'+COMPLETE+'\n'+ERROR;
const request=(url='https://en.wikipedia.org/wiki/Artificial_life',method='GET',id=1)=>({id,url,method,webContentsId:4,resourceType:'mainFrame'});

test('actual main source adapts exactly once and retains production guards',()=>{
  const main=fs.readFileSync(path.join(__dirname,'../main.js'),'utf8');
  const adapted=adaptSmokeSource(main);
  new vm.Script(adapted.source);
  assert.equal(adapted.evidence.guardMatches,1);
  for(const unchanged of ["if (isOnionUrl(details.url))",'if (isTrackerUrl(urlLower, FILTERS.block, FILTERS.allow))',"Network providers are disabled in isolated smoke mode.","session.defaultSession.webRequest.onBeforeRequest"])assert.ok(adapted.source.includes(unchanged));
  assert.equal(adapted.source.split(`!globalThis.${GLOBAL_NAME}?.allow(details)`).length,2);
});

test('missing or duplicate source adaptation anchors fail closed',()=>{
  for(const anchor of [GUARD,COMPLETE,ERROR]){
    assert.throws(()=>adaptSmokeSource(source.replace(anchor,'')),/exactly one/);
    assert.throws(()=>adaptSmokeSource(source+'\n'+anchor),/exactly one/);
  }
  assert.throws(()=>adaptSmokeSource(source.replace(provider,'')),/provider-fetch/);
  assert.throws(()=>adaptSmokeSource(adaptSmokeSource(source).source),/exactly one/);
});

test('adaptation wraps existing completion/error callbacks without replacing their effects',()=>{
  const callbacks={},calls=[];
  const adapted=adaptSmokeSource(source).source;
  const hooks=adapted.slice(adapted.indexOf('vaultSession.webRequest.onCompleted'));
  const context={vaultSession:{webRequest:{onCompleted(fn){callbacks.complete=fn;},onErrorOccurred(fn){callbacks.error=fn;}}},
    deepWebNavigation:{complete(...args){calls.push(['production',...args]);}},
    [GLOBAL_NAME]:{complete(...args){calls.push(['probe',...args]);}}};
  vm.runInNewContext(hooks,context);
  const ok={id:1},failed={id:2,error:'net::ERR_BLOCKED_BY_CLIENT'};
  callbacks.complete(ok);callbacks.error(failed);
  assert.deepEqual(calls,[['production',ok],['probe',ok],['production',failed,failed.error],['probe',failed,failed.error]]);
});

test('guest guard retains the owned local path and cancels absent/closed public gates',()=>{
  const statement=adaptSmokeSource(source).source.split('\n')[1];
  const evaluate=(owned,gate)=>{let cancelled=false;vm.runInNewContext('(function(){'+statement+'})()',{
    ownedLocalAsset:owned,details:request(),callback(result){cancelled=result.cancel;},[GLOBAL_NAME]:gate});return cancelled;};
  assert.equal(evaluate(true,undefined),false);
  assert.equal(evaluate(false,undefined),true);
  assert.equal(evaluate(false,{allow:()=>false}),true);
  assert.equal(evaluate(false,{allow:()=>true}),false);
});

test('actual public policy plus exact GET/HEAD methods controls admission',()=>{
  const gate=createPublicRequestGate({normalizeURL});gate.open(1000);
  assert.equal(gate.allow(request()),true);
  assert.equal(gate.allow(request('https://www.example.org/article','HEAD',2)),true);
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS','CONNECT','get',''])assert.equal(gate.allow(request('https://www.example.org/article',method,3)),false,method);
  for(const url of ['http://127.0.0.1/a','http://localhost/a','http://10.0.0.1/a','http://192.168.1.1/a','http://169.254.169.254/a','http://[::1]/a','https://user:password@example.org/a','https://example.org:8443/a','ws://example.org/a','file:///test','data:text/plain,test','https://'+'a'.repeat(56)+'.onion/'])assert.equal(gate.allow(request(url,'GET',4)),false,url);
  assert.ok(!JSON.stringify(gate.snapshot()).includes('user:password'));
});

test('network admission is closed before, after and at the bounded deadline',()=>{
  let time=100;
  const gate=createPublicRequestGate({normalizeURL,now:()=>time,wallNow:()=>10000+time});
  assert.equal(gate.allow(request()),false);
  gate.open(50);assert.equal(gate.allow(request()),true);
  time=150;assert.equal(gate.allow(request()),false);assert.equal(gate.snapshot().enabled,false);
  assert.throws(()=>gate.open(50),/only once/);
  const second=createPublicRequestGate({normalizeURL,now:()=>time});second.open(50);second.close();assert.equal(second.allow(request()),false);
  assert.throws(()=>createPublicRequestGate({normalizeURL}).open(120001),/bounded/);
});

test('mainFrame network success requires admitted response status and preserves errors',()=>{
  const gate=createPublicRequestGate({normalizeURL});gate.open(1000);
  gate.complete({...request(),statusCode:200});assert.equal(gate.snapshot().mainFrames.length,0);
  gate.allow(request());gate.complete({...request(),statusCode:200});
  gate.allow(request('https://example.org/next','GET',2));gate.complete({...request('https://example.org/next','GET',2),statusCode:200},'net::ERR_ABORTED');
  gate.allow(request('https://example.org/error','GET',3));gate.complete({...request('https://example.org/error','GET',3),statusCode:503});
  gate.allow(request('https://example.org/cached','GET',4));gate.complete({...request('https://example.org/cached','GET',4),statusCode:200,fromCache:true});
  assert.deepEqual(gate.snapshot().mainFrames.map(x=>x.networkVerified),[true,false,false,false]);
  assert.equal(gate.snapshot().mainFrames.at(-1).fromCache,true);
});

test('decision and critical mainFrame histories stay bounded',()=>{
  const gate=createPublicRequestGate({normalizeURL,limit:2});gate.open(1000);
  for(let id=0;id<8;id++)gate.allow(request('https://example.org/'+id,'POST',id));
  const snapshot=gate.snapshot();assert.equal(snapshot.decisions.length,2);assert.equal(snapshot.counters.droppedDecisions,6);assert.equal(snapshot.blockedMainFrames.length,8);
});

test('confirmed arrivals require all independent evidence and exclude the seed and duplicate dispatch',()=>{
  const dispatch={key:'d1',tabId:'t1',url:'https://example.org/choice',wallAt:200};
  const arrival={tabId:'t1',webContentsId:4,wallAt:400,guestReadAt:410,authorityCurrent:true,guestReadCurrent:true,learning:{updates:1},decision:{url:dispatch.url},guest:{url:'https://example.org/arrived',title:'Actual document'}};
  const phase={autonomousEnabledAt:100,dispatches:[dispatch],arrivals:[arrival,{...arrival}]};
  const network={mainFrames:[{webContentsId:4,url:arrival.guest.url,networkVerified:true,completedAt:390}],commits:[{webContentsId:4,url:arrival.guest.url,wallAt:395}]};
  assert.equal(correlateConfirmedArrivals(phase,network,normalizeURL).length,1);
  for(const change of [{authorityCurrent:false},{guestReadCurrent:false},{learning:{updates:NaN}},{webContentsId:9}])assert.equal(correlateConfirmedArrivals({...phase,arrivals:[{...arrival,...change}]},network,normalizeURL).length,0);
  assert.equal(correlateConfirmedArrivals({...phase,autonomousEnabledAt:300},network,normalizeURL).length,0);
  assert.equal(correlateConfirmedArrivals(phase,{...network,commits:[]},normalizeURL).length,0);
  assert.equal(correlateConfirmedArrivals(phase,{...network,mainFrames:[{...network.mainFrames[0],networkVerified:false}]},normalizeURL).length,0);
});

test('learning evidence requires finite actual tensor shapes and changes beyond counters',()=>{
  const dimensions={input:2,hidden:3,output:1};
  const before={inputWeights:{length:6,sum:1,squared:2,nonFinite:0},hiddenBias:{length:3,sum:0,squared:0,nonFinite:0},outputWeights:{length:3,sum:1,squared:1,nonFinite:0},outputBias:{length:1,sum:0,squared:0,nonFinite:0},counters:{length:4,sum:0,squared:0,nonFinite:0}};
  const counterOnly=structuredClone(before);counterOnly.counters.sum=3;
  assert.deepEqual(researchTensorEvidence(before,counterOnly,dimensions).changedTensors,[]);
  const trained=structuredClone(counterOnly);trained.hiddenBias.squared=.01;
  assert.equal(researchTensorEvidence(before,trained,dimensions).finiteShapes,true);
  assert.deepEqual(researchTensorEvidence(before,trained,dimensions).changedTensors,['hiddenBias']);
  trained.inputWeights.length=5;assert.equal(researchTensorEvidence(before,trained,dimensions).finiteShapes,false);
  trained.inputWeights.length=6;trained.outputBias.sum=NaN;assert.equal(researchTensorEvidence(before,trained,dimensions).finiteShapes,false);
  assert.equal(researchTensorEvidence({},trained,dimensions).finiteShapes,false);
});

function pausedEvidence() {
  const tokens=Array.from({length:4},(_,i)=>({sessionId:'s',epoch:7,revision:20,tabId:'t'+i,documentGeneration:2,documentNonce:'n'+i,kind:i===3?'primary':'auxiliary',permitId:''}));
  return {coordinatorRunning:false,rawSettled:true,prePause:{tokens,truncated:false},
    authority:{revision:21,paused:true,transitioning:false,manuals:0,leases:[],cleanup:{revision:21,status:'completed',attempt:1,maxAttempts:3,nextRetryAt:null,unresolved:[],rawDrained:true,
      revoked:tokens.map(t=>({...t,revision:21,acknowledged:true}))}},
    guests:tokens.map(token=>({token,status:'observed',authorityPresent:true,persistentCurrent:false,documentNonce:token.documentNonce,identityAfter:{generation:2,available:true,connected:true}}))};
}

test('strict pause proves all four old guest tokens rejected after explicit cleanup',()=>{
  const proof=assessPauseEvidence(pausedEvidence());assert.equal(proof.ok,true);assert.equal(proof.tokenChecks.length,4);
});

test('fourth bad ACK cannot pass despite paused coordinator, empty leases and idle raw work',()=>{
  const p=pausedEvidence();p.authority.cleanup.status='blocked';p.authority.cleanup.attempt=3;
  p.authority.cleanup.revoked.pop();p.authority.cleanup.unresolved=[{...p.prePause.tokens[3],reason:'Acknowledgement unavailable'}];
  assert.equal(assessPauseEvidence(p).ok,false);
  assert.match(assessPauseEvidence(p).reasons.join('; '),/Explicit all-known/);
});

test('missing, pending, stale, undrained or unresolved cleanup cannot pass',()=>{
  for(const mutate of [p=>delete p.authority.cleanup,p=>p.authority.cleanup.status='pending',p=>p.authority.cleanup.revision--,
    p=>p.authority.cleanup.rawDrained=false,p=>p.authority.cleanup.unresolved.push({tabId:'t3'}),p=>p.authority.transitioning=true,
    p=>p.authority.manuals=1,p=>p.rawSettled=false]){
    const p=pausedEvidence();mutate(p);assert.equal(assessPauseEvidence(p).ok,false);
  }
});

test('unknown, missing and still-current guest readbacks never count as successful cleanup',()=>{
  for(const mutate of [p=>p.guests[3].status='unknown',p=>p.guests.pop(),p=>p.guests[3].persistentCurrent=true,
    p=>p.guests[3].authorityPresent=false,p=>p.guests[3].documentNonce=null,p=>p.guests[3].identityAfter.available=false,
    p=>p.guests[3].identityAfter.generation=1,p=>p.prePause.truncated=true]){
    const p=pausedEvidence();mutate(p);assert.equal(assessPauseEvidence(p).ok,false);
  }
});

test('fresh-document cleanup can prove old token rejection while retaining nonce continuity',()=>{
  const p=pausedEvidence();p.guests[3].documentNonce='new-nonce';p.guests[3].identityAfter.generation=3;
  Object.assign(p.authority.cleanup.revoked[3],{previousDocumentNonce:'n3',documentNonce:'new-nonce',freshProbeAcknowledged:true});
  assert.equal(assessPauseEvidence(p).ok,true);
});

test('serialized pause waits through retry delay with transitioning false and never resets attempts',async()=>{
  let now=0,stops=0,paused=false;
  const token=pausedEvidence().prePause.tokens[0];
  const state=()=>({revision:21,paused,transitioning:false,manuals:0,leases:paused?[]:[token],
    cleanup:{revision:21,status:now>=6000?'completed':'pending',attempt:now>=6000?3:1,maxAttempts:3,nextRetryAt:6000,unresolved:now>=6000?[]:[{tabId:token.tabId}],rawDrained:now>=6000,revoked:[]}});
  const controller={running:true};
  const context={window:{aliveAuthority:{snapshot:state},aliveOverdrive:controller,AliveGuestExecution:{documentIdentity:()=>({generation:2,available:true,connected:true}),waitForIdle:async()=>true}},
    tabs:[{id:token.tabId,wv:{executeJavaScript:async script=>{assert.ok(script.includes('.current('));return {authorityPresent:true,documentNonce:token.documentNonce,persistentCurrent:false};}}}],
    stopAlienBrainAutonomy(){stops++;paused=true;controller.running=false;},performance:{now:()=>now},setTimeout(fn,ms){if(ms===1500)return 1;now+=ms;queueMicrotask(fn);return 1;}};
  const capture=vm.runInNewContext('('+capturePauseDiagnostics.toString()+')',context);
  const result=await capture();assert.equal(stops,1);assert.ok(result.cleanupWaitEndedAt>=6000);assert.equal(result.cleanupWaitDeadlineReached,false);
  assert.equal(assessPauseEvidence(result).ok,true);
  const final=await capture({carryTokens:result.prePause.tokens,requestPause:false});assert.equal(stops,1);assert.equal(final.pauseIssued,false);assert.equal(assessPauseEvidence(final).ok,true);
  await capture();assert.equal(stops,1,'Already-paused state must not reset bounded cleanup attempts');
});

const rect=(x,width,extra={})=>({x,y:40,width,height:600,display:'block',visibility:'visible',opacity:'1',...extra});
test('Controls, Inspect and Logs require visible nonoverlapping reserved page space',()=>{
  for(const [panel,key] of [['controls','controls'],['inspect','inspector'],['logs','logs']]){
    const layout={viewport:{width:1440,height:900},page:rect(320,1120),[key]:rect(0,320)};
    assert.equal(assessPanelReservation(panel,layout).ok,true);
    for(const changed of [{...layout,page:rect(0,1440)},{...layout,[key]:rect(0,320,{display:'none'})},{...layout,page:rect(320,0)},{...layout,[key]:undefined}])assert.equal(assessPanelReservation(panel,changed).ok,false);
  }
});

// Minimal regression from strict-public-installed35-20261108: the native guest
// committed generation 3 before Pause, while owner still described generation 2.
function retiredDocumentEvidence() {
  const tabId='tab_1794203731243_eq0v';
  const token={sessionId:'14ff2d19-73bd-4d6d-8e97-6398d0c28bac',epoch:19,revision:29,tabId,documentGeneration:2,documentNonce:'a9db3a95-4729-48d9-879c-7d635e11ee50',kind:'primary',permitId:''};
  const identity={guestId:6,generation:3,available:true,connected:true};
  return {coordinatorRunning:false,rawSettled:true,
    prePause:{tokens:[token],identities:[{tabId,identity:{...identity}}],truncated:false},
    guests:[{token,tabId,status:'unknown',authorityPresent:false,documentNonce:null,persistentCurrent:null,identity:{...identity},identityAfter:{...identity}}],
    authority:{revision:31,paused:true,transitioning:false,manuals:0,leases:[],cleanup:{revision:31,status:'completed',attempt:1,maxAttempts:3,nextRetryAt:null,unresolved:[],rawDrained:true,
      revoked:[{tabId:'auxiliary-1',acknowledged:true},{tabId:'auxiliary-2',acknowledged:true},{tabId:'auxiliary-3',acknowledged:true}]}}};
}

test('recorded stale-owner case passes only by proven same-guest native document retirement',()=>{
  const proof=assessPauseEvidence(retiredDocumentEvidence());
  assert.equal(proof.ok,true);assert.equal(proof.tokenChecks[0].proof,'native-document-retired');
  assert.deepEqual(proof.tokenChecks[0].nativeRetirement,{guestId:6,tokenGeneration:2,prePauseGeneration:3,observedGeneration:3});
  assert.equal(proof.tokenChecks[0].persistentCurrent,null,'Do not invent a guest token-rejection readback');
});

test('same-generation missing API and ambiguous native identities cannot establish retirement',()=>{
  for(const mutate of [
    p=>{p.guests[0].identity.generation=2;p.guests[0].identityAfter.generation=2;p.prePause.identities[0].identity.generation=2;},
    p=>p.prePause.identities=[],p=>p.prePause.identities.push(structuredClone(p.prePause.identities[0])),
    p=>p.prePause.identities[0].tabId='different-tab',p=>p.guests[0].tabId='different-tab',
    p=>p.guests[0].identityAfter.guestId=7,p=>p.guests[0].identity.guestId=7,p=>p.prePause.identities[0].identity.guestId=7,
    p=>p.guests[0].identityAfter.available=false,p=>p.prePause.identities[0].identity.connected=null,
    p=>delete p.guests[0].identityAfter,p=>p.guests[0].identityAfter.generation=4,
    p=>p.guests[0].persistentCurrent=true,p=>p.authority.cleanup.status='blocked',
    p=>p.authority.cleanup.unresolved=[{tabId:'auxiliary-3'}],p=>p.rawSettled=false
  ]) {const p=retiredDocumentEvidence();mutate(p);assert.equal(assessPauseEvidence(p).ok,false);}
});

test('actual executor retains old document on load start/failure/in-page navigation; only native commit retires it',async()=>{
  const {createExecutor}=require('../systems/alive-guest-execution.js');
  const executor=createExecutor(),events=new Map();
  let finish;
  const webview={isConnected:true,executeJavaScript:()=>new Promise(resolve=>{finish=resolve;}),
    addEventListener(name,fn){events.set(name,fn);},getURL:()=> 'https://example.org/retirement-fixture',getWebContentsId:()=>17};
  const pending=executor.run(webview,'new Promise(() => {})',{authority:false,timeoutMs:10000});
  const before=executor.documentIdentity(webview),p=retiredDocumentEvidence();
  p.prePause.tokens[0].documentGeneration=before.generation;
  p.prePause.identities[0].identity={...before};
  for(const event of ['did-start-loading','did-start-navigation','did-fail-load','did-navigate-in-page']) {
    events.get(event)?.({isMainFrame:true,errorCode:-105});
    p.guests[0].identity=executor.documentIdentity(webview);p.guests[0].identityAfter=executor.documentIdentity(webview);
    assert.equal(assessPauseEvidence(p).ok,false,event+' cannot prove document replacement');
    assert.equal(executor.pendingCount(),1);assert.equal(p.guests[0].identityAfter.generation,before.generation);
  }
  assert.equal(executor.retire(webview),false,'A connected guest cannot be retired');
  events.get('did-navigate')({isMainFrame:true});
  p.guests[0].identity=executor.documentIdentity(webview);p.guests[0].identityAfter=executor.documentIdentity(webview);
  assert.equal(await pending,null);assert.equal(executor.pendingCount(),0);
  assert.equal(assessPauseEvidence(p).ok,true);assert.equal(executor.lifecycleSnapshot().at(-1).reason,'document-replaced');
  finish(null);
});
