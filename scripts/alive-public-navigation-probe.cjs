'use strict';

// Verification-only support. The real application never imports this module.
const GLOBAL_NAME='__aliveProbePublicNetwork';
const GUARD='if (!ownedLocalAsset) return callback({ cancel: true });';
const COMPLETE='vaultSession.webRequest.onCompleted(details => deepWebNavigation.complete(details));';
const ERROR="vaultSession.webRequest.onErrorOccurred(details => deepWebNavigation.complete(details, details.error || 'request_failed'));";

function replaceExactlyOnce(source,needle,replacement,label) {
  if(source.split(needle).length!==2)throw new Error('Public probe requires exactly one unchanged '+label);
  return source.replace(needle,replacement);
}
function adaptSmokeSource(source) {
  if(!/const fetch = \(\.\.\.args\) => SMOKE\s*\? Promise\.reject\(new Error\('Network providers are disabled in isolated smoke mode\.'\)\)/.test(source))throw new Error('Public probe requires the unchanged SMOKE provider-fetch rejection');
  let adapted=replaceExactlyOnce(source,GUARD,`if (!ownedLocalAsset && !globalThis.${GLOBAL_NAME}?.allow(details)) return callback({ cancel: true });`,'owned-local SMOKE guard');
  adapted=replaceExactlyOnce(adapted,COMPLETE,`vaultSession.webRequest.onCompleted(details => { deepWebNavigation.complete(details); globalThis.${GLOBAL_NAME}?.complete(details); });`,'production completion observer');
  adapted=replaceExactlyOnce(adapted,ERROR,`vaultSession.webRequest.onErrorOccurred(details => { deepWebNavigation.complete(details, details.error || 'request_failed'); globalThis.${GLOBAL_NAME}?.complete(details, details.error || 'request_failed'); });`,'production error observer');
  return {source:adapted,evidence:{guardMatches:1,completionMatches:1,errorMatches:1,
    scope:'In-memory isolated SMOKE guest request exception; existing tracker, proxy and completion handlers retained',
    globalName:GLOBAL_NAME,providerFetchBlockUnchanged:true}};
}

function createPublicRequestGate({normalizeURL,now=()=>performance.now(),wallNow=()=>Date.now(),limit=600}={}) {
  if(typeof normalizeURL!=='function')throw new TypeError('Actual production normalizeURL is required');
  let enabled=false,opened=false,deadline=0,openedAt=null,closedAt=null,reason='not-started';
  const decisions=[],mainFrames=[],blockedMainFrames=[],commits=[],requests=new Map();
  const counters={admitted:0,blocked:0,outsidePhase:0,completed:0,errors:0,droppedDecisions:0,droppedMainFrames:0,droppedCommits:0};
  const reasons={};
  function append(list,value,key,max=limit){if(list.length>=max){list.shift();counters[key]++;}list.push(value);}
  function active(){if(enabled&&now()>=deadline){enabled=false;closedAt=wallNow();reason='deadline';}return enabled;}
  function publicURL(url) {
    try {
      const raw=new URL(url),normalized=normalizeURL(url);
      return /^https?:$/.test(raw.protocol)&&normalized&&!normalized.onion?normalized:null;
    }catch(_){return null;}
  }
  function safeURL(value){try{const url=new URL(value);url.username='';url.password='';url.hash='';return url.href.slice(0,2000);}catch(_){return '[unparseable URL]';}}
  function describe(details){return {id:details.id,webContentsId:details.webContentsId??null,method:String(details.method||''),resourceType:details.resourceType||null,url:safeURL(details.url)};}
  function allow(details) {
    if(!active()){counters.outsidePhase++;return false;}
    const entry=describe(details),normalized=publicURL(details.url);
    let denied=!['GET','HEAD'].includes(entry.method)?'method-not-read-only':!normalized?'outside-public-non-onion-policy':requests.size>=8192&&!requests.has(details.id)?'bounded-request-budget':null;
    if(denied){counters.blocked++;reasons[denied]=(reasons[denied]||0)+1;}
    else{counters.admitted++;requests.set(details.id,{...entry,normalizedURL:normalized.url,admittedAt:wallNow()});}
    append(decisions,{...entry,wallAt:wallNow(),admitted:!denied,reason:denied||'public-read-only-during-phase'},'droppedDecisions');
    if(denied&&entry.resourceType==='mainFrame')append(blockedMainFrames,{...entry,wallAt:wallNow(),reason:denied},'droppedMainFrames',100);
    return !denied;
  }
  function complete(details,error=null) {
    const admitted=requests.get(details.id);
    if(!admitted)return;
    requests.delete(details.id);counters.completed++;if(error)counters.errors++;
    if(details.resourceType!=='mainFrame'&&admitted.resourceType!=='mainFrame')return;
    const code=Number(details.statusCode)||null;
    append(mainFrames,{...admitted,url:safeURL(details.url||admitted.url),completedAt:wallNow(),statusCode:code,error:error?String(error).slice(0,300):null,
      fromCache:Boolean(details.fromCache),networkVerified:!error&&details.fromCache!==true&&code>=200&&code<400},'droppedMainFrames',100);
  }
  function commit(details) {
    if(!active()||!publicURL(details.url))return;
    append(commits,{webContentsId:details.webContentsId,url:String(details.url).slice(0,2000),title:String(details.title||'').slice(0,240),wallAt:wallNow(),statusCode:Number(details.statusCode)||null},'droppedCommits',100);
  }
  function title(webContentsId,value){if(!active())return;for(let i=commits.length-1;i>=0;i--)if(commits[i].webContentsId===webContentsId){commits[i].title=String(value||'').slice(0,240);break;}}
  return {
    open(durationMs){if(opened)throw new Error('Public network phase may open only once');if(!Number.isFinite(durationMs)||durationMs<=0||durationMs>120000)throw new Error('Public network duration must be bounded to120seconds');opened=true;enabled=true;openedAt=wallNow();deadline=now()+durationMs;reason='active';},
    close(why='finally'){enabled=false;if(opened&&closedAt===null)closedAt=wallNow();reason=why;},
    allow,complete,commit,title,publicURL,
    snapshot(){const isActive=active();return {enabled:isActive,opened,openedAt,closedAt,closeReason:reason,deadlineMonotonic:deadline,
      policy:'Actual AliveResearchPolicy.normalizeURL; GET/HEAD HTTP(S); no onion; only this bounded phase',
      counters:{...counters},blockedReasons:{...reasons},decisions:decisions.map(x=>({...x})),mainFrames:mainFrames.map(x=>({...x})),blockedMainFrames:blockedMainFrames.map(x=>({...x})),commits:commits.map(x=>({...x})),pendingRequests:requests.size};}
  };
}

function correlateConfirmedArrivals(phase,network,normalizeURL) {
  const norm=url=>{try{return normalizeURL(url)?.url||null;}catch(_){return null;}};
  const used=new Set(),confirmed=[];
  for(const arrival of phase.arrivals||[]) {
    if(!arrival.authorityCurrent||!arrival.guestReadCurrent||!Number.isFinite(arrival.learning?.updates))continue;
    const actual=norm(arrival.guest?.url),requested=norm(arrival.decision?.url);
    const dispatch=(phase.dispatches||[]).filter(item=>item.tabId===arrival.tabId&&norm(item.url)===requested&&item.wallAt<=arrival.wallAt+1000).at(-1);
    if(!actual||!dispatch||dispatch.wallAt<phase.autonomousEnabledAt||used.has(dispatch.key))continue;
    const completion=network.mainFrames.find(item=>item.webContentsId===arrival.webContentsId&&norm(item.url)===actual&&item.networkVerified&&item.completedAt>=dispatch.wallAt-1000&&item.completedAt<=arrival.guestReadAt+3000);
    const commit=network.commits.find(item=>item.webContentsId===arrival.webContentsId&&norm(item.url)===actual&&item.wallAt>=dispatch.wallAt-1000&&item.wallAt<=arrival.guestReadAt+3000);
    if(!completion||!commit)continue;
    used.add(dispatch.key);confirmed.push({dispatch,arrival,network:completion,commit});
  }
  return confirmed;
}

function researchTensorEvidence(before={},after={},dimensions={}) {
  const expected={inputWeights:dimensions.input*dimensions.hidden,hiddenBias:dimensions.hidden,outputWeights:dimensions.hidden*dimensions.output,outputBias:dimensions.output};
  const valid=(digest,length)=>Number.isSafeInteger(length)&&length>0&&digest?.length===length&&digest.nonFinite===0&&Number.isFinite(digest.sum)&&Number.isFinite(digest.squared);
  const finiteShapes=Object.entries(expected).every(([name,length])=>valid(before[name],length)&&valid(after[name],length));
  const changedTensors=Object.keys(expected).filter(name=>valid(before[name],expected[name])&&valid(after[name],expected[name])&&(before[name].sum!==after[name].sum||before[name].squared!==after[name].squared));
  return {expectedShapes:expected,finiteShapes,changedTensors,countersExcludedFromTensorChange:true};
}

// Serialized into the host. Only production Pause mutates state; guest scripts
// below read existing authority state without installing or revoking anything.
async function capturePauseDiagnostics({label='probe-pause',carryTokens=[],requestPause=true}={}) {
  const authority=window.aliveAuthority,executor=window.AliveGuestExecution,controller=window.aliveOverdrive;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const keys=['sessionId','epoch','revision','tabId','documentGeneration','documentNonce','kind','permitId'];
  const key=token=>JSON.stringify(keys.map(name=>token?.[name]));
  const before=authority.snapshot(),dedup=new Map();
  for(const token of [...(before.leases||[]),before.owner,...carryTokens])if(token?.tabId&&token.documentNonce)dedup.set(key(token),{...token});
  const allTokens=[...dedup.values()],tokens=allTokens.slice(0,64);
  const identities=tabs.slice(0,32).map(tab=>({tabId:tab.id,identity:executor.documentIdentity(tab.wv)}));
  const report={label,startedAt:performance.now(),pauseRequested:requestPause,
    budgets:{cleanupMs:10000,rawIdleMs:3000,guestDiagnosticMs:1500},
    prePause:{authority:before,tokens,identities,truncated:allTokens.length>tokens.length||tabs.length>32}};
  report.pauseIssued=Boolean(requestPause&&(before.paused!==true||controller.running!==false));
  if(report.pauseIssued){window.alienAutoNavigateLinks=false;stopAlienBrainAutonomy();}
  const until=performance.now()+10000;
  report.cleanupDeadline=until;
  while(performance.now()<until) {
    const state=authority.snapshot(),cleanup=state.cleanup;
    if(!state.transitioning&&cleanup?.revision===state.revision&&cleanup?.status==='completed'&&cleanup.rawDrained===true&&Array.isArray(cleanup.unresolved)&&cleanup.unresolved.length===0)break;
    if(!state.transitioning&&cleanup?.revision===state.revision&&cleanup?.status==='blocked'&&cleanup.attempt>=cleanup.maxAttempts)break;
    await sleep(40);
  }
  report.cleanupWaitEndedAt=performance.now();
  report.cleanupWaitDeadlineReached=report.cleanupWaitEndedAt>=until;
  report.rawSettled=await executor.waitForIdle(null,{timeoutMs:3000});
  report.guests=await Promise.all(tokens.map(async token=>{
    const tab=tabs.find(entry=>entry.id===token.tabId),entry={token,tabId:token.tabId,status:'unknown',persistentCurrent:null};
    if(!tab?.wv){entry.reason='Captured guest is no longer accessible';return entry;}
    entry.identity=executor.documentIdentity(tab.wv);
    try {
      const code=`(() => {const a=window.__aliveAuthority;return {authorityPresent:!!a,documentNonce:a?.documentNonce||null,persistentCurrent:typeof a?.current==='function'?a.current(${JSON.stringify(token)},true):null};})()`;
      const value=await Promise.race([tab.wv.executeJavaScript(code),sleep(1500).then(()=>null)]);
      entry.identityAfter=executor.documentIdentity(tab.wv);
      if(!value){entry.reason='Read-only guest diagnostic timed out';return entry;}
      entry.authorityPresent=value.authorityPresent;entry.documentNonce=value.documentNonce;entry.persistentCurrent=value.persistentCurrent;
      if(value.authorityPresent&&typeof value.documentNonce==='string'&&value.documentNonce&&typeof value.persistentCurrent==='boolean'&&entry.identity.generation===entry.identityAfter.generation)entry.status='observed';
      else entry.reason='Current guest authority/nonce is unavailable; no cleanup success inferred';
    }catch(error){entry.reason=String(error?.message||error).slice(0,250);}
    return entry;
  }));
  // Snapshot again after diagnostics so a lifecycle transition during reads
  // cannot be hidden by a prior completed cleanup record.
  report.authority=authority.snapshot();report.coordinatorRunning=controller.running;report.running=controller.running;
  report.durationMs=performance.now()-report.startedAt;
  return report;
}

function assessPauseEvidence(pause) {
  const reasons=[],state=pause?.authority,cleanup=state?.cleanup;
  if(!pause||pause.coordinatorRunning!==false||pause.rawSettled!==true)reasons.push('Coordinator or raw guest work did not stop');
  if(!state||state.paused!==true||state.transitioning!==false||state.manuals!==0||!Array.isArray(state.leases)||state.leases.length)reasons.push('Host authority is not settled and paused');
  if(!cleanup||cleanup.revision!==state?.revision||cleanup.status!=='completed'||cleanup.rawDrained!==true||!Array.isArray(cleanup.unresolved)||cleanup.unresolved.length)reasons.push('Explicit all-known guest cleanup completion is missing, stale, blocked or unresolved');
  if(!pause?.prePause||!Array.isArray(pause.prePause.tokens)||pause.prePause.truncated)reasons.push('Pre-pause token coverage is missing or truncated');
  const keys=['sessionId','epoch','revision','tabId','documentGeneration','documentNonce','kind','permitId'];
  const same=(a,b)=>keys.every(name=>a?.[name]===b?.[name]);
  const tokenChecks=(pause?.prePause?.tokens||[]).map(token=>{
    const observed=(pause.guests||[]).find(entry=>same(entry.token,token));
    const rejected=observed?.status==='observed'&&observed.authorityPresent===true&&observed.persistentCurrent===false&&typeof observed.documentNonce==='string'&&observed.documentNonce.length>0&&
      Number.isSafeInteger(observed.identityAfter?.generation)&&observed.identityAfter.generation>=token.documentGeneration&&observed.identityAfter.available!==false&&observed.identityAfter.connected!==false;
    // A committed native document replacement retires the old JavaScript
    // context even when the replacement has not installed guest authority.
    // Require the exact pre-Pause tab mapping and the same available, connected
    // executor guest on both sides of the read. A loading/failed navigation or
    // a missing API in the same generation is never retirement evidence.
    const mappings=(pause.prePause.identities||[]).filter(entry=>entry.tabId===token.tabId);
    const known=mappings.length===1?mappings[0].identity:null;
    const identities=[known,observed?.identity,observed?.identityAfter];
    const validIdentity=value=>value&&Number.isSafeInteger(value.guestId)&&value.guestId>0&&Number.isSafeInteger(value.generation)&&value.generation>=0&&value.available===true&&value.connected===true;
    const retired=Boolean(Number.isSafeInteger(token.documentGeneration)&&token.documentGeneration>=0&&observed?.tabId===token.tabId&&observed.persistentCurrent!==true&&
      identities.every(validIdentity)&&identities.every(value=>value.guestId===known.guestId)&&known.generation>=token.documentGeneration&&
      observed.identity.generation>=known.generation&&observed.identityAfter.generation===observed.identity.generation&&observed.identityAfter.generation>token.documentGeneration);
    const passed=Boolean(rejected||retired);
    if(!passed)reasons.push('Old guest token remains valid or its current-document diagnostic is unknown: '+token.tabId);
    return {tabId:token.tabId,documentNonce:token.documentNonce,documentGeneration:token.documentGeneration,passed,
      proof:rejected?'current-document-token-rejected':retired?'native-document-retired':'unproved',
      nativeRetirement:retired?{guestId:known.guestId,tokenGeneration:token.documentGeneration,prePauseGeneration:known.generation,observedGeneration:observed.identityAfter.generation}:null,
      status:observed?.status||'unknown',persistentCurrent:observed?.persistentCurrent??null};
  });
  return {ok:reasons.length===0,reasons,tokenChecks,cleanup:cleanup||null,unknownIsSuccess:false};
}

function assessPanelReservation(panel,layout) {
  const selector={controls:'controls',inspect:'inspector',logs:'logs'}[panel];
  const pane=layout?.[selector],page=layout?.page,viewport=layout?.viewport;
  const visible=rect=>Boolean(rect&&rect.display!=='none'&&rect.visibility!=='hidden'&&Number(rect.opacity)>0&&Number.isFinite(rect.x)&&Number.isFinite(rect.width)&&rect.width>0&&rect.height>0);
  const paneVisible=visible(pane),pageVisible=visible(page);
  const separated=Boolean(paneVisible&&pageVisible&&(pane.x+pane.width<=page.x+1||page.x+page.width<=pane.x+1));
  const inViewport=Boolean(paneVisible&&pageVisible&&viewport?.width>0&&pane.x>=-1&&page.x>=-1&&pane.x+pane.width<=viewport.width+1&&page.x+page.width<=viewport.width+1);
  return {panel,ok:paneVisible&&pageVisible&&separated&&inViewport,paneVisible,pageVisible,separatedHorizontally:separated,inViewport,pane:pane||null,page:page||null};
}

module.exports={GLOBAL_NAME,GUARD,COMPLETE,ERROR,adaptSmokeSource,createPublicRequestGate,correlateConfirmedArrivals,researchTensorEvidence,capturePauseDiagnostics,assessPauseEvidence,assessPanelReservation};
