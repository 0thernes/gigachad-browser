'use strict';

// An isolated, actual-Electron integration probe. The application's smoke boot
// supplies a temporary profile and blocks provider calls. Its legacy one-shot
// smoke runner alone is omitted in memory so this longer probe can own teardown.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(process.env.GIGACHAD_PROBE_OUTPUT || path.join(root, 'research_notes', 'alive-overdrive-verification'));
const autosaveStages = process.env.GIGACHAD_PROBE_AUTOSAVE_STAGES === '1';
const durationMs = Math.max(3000, Math.min(120000, Number(process.env.GIGACHAD_PROBE_MS) || (autosaveStages ? 20000 : 12000)));
const minimal = process.env.GIGACHAD_PROBE_MINIMAL === '1';
const inputIsolation = process.env.GIGACHAD_PROBE_INPUT_ISOLATION === '1';
const authorityChecks = process.env.GIGACHAD_PROBE_AUTHORITY === '1';
const navigationCacheChecks = process.env.GIGACHAD_PROBE_NAVIGATION_CACHE === '1';
const splitHabitatChecks = process.env.GIGACHAD_PROBE_SPLIT_HABITAT === '1';
const specialistFusionChecks = process.env.GIGACHAD_PROBE_SPECIALIST_FUSION === '1';
const publicNavigation = process.env.GIGACHAD_PROBE_PUBLIC_NAVIGATION === '1';
const publicDurationMs=Math.max(90000,Math.min(120000,Number(process.env.GIGACHAD_PROBE_PUBLIC_MS)||105000));
const publicNavigationSupport=require('./alive-public-navigation-probe.cjs');
const {assessSpecialistFusion}=require('./alive-specialist-fusion-evidence.cjs');
const {navigationCacheExpression}=require('./alive-navigation-cache-probe.cjs');
const {splitHabitatExpression,assessSplitHabitat}=require('./alive-split-habitat-probe.cjs');
const {readRecord:readDurableGenomeRecord}=require('./alive-genome-durable-evidence.cjs');
const nativeCloseTrace = process.env.GIGACHAD_PROBE_NATIVE_CLOSE_TRACE === '1' || autosaveStages;
const verifyWorker = process.env.GIGACHAD_PROBE_VERIFY_WORKER==='1'||process.env.GIGACHAD_PROBE_AUTONOMOUS==='1';
const verifyTrainer = process.env.GIGACHAD_PROBE_APP_WORKER === '1';
const traceCategories=['toplevel','devtools.timeline','blink','cc','gpu','viz','renderer.scheduler'];
function readArchiveProvenance() {
  const suppliedPath=process.env.GIGACHAD_PROBE_ARCHIVE_PROVENANCE;
  if(!suppliedPath)return null;
  const metadataPath=path.resolve(suppliedPath);
  const bytes=fs.readFileSync(metadataPath);
  return {metadataPath,metadataSha256:require('node:crypto').createHash('sha256').update(bytes).digest('hex'),record:JSON.parse(bytes.toString('utf8'))};
}
if (autosaveStages && (minimal || process.env.GIGACHAD_PROBE_FIXTURE !== '1')) throw new Error('Autosave stage timing requires the actual application and isolated offline fixture');
if (autosaveStages && ['SWEEP','PROFILE','FRAMEPROFILE','TRACE','AUTONOMOUS'].some(name => process.env['GIGACHAD_PROBE_' + name] === '1')) throw new Error('Autosave stage timing requires natural saves without a manual sweep, other profilers, or the full autonomous-coverage assertion');
if(inputIsolation&&(minimal||process.env.GIGACHAD_PROBE_FIXTURE!=='1'||process.env.GIGACHAD_PROBE_VISIBLE!=='1'||process.env.GIGACHAD_PROBE_FOCUS==='1'))throw new Error('Input isolation requires the visible isolated application fixture with focus disabled');
if(authorityChecks&&(minimal||process.env.GIGACHAD_PROBE_FIXTURE!=='1'))throw new Error('Authority verification requires actual isolated offline fixture guests');
if(navigationCacheChecks&&(minimal||process.env.GIGACHAD_PROBE_FIXTURE!=='1'))throw new Error('Navigation cache verification requires actual isolated offline fixture guests');
if(splitHabitatChecks&&(minimal||process.env.GIGACHAD_PROBE_FIXTURE!=='1'))throw new Error('Split habitat verification requires actual isolated offline fixture guests');
if(publicNavigation&&minimal)throw new Error('Public navigation verification requires the actual isolated application');

// Executed in the actual host after all performance, pause, restore and panel
// checks. Every test write is guarded production execution on owned fixtures.
// Direct guest execution below is restricted to tiny read-only diagnostics,
// except the deliberate stale-token test wrapped by production guardedScript.
async function verifyActualGuestAuthority(fixtureUrls) {
  const began=performance.now(), api=window.aliveAuthority, executor=window.AliveGuestExecution;
  const controller=window.aliveOverdrive, marker='__aliveAuthorityProbe_'+Math.random().toString(36).slice(2);
  const allowed=fixtureUrls.map(url=>url.split('#')[0]);
  const result={requested:true,phase:'after-performance-pause-restore-and-panels',startedAt:began,cases:[],
    apiContract:{authority:['select','grant','leaseFor','isCurrent','setPaused','withManualLease','snapshot'],
      executor:['run','documentIdentity','waitForIdle'],host:['startAliveOverdrive','selectAliveGuest','stopAlienBrainAutonomy'],
      runOptions:['authorityToken','tag','timeoutMs'],guest:['current','guard','onRevoke']},
    scope:'Actual production authority/executor and actual offline fixture guests; no distributed fencing claim'};
  const expected=['selected-tab-ack','auxiliary-grant','retained-callback-revoked','stale-token-rejected','a-b-a-delayed-result','same-url-document-replacement','paused-manual-permit'];
  const originalTabId=getActiveTab()?.id, created=[];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const copy=value=>value?JSON.parse(JSON.stringify(value)):null;
  const markCode=`const key=${JSON.stringify(marker)};const state=window[key]||(window[key]={ticks:0,revocations:0,auxWrites:0,hostStaleWrites:0,guestStaleWrites:0,delayedStarted:0,reloadStarted:0,manualWrites:0,manualPersistent:0});`;
  const fixtureScript=body=>`(() => {if(!${JSON.stringify(allowed)}.includes(location.href.split('#')[0]))return {probeRefused:true};${body}})()`;
  function requireFixture(tab) {
    if(!tab?.wv||!allowed.includes(String(safeGetUrl(tab)).split('#')[0]))throw new Error('Authority probe refused a non-fixture guest');
  }
  async function read(tab, expression) {
    requireFixture(tab);
    return Promise.race([tab.wv.executeJavaScript(expression),sleep(1000).then(()=>{throw new Error('Read-only guest diagnostic timed out');})]);
  }
  const markerState=tab=>read(tab,`(() => {const s=window[${JSON.stringify(marker)}];return s?{ticks:s.ticks,revocations:s.revocations,auxWrites:s.auxWrites,hostStaleWrites:s.hostStaleWrites,guestStaleWrites:s.guestStaleWrites,delayedStarted:s.delayedStarted,reloadStarted:s.reloadStarted,manualWrites:s.manualWrites,manualPersistent:s.manualPersistent}:null;})()`);
  async function waitUntil(predicate, label, timeout=5000) {
    const deadline=performance.now()+timeout;
    while(performance.now()<deadline){if(await predicate())return;await sleep(25);}
    throw new Error('Timed out: '+label);
  }
  function record(id, passed, evidence) {
    result.cases.push({id,passed:Boolean(passed),at:performance.now(),evidence});
    if(!passed)throw new Error('Authority assertion failed: '+id);
  }
  async function pause() {
    stopAlienBrainAutonomy();
    await waitUntil(()=>!controller.running&&api.snapshot().paused&&!api.snapshot().transitioning,'pause revocation acknowledgement');
    if(!await executor.waitForIdle(null,{timeoutMs:3000}))throw new Error('Raw guest executions did not drain after pause');
  }
  async function select(tab, reason) {
    requireFixture(tab);switchTab(tab.id);
    const outcome=await window.selectAliveGuest(tab.id,{reason});
    await waitUntil(()=>!api.snapshot().transitioning&&!!api.leaseFor(tab.id),'selected guest lease');
    return outcome;
  }
  async function run(tab, body, token, tag) {
    requireFixture(tab);
    return executor.run(tab.wv,fixtureScript(body),{authorityToken:token,tag:'probe-authority-'+tag,timeoutMs:1800});
  }
  try {
    for(const [object,names] of [[api,result.apiContract.authority],[executor,result.apiContract.executor]])
      if(!object||names.some(name=>typeof object[name]!=='function'))throw new Error('Production authority API contract unavailable');
    if(typeof window.startAliveOverdrive!=='function'||typeof window.selectAliveGuest!=='function'||typeof stopAlienBrainAutonomy!=='function'||typeof window.AliveAuthority?.guardedScript!=='function')throw new Error('Production authority host integration unavailable');
    result.before={authority:api.snapshot(),coordinator:controller.snapshot().running};
    await pause();window.alienAutoNavigateLinks=false;
    let a=tabs.find(tab=>tab.domReady&&String(safeGetUrl(tab)).split('#')[0]===allowed[0]);
    if(!a){a=createTab(allowed[0],{title:'Authority fixture A'});created.push(a.id);await ensureTabDomReady(a,5000);}
    let b=tabs.find(tab=>tab.id!==a.id&&tab.domReady&&String(safeGetUrl(tab)).split('#')[0]===allowed[1]);
    if(!b){b=createTab(allowed[1],{title:'Authority fixture B'});created.push(b.id);await ensureTabDomReady(b,5000);}
    requireFixture(a);requireFixture(b);switchTab(a.id);window.startAliveOverdrive();
    const selected=await select(a,'probe-selected-tab');
    const first=copy(api.leaseFor(a.id));
    const guestAck=await read(a,`({current:window.__aliveAuthority?.current(${JSON.stringify(first)})===true,documentNonce:window.__aliveAuthority?.documentNonce})`);
    record('selected-tab-ack',selected.status==='completed'&&selected.evidence?.destinationAcknowledged===true&&first?.tabId===a.id&&getActiveTab()?.id===a.id&&guestAck.current&&guestAck.documentNonce===first.documentNonce,
      {outcome:selected,token:first,guestAck,identity:executor.documentIdentity(a.wv)});

    const primaryBefore=copy(api.leaseFor(a.id));
    const grant=await api.grant(b.id), auxiliary=copy(api.leaseFor(b.id));
    const auxiliaryWrite=await run(b,`${markCode}state.auxWrites++;return {writes:state.auxWrites};`,auxiliary,'auxiliary');
    record('auxiliary-grant',grant.status==='completed'&&grant.evidence?.destinationAcknowledged===true&&auxiliary?.kind==='auxiliary'&&auxiliaryWrite?.writes===1&&getActiveTab()?.id===a.id&&window.AliveAuthority.sameToken(primaryBefore,api.leaseFor(a.id)),
      {grant,token:auxiliary,write:auxiliaryWrite,primaryRetained:copy(api.leaseFor(a.id))});

    const retainedToken=copy(api.leaseFor(a.id));
    const retained=await run(a,`${markCode}const authority=window.__aliveAuthority;const token=authority.executingToken;const timer=setInterval(authority.guard(token,()=>{state.ticks++;}),20);setTimeout(()=>clearInterval(timer),15000);authority.onRevoke(token,()=>{clearInterval(timer);state.revocations++;});return {installed:true};`,retainedToken,'retained');
    await waitUntil(async()=>((await markerState(a))?.ticks||0)>=2,'retained callback ticks');
    await pause();const stopped=await markerState(a);await sleep(180);const later=await markerState(a);
    record('retained-callback-revoked',retained?.installed===true&&stopped.revocations===1&&later.ticks===stopped.ticks&&api.snapshot().paused&&!controller.running&&api.snapshot().leases.length===0,
      {token:retainedToken,stopped,later,authority:api.snapshot()});

    const hostStale=await run(a,`${markCode}state.hostStaleWrites++;return {executed:true};`,retainedToken,'stale-host');
    requireFixture(a);
    const guestStale=await a.wv.executeJavaScript(window.AliveAuthority.guardedScript(fixtureScript(`${markCode}state.guestStaleWrites++;return {executed:true};`),retainedToken));
    const staleState=await markerState(a);
    record('stale-token-rejected',hostStale===null&&guestStale==null&&staleState.hostStaleWrites===0&&staleState.guestStaleWrites===0&&!api.isCurrent(retainedToken),
      {hostResult:hostStale,guestResult:guestStale??null,marker:staleState,oldToken:retainedToken});

    window.startAliveOverdrive();await select(a,'probe-before-aba');
    const abaToken=copy(api.leaseFor(a.id));
    const pendingA=run(a,`${markCode}state.delayedStarted++;return new Promise(resolve=>setTimeout(()=>resolve({probeDelayed:true}),400));`,abaToken,'aba-delayed');
    await waitUntil(async()=>((await markerState(a))?.delayedStarted||0)>0,'delayed A result started');
    switchTab(b.id);const toB=window.selectAliveGuest(b.id,{reason:'probe-a-to-b'});
    await sleep(20);switchTab(a.id);const toA=window.selectAliveGuest(a.id,{reason:'probe-b-to-a'});
    const [delayedA,bOutcome,aOutcome]=await Promise.all([pendingA,toB,toA]);
    await waitUntil(()=>!!api.leaseFor(a.id)&&!api.snapshot().transitioning,'A authority after round trip');
    const returnedToken=copy(api.leaseFor(a.id));
    record('a-b-a-delayed-result',delayedA===null&&aOutcome.status==='completed'&&getActiveTab()?.id===a.id&&returnedToken.documentNonce===abaToken.documentNonce&&returnedToken.revision!==abaToken.revision&&!api.isCurrent(abaToken),
      {result:delayedA,toB:bOutcome,toA:aOutcome,oldToken:abaToken,newToken:returnedToken});

    const replacementToken=copy(api.leaseFor(a.id)), previousIdentity=executor.documentIdentity(a.wv), sameUrl=String(safeGetUrl(a));
    const pendingDocument=run(a,`${markCode}state.reloadStarted++;return new Promise(resolve=>setTimeout(()=>resolve({oldDocument:true}),600));`,replacementToken,'document-delayed');
    await waitUntil(async()=>((await markerState(a))?.reloadStarted||0)>0,'old-document result started');
    requireFixture(a);a.wv.reload();
    await waitUntil(()=>executor.documentIdentity(a.wv).generation>previousIdentity.generation&&a.domReady,'same-URL document commit');
    await ensureTabDomReady(a,5000);const replacement=await select(a,'probe-same-url-document');
    const oldDocument=await pendingDocument,newDocumentToken=copy(api.leaseFor(a.id));
    record('same-url-document-replacement',oldDocument===null&&replacement.status==='completed'&&String(safeGetUrl(a))===sameUrl&&newDocumentToken.documentGeneration>replacementToken.documentGeneration&&newDocumentToken.documentNonce!==replacementToken.documentNonce&&!api.isCurrent(replacementToken),
      {result:oldDocument,urlBefore:sameUrl,urlAfter:String(safeGetUrl(a)),oldToken:replacementToken,newToken:newDocumentToken,outcome:replacement});

    await pause();const manualBefore={authority:api.snapshot(),coordinator:controller.snapshot(),backprop:humunculusRuntime.trainableAlifeNeuralHub?.totalBackpropStepsTrained,simulationTick:humunculusRuntime.simulationTick};
    let manualToken=null;
    const manual=await api.withManualLease(a.id,async token=>{
      manualToken=copy(token);
      return run(a,`${markCode}state.manualWrites++;const guarded=window.__aliveAuthority.guard(window.__aliveAuthority.executingToken,()=>state.manualPersistent++);guarded();setTimeout(guarded,25);return {manualWrites:state.manualWrites};`,token,'manual');
    });
    await sleep(80);
    const manualReuse=await run(a,`${markCode}state.manualWrites++;return {reused:true};`,manualToken,'manual-reuse');
    const manualState=await markerState(a),manualAfter={authority:api.snapshot(),coordinator:controller.snapshot(),backprop:humunculusRuntime.trainableAlifeNeuralHub?.totalBackpropStepsTrained,simulationTick:humunculusRuntime.simulationTick};
    record('paused-manual-permit',manual?.manualWrites===1&&manualReuse===null&&manualState.manualWrites===1&&manualState.manualPersistent===0&&manualToken?.kind==='manual'&&!api.isCurrent(manualToken)&&manualAfter.authority.paused&&manualAfter.authority.manuals===0&&manualAfter.authority.leases.length===0&&!manualAfter.coordinator.running&&manualAfter.coordinator.generation===manualBefore.coordinator.generation&&Number.isFinite(manualAfter.backprop)&&manualAfter.backprop===manualBefore.backprop&&manualAfter.simulationTick===manualBefore.simulationTick,
      {result:manual,reuse:manualReuse,token:manualToken,marker:manualState,before:manualBefore,after:manualAfter});
    result.completed=true;
  } catch(error) {result.error=String(error?.stack||error).slice(0,2400);}
  finally {
    try {
      if(api&&controller){await pause();result.finalAuthority=api.snapshot();result.pendingExecutions=executor.pendingSnapshot?.()||[];}
      const selected=tabs.find(tab=>tab.id===originalTabId&&tab.domReady&&allowed.includes(String(safeGetUrl(tab)).split('#')[0]));
      if(selected)switchTab(selected.id);
      for(const id of created)if(id!==getActiveTab()?.id&&tabs.some(tab=>tab.id===id))closeTab(id);
      result.finalCoordinatorRunning=Boolean(controller?.running);
      result.finalSelectedTabId=getActiveTab()?.id||null;
    } catch(error){result.cleanupError=String(error?.message||error);}
    result.durationMs=performance.now()-began;
    result.missingCases=expected.filter(id=>!result.cases.some(test=>test.id===id));
    result.ok=result.completed===true&&!result.error&&!result.cleanupError&&!result.missingCases.length&&result.cases.every(test=>test.passed)&&result.finalAuthority?.paused===true&&result.finalCoordinatorRunning===false&&!result.pendingExecutions?.length;
  }
  return result;
}

async function verifyOfflineNavigation(fixtureUrls) {
  const controller=window.aliveOverdrive, authority=window.aliveAuthority;
  const allowed=fixtureUrls.map(url=>url.split('#')[0]);
  const report={phase:'after-performance',target:fixtureUrls[1],autoHopWindows:[]};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function waitUntil(predicate,label,timeout=6000) {
    const until=performance.now()+timeout;
    while(performance.now()<until){if(await predicate())return;await sleep(25);}
    throw new Error('Timed out: '+label);
  }
  const job=id=>controller.snapshot().jobs.find(entry=>entry.id===id);
  async function requestJob(id) {
    const before=job(id), requestedAt=performance.now();
    const accepted=controller.request(id);
    report.requests??=[];
    report.requests.push({id,requestedAt,accepted,previousRunCount:before?.runCount,previousStatus:before?.status});
    if(!accepted&&!['running','queued'].includes(before?.status))return job(id);
    await waitUntil(()=>{
      const current=job(id);
      return !['running','queued'].includes(current?.status)&&
        (current?.lastCompletedAt>=requestedAt||current?.runCount>(before?.runCount||0));
    },id+' requested completion',12000);
    return job(id);
  }
  function fixtureTab(tab) {
    if(!tab?.wv||!allowed.includes(String(safeGetUrl(tab)).split('#')[0]))throw new Error('Navigation probe refused a non-fixture source');
    return tab;
  }
  async function narrowlyEnable(id) {
    const record={id,enabledAt:performance.now()};report.autoHopWindows.push(record);
    window.alienAutoNavigateLinks=true;
    try{return await requestJob(id);}
    finally{window.alienAutoNavigateLinks=false;record.disabledAt=performance.now();window.syncAliveGuestState?.();}
  }
  try {
    // Production Stop invalidates observations. Establish an acknowledged current
    // lease and obtain a new actual DOM observation before choosing any door.
    stopAlienBrainAutonomy();window.alienAutoNavigateLinks=false;
    await waitUntil(()=>!controller.running&&(!authority||authority.snapshot().paused&&!authority.snapshot().transitioning),'initial pause');
    if(!await window.AliveGuestExecution.waitForIdle(null,{timeoutMs:3000}))throw new Error('Guest writers did not settle before navigation setup');
    let source=tabs.find(tab=>tab.domReady&&String(safeGetUrl(tab)).split('#')[0]===allowed[0]);
    if(!source){source=createTab(allowed[0],{title:'Offline navigation source'});await ensureTabDomReady(source,5000);}
    let other=tabs.find(tab=>tab.id!==source.id&&tab.domReady&&String(safeGetUrl(tab)).split('#')[0]===allowed[1]);
    if(!other){other=createTab(allowed[1],{title:'Second offline habitat'});await ensureTabDomReady(other,5000);}
    fixtureTab(source);fixtureTab(other);switchTab(source.id);
    report.source=source.id;report.other=other.id;
    window.startAliveOverdrive();
    report.sourceAcknowledgement=authority?await window.selectAliveGuest(source.id,{reason:'probe-offline-navigation'}):null;
    if(authority&&(report.sourceAcknowledgement?.status!=='completed'||!authority.leaseFor(source.id)))throw new Error('Source fixture did not acknowledge current authority');
    report.freshObservation=await requestJob('dom-body');
    const observation=report.freshObservation?.evidence;
    if(report.freshObservation?.status!=='completed'||observation?.url!==safeGetUrl(source)||!(observation?.doors>0)||getActiveTab()?.id!==source.id||authority&&!authority.isCurrent(observation.authority))throw new Error('A fresh current-lease fixture observation was not obtained');
    fixtureTab(source);
    const selectedHref=fixtureUrls[1]+'#topic-0';
    const selected=await source.wv.executeJavaScript(`(() => {if(!${JSON.stringify(allowed)}.includes(location.href.split('#')[0]))return null;const a=Array.from(document.querySelectorAll('a[href]')).find(node=>node.href===${JSON.stringify(selectedHref)});if(!a)return null;const r=a.getBoundingClientRect();return {href:a.href,text:(a.textContent||'').slice(0,120),doorNum:1,x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    if(!selected)throw new Error('Observed fixture door no longer exists in the actual document');
    report.observedDoor=selected;
    report.epochBefore=humunculusRuntime.authorityEpoch;
    if(window.aliveResearch) {
      const acceptedByPublicPolicy=Boolean(window.AliveResearchPolicy?.normalizeURL(selected.href));
      report.scopeBlocked={status:'blocked',acceptedByPublicPolicy,
        reason:acceptedByPublicPolicy?'Research frontier has no confirmed exact-fixture target route; external fallback was not dispatched':'Owned loopback fixture is excluded from public research discovery/protected-page scope; external fallback was not dispatched',
        requires:'A separately approved fixture transport and exact observed-door route using the unchanged production policy'};
      report.portal={id:'portal-jump',status:'blocked',evidence:{reason:report.scopeBlocked.reason}};
      report.handoff={id:'epoch-handoff',status:'blocked',evidence:{reason:'Portal scope preflight did not pass'}};
      return report;
    }
    humunculusRuntime.aliveSelectedDoor=selected;
    // Older adapters have a 15-second page-settling guard. Waiting happens with
    // Auto-Hop off; the selected door is refreshed immediately before dispatch.
    const now=performance.now();if(now<15500)await sleep(15500-now);
    report.freshObservation=await requestJob('dom-body');
    if(report.freshObservation?.status!=='completed'||report.freshObservation.evidence?.url!==safeGetUrl(source)||authority&&!authority.isCurrent(report.freshObservation.evidence?.authority))throw new Error('Fixture observation expired before portal dispatch');
    humunculusRuntime.aliveSelectedDoor=selected;
    report.portal=await narrowlyEnable('portal-jump');
    if(report.portal?.status!=='completed'||!report.portal.evidence?.url?.startsWith(fixtureUrls[1]))throw new Error('Portal did not dispatch the observed offline fixture door');
    await ensureTabDomReady(getActiveTab(),5000);fixtureTab(getActiveTab());
    if(authority){report.destinationAcknowledgement=await window.selectAliveGuest(getActiveTab().id,{reason:'probe-offline-portal-arrived'});if(report.destinationAcknowledgement.status!=='completed')throw new Error('Portal destination did not acknowledge authority');}
    const remaining=15100-(performance.now()-(report.portal.lastStartedAt||0));if(remaining>0)await sleep(remaining);
    fixtureTab(getActiveTab());
    report.handoff=await narrowlyEnable('epoch-handoff');
    report.after={activeTab:activeTabId,epoch:humunculusRuntime.authorityEpoch,url:safeGetUrl(getActiveTab()),ready:getActiveTab()?.domReady};
  } catch(error) {report.error=String(error?.stack||error).slice(0,2000);}
  finally {
    window.alienAutoNavigateLinks=false;stopAlienBrainAutonomy();
    try {
      await waitUntil(()=>!controller.running&&(!authority||authority.snapshot().paused&&!authority.snapshot().transitioning),'final navigation pause');
      report.finalPause={running:controller.running,authority:authority?.snapshot()||null,rawSettled:await window.AliveGuestExecution.waitForIdle(null,{timeoutMs:3000})};
      report.after??={activeTab:activeTabId,epoch:humunculusRuntime.authorityEpoch,url:safeGetUrl(getActiveTab()),ready:getActiveTab()?.domReady};
    }catch(error){report.cleanupError=String(error?.message||error);}
  }
  return report;
}

// Public page text is consumed only by the ordinary production creature. The
// diagnostic retains URLs/titles, decisions, authority and numerical evidence.
async function verifyPublicResearchNavigation({durationMs,seedURL,fixtureUrls=[]},capturePause,assessPause) {
  const started=performance.now(),deadline=started+durationMs;
  const controller=window.aliveOverdrive,authority=window.aliveAuthority,research=window.aliveResearch;
  const report={phase:'public-network-after-all-offline-checks',seedURL,durationLimitMs:durationMs,startedAt:Date.now(),
    dispatches:[],arrivals:[],events:[],samples:[],closedOwnedFixtureTabs:[],maxTabs:tabs.length,providerCoverage:false,torCoverage:false};
  const metrics={raw:[],presented:[],longTasks:[],firstAt:null,lastAt:null,lastFrame:null,active:true};
  const pendingReads=new Set(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const normalized=url=>window.AliveResearchPolicy?.normalizeURL(url);
  let observer,frameId,listener,startedFrame=0;
  const bounded=(array,value,limit=200)=>{if(array.length<limit)array.push(value);};
  const shortResearch=()=>{const s=research.snapshot();return {frontierCount:s.frontierCount,visitedPages:s.visitedPages,visitedDomains:s.visitedDomains,observations:s.observations,modelUpdates:s.modelUpdates,lastReward:s.lastReward,lastLoss:s.lastLoss,pending:s.pending,lastDecision:s.lastDecision,lastReadiness:s.lastReadiness};};
  const weightState=()=>Object.fromEntries(Object.entries(research.model).filter(([,value])=>ArrayBuffer.isView(value)).map(([name,value])=>{
    let sum=0,squared=0,nonFinite=0;for(const x of value){if(Number.isFinite(x)){sum+=x;squared+=x*x;}else nonFinite++;}return [name,{length:value.length,sum,squared,nonFinite}];
  }));
  const pause=label=>capturePause({label});
  async function waitUntil(predicate,label,timeout=20000) {
    const until=Math.min(deadline,performance.now()+timeout);
    while(performance.now()<until){if(await predicate())return;await sleep(50);}
    throw new Error('Public phase unavailable: '+label);
  }
  function frame(now) {
    if(!metrics.active)return;
    if(metrics.firstAt===null)metrics.firstAt=now;
    if(metrics.lastAt!==null&&metrics.raw.length<36000)metrics.raw.push(now-metrics.lastAt);
    metrics.lastAt=now;
    const st=chromeCrawlerState;
    if(metrics.lastFrame!==st.frameCount){const gap=st.presentationIntervals?.at(-1);if(metrics.lastFrame!==null&&Number.isFinite(gap)&&metrics.presented.length<9000)metrics.presented.push(gap);metrics.lastFrame=st.frameCount;}
    frameId=requestAnimationFrame(frame);
  }
  try {
    if(!controller||!authority||!research||!normalized(seedURL)||normalized(seedURL).onion)throw new Error('Required public research/authority APIs or public seed unavailable');
    report.before={research:shortResearch(),weights:weightState(),authority:authority.snapshot()};
    report.initialPause=await pause('before-public-navigation');
    report.initialPauseProof=assessPause(report.initialPause);
    if(!report.initialPauseProof.ok)throw new Error('Prior offline work did not fully revoke and settle: '+report.initialPauseProof.reasons.join('; '));
    const owned=tab=>fixtureUrls.some(url=>String(safeGetUrl(tab)).split('#')[0]===url.split('#')[0])||/\/pages\/newtab\.html(?:[?#]|$)/.test(String(safeGetUrl(tab)));
    if(tabs.length>=4){const removable=tabs.find(owned);if(!removable)throw new Error('No owned fixture tab available within the four-tab cap');report.closedOwnedFixtureTabs.push(removable.id);closeTab(removable.id);}
    const seed=createTab(seedURL,{title:'Public navigation verification'});report.seedTabId=seed.id;
    for(const tab of [...tabs])if(tab.id!==seed.id&&owned(tab)){report.closedOwnedFixtureTabs.push(tab.id);closeTab(tab.id);}
    switchTab(seed.id);
    await waitUntil(()=>seed.domReady&&isWebviewGuestReady(seed.wv)&&Boolean(normalized(safeGetUrl(seed))),'seed document ready');
    window.startAliveOverdrive();
    report.seedAcknowledgement=await window.selectAliveGuest(seed.id,{reason:'probe-public-seed'});
    if(report.seedAcknowledgement.status!=='completed')throw new Error('Public seed authority was not acknowledged');
    const beforeObservation=controller.snapshot().jobs.find(job=>job.id==='dom-body').completedCount;
    controller.request('dom-body');
    await waitUntil(()=>{const j=controller.snapshot().jobs.find(job=>job.id==='dom-body');return j.completedCount>beforeObservation&&j.status==='completed'&&j.evidence?.url===safeGetUrl(seed)&&authority.isCurrent(j.evidence?.authority);},'fresh acknowledged seed observation',10000);
    report.seedObservation=controller.snapshot().jobs.find(job=>job.id==='dom-body');
    report.seedActual=await seed.wv.executeJavaScript('({url:location.href,title:document.title})');
    report.initialArticleExcludedFromArrivalCount=true;
    listener=event=>{
      const detail=event.detail||{},at=performance.now(),wallAt=Date.now();
      if(detail.id==='portal-jump'&&detail.type==='completed') {
        const evidence=detail.evidence||{};
        bounded(report.dispatches,{key:String(at)+':'+String(evidence.tab),at,wallAt,tabId:evidence.tab,url:evidence.url,selection:evidence.selection,reason:evidence.reason,recovery:evidence.recovery,decision:shortResearch().lastDecision},30);
      }
      if(detail.id==='portal-jump'&&detail.type==='arrival-observed') {
        const tab=getActiveTab(),token=authority.leaseFor(tab?.id),decision=shortResearch().lastDecision;
        if(!tab||!token)return;
        let webContentsId=null;try{webContentsId=tab.wv.getWebContentsId();}catch(_){}
        const entry={at,wallAt,tabId:tab.id,webContentsId,token:{...token},authorityCurrent:authority.isCurrent(token),decision,learning:detail.evidence,research:shortResearch()};
        const reading=Promise.race([tab.wv.executeJavaScript('({url:location.href,title:document.title})'),sleep(1500).then(()=>null)]).then(guest=>{
          entry.guest=guest;entry.guestReadAt=Date.now();entry.guestReadCurrent=Boolean(guest&&authority.isCurrent(token)&&getActiveTab()?.id===tab.id&&guest.url===safeGetUrl(tab));bounded(report.arrivals,entry,30);
        }).catch(error=>{entry.readError=String(error?.message||error).slice(0,200);bounded(report.arrivals,entry,30);}).finally(()=>pendingReads.delete(reading));
        pendingReads.add(reading);
      }
      if(['portal-jump','epoch-handoff','research-plan'].includes(detail.id)&&['completed','observed','blocked','unavailable','error','timeout','arrival-failed','arrival-observed'].includes(detail.type))bounded(report.events,{at,wallAt,id:detail.id,type:detail.type,reason:detail.reason||detail.evidence?.reason||null});
    };
    window.addEventListener('alive-runtime-event',listener);
    report.autonomousEnabledAt=Date.now();report.autonomousStartedAt=performance.now();startedFrame=chromeCrawlerState.frameCount;
    frameId=requestAnimationFrame(frame);
    try{observer=new PerformanceObserver(list=>{for(const item of list.getEntries())if(item.startTime>=report.autonomousStartedAt)bounded(metrics.longTasks,{start:item.startTime,duration:item.duration},500);});observer.observe({type:'longtask',buffered:true});report.longTaskObserverInstalled=true;}catch(error){report.longTaskObserverInstalled=false;}
    window.alienAutoNavigateLinks=true;window.syncAliveGuestState();
    while(performance.now()<deadline) {
      report.maxTabs=Math.max(report.maxTabs,tabs.length);
      if(tabs.length>4)throw new Error('Public phase exceeded the production four-tab habitat cap');
      const active=getActiveTab();
      bounded(report.samples,{at:performance.now(),activeTabId:active?.id,url:safeGetUrl(active),ready:active?.domReady,research:shortResearch(),authorityRevision:authority.snapshot().revision},130);
      await sleep(Math.min(1000,Math.max(1,deadline-performance.now())));
    }
    report.after={research:shortResearch(),weights:weightState(),authority:authority.snapshot()};
    report.completed=true;
  }catch(error){report.error=String(error?.stack||error).slice(0,2400);}
  finally {
    const ended=performance.now(),endedFrame=chromeCrawlerState.frameCount;
    metrics.active=false;if(frameId)cancelAnimationFrame(frameId);observer?.disconnect();if(listener)window.removeEventListener('alive-runtime-event',listener);
    await Promise.allSettled([...pendingReads]);
    const distribution=values=>{const s=values.filter(Number.isFinite).sort((a,b)=>a-b);const percentile=p=>s.length?s[Math.min(s.length-1,Math.floor(s.length*p))]:null;return {samples:s.length,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),maxMs:s.at(-1)??null};};
    const measuredMs=report.autonomousStartedAt?ended-report.autonomousStartedAt:0,presentedFrames=report.autonomousStartedAt?endedFrame-startedFrame:0;
    report.timing={scope:'Public autonomous interval only; excludes seed setup and subsequent pause',durationMs:measuredMs,frames:presentedFrames,averageFps:measuredMs>0?presentedFrames/(measuredMs/1000):null,rawRaf:distribution(metrics.raw),presentation:distribution(metrics.presented),longTasks:metrics.longTasks,longTaskTotalMs:metrics.longTasks.reduce((sum,x)=>sum+x.duration,0)};
    try{report.finalPause=await pause('public-renderer-final');report.finalPauseProof=assessPause(report.finalPause);}catch(error){report.cleanupError=String(error?.message||error);}
    report.finishedAt=Date.now();report.totalDurationMs=performance.now()-started;
  }
  return report;
}

// Serialized into the isolated host preload. Nothing here runs in normal app
// launches. Decorate install before it binds structuredClone; late global
// replacement would miss the autosaver's captured reference.
function installAutosaveStageInstrumentation() {
  const root = window, limit = 80, payloadRecords = new WeakMap(), wrapped = new WeakMap();
  const state = { installed: false, active: false, startedAt: null, endedAt: null,
    captureCount: 0, droppedCaptures: 0, samples: [], hooks: [], errors: [] };
  let current = null, api = null, nextId = 0;
  const now = () => performance.now();
  const errorName = error => String(error?.name || 'Error').slice(0, 60);
  function timed(record, name, call) {
    if (!record) return call();
    const phase = { name, start: now(), end: null, durationMs: null, ok: false };
    try { const value = call(); phase.ok = true; return value; }
    catch (error) { phase.error = errorName(error); throw error; }
    finally { phase.end = now(); phase.durationMs = Math.max(0, phase.end - phase.start); record.phases.push(phase); }
  }
  function wrapMethod(object, name, phaseName) {
    if (!object || typeof object[name] !== 'function') return;
    let methods = wrapped.get(object);
    if (!methods) { methods = new Map(); wrapped.set(object, methods); }
    if (methods.get(name) === object[name]) return;
    const original = object[name];
    const replacement = function (...args) { return timed(current, phaseName, () => original.apply(this, args)); };
    object[name] = replacement;
    methods.set(name, replacement);
    if (!state.hooks.includes(phaseName)) state.hooks.push(phaseName);
  }
  function hookExports(runtime) {
    const authentic = runtime.authenticAsmodensius;
    // New worker payload capture and the existing public export are both
    // detected. Missing hooks stay absent, never reported as zero-cost calls.
    wrapMethod(authentic, 'captureStatePayload', 'authenticCaptureStatePayload');
    wrapMethod(authentic, 'exportState', 'authenticExportState');
    wrapMethod(authentic?._creature, 'snapshot', 'authenticNativeSnapshot');
    const ported = runtime.portedMultiverseBrains;
    wrapMethod(ported, 'captureLearnedStatePayload', 'portedCaptureLearnedStatePayload');
    wrapMethod(ported, 'captureStatePayload', 'portedCaptureStatePayload');
    wrapMethod(ported, 'exportLearnedState', 'portedExportLearnedState');
  }
  function summarize() {
    const phases = {};
    for (const sample of state.samples) for (const phase of sample.phases) {
      (phases[phase.name] ||= []).push(phase.durationMs);
    }
    for (const name of ['captureToDispatchSpanMs', 'cloneToDispatchSpanMs', 'storageSpanMs',
      'hostCaptureMs', 'hostDispatchMs', 'hostCommitMs', 'hostPhaseSumMs', 'workerSerializationMs']) {
      phases[name] = state.samples.map(sample => sample[name]).filter(Number.isFinite);
    }
    const stats = values => {
      const sorted = values.slice().sort((a, b) => a - b), count = sorted.length;
      const totalMs = sorted.reduce((sum, value) => sum + value, 0);
      return { count, observation: count ? 'observed' : 'not-observed', totalMs: count ? totalMs : null, meanMs: count ? totalMs / count : null,
        medianMs: count ? (sorted[Math.floor((count - 1) / 2)] + sorted[Math.floor(count / 2)]) / 2 : null,
        maxMs: count ? sorted[count - 1] : null };
    };
    const reasons = {};
    for (const sample of state.samples) reasons[sample.reason] = (reasons[sample.reason] || 0) + 1;
    const explicitCloneCalls = phases.structuredClone?.length || 0;
    return { ...state, reasons,
      cloneObservation: { explicitStructuredCloneCalls: explicitCloneCalls,
        status: explicitCloneCalls ? 'explicit-clone-observed' : 'no-explicit-clone-observed',
        note: 'When postMessage copies the captured payload directly, its implicit structured clone is included in workerPostMessage elapsed time and cannot be timed separately by these wrappers.' },
      completed: state.samples.filter(sample => sample.completedAt !== undefined).length,
      pending: state.samples.filter(sample => sample.completedAt === undefined).length,
      completedAfterWindow: state.samples.filter(sample => state.endedAt !== null && sample.completedAt > state.endedAt).length,
      summary: Object.fromEntries(Object.entries(phases).map(([name, values]) => [name, stats(values)])),
      caveats: [
        'Diagnostic wrappers add overhead. Phase times are elapsed wall time, not CPU utilization.',
        'Nested phase durations overlap. Totals and per-save host phase sums are not continuous blocking tasks.',
        'captureToDispatchSpan covers capture entry through postMessage return; storageSpan covers setItem entry through getItem return. The subsequent string-equality check and callback bookkeeping are excluded from storageSpan; hostCommitMs includes the original complete measured commit.',
        'Only captures started inside the measured window are retained. Completion can occur afterward and is labeled.',
        'A short natural-save sample supports attribution, not reliable tail percentiles; p95/p99 are deliberately omitted.'
      ] };
  }
  root.__aliveAutosaveStageProbe = {
    begin() {
      state.active = true; state.startedAt = now(); state.endedAt = null;
      state.captureCount = 0; state.droppedCaptures = 0; state.samples.length = 0;
      return { installed: state.installed, startedAt: state.startedAt, hooks: state.hooks.slice() };
    },
    end() { state.active = false; state.endedAt = now(); return { endedAt: state.endedAt }; },
    snapshot: summarize
  };
  function decorate(module) {
    if (!module || typeof module.install !== 'function') { state.errors.push('Autosave install unavailable'); return module; }
    const originalInstall = module.install;
    module.install = function (runtime, options = {}) {
      if (typeof options.capture !== 'function' || !options.storage) {
        state.errors.push('Autosave capture/storage contract unavailable');
        return originalInstall.call(this, runtime, options);
      }
      const originalCapture = options.capture, storage = options.storage;
      const originalClone = options.structuredClone || root.structuredClone.bind(root);
      const originalCreateWorker = options.createWorker || (url => new root.Worker(url));
      let pendingRecord = null;
      const profiled = { ...options,
        capture: function (...args) {
          if (pendingRecord && pendingRecord.completedAt === undefined) pendingRecord.supersededAt = now();
          pendingRecord = null;
          if (!state.active) return originalCapture.apply(this, args);
          state.captureCount++;
          if (state.samples.length >= limit) { state.droppedCaptures++; return originalCapture.apply(this, args); }
          hookExports(runtime);
          const job = api?.snapshot?.();
          const record = { sampleId: ++nextId, jobId: job?.inFlightId ?? null, reason: job?.lastReason || 'unknown',
            start: now(), phases: [], outcome: 'capturing' };
          state.samples.push(record);
          pendingRecord = record;
          const previous = current; current = record;
          try {
            const payload = timed(record, 'payloadCapture', () => originalCapture.apply(this, args));
            if (payload && typeof payload === 'object') payloadRecords.set(payload, record);
            record.outcome = 'captured';
            return payload;
          } catch (error) { record.outcome = 'capture-error'; throw error; }
          finally { current = previous; }
        },
        structuredClone: function (payload, ...args) {
          const record = payload && typeof payload === 'object' ? payloadRecords.get(payload) : null;
          const copy = timed(record, 'structuredClone', () => originalClone(payload, ...args));
          if (record && copy && typeof copy === 'object') { payloadRecords.set(copy, record); record.cloneEndedAt = now(); }
          return copy;
        },
        createWorker: function (...args) {
          const instance = originalCreateWorker.apply(this, args), originalPost = instance.postMessage;
          instance.postMessage = function (message, ...rest) {
            const record = message?.payload && typeof message.payload === 'object' ? payloadRecords.get(message.payload) : null;
            if (record) {
              record.jobId = message.id; record.outcome = 'dispatched';
              record.dispatchTransferCount = Array.isArray(rest[0]) ? rest[0].length : Array.isArray(rest[0]?.transfer) ? rest[0].transfer.length : 0;
              record.explicitCloneObserved = record.phases.some(phase => phase.name === 'structuredClone');
            }
            try { return timed(record, 'workerPostMessage', () => originalPost.call(this, message, ...rest)); }
            finally {
              if (record) {
                record.dispatchEndedAt = now();
                record.captureToDispatchSpanMs = record.dispatchEndedAt - record.start;
                if (Number.isFinite(record.cloneEndedAt)) record.cloneToDispatchSpanMs = record.dispatchEndedAt - record.cloneEndedAt;
              }
            }
          };
          return instance;
        },
        storage: {
          setItem: function (...args) {
            const record = pendingRecord;
            if (record) record.storageStartedAt = now();
            return timed(record, 'storageSetItem', () => storage.setItem.apply(storage, args));
          },
          getItem: function (...args) {
            const record = pendingRecord;
            try { return timed(record, 'storageGetItem', () => storage.getItem.apply(storage, args)); }
            finally {
              if (record) {
                record.storageEndedAt = now();
                if (Number.isFinite(record.storageStartedAt)) record.storageSpanMs = record.storageEndedAt - record.storageStartedAt;
                pendingRecord = null;
                queueMicrotask(() => {
                  const result = api?.snapshot?.();
                  record.completedAt = now(); record.outcome = result?.lastOutcome || 'storage-read-completed';
                  record.persistenceVerified = result?.persistenceVerified === true;
                  record.workerMode = result?.workerMode || null;
                  record.hostCaptureMs = result?.lastCaptureMs ?? null;
                  record.hostDispatchMs = result?.lastDispatchMs ?? null;
                  record.hostCommitMs = result?.lastCommitMs ?? null;
                  record.hostPhaseSumMs = result?.lastDurationMs ?? null;
                  record.workerSerializationMs = result?.lastSerializationMs ?? null;
                });
              }
            }
          }
        }
      };
      api = originalInstall.call(this, runtime, profiled);
      state.installed = true;
      hookExports(runtime);
      return api;
    };
    return module;
  }
  const existing = Object.getOwnPropertyDescriptor(root, 'AliveAutosave');
  if (existing?.value) root.AliveAutosave = decorate(existing.value);
  else Object.defineProperty(root, 'AliveAutosave', { configurable: true, enumerable: true,
    get() { return undefined; },
    set(value) { Object.defineProperty(root, 'AliveAutosave', { value: decorate(value), writable: true, configurable: true, enumerable: true }); }
  });
}

if (!process.versions.electron) {
  const { spawnSync } = require('node:child_process');
  const env = { ...process.env, GIGACHAD_SMOKE: '1', GIGACHAD_TEST_MODE: '1' };
  for (const key of ['ELECTRON_RUN_AS_NODE', 'OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'GIGACHAD_LLM_API_KEY']) delete env[key];
  const resolvedElectronPath=path.resolve(require('electron'));
  const launcher={processVersions:{...process.versions},execPath:process.execPath,resolvedElectronPath,
    electronOverrideDistPath:env.ELECTRON_OVERRIDE_DIST_PATH?path.resolve(env.ELECTRON_OVERRIDE_DIST_PATH):null,
    archiveProvenance:readArchiveProvenance()};
  env.GIGACHAD_PROBE_LAUNCHER_RUNTIME=JSON.stringify(launcher);
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'launcher-provenance.json'),JSON.stringify(launcher,null,2));
  const args=[];
  let traceDirectory=null,traceFile=null;
  if(env.GIGACHAD_PROBE_TRACE==='1') {
    if(env.GIGACHAD_PROBE_FIXTURE!=='1')throw new Error('Startup tracing requires the isolated offline fixture');
    traceDirectory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'gigachad-startup-trace-'));
    traceFile=path.join(traceDirectory,'trace.json');
    env.GIGACHAD_PROBE_TRACE_FILE=traceFile;
    args.push('--trace-startup='+traceCategories.join(','),'--trace-startup-duration=20','--trace-startup-file='+traceFile,'--trace-startup-format=json');
  }
  args.push(__filename);
  const launchStartedAt=new Date().toISOString(),launchStartedMonotonic=performance.now();
  const launcherTimeoutMs=durationMs+90000+(publicNavigation?publicDurationMs+50000:0);
  const launchRecord={startedAt:launchStartedAt,endedAt:null,configuredTimeoutMs:launcherTimeoutMs,childPid:null,status:'launching',resolvedElectronPath};
  fs.writeFileSync(path.join(outputDir,'launcher-run.json'),JSON.stringify(launchRecord,null,2));
  const result = spawnSync(resolvedElectronPath, args, {
    cwd: root, env, windowsHide: true, encoding: 'utf8', timeout: launcherTimeoutMs,
    maxBuffer: 4 * 1024 * 1024
  });
  Object.assign(launchRecord,{endedAt:new Date().toISOString(),elapsedMs:performance.now()-launchStartedMonotonic,childPid:result.pid??null,status:result.status,signal:result.signal||null,error:result.error?{message:result.error.message,code:result.error.code||null}:null});
  fs.writeFileSync(path.join(outputDir,'launcher-run.json'),JSON.stringify(launchRecord,null,2));
  const completedReportPath=path.join(outputDir,'report.json');
  if(fs.existsSync(completedReportPath)){const saved=JSON.parse(fs.readFileSync(completedReportPath,'utf8'));if(saved.runtime?.processId===result.pid){saved.launcherExit=launchRecord;fs.writeFileSync(completedReportPath,JSON.stringify(saved,null,2));}}
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  if(traceFile) {
    fs.mkdirSync(outputDir,{recursive:true});
    const artifact={mode:'chromium-startup-switches',available:fs.existsSync(traceFile),temporaryPath:traceFile};
    if(artifact.available){artifact.path=path.join(outputDir,'compositor-trace.json');fs.copyFileSync(traceFile,artifact.path);artifact.bytes=fs.statSync(artifact.path).size;fs.unlinkSync(traceFile);if(fs.readdirSync(traceDirectory).length===0)fs.rmdirSync(traceDirectory);}
    else artifact.reason='Chromium startup trace file was not produced; no trace attribution is available';
    fs.writeFileSync(path.join(outputDir,'trace-artifact.json'),JSON.stringify(artifact,null,2));
    const reportPath=path.join(outputDir,'report.json');
    if(fs.existsSync(reportPath)){const saved=JSON.parse(fs.readFileSync(reportPath,'utf8'));saved.trace={...saved.trace,...artifact};fs.writeFileSync(reportPath,JSON.stringify(saved,null,2));}
    console.log('ALIVE_TRACE_ARTIFACT '+JSON.stringify(artifact));
  }
  const completed = (result.stdout || '').includes('ALIVE_PROBE ');
  if(!completed){
    fs.mkdirSync(outputDir,{recursive:true});
    fs.writeFileSync(path.join(outputDir,'launcher-failure.json'),JSON.stringify({at:new Date().toISOString(),launcher,status:result.status,signal:result.signal,error:result.error?.message,stderr:(result.stderr||'').slice(-12000),stdout:(result.stdout||'').slice(-4000)},null,2));
    console.error('ALIVE_PROBE_FAILED: Electron exited before producing a completed verification report.');
  }
  process.exit(result.status === 0 && completed ? 0 : result.status || 1);
}

const launcherRuntime=process.env.GIGACHAD_PROBE_LAUNCHER_RUNTIME?JSON.parse(process.env.GIGACHAD_PROBE_LAUNCHER_RUNTIME):null;
const runtimeProvenance={processId:process.pid,processVersions:{...process.versions},execPath:process.execPath,platform:process.platform,arch:process.arch,
  launcher:launcherRuntime,archiveProvenance:launcherRuntime?.archiveProvenance||readArchiveProvenance()};
const sameExecutablePath=(left,right)=>typeof left==='string'&&typeof right==='string'&&
  (process.platform==='win32'?path.resolve(left).toLowerCase()===path.resolve(right).toLowerCase():path.resolve(left)===path.resolve(right));
runtimeProvenance.matchesLauncherExecutable=launcherRuntime?sameExecutablePath(process.execPath,launcherRuntime.resolvedElectronPath):null;
const archiveRecord=runtimeProvenance.archiveProvenance?.record;
runtimeProvenance.matchesArchiveVersion=archiveRecord?process.versions.electron===archiveRecord.version:null;
runtimeProvenance.matchesArchiveExecutable=archiveRecord?sameExecutablePath(process.execPath,archiveRecord.executablePath):null;
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'runtime-provenance.json'),JSON.stringify(runtimeProvenance,null,2));
console.log('ALIVE_PROBE_RUNTIME '+JSON.stringify(runtimeProvenance));

const { app, BrowserWindow, Menu, webContents } = require('electron');
const Module = require('node:module');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
process.env.GIGACHAD_SMOKE = '1';
process.env.GIGACHAD_TEST_MODE = '1';
const appPath = path.join(root, 'main.js');
let source = fs.readFileSync(appPath, 'utf8');
let publicNetworkGate=null,publicAdaptation=null;
if(publicNavigation) {
  const policy=require(path.join(root,'systems/alive-research-policy.js'));
  publicNetworkGate=publicNavigationSupport.createPublicRequestGate({normalizeURL:policy.normalizeURL});
  globalThis[publicNavigationSupport.GLOBAL_NAME]=publicNetworkGate;
  const adapted=publicNavigationSupport.adaptSmokeSource(source);
  source=adapted.source;publicAdaptation=adapted.evidence;
}
const legacyStart = /  if \(SMOKE\) \{\r?\n    const fail = \(message\) => \{/;
if (!legacyStart.test(source)) throw new Error('The application smoke bootstrap changed; review the probe adapter.');
source = source.replace(legacyStart, '  if (false) {\n    const fail = (message) => {');
if (process.env.GIGACHAD_PROBE_GPU === '1') {
  source = source.replace('  app.disableHardwareAcceleration();', '  // GPU rendering retained for the isolated performance probe.');
  source = source.replace("  app.commandLine.appendSwitch('disable-gpu');", "  // No GPU-disable switch in this performance probe.");
}
if((nativeCloseTrace||autosaveStages)&&!minimal) {
  fs.mkdirSync(outputDir,{recursive:true});
  const probePreload=path.join(outputDir,'probe-preload.cjs');
  const preload=fs.readFileSync(path.join(root,'preload.js'),'utf8');
  const closeBootstrap=nativeCloseTrace?`\ncontextBridge.executeInMainWorld({func: function(){
    const originalClose=window.close;
    window.close=function(...args){console.warn('__ALIVE_PROBE_EARLY_WINDOW_CLOSE__ '+new Error().stack);return originalClose.apply(this,args);};
    window.__aliveProbeEarlyCloseInstalled=true;
  }});\n`:'';
  const autosaveBootstrap=autosaveStages?'\ncontextBridge.executeInMainWorld({func: '+installAutosaveStageInstrumentation.toString()+'});\n':'';
  fs.writeFileSync(probePreload,preload+closeBootstrap+autosaveBootstrap);
  const originalPreload="preload: path.join(ROOT, 'preload.js')";
  if(!source.includes(originalPreload))throw new Error('Host preload definition changed; review close-trace probe');
  source=source.replace(originalPreload,'preload: '+JSON.stringify(probePreload));
}
const application = new Module(appPath, module);
application.filename = appPath;
application.paths = Module._nodeModulePaths(root);
let minimalWindow, minimalReady;
if(minimal) {
  const profile=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'gigachad-minimal-probe-'));
  app.setPath('userData',profile);
  app.setPath('sessionData',profile);
  minimalReady=app.whenReady().then(async()=>{
    minimalWindow=new BrowserWindow({width:1440,height:900,show:false,title:'GIGACHAD isolated static window',webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false}});
    await minimalWindow.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<!doctype html><title>Isolated static diagnostic</title><style>body{background:#10201a;color:#d8f4e4;font:24px system-ui;padding:60px}</style><h1>Isolated window lifecycle diagnostic</h1><p>This static window closes automatically after the verification interval.</p><p>No application code, model, guest browser, or creature runtime is loaded.</p>'));
  });
  app.on('window-all-closed',()=>app.quit());
} else application._compile(source, appPath);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  probe: 'isolated-electron-alive-overdrive', startedAt: new Date().toISOString(),
  runtime:runtimeProvenance,
  limitations: ['Hidden, software-rendered Electron window; timing is a regression measurement, not a foreground hardware FPS guarantee.', 'Network providers are disabled by the application smoke configuration.'],
  durationMs, consoleErrors: [], guestErrors: [], checkpoints: {}
};
report.minimal=minimal;
report.nativeCloseTrace=nativeCloseTrace;
report.autosaveStagesRequested=autosaveStages;
report.authorityChecksRequested=authorityChecks;
report.publicNavigationRequested=publicNavigation;
report.phasesRequested={restore:process.env.GIGACHAD_PROBE_RESTORE==='1',panels:process.env.GIGACHAD_PROBE_PANELS==='1',authority:authorityChecks,navigationCache:navigationCacheChecks,specialistFusion:specialistFusionChecks,public:publicNavigation,offlineNavigation:process.env.GIGACHAD_PROBE_NAVIGATION==='1',autonomous:process.env.GIGACHAD_PROBE_AUTONOMOUS==='1',workerPersistence:verifyWorker,autosaveStages};
if(splitHabitatChecks)report.phasesRequested.splitHabitat=true;
if(publicNavigation)report.publicNetworkAdaptation=publicAdaptation;
report.inputIsolation={requested:inputIsolation,appliedBeforeShow:false};
const traceStage=stage=>{if(report.trace){report.trace.stage=stage;report.trace.stageAt=Date.now();fs.writeFileSync(path.join(outputDir,'trace-progress.json'),JSON.stringify(report.trace,null,2));}};
report.inputEvents=[];
report.lifecycle=[];
report.lifecycleLog={routineLimit:80,criticalLimit:64,droppedRoutine:0,droppedCritical:0};
function recordLifecycle(type, detail = {}) {
  const critical=/close|quit|exit|destroy|process-gone|F4|menu\.click/i.test(type);
  const count=report.lifecycle.reduce((sum,event)=>sum+(Boolean(event.critical)===critical?1:0),0);
  if(!critical&&count>=report.lifecycleLog.routineLimit){report.lifecycleLog.droppedRoutine++;return;}
  if(critical&&count>=report.lifecycleLog.criticalLimit){const oldest=report.lifecycle.findIndex(event=>event.critical);if(oldest>=0)report.lifecycle.splice(oldest,1);report.lifecycleLog.droppedCritical++;}
  report.lifecycle.push({at:Date.now(),type,critical,...detail,stack:new Error().stack?.split('\n').slice(2,9).join('\n')});
}
for(const name of ['quit','exit']) {
  const original=app[name];
  app[name]=function(...args){recordLifecycle('app.'+name,{exitCode:name==='exit'?args[0]:undefined});return original.apply(this,args);};
}
for(const event of ['before-quit','will-quit','quit','window-all-closed'])app.prependListener(event,()=>recordLifecycle(event));
report.processFailures=[];
app.on('child-process-gone',(_event,details)=>{
  const evidence={at:Date.now(),type:String(details.type||'unknown').slice(0,80),reason:String(details.reason||'unknown').slice(0,120),exitCode:details.exitCode??null};
  if(report.processFailures.length<64)report.processFailures.push(evidence);
  recordLifecycle('child-process-gone',{at:evidence.at,processType:evidence.type,reason:evidence.reason,exitCode:evidence.exitCode});
});
app.on('web-contents-created', (_event, contents) => {
  contents.on('render-process-gone',(_event,details)=>{
    let type='unknown';try{type=contents.getType();}catch(_){}
    const evidence={at:Date.now(),webContentsId:contents.id,type,reason:String(details.reason||'unknown').slice(0,120),exitCode:details.exitCode??null};
    if(report.processFailures.length<64)report.processFailures.push(evidence);
    recordLifecycle('render-process-gone',{at:evidence.at,webContentsId:evidence.webContentsId,processType:evidence.type,reason:evidence.reason,exitCode:evidence.exitCode});
  });
  if(publicNetworkGate) {
    contents.on('did-navigate',(_event,url,httpResponseCode)=>{if(contents.getType()==='webview')publicNetworkGate.commit({webContentsId:contents.id,url,statusCode:httpResponseCode,title:contents.getTitle()});});
    contents.on('page-title-updated',(_event,title)=>publicNetworkGate.title(contents.id,title));
  }
  if(typeof contents.close==='function') {
    const original=contents.close;
    contents.close=function(...args){recordLifecycle('webContents.close-called',{webContentsId:contents.id});return original.apply(this,args);};
  }
  contents.on('before-input-event',(_inputEvent,input)=>{
    const key=String(input.key||'').toLowerCase();
    const closeChord=nativeCloseTrace&&(input.alt&&key==='f4'?'Alt+F4':input.control&&key==='w'?(input.shift?'Ctrl+Shift+W':'Ctrl+W'):input.control&&key==='q'?'Ctrl+Q':null);
    if(report.inputEvents.length<1000)report.inputEvents.push({at:Date.now(),webContentsId:contents.id,type:input.type,source:'before-input-event',...(closeChord?{closeChord}: {})});
  });
  contents.on('input-event', (_inputEvent, input) => {
    if(['mouseDown','mouseUp','keyDown','rawKeyDown','keyUp','touchStart','gestureTap'].includes(input.type)&&report.inputEvents.length<1000) {
      // Record event type and time only; never retain typed characters.
      report.inputEvents.push({at:Date.now(),webContentsId:contents.id,type:input.type,...(nativeCloseTrace?{x:Number.isFinite(input.x)?input.x:null,y:Number.isFinite(input.y)?input.y:null,button:input.button||null}: {})});
    }
  });
});
const requiredSourcePaths=['index.html','main.js','preload.js','config.js','alife_neural_cyber_engine.js','scripts/alive-overdrive-probe.cjs','scripts/alive-public-navigation-probe.cjs','systems/cortex-neural-cyber-engine.js','systems/alive-overdrive-runtime.js','systems/alive-overdrive-adapters.js','systems/alive-checkpoints.js','systems/alive-guest-execution.js','systems/alive-authority.js','systems/alive-neural-coupling.js','systems/alive-autosave.js','systems/alive-genome-codec.js','systems/authentic-asmodensius-adapter.js','systems/generated/authentic-asmodensius.js','systems/ported-multiverse-brains.js','systems/alife-learning-evidence.js','systems/alive-workspace-ui.js','assets/alive-workspace.css'];
requiredSourcePaths.push('scripts/alive-specialist-fusion-evidence.cjs','scripts/alive-navigation-cache-probe.cjs','scripts/alive-genome-durable-evidence.cjs');
requiredSourcePaths.push('systems/alive-startup-loader.js','systems/alive-primary-policy-bootstrap.js','systems/alive-primary-policy-state.js',
  'systems/alive-trainer-state.js','systems/alive-replay-state.js','systems/alive-hub-state.js','systems/alive-cortex-state.js','systems/alife-25-bleeding-edge-models.js',
  'systems/alive-learned-state-registry.js','systems/alive-learned-state-codec.js','systems/alive-genome-persistence.js');
if(splitHabitatChecks)requiredSourcePaths.push('scripts/alive-split-habitat-probe.cjs','systems/alive-page-exploration.js','systems/alive-habitat.js');
const optionalSourcePaths=['systems/deep-web-transport.js','systems/sha3-256.cjs','systems/alive-specialist-fusion.js','systems/alive-research-planner.cjs','systems/alive-research-policy.js','systems/alive-tor-service.cjs'];
optionalSourcePaths.push('systems/alive-genome-store.cjs','systems/alive-genome-ipc.cjs','systems/alive-genome-persistence.js');
const sourceHash=name=>fs.existsSync(path.join(root,name))?require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'):null;
report.sourceHashes=Object.fromEntries([...requiredSourcePaths,...optionalSourcePaths].map(name=>[name,sourceHash(name)]));
report.sourcePresence={required:requiredSourcePaths,optional:optionalSourcePaths,missingOptionalAtStart:optionalSourcePaths.filter(name=>report.sourceHashes[name]===null)};
if(requiredSourcePaths.some(name=>report.sourceHashes[name]===null))throw new Error('Required verification source is missing');
const requiredCapabilityIds=['brains-precision','dom-body','macro','meso','micro','body-curriculum','connectome','millennium','reasoning','train-policy','grover-collapse','decursive','feed','formation','soul-surge','deity','omega','morph','dream','procreate','zalgo','neo','portal-jump','epoch-handoff','checkpoint','onion','deep-dark-dive','flywire','acceptance-gates'];
const declaredCapabilityIds=Array.from(require(path.join(root,'systems/alive-overdrive-runtime.js')).CAPABILITIES,definition=>definition.id);
report.capabilityContract={requiredIds:requiredCapabilityIds,declaredIds:declaredCapabilityIds};
const expectedCouplingIds=Array.from(require(path.join(root,'systems/alive-neural-coupling.js')).SOURCE_IDS);
const coreCouplingIds=['brain1Asmodensius','brain2Glitchling','brain3CqmSuperMind','brain4ApexHydra',
  'brain5Xenomimic','brain6XylosManifold','brain7Mechalogodrom','brain8GlyphPantheon','brain9ThalerDabus',
  'brain10GraphCrystal','brain11TsotchkeDale','brain12BlackHolePage','brain13ConsciousnessConsortium',
  'brain14ThingmakerGrimoire','precision-f64','precision-i64','precision-u32','precision-fp16',
  'precision-int8','precision-ternary','precision-f32','micro-ising'];
const omegaCouplingIds=['omega-lorenz','omega-izhikevich'];
const requireOmegaCoupling=process.env.GIGACHAD_PROBE_REQUIRE_OMEGA==='1'||omegaCouplingIds.some(id=>expectedCouplingIds.includes(id));
report.neuralCouplingContract={expectedIds:expectedCouplingIds,
  requiredIds:coreCouplingIds.concat(requireOmegaCoupling?omegaCouplingIds:[]),
  requireOmega:requireOmegaCoupling,featureDimension:16,expectedTrainableParameters:expectedCouplingIds.length*17};
let fixtureDirectory=null;
let probeCompleted=false;
function cleanupFixture() {
  if(!fixtureDirectory)return;
  const allowed=path.resolve(root,'brains',`.alive-probe-${process.pid}`);
  if(path.resolve(fixtureDirectory)!==allowed)throw new Error('Unexpected probe fixture cleanup target');
  for(const name of ['habitat.html','habitat-second.html']) {
    const target=path.join(allowed,name);if(fs.existsSync(target))fs.unlinkSync(target);
  }
  fs.rmdirSync(allowed);fixtureDirectory=null;
}
app.on('will-quit', () => {
  if(probeCompleted)return;
  report.ok=false;
  report.fatal='Electron quit before verification completed; the isolated test window may have been closed.';
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
  cleanupFixture();
});
const snapshotSource = `(() => {
  const h = humunculusRuntime;
  const describe = (selector) => {
    const e = document.querySelector(selector); if (!e) return null;
    const r=e.getBoundingClientRect(), c=getComputedStyle(e);
    return { x:r.x,y:r.y,width:r.width,height:r.height,display:c.display,visibility:c.visibility,opacity:c.opacity,pointerEvents:c.pointerEvents };
  };
  const weightDigest = (arr) => {
    if (!arr) return null;
    let sum=0,abs=0,squared=0,nonFinite=0;
    for(let i=0;i<arr.length;i++){const v=arr[i];if(!Number.isFinite(v)){nonFinite++;continue;}sum+=v;abs+=Math.abs(v);squared+=v*v;}
    return {length:arr.length,sum,abs,squared,nonFinite,sample:Array.from(arr.slice(0,24))};
  };
  const api = window.aliveOverdrive;
  const executionState=window.getAliveRuntimeEvidence?.()||{};
  let overdrive=null;
  if(api) { try { overdrive = typeof api.snapshot==='function' ? api.snapshot() : typeof api.getSnapshot==='function' ? api.getSnapshot() : { keys:Object.keys(api) }; } catch(e){overdrive={error:e.message};} }
  return { at:performance.now(), overdrive, active:typeof alienBrainActive!=='undefined'&&alienBrainActive,
    pendingGuestExecutions:executionState.pendingGuestExecutions??null,guestExecutions:executionState.guestExecutions||[],guestLifecycle:executionState.guestLifecycle||[],
    rawGuestLanes:tabs.map(t=>({tab:t.id,url:t.url,ready:t.domReady,lanes:window.AliveGuestExecution?.snapshot(t.wv)||[]})),
    simulationTick:h.simulationTick, policyCid:h.policyCid, stageIdx:h.stageIdx,
    autosave:window.aliveAutosave?.snapshot?.()||null,
    legacyGenome:(()=>{try{const raw=localStorage.getItem('humunculus_persistent_genome_v1');if(!raw)return null;const p=JSON.parse(raw);return {bytes:raw.length,savedAt:p.savedAt,simulationTick:p.simulationTick,authorityEpoch:p.authorityEpoch,policyCid:p.policyCid,bodyCid:p.bodyRecipe?.bodyCid,actorValuesChecked:p.W_actor?.length||0,actorMatchesCurrentRounded:Array.isArray(p.W_actor)&&p.W_actor.length===h.W_actor.length&&p.W_actor.every((v,i)=>v===Number(h.W_actor[i].toFixed(5))),tickMatchesCurrent:p.simulationTick===h.simulationTick,policyMatchesCurrent:p.policyCid===h.policyCid,epochMatchesCurrent:p.authorityEpoch===h.authorityEpoch,bodyMatchesCurrent:p.bodyRecipe?.bodyCid===h.bodyRecipe?.bodyCid};}catch(error){return {error:error.message};}})(),
    neuralCoupling:h.aliveNeuralCoupling?.snapshot?.()||null,
    workerTrainer:h.bleedingEdge25Engine?.workerTrainerSnapshot?.()||null,
    workerTarget:weightDigest(h.bleedingEdge25Engine?.W_hyper_u),
    specialistFusion:h.aliveSpecialistFusion?.snapshot?.()||null,
    specialistFusionHandleEnumerable:Object.getOwnPropertyDescriptor(h,'aliveSpecialistFusion')?.enumerable??null,
    lastPolicyStep:h.lastPolicyStep||null,
    worldPredError:h.worldPredError, lastEvalReport:h.lastEvalReport,
    backprop:h.trainableAlifeNeuralHub?.totalBackpropStepsTrained,
    stdpUpdates:h.connectome512?.stdpUpdatesCount, dreams:h.dreamReplaysCount,
    presentation:{frameCount:typeof chromeCrawlerState!=='undefined'?chromeCrawlerState?.frameCount:null,intervals:typeof chromeCrawlerState!=='undefined'?chromeCrawlerState?.presentationIntervals||[]:[]},
    offspring:h.offspringColony?.length, checkpoints:h.checkpoints?.length,
    weights:{actor:weightDigest(h.W_actor),critic:weightDigest(h.W_critic),world:weightDigest(h.W_world),perception:weightDigest(h.trainableAlifeNeuralHub?.W_perc_enc),couplingWeights:weightDigest(h.aliveCouplingWeights),couplingGateLogits:weightDigest(h.aliveCouplingGateLogits)},
    layout:{viewport:{width:innerWidth,height:innerHeight},page:describe('#webviews-stack'),hostCanvas:describe('#host-alife-viewport-canvas'),sidebar:describe('#ai-sidebar'),habitat:describe('#alife-habitat-strip'),hud:describe('#host-alife-hud-dock'),inspector:describe('#alien-brain-drawer'),controls:describe('#alive-controls-panel'),logs:describe('#alife-left-omni-dock'),bar:describe('#alive-runtime-bar')},
    tabs:tabs.map(t=>({id:t.id,url:t.url,ready:t.domReady,committedUrl:t.committedUrl??null,
      mainFrameNavigating:t.mainFrameNavigating??null,terminalLoadFailure:t.terminalLoadFailure??null,
      guestAttached:t.guestAttached??null,guestUnavailable:t.guestUnavailable??null,frozen:Boolean(t.frozen),
      connected:Boolean(t.wv?.isConnected),cachedAdmission:typeof isWebviewGuestReady==='function'?isWebviewGuestReady(t.wv):null})),
    errors:window.__aliveProbeErrors||[], metrics:window.__aliveProbeMetrics||null
  };
})()`;

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  await app.whenReady();
  let win;
  for (let i=0;i<100;i++) { win=BrowserWindow.getAllWindows()[0]; if(win) break; await sleep(50); }
  if(!win) throw new Error('Application did not create a BrowserWindow.');
  const probeWindowId=win.id;
  const traceMenu=menu=>{for(const item of menu?.items||[]){if(typeof item.click==='function'){const original=item.click;item.click=function(...args){recordLifecycle('menu.click',{role:item.role||null,label:item.label});return original.apply(this,args);};}if(item.submenu)traceMenu(item.submenu);}};
  traceMenu(Menu.getApplicationMenu());
  for(const event of ['close','closed','focus','blur','show','hide','minimize','restore'])win.on(event,()=>recordLifecycle('window.'+event,{windowId:probeWindowId}));
  if(process.platform==='win32'&&typeof win.hookWindowMessage==='function') {
    win.hookWindowMessage(0x0010,()=>recordLifecycle('WM_CLOSE',{windowId:probeWindowId}));
    win.hookWindowMessage(0x0112,wParam=>{const command=wParam.readUInt32LE(0)&0xfff0;if(command===0xf060)recordLifecycle('WM_SYSCOMMAND_SC_CLOSE',{windowId:probeWindowId});});
    if(nativeCloseTrace) {
      for(const [message,label] of [[0x00a1,'WM_NCLBUTTONDOWN_HTCLOSE'],[0x00a2,'WM_NCLBUTTONUP_HTCLOSE']])win.hookWindowMessage(message,(wParam,lParam)=>{
        if(wParam.readUInt32LE(0)!==20)return;const packed=lParam.readUInt32LE(0);recordLifecycle(label,{windowId:probeWindowId,screenX:(packed<<16)>>16,screenY:packed>>16});
      });
      win.hookWindowMessage(0x0104,wParam=>{if(wParam.readUInt32LE(0)===0x73)recordLifecycle('WM_SYSKEYDOWN_F4',{windowId:probeWindowId});});
    }
  }
  for(const name of ['close','destroy']) {
    const original=win[name];
    win[name]=function(...args){recordLifecycle('window.'+name+'-called',{windowId:probeWindowId});return original.apply(this,args);};
  }
  const labelTestWindow=()=>{if(process.env.GIGACHAD_PROBE_VISIBLE==='1'&&!win.isDestroyed())win.setTitle('GIGACHAD — isolated verification window (closes automatically)');};
  win.webContents.on('page-title-updated',()=>setTimeout(labelTestWindow,0));
  win.webContents.setBackgroundThrottling(false);
  if(inputIsolation) {
    // Change only this probe's already-isolated window, never production options.
    // Mouse events pass through; non-focusability also excludes keyboard focus.
    win.setFocusable(false);
    win.setIgnoreMouseEvents(true);
    report.inputIsolation={requested:true,appliedBeforeShow:true,focusable:win.isFocusable(),ignoreMouseEventsApplied:true,
      scope:'Visible offline fixture only; native input passes to underlying windows.'};
    report.limitations.push('Input-isolated test window is non-focusable and ignores mouse input; interactive input behavior is outside this run.');
  }
  if (process.env.GIGACHAD_PROBE_VISIBLE === '1') {
    win.showInactive();
    labelTestWindow();
    report.limitations[0] = 'Visible isolated Electron test window; timing applies to this observed run and hardware only.';
  }
  if (process.env.GIGACHAD_PROBE_FOCUS === '1') {
    win.show();
    win.focus();
  }
  report.focusRequested = process.env.GIGACHAD_PROBE_FOCUS === '1';
  report.gpuRequested = process.env.GIGACHAD_PROBE_GPU === '1';
  report.gpuStatus = app.getGPUFeatureStatus();
  win.webContents.on('console-message', (event) => {
    const level = event.level, message = event.message;
    if((level==='warning'||level==='error') && report.consoleErrors.length<80) report.consoleErrors.push({level,message:String(message).slice(0,1200)});
  });
  win.webContents.on('render-process-gone', (_event, detail)=>report.renderProcessGone=detail);
  const evaluate = (script) => win.webContents.executeJavaScript(script, true);
  const processInventory = () => ({mainPid:process.pid,host:{webContentsId:win.webContents.id,pid:win.webContents.getOSProcessId()},
    guests:webContents.getAllWebContents().filter(contents=>!contents.isDestroyed()&&contents.getType()==='webview').map(contents=>({webContentsId:contents.id,pid:contents.getOSProcessId(),fixture:contents.getURL().includes('/.alive-probe-')})),
    processes:app.getAppMetrics().map(metric=>({pid:metric.pid,type:metric.type,name:metric.name||null}))});
  if(minimal) {
    await minimalReady;
    labelTestWindow();
    report.measurementStartedAt=Date.now();
    await sleep(durationMs);
    report.completedAt=new Date().toISOString();
    report.focusAfter={native:win.isFocused(),renderer:await evaluate('({focused:document.hasFocus(),visibility:document.visibilityState})')};
    fs.writeFileSync(path.join(outputDir,'static.png'),(await win.webContents.capturePage()).toPNG());
    report.ok=!report.renderProcessGone;
    fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
    console.log('ALIVE_PROBE '+JSON.stringify({outputDir,minimal:true,ok:report.ok,durationMs,lifecycle:report.lifecycle,inputEvents:report.inputEvents}));
    probeCompleted=true;
    app.exit(report.ok?0:1);
    return;
  }
  let ready=false;
  for(let i=0;i<150;i++) {
    try { ready=await evaluate('typeof humunculusRuntime === "object" && typeof getActiveTab === "function" && Boolean(getActiveTab()?.domReady)'); } catch(_){}
    if(ready) break;
    await sleep(100);
  }
  if(!ready) throw new Error('A-Life runtime or guest page did not become ready.');
  report.earlyCloseInstrumentation=await evaluate('window.__aliveProbeEarlyCloseInstalled===true');
  if(autosaveStages) {
    const installed=await evaluate('window.__aliveAutosaveStageProbe?.snapshot?.().installed===true');
    if(!installed)throw new Error('Early autosave stage wrappers did not install; timing would be incomplete');
    report.limitations.push('Opt-in autosave stage wrappers add timing overhead. Phase attribution is diagnostic, not uninstrumented FPS qualification.');
  }
  labelTestWindow();
  await evaluate(`(() => {
    window.__aliveProbeNavigation=[];
    window.__aliveProbeEvents=[];
    window.__aliveProbeDomInputs=[];
    for(const type of ['pointerdown','pointerup','keydown','keyup'])addEventListener(type,event=>{
      if(window.__aliveProbeDomInputs.length<1000)window.__aliveProbeDomInputs.push({at:performance.now(),wallAt:Date.now(),type,isTrusted:event.isTrusted,targetId:event.target?.id||null,targetTag:event.target?.tagName||null});
    },true);
    const originalClose=window.close;
    window.close=function(...args){console.warn('__ALIVE_PROBE_WINDOW_CLOSE__ '+new Error().stack);return originalClose.apply(this,args);};
    for(const name of ['createTab','closeTab','switchTab','navigate','dispatchNonBlockingTabNavigation']) {
      const original=window[name];if(typeof original!=='function')continue;
      window[name]=function(...args){
        if(window.__aliveProbeNavigation.length<1000)window.__aliveProbeNavigation.push({at:performance.now(),wallAt:Date.now(),name,autoHop:window.alienAutoNavigateLinks,tab:args[0]?.id||(typeof args[0]==='string'?args[0]:null),url:name==='createTab'?args[0]:name==='dispatchNonBlockingTabNavigation'?args[1]:null,stack:new Error().stack?.split('\\n').slice(1,7).join('\\n')});
        return original.apply(this,args);
      };
    }
    const controller=window.aliveOverdrive;
    if(controller){const originalEvent=controller.onEvent;controller.onEvent=function(event){if(window.__aliveProbeEvents.length<5000)window.__aliveProbeEvents.push(event);return originalEvent?.call(this,event);};}
    return true;
  })()`);
  if(process.env.GIGACHAD_PROBE_FIXTURE==='1') {
    // Serve through the application's existing owned loopback asset server.
    // Arbitrary local files are correctly rejected by its guest allowlist.
    fixtureDirectory=path.join(root,'brains',`.alive-probe-${process.pid}`);
    fs.mkdirSync(fixtureDirectory,{recursive:false});
    const portals=await evaluate("window.gigachad.invoke('hybrid-brain-portals')");
    if(!portals.httpBaseUrl)throw new Error('Owned local fixture server unavailable');
    const base=portals.httpBaseUrl.replace(/\/$/,'')+`/.alive-probe-${process.pid}/`;
    report.fixtureUrls=[base+'habitat.html',base+'habitat-second.html'];
    const links=Array.from({length:8},(_,i)=>`<a href="${report.fixtureUrls[1]}#topic-${i}">Explore habitat topic ${i+1}</a>`).join('');
    const document=(name)=>`<!doctype html><meta charset="utf-8"><title>${name}</title><style>body{font:20px/1.6 system-ui;margin:0;background:#f1f4ef;color:#203027}main{max-width:1060px;margin:64px auto;padding:0 36px}h1{font-size:56px;line-height:1.1}p{max-width:780px}nav{display:flex;flex-wrap:wrap;gap:12px}a,button{background:white;color:#154737;border:1px solid #a0b9aa;border-radius:9px;padding:10px 16px}section{background:#fff;padding:24px;margin:24px 0;border-radius:16px}input{font:inherit;padding:8px}</style><main><p>GIGACHAD / isolated offline runtime verification</p><h1>${name}</h1><p>This ordinary webpage remains readable while the creature senses its links, moves across its elements, adapts its model, and changes the browser habitat.</p><section><h2>Observed environment</h2><p>Every capability outcome belongs in the inspector and logs. The content area belongs to the page and its creature.</p><label>Search this habitat <input placeholder="Find a topic"></label> <button onclick="this.textContent='Interaction recorded'">Inspect a specimen</button></section><nav>${links}</nav><section><h2>Living systems</h2><p>Body movement, perception, memory, learning, and autonomous actions share one bounded runtime. Pause stops new work; diagnostics report only their observed results.</p></section></main>`;
    for(const [name,title] of [['habitat.html','A place for the creature to explore'],['habitat-second.html','The next habitat']]) {
      const html=document(title);fs.writeFileSync(path.join(fixtureDirectory,name),html);fs.writeFileSync(path.join(outputDir,name),html);
    }
    const fixtureReady=await evaluate(`(async()=>{const old=getActiveTab();const t=createTab(${JSON.stringify(report.fixtureUrls[0])},{title:'Offline habitat'});switchTab(t.id);const ready=await ensureTabDomReady(t,5000);if(ready&&old&&old.id!==t.id)closeTab(old.id);return ready;})()`);
    if(!fixtureReady)throw new Error('Offline guest fixture did not become ready; performance results would be invalid');
  }
  await evaluate(`(() => {
    window.__aliveProbeErrors=[];
    addEventListener('error',e=>window.__aliveProbeErrors.push({type:'error',message:e.message}));
    addEventListener('unhandledrejection',e=>window.__aliveProbeErrors.push({type:'rejection',message:String(e.reason)}));
    window.__aliveProbeMetrics={frames:[],presentedIntervals:[],lastPresentedFrame:null,longTasks:[],started:performance.now(),last:null,active:true};
    const m=window.__aliveProbeMetrics;
    const tick=t=>{if(!m.active)return;if(m.last!==null&&m.frames.length<30000)m.frames.push(t-m.last);m.last=t;
      const st=typeof chromeCrawlerState!=='undefined'?chromeCrawlerState:null;
      if(st&&m.lastPresentedFrame!==st.frameCount){const gap=st.presentationIntervals?.at(-1);if(m.lastPresentedFrame!==null&&Number.isFinite(gap)&&m.presentedIntervals.length<12000)m.presentedIntervals.push(gap);m.lastPresentedFrame=st.frameCount;}
      requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
    try { const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.startTime>=m.started&&m.longTasks.length<1000)m.longTasks.push({start:e.startTime,duration:e.duration});});observer.observe({type:'longtask',buffered:true});window.__aliveProbeLongTaskObserver=observer;m.longTaskObserverInstalled=true; } catch(error){m.longTaskObserverInstalled=false;m.longTaskObserverError=String(error?.name||'Error');}
    window.alienAutoNavigateLinks=false;
    return true;
  })()`);
  report.checkpoints.before = await evaluate(snapshotSource);
  fs.writeFileSync(path.join(outputDir,'before.png'), (await win.webContents.capturePage()).toPNG());
  // Keep the standard new-tab document as an offline, consent-free test habitat.
  report.action = await evaluate(`(async()=>{
    await performWeirdAlienDomExperiment();
    if(typeof window.startAliveOverdrive==='function') {
      await window.startAliveOverdrive(); return {started:'startAliveOverdrive'};
    }
    if(window.aliveOverdrive && typeof window.aliveOverdrive.start==='function') {
      window.aliveOverdrive.start(); return {started:'aliveOverdrive.start'};
    }
    return {started:'baseline',reason:'Unified overdrive API is not installed yet'};
  })()`);
  if(process.env.GIGACHAD_PROBE_SWEEP==='1') {
    report.sweep=await evaluate(`(() => { const c=window.aliveOverdrive; if(!c)return []; return c.snapshot().jobs.map(job=>({id:job.id,requested:c.request(job.id)})); })()`);
  }
  if(process.env.GIGACHAD_PROBE_PROFILE==='1') {
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Profiler.enable');
    await win.webContents.debugger.sendCommand('Profiler.start');
  }
  if(process.env.GIGACHAD_PROBE_FRAMEPROFILE==='1') {
    await evaluate(`(() => {
      const p=window.__aliveFrameProfile={active:true,draws:[],neural:[],started:performance.now(),callbackCount:0,skippedCount:0,focusAtStart:document.hasFocus(),visibilityAtStart:document.visibilityState};
      const originalRaf=window.requestAnimationFrame.bind(window), wrappers=new WeakMap();
      window.requestAnimationFrame=function(callback){
        if(callback.name!=='stepChromeCrawler')return originalRaf(callback);
        let wrapped=wrappers.get(callback);
        if(!wrapped){
          wrapped=function(timestamp){
            if(!p.active)return callback(timestamp);
            const at=performance.now(),before=chromeCrawlerState.frameCount,neuralStart=p.neural.length;
            try{return callback(timestamp);}finally{
              const duration=performance.now()-at;p.callbackCount++;
              if(chromeCrawlerState.frameCount!==before&&p.draws.length<5000)p.draws.push({at,timestamp,duration,neuralMs:p.neural.slice(neuralStart).reduce((sum,n)=>sum+n.duration,0),focused:document.hasFocus()});
              else p.skippedCount++;
            }
          };
          wrappers.set(callback,wrapped);
        }
        return originalRaf(wrapped);
      };
      const originalNeural=humunculusRuntime.stepContinuousWorldModelAndFeralMorph60Hz;
      humunculusRuntime.stepContinuousWorldModelAndFeralMorph60Hz=function(...args){
        if(!p.active)return originalNeural.apply(this,args);
        const at=performance.now();try{return originalNeural.apply(this,args);}finally{if(p.neural.length<5000)p.neural.push({at,duration:performance.now()-at});}
      };
      return true;
    })()`);
  }
  await evaluate(`(() => { const m=window.__aliveProbeMetrics;m.frames.length=0;m.presentedIntervals.length=0;m.lastPresentedFrame=null;m.longTasks.length=0;m.last=null;m.started=performance.now();return true;})()`);
  report.checkpoints.measurementStart=await evaluate(snapshotSource);
  if(autosaveStages)report.autosaveStageWindow=await evaluate('window.__aliveAutosaveStageProbe.begin()');
  if(process.env.GIGACHAD_PROBE_TRACE==='1') {
    if(process.env.GIGACHAD_PROBE_FIXTURE!=='1')throw new Error('Compositor tracing requires the isolated offline fixture');
    report.trace={mode:'chromium-startup-switches',categories:traceCategories,before:processInventory(),durationSeconds:20,temporaryPath:process.env.GIGACHAD_PROBE_TRACE_FILE,
      caveat:'Startup tracing includes application warmup and adds overhead. Instrumented presentation timing is diagnostic only, not an uninstrumented performance qualification. The fixture-only startup capture is limited to 20 seconds.'};
    report.limitations.push(report.trace.caveat);
    traceStage('startup-tracing-measurement-begins');
  }
  await sleep(durationMs);
  if(autosaveStages) {
    report.autosaveStageWindow={...report.autosaveStageWindow,...await evaluate(`(() => {
      const ended=window.__aliveAutosaveStageProbe.end(),m=window.__aliveProbeMetrics;
      for(const e of window.__aliveProbeLongTaskObserver?.takeRecords?.()||[])if(e.startTime>=m.started&&m.longTasks.length<1000)m.longTasks.push({start:e.startTime,duration:e.duration});
      return ended;
    })()`)};
  }
  if(report.trace) {
    traceStage('measurement-ended');
    // Chromium owns the timed startup trace; never invoke Electron's affected
    // contentTracing callbacks. The Node launcher copies its local file later.
    report.checkpoints.after=await evaluate(snapshotSource);
    traceStage('measurement-snapshot-captured');
    report.trace.after=processInventory();
    report.trace.completedAt=Date.now();
    traceStage('measurement-completed-awaiting-launcher-copy');
  }
  report.focusAfter = {native:win.isFocused(),renderer:await evaluate('({focused:document.hasFocus(),visibility:document.visibilityState})')};
  if(process.env.GIGACHAD_PROBE_FRAMEPROFILE==='1') {
    report.frameProfile=await evaluate(`(() => {const p=window.__aliveFrameProfile;p.active=false;return {...p,ended:performance.now(),focusAtEnd:document.hasFocus(),visibilityAtEnd:document.visibilityState};})()`);
    const quantiles=values=>{const v=values.slice().sort((a,b)=>a-b);return {count:v.length,total:v.reduce((a,b)=>a+b,0),p50:v[Math.floor(v.length*.5)]??null,p95:v[Math.floor(v.length*.95)]??null,p99:v[Math.floor(v.length*.99)]??null,max:v.at(-1)??null};};
    const draws=report.frameProfile.draws;
    report.frameProfile.summary={
      drawWorkMs:quantiles(draws.map(d=>d.duration)),neuralWorkMs:quantiles(report.frameProfile.neural.map(n=>n.duration)),
      drawWithoutNeuralMs:quantiles(draws.map(d=>d.duration-d.neuralMs)),
      presentationGapMs:quantiles(draws.slice(1).map((d,i)=>d.at-draws[i].at)),
      nonCallbackGapMs:quantiles(draws.slice(1).map((d,i)=>d.at-draws[i].at-draws[i].duration)),
      focusedDraws:draws.filter(d=>d.focused).length,
      slowGaps:draws.slice(1).map((d,i)=>({gapMs:d.at-draws[i].at,previousWorkMs:draws[i].duration,previousNeuralMs:draws[i].neuralMs,at:d.at})).sort((a,b)=>b.gapMs-a.gapMs).slice(0,20)
    };
  }
  if(process.env.GIGACHAD_PROBE_PROFILE==='1') {
    const {profile}=await win.webContents.debugger.sendCommand('Profiler.stop');
    fs.writeFileSync(path.join(outputDir,'renderer.cpuprofile'),JSON.stringify(profile));
    const nodes=new Map(profile.nodes.map(n=>[n.id,{...n,selfMs:0}]));
    for(let i=0;i<(profile.samples||[]).length;i++) {
      const n=nodes.get(profile.samples[i]);if(n)n.selfMs+=(profile.timeDeltas?.[i]||0)/1000;
    }
    report.cpuProfile=Array.from(nodes.values()).sort((a,b)=>b.selfMs-a.selfMs).slice(0,30).map(n=>({function:n.callFrame.functionName,selfMs:n.selfMs,url:n.callFrame.url,line:n.callFrame.lineNumber+1}));
    win.webContents.debugger.detach();
  }
  if(!report.checkpoints.after)report.checkpoints.after = await evaluate(snapshotSource);
  report.autonomousTrace=await evaluate('({navigation:window.__aliveProbeNavigation||[],events:window.__aliveProbeEvents||[],domInputs:window.__aliveProbeDomInputs||[]})');
  if(process.env.GIGACHAD_PROBE_AUTONOMOUS==='1') {
    report.autonomousCoverage={sweepRequested:process.env.GIGACHAD_PROBE_SWEEP==='1',jobs:(report.checkpoints.after.overdrive?.jobs||[]).map(j=>({id:j.id,runCount:j.runCount,completedCount:j.completedCount,errorCount:j.errorCount,status:j.status,lastError:j.lastError})),expectedCapabilities:declaredCapabilityIds.length,expectedIds:declaredCapabilityIds,requiredIds:requiredCapabilityIds};
  }
  report.gpuStatusAfter = app.getGPUFeatureStatus();
  fs.writeFileSync(path.join(outputDir,'after.png'), (await win.webContents.capturePage()).toPNG());
  report.guest = await evaluate(`(async()=>{
    const t=getActiveTab(); if(!t?.domReady)return null;
    return t.wv.executeJavaScript('({canvas:!!document.getElementById("__humunculus_alife_canvas"),hud:!!document.getElementById("__gigachad_alien_hud"),hudDisplay:document.getElementById("__gigachad_alien_hud")?getComputedStyle(document.getElementById("__gigachad_alien_hud")).display:null,bodyChildren:document.body.children.length,frames:window.__humunculusFrameCount||null})');
  })()`);
  report.guestViews = await evaluate(`Promise.all(tabs.slice(0,4).map(async t=>{
    if(!t.domReady)return {tab:t.id,url:t.url,ready:false};
    try {
      const state=await Promise.race([t.wv.executeJavaScript('(()=>{const c=document.getElementById("__humunculus_alife_canvas");if(!c)return {canvas:false};const s=getComputedStyle(c),r=c.getBoundingClientRect();return {canvas:true,display:s.display,visibility:s.visibility,opacity:s.opacity,width:r.width,height:r.height,inlineStyle:c.getAttribute("style"),visible:s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)>0&&r.width>0&&r.height>0};})()'),new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),1000))]);
      return {tab:t.id,url:t.url,active:t.id===activeTabId,ready:true,...state};
    } catch(error){return {tab:t.id,error:error.message};}
  }))`);
  if(process.env.GIGACHAD_PROBE_NAVIGATION==='1' && report.fixtureUrls) {
    report.navigation=await evaluate('('+verifyOfflineNavigation.toString()+')('+JSON.stringify(report.fixtureUrls)+')');
  }
  await evaluate(`(() => { window.__aliveProbeMetrics.active=false; if(window.aliveOverdrive?.stop)window.aliveOverdrive.stop(); if(typeof stopAlienBrainAutonomy==='function')stopAlienBrainAutonomy(); return true; })()`);
  report.checkpoints.stopped=await evaluate(snapshotSource);
  await sleep(3000);
  report.checkpoints.afterStop=await evaluate(snapshotSource);
  if(verifyWorker) {
    // Preserve natural settling evidence above, then await the serializer before
    // asking the independent storage readback to match the paused current state.
    report.autosaveFlush=await evaluate(`Promise.resolve(window.aliveAutosave?.flush?.('probe-verification'))`);
    report.checkpoints.afterAutosaveFlush=await evaluate(snapshotSource);
    if(report.checkpoints.afterAutosaveFlush.autosave?.storageMode==='async-main') {
      const durablePath=path.join(app.getPath('userData'),'alive-genome-v1.snapshot');
      const durable=readDurableGenomeRecord(durablePath);
      const p=durable.payload;
      const selected={savedAt:p.savedAt,simulationTick:p.simulationTick,authorityEpoch:p.authorityEpoch,policyCid:p.policyCid,bodyCid:p.bodyRecipe?.bodyCid,W_actor:p.W_actor};
      report.canonicalGenomeReadback={independent:durable.evidence,comparison:await evaluate(`(p=>{const h=humunculusRuntime;return {actorValuesChecked:p.W_actor?.length||0,actorMatchesCurrentRounded:Array.isArray(p.W_actor)&&p.W_actor.length===h.W_actor.length&&p.W_actor.every((v,i)=>v===Number(h.W_actor[i].toFixed(5))),tickMatchesCurrent:p.simulationTick===h.simulationTick,policyMatchesCurrent:p.policyCid===h.policyCid,epochMatchesCurrent:p.authorityEpoch===h.authorityEpoch,bodyMatchesCurrent:p.bodyCid===h.bodyRecipe?.bodyCid};})(${JSON.stringify(selected)})`)};
      fs.copyFileSync(durablePath,path.join(outputDir,'verified-autosave.snapshot'));
      const pausedMatch = ['actorMatchesCurrentRounded','tickMatchesCurrent','policyMatchesCurrent','epochMatchesCurrent','bodyMatchesCurrent']
        .every(key => report.canonicalGenomeReadback.comparison[key] === true);
      report.limitations.push('Canonical autosave was independently read and hash/length checked after the paused flush attempt; selected actor/identity fields ' +
        (pausedMatch ? 'match' : 'do not all match') + ' the paused model. Flush success and revision agreement are checked separately. Separate process-restart verification covers broader hydration.');
    }
  }
  if(process.env.GIGACHAD_PROBE_RESTORE==='1') {
    report.restore=await evaluate(`(async()=>{
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('gigachad-alive-checkpoints',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      let record;try{record=await new Promise((resolve,reject)=>{const r=db.transaction('snapshots','readonly').objectStore('snapshots').get('latest');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}
      const tensor=record?.tensors?.find(t=>t.group==='policy'&&t.path.join('.')==='W_actor');
      if(!tensor)throw new Error('Persisted actor tensor missing');
      const expected=new Float32Array(tensor.buffer)[0];
      const couplingTensors=['aliveCouplingWeights','aliveCouplingGateLogits'].map(name=>{
        const saved=record?.tensors?.find(t=>t.group==='policy'&&t.path.join('.')===name);
        if(!saved)throw new Error('Persisted neural coupling tensor missing: '+name);
        const expected=new Float32Array(saved.buffer)[0];humunculusRuntime[name][0]=expected+.5;
        return {name,expected,perturbed:humunculusRuntime[name][0]};
      });
      humunculusRuntime.W_actor[0]=expected+.75;
      const perturbed=humunculusRuntime.W_actor[0];
      const result=await window.restoreAliveCheckpoint();
      return {cid:record.cid,expected,perturbed,restored:humunculusRuntime.W_actor[0],matched:humunculusRuntime.W_actor[0]===expected,coupling:couplingTensors.map(t=>({...t,restored:humunculusRuntime[t.name][0],matched:humunculusRuntime[t.name][0]===t.expected})),result};
    })()`);
  }
  if (process.env.GIGACHAD_PROBE_PANELS==='1') {
    report.panels=[];
    report.checkpoints.beforePanels=await evaluate(snapshotSource);
    for (const panel of ['controls','inspect','logs']) {
      await evaluate(`window.aliveWorkspace?.openPanel(${JSON.stringify(panel)})`);
      await sleep(panel==='inspect'?1000:250);
      fs.writeFileSync(path.join(outputDir,`${panel}.png`),(await win.webContents.capturePage()).toPNG());
      report.panels.push({panel,screenshot:path.join(outputDir,`${panel}.png`),snapshot:await evaluate(snapshotSource)});
      if(panel==='controls')report.controlsContent=await evaluate(`(()=>{
        const summary=document.querySelector('#alive-research-status'),list=document.querySelector('#alive-capability-list');
        if(!summary||!list)return {ok:false,reason:'Controls content missing'};
        const style=getComputedStyle(summary),rect=summary.getBoundingClientRect(),listRect=list.getBoundingClientRect();
        const lineHeight=parseFloat(style.lineHeight),contentHeight=rect.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-parseFloat(style.borderTopWidth)-parseFloat(style.borderBottomWidth);
        const lines=[...summary.childNodes].flatMap(node=>{if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())return [];const range=document.createRange();range.selectNodeContents(node);return [...range.getClientRects()].map(r=>({top:r.top,bottom:r.bottom}));});
        return {ok:Number.isFinite(lineHeight)&&contentHeight>=lineHeight-.5&&listRect.height>lineHeight&&listRect.top>=rect.bottom&&listRect.bottom<=innerHeight+1,
          summary:{height:rect.height,contentHeight,lineHeight,flexShrink:style.flexShrink,text:summary.textContent,lines},
          list:{height:listRect.height,top:listRect.top,bottom:listRect.bottom,clientHeight:list.clientHeight,scrollHeight:list.scrollHeight,overflowY:getComputedStyle(list).overflowY}};
      })()`);
    }
    await evaluate('window.aliveWorkspace?.closePanels(true)');
  }
  if(authorityChecks) {
    report.authorityVerification=await evaluate('('+verifyActualGuestAuthority.toString()+')('+JSON.stringify(report.fixtureUrls)+')');
    report.limitations.push('Authority fault-injection checks run after the measured performance interval and use only owned offline fixture guests.');
  }
  if(navigationCacheChecks) {
    report.navigationCacheVerification=await evaluate(navigationCacheExpression({fixtureUrl:report.fixtureUrls[1],ownedFixtureUrls:report.fixtureUrls}));
    report.limitations.push('Navigation-cache checks run after Pause on one owned offline guest, outside the measured performance interval.');
  }
  if(splitHabitatChecks) {
    report.splitHabitatVerification=await evaluate(splitHabitatExpression({fixtureUrls:report.fixtureUrls}));
    report.splitHabitatVerification.assessment=assessSplitHabitat(report.splitHabitatVerification);
    if(report.splitHabitatVerification.screenshotReady) {
      const screenshot=path.join(outputDir,'split-habitat.png');
      fs.writeFileSync(screenshot,(await win.webContents.capturePage()).toPNG());
      report.splitHabitatVerification.screenshot=screenshot;
    }
    report.limitations.push('Split-habitat checks run after performance, Pause and optional restore/panel phases on owned offline fixtures at 25/50/75 ratios. They do not establish public-web navigation performance or independent agents in each pane.');
  }
  if(publicNavigation) {
    const publicReport=report.publicNavigation={requested:true,separatePhase:true,durationLimitMs:publicDurationMs,
      seedURL:process.env.GIGACHAD_PROBE_PUBLIC_SEED_URL||'https://en.wikipedia.org/wiki/Artificial_life',
      providerCoverage:false,torCoverage:false,adaptation:publicAdaptation};
    const policy=require(path.join(root,'systems/alive-research-policy.js'));
    try {
      const {session}=require('electron');
      publicReport.isolation={userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),
        profileCreatedBySmoke:path.basename(app.getPath('userData')).startsWith('gigachad-smoke-'),
        cookieCountBefore:(await session.fromPartition('persist:gigachad_vault').cookies.get({})).length,
        mainProcessProvidersBlocked:true,existingAuthenticatedSessionSupplied:false};
      if(!publicReport.isolation.profileCreatedBySmoke||publicReport.isolation.cookieCountBefore!==0)throw new Error('Public phase requires this probe\'s fresh smoke profile with no pre-existing cookies');
      if(!publicNetworkGate.publicURL(publicReport.seedURL))throw new Error('Public seed is outside the production public non-onion URL policy');
      publicNetworkGate.open(publicDurationMs);
      publicReport.renderer=await Promise.race([
        evaluate('('+verifyPublicResearchNavigation.toString()+')('+JSON.stringify({durationMs:publicDurationMs,seedURL:publicReport.seedURL,fixtureUrls:report.fixtureUrls||[]})+',('+publicNavigationSupport.capturePauseDiagnostics.toString()+'),('+publicNavigationSupport.assessPauseEvidence.toString()+'))'),
        sleep(publicDurationMs+25000).then(()=>{throw new Error('Public renderer phase exceeded its bounded deadline');})
      ]);
    }catch(error){publicReport.error=String(error?.stack||error).slice(0,2400);}
    finally {
      publicNetworkGate.close('public-phase-finally');
      publicReport.stoppedGuestLoads=[];
      for(const contents of webContents.getAllWebContents())if(!contents.isDestroyed()&&contents.getType()==='webview'){
        try{contents.stop();publicReport.stoppedGuestLoads.push(contents.id);}catch(_){}
      }
      try {
        // Observe the original Pause and its bounded retries; never reset the
        // authority revision merely to obtain a fresh cleanup attempt. The
        // helper issues Stop only if a renderer failure left autonomy running.
        const carryTokens=publicReport.renderer?.finalPause?.prePause?.tokens||publicReport.renderer?.after?.authority?.leases||[];
        publicReport.finalHostPause=await Promise.race([evaluate('('+publicNavigationSupport.capturePauseDiagnostics.toString()+')('+JSON.stringify({label:'public-host-final-observation',carryTokens,requestPause:true})+')'),sleep(18000).then(()=>{throw new Error('Final read-only Pause observation exceeded its cleanup deadline');})]);
      }catch(error){publicReport.cleanupError=String(error?.message||error);}
      publicReport.network=publicNetworkGate.snapshot();
      publicReport.confirmedArrivals=publicNavigationSupport.correlateConfirmedArrivals(publicReport.renderer||{},publicReport.network,policy.normalizeURL);
      const phase=publicReport.renderer,confirmed=publicReport.confirmedArrivals;
      publicReport.researchLearning={...publicNavigationSupport.researchTensorEvidence(phase?.before?.weights,phase?.after?.weights,policy.dimensions),modelUpdateDelta:(phase?.after?.research?.modelUpdates||0)-(phase?.before?.research?.modelUpdates||0)};
      publicReport.pauseProofs={interim:publicNavigationSupport.assessPauseEvidence(phase?.finalPause),final:publicNavigationSupport.assessPauseEvidence(publicReport.finalHostPause)};
      publicReport.pauseProofs.definitive='final read-only observation carrying every captured pre-Pause token';
      publicReport.ok=Boolean(!publicReport.error&&!publicReport.cleanupError&&phase?.completed&&!phase.error&&!phase.cleanupError&&confirmed.length>=2&&phase.maxTabs<=4&&
        publicReport.pauseProofs.final.ok&&
        publicReport.network.enabled===false&&Object.values(phase.after?.weights||{}).every(value=>value.nonFinite===0)&&
        publicReport.researchLearning.finiteShapes&&publicReport.researchLearning.changedTensors.length>0&&publicReport.researchLearning.modelUpdateDelta>=2);
      if(!publicReport.ok)publicReport.failureReason=publicReport.error||phase?.error||publicReport.cleanupError||phase?.cleanupError||
        (!publicReport.pauseProofs.final.ok?'Final Pause cleanup is not proved: '+publicReport.pauseProofs.final.reasons.join('; '):
        confirmed.length<2?`Only ${confirmed.length} autonomous arrivals had matching current guest authority, committed public document, uncached successful mainFrame network completion and research learning evidence`:
        !publicReport.researchLearning.finiteShapes?'Research model tensor shapes or finite digests were not preserved':
        !publicReport.researchLearning.changedTensors.length?'Research update counters advanced without a measured trainable-tensor digest change':
        publicReport.researchLearning.modelUpdateDelta<2?'Fewer than two research model updates were observed':'Public phase did not complete within its tab, pause, settlement or network-closure contract');
      publicReport.finalDocumentScreenshot={meaning:'Final document after the public phase paused; may be loading or failed. The screenshot is not successful-arrival evidence.'};
      try {
        if(win.isDestroyed())throw new Error('Verification window no longer exists');
        const capture=await Promise.race([win.webContents.capturePage(),sleep(5000).then(()=>null)]);
        if(!capture)throw new Error('Final document capture timed out');
        const screenshotPath=path.join(outputDir,'public-navigation.png');fs.writeFileSync(screenshotPath,capture.toPNG());
        publicReport.finalDocumentScreenshot.path=screenshotPath;
      }catch(error){publicReport.finalDocumentScreenshot.error=String(error?.message||error).slice(0,250);}
      fs.writeFileSync(path.join(outputDir,'public-navigation.json'),JSON.stringify(publicReport,null,2));
    }
    report.limitations.push('Separate bounded public browsing phase uses ordinary production research policy on a fresh smoke profile; it does not qualify configured language-model providers, authenticated browsing, Tor, or onion reachability.');
  }
  const before=report.checkpoints.before, after=report.checkpoints.after;
  const sorted=(after.metrics?.frames||[]).slice().sort((a,b)=>a-b);
  const percentile=p=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]:null;
  const presentation=(after.presentation.intervals||[]).filter(Number.isFinite).slice().sort((a,b)=>a-b);
  const presentationPercentile=p=>presentation.length?presentation[Math.min(presentation.length-1,Math.floor(presentation.length*p))]:null;
  const presentedFrames=(after.presentation.frameCount||0)-(report.checkpoints.measurementStart.presentation.frameCount||0);
  const measuredDuration=after.at-report.checkpoints.measurementStart.at;
  const fullPresentation=(after.metrics?.presentedIntervals||[]).filter(Number.isFinite).slice().sort((a,b)=>a-b);
  const fullPresentationPercentile=p=>fullPresentation.length?fullPresentation[Math.min(fullPresentation.length-1,Math.floor(fullPresentation.length*p))]:null;
  report.summary={
    frameSamples:sorted.length,frameIntervalMs:{p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),max:sorted.at(-1)||null},
    presentation:{frames:presentedFrames,durationMs:measuredDuration,averageFps:presentedFrames/(measuredDuration/1000),rollingSamples:presentation.length,p50Ms:presentationPercentile(.5),p95Ms:presentationPercentile(.95),p99Ms:presentationPercentile(.99)},
    fullPresentation:{samples:fullPresentation.length,p50Ms:fullPresentationPercentile(.5),p95Ms:fullPresentationPercentile(.95),p99Ms:fullPresentationPercentile(.99),maxMs:fullPresentation.at(-1)||null},
    longTasks:after.metrics?.longTasks?.length||0,
    totalLongTaskMs:(after.metrics?.longTasks||[]).reduce((sum,x)=>sum+x.duration,0),
    weightDeltas:Object.fromEntries(Object.keys(before.weights).map(k=>[k,{sum:(after.weights[k]?.sum||0)-(before.weights[k]?.sum||0),squared:(after.weights[k]?.squared||0)-(before.weights[k]?.squared||0),nonFinite:after.weights[k]?.nonFinite}])),
    backpropDelta:(after.backprop||0)-(before.backprop||0),stdpDelta:(after.stdpUpdates||0)-(before.stdpUpdates||0),
    neuralCoupling:{sources:after.neuralCoupling?.sourceCount||0,steps:(after.neuralCoupling?.steps||0)-(before.neuralCoupling?.steps||0),feedbackUpdates:(after.neuralCoupling?.feedbackUpdates||0)-(before.neuralCoupling?.feedbackUpdates||0),trainableParameters:after.neuralCoupling?.trainableParameters||0},
    rendererErrors:after.errors.length,
    runsAfterStop:(report.checkpoints.afterStop.overdrive?.jobs||[]).reduce((sum,j)=>sum+j.runCount,0)-(report.checkpoints.stopped.overdrive?.jobs||[]).reduce((sum,j)=>sum+j.runCount,0),
    backpropAfterStop:(report.checkpoints.afterStop.backprop||0)-(report.checkpoints.stopped.backprop||0),
    simulationTicksAfterStop:(report.checkpoints.afterStop.simulationTick||0)-(report.checkpoints.stopped.simulationTick||0),
    jobStatuses:(after.overdrive?.jobs||[]).map(j=>({id:j.id,status:j.status,runCount:j.runCount,errorCount:j.errorCount,lastError:j.lastError})),
    unifiedRuntimePresent:Boolean(after.overdrive),guestCanvas:Boolean(report.guest?.canvas)
  };
  report.completedAt=new Date().toISOString();
  if(autosaveStages)report.autosaveStages=await evaluate('window.__aliveAutosaveStageProbe.snapshot()');
  report.completeNavigationTrace=await evaluate('window.__aliveProbeNavigation||[]');
  report.sourceHashesAtEnd=Object.fromEntries(Object.keys(report.sourceHashes).map(name=>[name,sourceHash(name)]));
  report.changedSources=Object.keys(report.sourceHashes).filter(name=>report.sourceHashes[name]!==report.sourceHashesAtEnd[name]);
  const failures=[];
  if(specialistFusionChecks) {
    report.specialistFusionVerification=assessSpecialistFusion(after,{requireAllFive:true});
    if(!report.specialistFusionVerification.ok)failures.push('Actual specialist fusion was not proved: '+report.specialistFusionVerification.reasons.join('; '));
    if(report.phasesRequested.restore) {
      const restored=report.restore?.result?.evidence;
      report.specialistFusionVerification.checkpointRoster={expectedTensors:560,expectedBytes:5306148,observedTensors:restored?.tensorCount??null,observedBytes:restored?.bytes??null,
        basis:'Previously qualified unchanged model tensor roster; specialist fusion adds derived private state only'};
      if(restored?.tensorCount!==560||restored?.bytes!==5306148)failures.push('Specialist fusion changed the previously qualified checkpoint tensor roster');
    }
  }
  if(publicNavigation&&!report.publicNavigation?.ok)failures.push('Bounded public navigation verification failed: '+(report.publicNavigation?.failureReason||'no complete evidence'));
  if(splitHabitatChecks&&(!report.splitHabitatVerification?.assessment?.ok||!report.splitHabitatVerification?.screenshot||!fs.existsSync(report.splitHabitatVerification.screenshot)))failures.push('Actual split-habitat verification failed: '+(report.splitHabitatVerification?.assessment?.reasons?.join('; ')||'complete evidence and screenshot missing'));
  const observedCapabilityIds=(after.overdrive?.jobs||[]).map(job=>job.id);
  if(new Set(declaredCapabilityIds).size!==declaredCapabilityIds.length||new Set(observedCapabilityIds).size!==observedCapabilityIds.length||requiredCapabilityIds.some(id=>!declaredCapabilityIds.includes(id)||!observedCapabilityIds.includes(id))||declaredCapabilityIds.some(id=>!observedCapabilityIds.includes(id))||observedCapabilityIds.some(id=>!declaredCapabilityIds.includes(id)))failures.push('Capability registry omitted a required capability or differs from its declared IDs');
  if(authorityChecks&&!report.authorityVerification?.ok)failures.push('Actual guest authority verification failed: '+(report.authorityVerification?.error||report.authorityVerification?.cleanupError||report.authorityVerification?.missingCases?.join(', ')||'no complete evidence'));
  if(inputIsolation) {
    report.inputIsolation.focusableAtEnd=win.isFocusable();
    report.inputIsolation.focusedAtEnd=win.isFocused();
    report.inputIsolation.nativeInputCount=report.inputEvents.length;
    report.inputIsolation.trustedMeasuredDomInputCount=report.autonomousTrace?.domInputs?.filter(event=>event.isTrusted).length||0;
    if(!report.inputIsolation.appliedBeforeShow||report.inputIsolation.focusable||report.inputIsolation.focusableAtEnd||report.inputIsolation.focusedAtEnd||report.inputIsolation.nativeInputCount||report.inputIsolation.trustedMeasuredDomInputCount)failures.push('Requested native input isolation was not maintained');
  }
  if(runtimeProvenance.matchesLauncherExecutable===false)failures.push('Actual Electron executable differs from the launcher resolution');
  if(archiveRecord&&(runtimeProvenance.matchesArchiveVersion!==true||runtimeProvenance.matchesArchiveExecutable!==true))failures.push('Actual Electron runtime differs from the supplied archive provenance');
  if(autosaveStages) {
    const stages=report.autosaveStages;
    if(!stages?.installed||!stages.completed||stages.errors?.length)failures.push('Autosave stage diagnostic did not record a complete natural save');
    for(const name of ['payloadCapture','authenticNativeSnapshot','workerPostMessage','storageSetItem','storageGetItem'])if(!(stages?.summary?.[name]?.count>0))failures.push('Autosave stage was not observed: '+name);
    if(!['authenticCaptureStatePayload','authenticExportState'].some(name=>stages?.summary?.[name]?.count>0))failures.push('Authentic state capture/export was not observed');
    if(!['portedCaptureLearnedStatePayload','portedCaptureStatePayload','portedExportLearnedState'].some(name=>stages?.summary?.[name]?.count>0))failures.push('Ported learned-state capture/export was not observed');
    if(!report.earlyCloseInstrumentation)failures.push('Early native-close diagnostic preload was not installed');
  }
  if(report.changedSources.length)failures.push('Application sources changed during verification');
  if(!report.summary.guestCanvas)failures.push('Guest creature canvas missing');
  if(!after.layout.hostCanvas||after.layout.hostCanvas.display==='none'||after.layout.hostCanvas.width<=0)failures.push('Visible host creature canvas missing');
  if(!after.overdrive?.jobs?.some(j=>j.id==='dom-body'&&j.completedCount>0))failures.push('Actual DOM observation/body adapter did not complete');
  if(!report.summary.unifiedRuntimePresent)failures.push('Unified runtime missing');
  const coupling=after.neuralCoupling,contract=report.neuralCouplingContract;
  const observedSources=coupling?.sources||[],observedIds=observedSources.map(source=>source.id);
  if(new Set(contract.expectedIds).size!==contract.expectedIds.length||contract.requiredIds.some(id=>!contract.expectedIds.includes(id)))failures.push('Neural coupling registry omitted a required model source');
  if(!coupling||coupling.sourceCount!==contract.expectedIds.length||observedIds.length!==contract.expectedIds.length||new Set(observedIds).size!==observedIds.length||contract.expectedIds.some(id=>!observedIds.includes(id))||observedSources.some(source=>!source.available||!Number.isFinite(source.gate))||report.summary.neuralCoupling.feedbackUpdates<=0)failures.push('Every declared neural coupling source and observed-outcome learning must be exercised');
  if(coupling?.trainableParameters!==contract.expectedTrainableParameters||after.weights.couplingWeights?.length!==contract.expectedIds.length*contract.featureDimension||after.weights.couplingGateLogits?.length!==contract.expectedIds.length)failures.push('Neural coupling tensor shapes do not match the declared source registry');
  if(after.errors.length)failures.push('Renderer exceptions');
  if(report.summary.runsAfterStop||report.summary.backpropAfterStop||report.summary.simulationTicksAfterStop)failures.push('Work continued after pause');
  if(report.guestViews?.some(t=>t.active&&t.visible))failures.push('Duplicate guest creature canvas is visible beneath the host colony');
  if(Object.values(after.weights).some(w=>w&&w.nonFinite))failures.push('Non-finite model weights');
  if(report.navigation&&(report.navigation.portal?.status!=='completed'||report.navigation.handoff?.status!=='completed'||!report.navigation.portal?.evidence?.url?.startsWith(report.navigation.target)||!report.navigation.after?.ready||report.navigation.finalPause?.running!==false||report.navigation.finalPause?.rawSettled!==true||report.navigation.cleanupError))failures.push('Requested offline portal/handoff integration failed: '+(report.navigation.scopeBlocked?.reason||report.navigation.error||report.navigation.cleanupError||report.navigation.handoff?.lastError||'required navigation evidence missing'));
  if(report.phasesRequested.restore&&!report.restore)failures.push('Requested checkpoint restore result is missing');
  if(navigationCacheChecks&&report.navigationCacheVerification?.ok!==true)failures.push('Requested actual navigation-cache verification failed: '+(report.navigationCacheVerification?.error||report.navigationCacheVerification?.cleanup?.error||'required fragment/reload evidence missing'));
  if(report.restore&&(!report.restore.matched||report.restore.result?.status!=='completed'))failures.push('Checkpoint did not restore persisted tensor bytes');
  if(report.restore?.coupling?.some(t=>!t.matched))failures.push('Checkpoint did not restore persisted neural coupling coefficients');
  if(report.phasesRequested.panels) {
    report.panelReservations=['controls','inspect','logs'].map(panel=>{
      const entry=report.panels?.find(item=>item.panel===panel);
      return {...publicNavigationSupport.assessPanelReservation(panel,entry?.snapshot?.layout),screenshotPresent:Boolean(entry?.screenshot&&fs.existsSync(entry.screenshot))};
    });
    for(const panel of report.panelReservations)if(!panel.ok||!panel.screenshotPresent)failures.push('Requested '+panel.panel+' panel did not prove visible reserved page space with a screenshot');
    if(!report.controlsContent?.ok)failures.push('Controls summary or scrolling capability list collapsed');
  }
  const inspector=report.panels?.find(p=>p.panel==='inspect')?.snapshot,pausedPanelBaseline=report.checkpoints.beforePanels;
  if(report.phasesRequested.panels&&(!inspector||!pausedPanelBaseline))failures.push('Requested paused Inspect model invariance evidence is missing');
  if(inspector&&pausedPanelBaseline&&((inspector.backprop||0)!==(pausedPanelBaseline.backprop||0)||inspector.simulationTick!==pausedPanelBaseline.simulationTick))failures.push('Paused inspector stepped the model');
  if(report.autonomousCoverage) {
    const coverage=report.autonomousCoverage;
    if(coverage.sweepRequested)failures.push('Autonomous soak incorrectly used a manual job sweep');
    if(coverage.jobs.length!==coverage.expectedCapabilities||coverage.expectedIds.some(id=>!coverage.jobs.some(job=>job.id===id)))failures.push('Autonomous capability registry differs from the declared capabilities');
    const missed=coverage.jobs.filter(j=>!['portal-jump','epoch-handoff'].includes(j.id)&&j.runCount<1);
    if(missed.length)failures.push('Autonomous capabilities never attempted: '+missed.map(j=>j.id).join(', '));
    if(coverage.jobs.some(j=>j.errorCount>0||['error','timeout'].includes(j.status)))failures.push('Autonomous job failure or timeout');
  }
  if(verifyWorker) {
    const saved=report.checkpoints.afterAutosaveFlush||report.checkpoints.afterStop;
    if(!saved.autosave||saved.autosave.flushAttempts<1||saved.autosave.pending||saved.autosave.flushing)failures.push('Autonomous autosave did not flush and settle');
    if(saved.autosave?.workerMode!=='worker'||!(saved.autosave?.workerFlushes>0)||saved.autosave?.fallbackCount!==0)failures.push('Worker autosave was not used without synchronous fallback');
    if(saved.autosave?.persistenceVerified!==true||!(saved.autosave?.verifiedWrites>0)||report.autosaveFlush?.persistenceVerified!==true)failures.push('Worker autosave did not verify persisted output');
    const persisted=saved.autosave?.storageMode==='async-main'?report.canonicalGenomeReadback?.comparison:saved.legacyGenome;
    if(!persisted?.tickMatchesCurrent||!persisted?.policyMatchesCurrent||!persisted?.actorMatchesCurrentRounded||!persisted?.epochMatchesCurrent||!persisted?.bodyMatchesCurrent)failures.push('Settled autosave differs from the paused current model');
    if(saved.autosave?.storageMode==='async-main'&&report.canonicalGenomeReadback?.independent?.revision!==report.autosaveFlush?.revision)failures.push('Canonical autosave revision differs from the acknowledged paused flush');
  }
  if (verifyTrainer) {
    const initial=report.checkpoints.before, running=report.checkpoints.after;
    const stopped=report.checkpoints.stopped, settled=report.checkpoints.afterStop;
    const state=value=>value?.workerTrainer;
    const validTarget=value=>value?.workerTarget?.length===16&&value.workerTarget.nonFinite===0&&value.workerTarget.sample.length===16;
    const sameTarget=(a,b)=>validTarget(a)&&validTarget(b)&&a.workerTarget.sample.every((value,index)=>Object.is(value,b.workerTarget.sample[index]));
    const cases=[
      {id:'full-app-worker-applied',passed:Boolean(state(initial)&&state(running)?.active&&state(running).applied>state(initial).applied&&state(running).committedEpoch>state(initial).committedEpoch)},
      {id:'finite-target-changed-while-running',passed:validTarget(initial)&&validTarget(running)&&!sameTarget(initial,running)},
      {id:'pause-retired-worker',passed:Boolean(state(stopped)&&state(settled)&&state(stopped).active===false&&state(settled).active===false&&state(stopped).pendingJobId===null&&state(settled).pendingJobId===null)},
      {id:'pause-kept-target-and-clock-unchanged',passed:Boolean(sameTarget(stopped,settled)&&state(stopped).applied===state(settled).applied&&state(stopped).committedEpoch===state(settled).committedEpoch&&state(stopped).generation===state(settled).generation)},
      {id:'no-worker-faults-or-timeouts',passed:[initial,running,stopped,settled].every(value=>state(value)&&state(value).faults===0&&state(value).timeouts===0)}
    ];
    report.workerTrainerVerification={requested:true,ok:cases.every(item=>item.passed),cases,
      initial:state(initial),running:state(running),stopped:state(stopped),settled:state(settled),
      targetBefore:initial.workerTarget,targetRunning:running.workerTarget,targetStopped:stopped.workerTarget,targetSettled:settled.workerTarget,
      scope:'Full production application and constructor, natural worker dispatch and native replies; unchanged 16-value target and committed epoch during the existing three-second production Pause interval. Running target changes also include synchronous model updates; worker application is established by its committed reply counter.'};
    if(!report.workerTrainerVerification.ok)failures.push('Requested full-application worker verification failed: '+cases.filter(item=>!item.passed).map(item=>item.id).join(', '));
  }
  report.requiredFailures=failures;report.ok=failures.length===0&&!report.renderProcessGone;
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
  console.log('ALIVE_PROBE '+JSON.stringify({outputDir,ok:report.ok,requiredFailures:failures,...report.summary}));
  cleanupFixture();
  probeCompleted=true;
  app.exit(report.ok?0:1);
}

main().catch(error=>{
  report.fatal=error.stack||String(error);
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
  console.error('ALIVE_PROBE_FAILED '+report.fatal);
  cleanupFixture();
  probeCompleted=true;
  app.exit(1);
});
