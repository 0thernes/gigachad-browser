(function (scope) {
  'use strict';
  const source = scope.GigachadAsmodensiusSource || (typeof require === 'function' ? require('./generated/authentic-asmodensius.js') : null);
  const SCHEMA = 'gigachad.authentic-asmodensius.state.v1';
  const PROFILE = Object.freeze({mind:'v40', entropy:'seeded', substrate:'synthetic', noise:'quantum', access:'all'});
  const INTERVAL_MS = 250; // 4 simulated minutes per active wall-clock second; never claims biological real time.
  const LIMIT_BYTES = 8 * 1024 * 1024;
  // Prepared imports are capabilities, not serialized model containers. The
  // application fences other writers; this revision tracks supported mutators.
  const instances = new WeakMap(), preparedImports = new WeakMap();
  const ownDescriptor = Object.getOwnPropertyDescriptor, applyNative = Reflect.apply;
  const typedPrototype = Object.getPrototypeOf(Float64Array.prototype);
  const nativeView = Object.freeze({
    buffer:ownDescriptor(typedPrototype,'buffer').get,
    offset:ownDescriptor(typedPrototype,'byteOffset').get,
    bytes:ownDescriptor(typedPrototype,'byteLength').get,
    length:ownDescriptor(typedPrototype,'length').get,
    dtype:ownDescriptor(typedPrototype,Symbol.toStringTag).get,
    set:Float64Array.prototype.set,
    bufferBytes:ownDescriptor(ArrayBuffer.prototype,'byteLength').get,
    resizable:ownDescriptor(ArrayBuffer.prototype,'resizable')?.get
  });
  const destinationFields = Object.freeze(['_creature','_developmentAffinity','seed','elapsedMs','paused','lastInput','motor2D','status','lastError','lastStepDurationMs']);
  const importContext = Object.freeze({ownerId:'native-importState',epoch:0,generation:0});
  const blocked = new Set(['__proto__', 'prototype', 'constructor']);
  const integerRanges = {Int8Array:[-128,127],Uint8Array:[0,255],Int16Array:[-32768,32767],Uint16Array:[0,65535],Int32Array:[-2147483648,2147483647],Uint32Array:[0,4294967295]};
  const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(name + ' must be finite'); return v; };
  const unit = v => Math.max(0,Math.min(1,finite(v,'observation')));
  const integer = (v, lo, hi, name) => { if (!Number.isSafeInteger(v) || v < lo || v > hi) throw new TypeError(name+' is outside its integer contract'); return v; };
  const stringify = v => JSON.stringify(v, (_k,x) => Object.is(x,-0) ? {$number:'-0'} : x);
  const parse = s => JSON.parse(s, (_k,x) => x && x.$number === '-0' && Object.keys(x).length === 1 ? -0 : x);
  // Detect accidental storage corruption; this is not authentication or tamper resistance.
  function checksum(text) { let h=2166136261; for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;}return h.toString(16).padStart(8,'0'); }
  function validateTree(value, expected, at='state', budget={nodes:0}, depth=0) {
    if (++budget.nodes > 1000000 || depth>40) throw new TypeError('Checkpoint exceeds structural limits');
    if(expected!==undefined && expected!==null){
      if(value===null || typeof value!==typeof expected || Array.isArray(value)!==Array.isArray(expected))throw new TypeError('Checkpoint type mismatch at '+at);
      if(expected.__ta && (!value.__ta || !Array.isArray(value.v)))throw new TypeError('Missing typed array at '+at);
      if(expected.__rng!==undefined && value.__rng===undefined)throw new TypeError('Missing RNG state at '+at);
      if(typeof expected==='object'&&!Array.isArray(expected)){
        for(const key of Object.keys(expected))if(expected[key]!==undefined&&!Object.hasOwn(value,key))throw new TypeError('Incomplete nested state at '+at+'.'+key);
        if(Object.keys(expected).length)for(const key of Object.keys(value))if(!Object.hasOwn(expected,key)&&!(at==='state.org'&&key==='c10got'))throw new TypeError('Unknown nested state at '+at+'.'+key);
      }
    }
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') { finite(value,at); if(typeof expected==='number' && Number.isInteger(expected) && /(?:__rng|^state\.org\.t)$/.test(at))integer(value,0,4294967295,at); return; }
    if (typeof value === 'string') { if(value.length>4096)throw new TypeError('Checkpoint string too large');return; }
    if (!value || typeof value !== 'object') throw new TypeError('Unsupported checkpoint value at '+at);
    if (Array.isArray(value)) { if(value.length>100000)throw new TypeError('Checkpoint array too large');value.forEach((x,i)=>validateTree(x,Array.isArray(expected)?expected[i]:undefined,at+'.'+i,budget,depth+1));return; }
    if (Object.getPrototypeOf(value)!==Object.prototype && Object.getPrototypeOf(value)!==null) throw new TypeError('Checkpoint must contain plain objects');
    for(const key of Object.keys(value))if(blocked.has(key))throw new TypeError('Forbidden checkpoint key');
    if ('__rng' in value) { if(Object.keys(value).length!==1)throw new TypeError('Invalid RNG record');integer(value.__rng,0,4294967295,at);return; }
    if ('__ta' in value) {
      if (Object.keys(value).length!==2 || !Array.isArray(value.v) || value.v.length>100000)throw new TypeError('Invalid typed array record');
      if (expected && expected.__ta && (value.__ta!==expected.__ta || value.v.length!==expected.v.length))throw new TypeError('Typed array shape mismatch at '+at);
      if (!integerRanges[value.__ta] && value.__ta!=='Float32Array' && value.__ta!=='Float64Array')throw new TypeError('Unknown typed array');
      value.v.forEach(x=>{finite(x,at);if(integerRanges[value.__ta])integer(x,...integerRanges[value.__ta],at);if(value.__ta==='Float32Array'&&!Object.is(Math.fround(x),x))throw new TypeError('Inexact Float32 checkpoint value');});return;
    }
    for(const [key,x] of Object.entries(value))validateTree(x,expected&&expected[key],at+'.'+key,budget,depth+1);
  }
  function collectSets(org) {
    const sets=[];
    for(const part of ['affect','bus','selfM','curv','neo'])for(const field of ['off','ctl'])if(org[part] && org[part][field] instanceof Set)sets.push({part,field,values:Array.from(org[part][field])});
    return sets;
  }
  function pruneAbsent(target,snapshot){
    if(!target||!snapshot||typeof target!=='object'||typeof snapshot!=='object'||Array.isArray(target)||ArrayBuffer.isView(target)||target instanceof Set||target instanceof Map)return;
    for(const key of Object.keys(target)){
      if(['g','rule','qb'].includes(key)||typeof target[key]==='function')continue;
      if(!Object.hasOwn(snapshot,key))delete target[key];else pruneAbsent(target[key],snapshot[key]);
    }
  }
  const edgeTypes = { pre:'Int32Array', post:'Int32Array', w:'Float32Array', plastic:'Uint8Array', pk:'Uint8Array', kind:'Uint8Array', mask:'Float32Array' };
  // The unchanged donor keeps CP private. Mirror only its authored region pairs,
  // checked against that exact source table by the adapter tests. Saved endpoints
  // must never define a projection's domain: devRefine still uses donor CP.
  const DEVELOPMENT_PROJECTIONS = Object.freeze([
    ['SENS','THAL'],['THAL','CTX'],['CTX','THAL'],['CTX','CTX'],['CTX','HIP'],['HIP','CTX'],['HIP','HIP'],
    ['CTX','STR'],['STR','MOT'],['CTX','MOT'],['HYP','VTA'],['HYP','LC'],['HYP','HYP'],['INS','LC'],['INS','CTX'],['INS','HYP'],
    ['VTA','STR'],['LC','CTX'],['RAPHE','CTX'],['BF','CTX'],['BF','HIP'],['SCN','HYP'],['SCN','RAPHE'],['CTX','INS'],['ENS','ENS'],['ENS','HYP']
  ].map(pair=>Object.freeze(pair)));
  function regionAt(index) {
    let start=0;
    for(const [name,count] of source.REGIONS){if(index>=start&&index<start+count)return {name,start,count};start+=count;}
    throw new TypeError('Unknown neuron region');
  }
  function topology(native, expected) {
    const org=native.org, count=org.syn?.pre?.v?.length;
    integer(count,1,100000,'sparse edge count');
    for(const [key,type] of Object.entries(edgeTypes)){
      const record=Object.hasOwn(org.syn,key)?org.syn[key]:org[key];
      if(record?.__ta!==type||!Array.isArray(record.v)||record.v.length!==count)throw new TypeError('Inconsistent sparse edge tensor '+key);
      if(expected){const target=Object.hasOwn(expected.org.syn,key)?expected.org.syn:expected.org;target[key]={__ta:type,v:record.v};}
    }
    if(org.devPruned!==null&&(org.devPruned?.__ta!=='Uint8Array'||org.devPruned?.v?.length!==count))throw new TypeError('Invalid developmental pruning mask');
    for(const key of ['pre','post'])for(const index of org.syn[key].v)integer(index,0,source.NNEU-1,'synapse endpoint');
    for(const [key,endpoint,selected] of [['out','pre',()=>true],['inn','post',i=>org.pk.v[i]!==0]]){
      if(!Array.isArray(org[key])||org[key].length!==source.NNEU)throw new TypeError('Invalid '+key+' adjacency shape');
      const seen=new Uint8Array(count);
      org[key].forEach((list,neuron)=>{
        if(!Array.isArray(list)||list.length>count)throw new TypeError('Invalid adjacency list');
        for(const edge of list){integer(edge,0,count-1,'adjacency edge');if(seen[edge]++||org.syn[endpoint].v[edge]!==neuron||!selected(edge))throw new TypeError('Inconsistent '+key+' adjacency');}
      });
      for(let i=0;i<count;i++)if(seen[i]!==Number(selected(i)))throw new TypeError('Incomplete '+key+' adjacency');
    }
    const projections=DEVELOPMENT_PROJECTIONS.length;
    if(org.devGenome?.__ta!=='Float32Array'||org.devGenome.v?.length!==projections*3+source.REGIONS.length*3+6)throw new TypeError('Invalid authored developmental genome shape');
    if(!Array.isArray(org.devSlots)||org.devSlots.length>count)throw new TypeError('Invalid developmental edge slots');
    const rows=new Map(), seen=new Set();
    for(const slot of org.devSlots){
      if(!Array.isArray(slot)||(slot.length!==2&&slot.length!==3))throw new TypeError('Invalid developmental edge slot');
      const [edge,projection,pruned]=slot;integer(edge,0,count-1,'development edge');integer(projection,0,projections-1,'development projection');
      if(seen.has(edge)||(slot.length===3&&pruned!==1))throw new TypeError('Duplicate or invalid developmental edge slot');seen.add(edge);
      const pre=org.syn.pre.v[edge],post=org.syn.post.v[edge],region=regionAt(pre),target=regionAt(post),key=projection+':'+post;
      const [authoredSource,authoredTarget]=DEVELOPMENT_PROJECTIONS[projection];
      if(region.name!==authoredSource||target.name!==authoredTarget||pre===post)throw new TypeError('Developmental edge violates authored projection '+projection);
      rows.set(key,{projection,post,start:region.start,count:region.count});
    }
    return rows;
  }
  function affinityRecords(creature,rows) {
    // Every possible source neuron used by devRefine for a stored projection
    // and destination was already tagged during grow(). Reading these affinities
    // does not advance a PRNG. Preserve the actual closure, not a new seed guess.
    return Array.from(rows.values(),row=>({projection:row.projection,post:row.post,start:row.start,
      values:Array.from({length:row.count},(_,i)=>finite(creature.o.devAff(row.projection,row.start+i,row.post),'development affinity'))}));
  }
  function captureAffinity(creature) { return affinityRecords(creature,topology(creature.snapshot())); }
  function freezeRecord(record) {
    if(record&&typeof record==='object'){for(const value of Object.values(record))freezeRecord(value);Object.freeze(record);}
    return record;
  }
  function restoreAffinity(creature, records, rows) {
    if(!Array.isArray(records)||records.length!==rows.size)throw new TypeError('Incomplete developmental affinity state');
    const lookup=new Map();
    for(const record of records){
      const key=record.projection+':'+record.post,expected=rows.get(key);
      if(!expected||lookup.has(key)||record.start!==expected.start||!Array.isArray(record.values)||record.values.length!==expected.count||
          Object.keys(record).sort().join(',')!=='post,projection,start,values')throw new TypeError('Invalid developmental affinity row');
      record.values.forEach(value=>{finite(value,'development affinity');if(value<0||value>2)throw new TypeError('Development affinity outside source range');});
      lookup.set(key,{...record,values:record.values.slice()});
    }
    creature.o.devAff=(projection,pre,post)=>{
      const row=lookup.get(projection+':'+post),index=pre-(row?.start??0);
      if(!row||!Number.isInteger(index)||index<0||index>=row.values.length)throw new TypeError('Developmental affinity lookup outside saved domain');
      return row.values[index];
    };
    // Creature001's region-coupling lookup is also derived constructor state.
    if(creature.edges instanceof Map){creature.edges.clear();const syn=creature.o.syn;for(let i=0;i<syn.pre.length;i++){
      const key=regionAt(syn.pre[i]).name+'->'+regionAt(syn.post[i]).name;
      if(!creature.edges.has(key))creature.edges.set(key,[]);creature.edges.get(key).push(i);
    }}
    return Array.from(lookup.values());
  }
  function invalidate(target) {
    const state=instances.get(target);
    if(!state)throw new TypeError('Unknown native adapter instance');
    state.revision++;
  }
  function transactionContext(context) {
    if(!context||typeof context!=='object')throw new TypeError('Prepared import requires a transaction context');
    const copy={};
    for(const key of ['ownerId','epoch','generation']){
      const field=ownDescriptor(context,key);
      if(!field||!Object.hasOwn(field,'value'))throw new TypeError('Transaction context requires own-data fields');
      copy[key]=field.value;
    }
    if(typeof copy.ownerId!=='string'||!copy.ownerId.length||copy.ownerId.length>128)throw new TypeError('Invalid transaction ownerId');
    for(const key of ['epoch','generation']){
      integer(copy[key],0,Number.MAX_SAFE_INTEGER,'transaction '+key);
      if(Object.is(copy[key],-0))throw new TypeError('Invalid transaction '+key);
    }
    return copy;
  }
  function ownEnvelope(envelope) {
    if(!envelope||typeof envelope!=='object')throw new TypeError('Invalid authentic checkpoint');
    const copy={};
    for(const key of ['schema','sourceDigest','payload','checksum']){
      const field=ownDescriptor(envelope,key);
      if(!field||!Object.hasOwn(field,'value'))throw new TypeError('Checkpoint envelope requires own-data fields');
      copy[key]=field.value;
    }
    return copy;
  }
  function vectorDestination(value,length) {
    if(applyNative(nativeView.dtype,value,[])!=='Float64Array'||applyNative(nativeView.length,value,[])!==length)
      throw new TypeError('Native import requires an attached Float64Array destination');
    const buffer=applyNative(nativeView.buffer,value,[]),offset=applyNative(nativeView.offset,value,[]),bytes=applyNative(nativeView.bytes,value,[]);
    // ArrayBuffer's intrinsic rejects shared memory. A resizable backing could
    // invalidate admission, so reject it even when its present length matches.
    const bufferBytes=applyNative(nativeView.bufferBytes,buffer,[]);
    if(bytes!==length*8||bufferBytes<offset+bytes||nativeView.resizable&&applyNative(nativeView.resizable,buffer,[]))
      throw new TypeError('Native import requires a fixed attached ArrayBuffer');
    const view=new Uint8Array(buffer,offset,bytes);
    return {buffer,offset,bytes,view};
  }
  function captureDestination(target) {
    const fields={};
    for(const key of destinationFields){
      const field=ownDescriptor(target,key);
      if(!field||!Object.hasOwn(field,'value')||!field.writable)throw new TypeError('Native destination must be writable own data: '+key);
      fields[key]=field;
    }
    const vectors={};
    for(const [key,length] of [['lastInput',16],['motor2D',2]]){
      const vector=vectorDestination(fields[key].value,length);
      vectors[key]={...vector,baseline:new Uint8Array(vector.view)};
    }
    const a=vectors.lastInput,b=vectors.motor2D;
    if(a.buffer===b.buffer&&a.offset<b.offset+b.bytes&&b.offset<a.offset+a.bytes)
      throw new TypeError('Native input and motor destinations must not overlap');
    return {fields,vectors};
  }
  function checkDestination(target,destination) {
    for(const key of destinationFields){
      const field=ownDescriptor(target,key),before=destination.fields[key];
      if(!field||!Object.hasOwn(field,'value')||!field.writable||!Object.is(field.value,before.value)||
          field.configurable!==before.configurable||field.enumerable!==before.enumerable)
        throw new TypeError('Native destination changed: '+key);
    }
    for(const [key,length] of [['lastInput',16],['motor2D',2]]){
      const current=vectorDestination(destination.fields[key].value,length),before=destination.vectors[key];
      if(current.buffer!==before.buffer||current.offset!==before.offset||current.bytes!==before.bytes)
        throw new TypeError('Native vector backing changed: '+key);
      for(let i=0;i<before.bytes;i++)if(current.view[i]!==before.baseline[i])throw new TypeError('Native vector contents changed: '+key);
    }
  }
  function prepareFor(target,envelope,context) {
    const state=instances.get(target);
    if(!state)throw new TypeError('Unknown native adapter instance');
    const identity=transactionContext(context),revision=state.revision,destination=captureDestination(target);
    const owned=ownEnvelope(envelope),candidate=prepareCandidate(owned);
    if(state.revision!==revision)throw new TypeError('Native adapter changed during preparation');
    checkDestination(target,destination);
    const handle=Object.freeze({kind:'authentic-asmodensius-prepared-import-v1'});
    preparedImports.set(handle,{target,identity,revision,destination,candidate,checksum:owned.checksum,sourceDigest:owned.sourceDigest,
      inputArguments:[candidate.input],motorArguments:[candidate.motor]});
    return handle;
  }
  function admitPrepared(target,handle,context) {
    const plan=preparedImports.get(handle);
    if(!plan||plan.target!==target)throw new TypeError('Unknown, foreign, discarded or consumed native import');
    const identity=transactionContext(context);
    for(const key of ['ownerId','epoch','generation'])if(identity[key]!==plan.identity[key])throw new TypeError('Native import transaction mismatch');
    if(instances.get(target)?.revision!==plan.revision)throw new TypeError('Stale native import revision');
    checkDestination(target,plan.destination);
    return plan;
  }
  function preparedReceipt(status,plan) {
    return Object.freeze({status,...plan.identity,revision:plan.revision,sourceDigest:plan.sourceDigest,checksum:plan.checksum});
  }
  function commitFor(target,handle,context) {
    const plan=admitPrepared(target,handle,context),next=plan.candidate;
    // Allocate diagnostics before the write boundary. No donor methods, getters,
    // overridable .set, callbacks or yields are allowed below it. Ordinary own
    // writable slots and fixed, nonshared native vectors were just rechecked.
    const receipt=preparedReceipt('applied',plan);
    preparedImports.delete(handle);
    applyNative(nativeView.set,plan.destination.fields.lastInput.value,plan.inputArguments);
    applyNative(nativeView.set,plan.destination.fields.motor2D.value,plan.motorArguments);
    target._creature=next.candidate;target._developmentAffinity=next.affinity;
    target.seed=next.seed;target.elapsedMs=next.elapsedMs;target.paused=next.paused;
    target.status=next.status;target.lastError=null;
    invalidate(target);
    return receipt;
  }
  function prepareCandidate(envelope) {
    if(!envelope || envelope.schema!==SCHEMA || envelope.sourceDigest!==source.sourceDigest || typeof envelope.payload!=='string' || envelope.payload.length>LIMIT_BYTES || envelope.checksum!==checksum(envelope.payload))throw new TypeError('Invalid, incompatible or corrupted authentic checkpoint');
    const data=parse(envelope.payload);
    validateTree(data,null);
    integer(data.seed,0,4294967295,'seed');
    if(JSON.stringify(data.profile)!==JSON.stringify(PROFILE))throw new TypeError('Unsupported source profile');
    if(typeof data.paused!=='boolean' || data.elapsedMs<0 || data.elapsedMs>=INTERVAL_MS)throw new TypeError('Invalid scheduler state');
    finite(data.elapsedMs,'elapsedMs');
    if(!Array.isArray(data.input)||data.input.length!==16||data.input.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)||
        !Array.isArray(data.motor)||data.motor.length!==2||data.motor.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1))throw new TypeError('Invalid adapter vector shape/range');
    const candidate=new source.Creature001(data.seed,PROFILE);
    const fresh=candidate.snapshot();candidate.step();const warm=candidate.snapshot();
    const nativeSetIdentities=new Map(collectSets(candidate.o).map(record=>[record.part+'.'+record.field,candidate.o[record.part][record.field]]));
    if(!data.native || !data.native.org || Object.keys(data.native).sort().join(',')!=='lastSite,nChoices,org')throw new TypeError('Missing original state');
    const keys=Object.keys(data.native.org),allowed=Object.keys(fresh.org),required=allowed.filter(k=>fresh.org[k]!==undefined);
    if(required.some(k=>!Object.hasOwn(data.native.org,k))||keys.some(k=>!allowed.includes(k)&&k!=='c10got'))throw new TypeError('Incomplete or unknown organism fields');
    // New checkpoints own their sparse graph and hidden refinement affinity.
    // Native Array.sort's random comparator can consume a different seeded
    // stream on another V8 execution path. Never infer saved topology from a
    // reconstructed constructor. Legacy checkpoints retain the strict prior
    // shape gate; an incompatible legacy state is not silently migrated.
    const checkedTopology=topology(data.native,data.developmentAffinity?fresh:undefined);
    const savedTopology=data.developmentAffinity?checkedTopology:null;
    validateTree(data.native,fresh);
    for(const part of ['affect','bus','selfM','curv','neo'])if(data.native.org[part]!==null)validateTree(data.native.org[part],warm.org[part],'state.org.'+part);
    integer(data.native.org.t,0,Number.MAX_SAFE_INTEGER,'organism tick');
    for(const indices of [data.native.org.syn.pre.v,data.native.org.syn.post.v])for(const index of indices)integer(index,0,source.NNEU-1,'synapse neuron index');
    integer(data.native.nChoices,0,data.native.org.choices.length,'choice count');integer(data.native.lastSite,-1,15,'last site');
    if(JSON.stringify(data.native.org.o)!==JSON.stringify({...fresh.org.o}))throw new TypeError('Original options mismatch');
    // Native restore preserves methods only when lazily-created classes already exist.
    // The warm tick is discarded by restoring the complete original state into this isolated candidate.
    pruneAbsent(candidate.o,data.native.org);
    candidate.restore(data.native);
    const affinity=savedTopology?restoreAffinity(candidate,data.developmentAffinity,savedTopology):null;
    if(!Array.isArray(data.sets)||data.sets.length>10)throw new TypeError('Invalid collection records');
    const expectedSets=collectSets(candidate.o);
    if(data.sets.length!==expectedSets.length)throw new TypeError('Incomplete collection state');
    const seen=new Set(),sharedSets=new Map();
    for(const record of data.sets){
      const key=record.part+'.'+record.field;
      if(!expectedSets.some(s=>s.part===record.part&&s.field===record.field)||!Array.isArray(record.values)||record.values.length>64||record.values.some(x=>typeof x!=='string')||new Set(record.values).size!==record.values.length||seen.has(key))throw new TypeError('Invalid collection record');
      // Donor initialization shares off/ctl Sets across several modules.
      // Preserve those trusted warm-candidate identities; serialized values
      // for one shared Set must agree, including observable iteration order.
      const identity=nativeSetIdentities.get(key),shared=sharedSets.get(identity);
      if(!identity)throw new TypeError('Missing native collection identity');
      if(shared&&stringify(shared.values)!==stringify(record.values))throw new TypeError('Inconsistent shared collection state');
      const restored=shared?.restored||new Set(record.values);
      if(!shared)sharedSets.set(identity,{values:record.values,restored});
      seen.add(key);candidate.o[record.part][record.field]=restored;
    }
    if(stringify(candidate.snapshot())!==stringify(data.native))throw new TypeError('Restored source state does not round trip exactly');
    return {candidate,affinity,seed:data.seed,elapsedMs:data.elapsedMs,paused:data.paused,
      input:Float64Array.from(data.input),motor:Float64Array.from(data.motor),
      status:candidate.t()?(candidate.alive()?'running':'organism-dead'):'ready'};
  }
  class AuthenticAsmodensiusAdapter {
    constructor({seed=1}={}) {
      if(!source)throw new Error('Authentic Asmodensius source bundle unavailable');
      this.seed=integer(seed,0,4294967295,'seed');
      this._creature=new source.Creature001(this.seed,PROFILE);
      this._developmentAffinity=captureAffinity(this._creature);
      this.elapsedMs=0;this.paused=false;this.lastInput=new Float64Array(16);this.motor2D=new Float64Array(2);this.lastError=null;
      this.status='ready';this.lastStepDurationMs=0;
      instances.set(this,{revision:0});
    }
    static get sourceDigest(){return source.sourceDigest;}
    static get developmentProjections(){return DEVELOPMENT_PROJECTIONS;}
    static get intervalMs(){return INTERVAL_MS;}
    static prepareLegacyRecovery(envelope) {
      // Explicit preparation only. Nothing here imports into a caller's adapter,
      // writes a profile, or claims recovery of the absent historical closure.
      if(!envelope||envelope.schema!==SCHEMA||envelope.sourceDigest!==source.sourceDigest||typeof envelope.payload!=='string'||envelope.payload.length>LIMIT_BYTES||envelope.checksum!==checksum(envelope.payload))throw new TypeError('Legacy recovery requires a valid compatible authentic envelope');
      const data=parse(envelope.payload);validateTree(data,null);
      if(!data||typeof data!=='object'||Object.hasOwn(data,'developmentAffinity'))throw new TypeError('Legacy recovery requires missing developmental affinity; current envelopes are not eligible');
      const knownFields=['seed','profile','elapsedMs','paused','input','motor','native','sets'];
      if(Object.keys(data).sort().join(',')!==knownFields.slice().sort().join(','))throw new TypeError('Legacy recovery requires exactly the known legacy fields');
      integer(data.seed,0,4294967295,'seed');
      if(JSON.stringify(data.profile)!==JSON.stringify(PROFILE))throw new TypeError('Unsupported legacy source profile');
      if(!data.native?.org)throw new TypeError('Legacy recovery requires original native state');
      const rows=topology(data.native);
      const generator=new source.Creature001(data.seed,PROFILE);
      const constructorStateChecksum=checksum(stringify(generator.snapshot()));
      // The constructor visits every authored projection candidate. This reads
      // its present seeded affinity over the saved, validated domain. It cannot
      // recreate the unsaved historical jitter closure or its V8 sort history.
      const preparedData={...data,developmentAffinity:affinityRecords(generator,rows)};
      const payload=stringify(preparedData);
      if(payload.length>LIMIT_BYTES)throw new TypeError('Prepared legacy recovery exceeds 8 MiB');
      const prepared={schema:SCHEMA,sourceDigest:source.sourceDigest,checksum:checksum(payload),payload};
      const isolated=new AuthenticAsmodensiusAdapter({seed:data.seed});
      if(!isolated.importState(prepared))throw new TypeError('Legacy recovery validation failed: '+isolated.lastError);
      const restored=isolated.captureStatePayload();
      for(const field of knownFields)if(stringify(restored[field])!==stringify(data[field]))throw new TypeError('Legacy recovery changed known state: '+field);
      if(stringify(restored)!==payload)throw new TypeError('Prepared legacy recovery does not round trip exactly');
      return freezeRecord({schema:'gigachad.authentic-asmodensius.legacy-recovery.v1',envelope:prepared,provenance:{
        kind:'legacy-missing-development-affinity-recovery',sourceDigest:source.sourceDigest,
        sourceEnvelopeChecksum:envelope.checksum,preparedEnvelopeChecksum:prepared.checksum,
        checksumAlgorithm:'fnv1a32-accidental-corruption-only',constructorStateChecksum,
        seed:data.seed,profile:{...PROFILE},nativeTick:data.native.org.t,edges:data.native.org.syn.pre.v.length,
        affinityRows:rows.size,preservedKnownState:true,knownStateComparison:'exact-serialized-known-fields',
        developmentalAffinity:'reinitialized-from-current-seeded-constructor',exactHistoricalContinuation:false,
        limitations:[
          'Historical developmental affinity/jitter was absent and cannot be recovered exactly.',
          'Only missing affinity values are reconstructed from the current same-seed default-profile constructor; saved native state, topology, genome, RNG and collections are retained.',
          'Constructor RNG consumption can vary with V8 sorting; the constructor-state checksum describes this preparation, not cross-runtime reproducibility.',
          'Future developmental refinement is approximate relative to the historical organism; no historical continuity or learning-quality claim is made.',
          'Preparation does not publish, persist or activate the returned candidate; verified backup and caller-controlled publication remain separate.'
        ]
      }});
    }
    static observeChrome({width,height,x,y,vx,vy,tabCount,focused,loading}) {
      const w=Math.max(1,finite(width,'width')),h=Math.max(1,finite(height,'height'));
      const px=unit(x/w),py=unit(y/h),dx=Math.tanh(finite(vx,'vx')/10),dy=Math.tanh(finite(vy,'vy')/10);
      return Float64Array.from([unit(w/3840),unit(h/2160),px,py,1-px,1-py,(1+dx)/2,(1+dy)/2,unit(tabCount/16),focused?1:0,loading?1:0,unit(Math.hypot(vx,vy)/20),unit(Math.min(px,1-px)*2),unit(Math.min(py,1-py)*2),w>=h?1:0,1]);
    }
    step(input) {
      if(this.paused)return this.readout();
      if(!input || input.length!==16)throw new TypeError('Original Creature001 requires exactly 16 sensory lines');
      const values=Array.from(input,unit);
      invalidate(this);
      this.lastInput.set(values);this._creature.senseLines(values);
      const begin=typeof performance!=='undefined'?performance.now():0;
      this._creature.step();
      this.lastStepDurationMs=typeof performance!=='undefined'?performance.now()-begin:0;
      const m=this._creature.motor();
      this.motor2D[0]=Math.tanh(3*((m[0]+m[1]-m[2]-m[3])/2));
      this.motor2D[1]=Math.tanh(3*((m[4]+m[5]-m[6]-m[7])/2));
      this.status=this._creature.alive()?'running':'organism-dead';
      return this.readout();
    }
    advance(elapsedMs,input) {
      finite(elapsedMs,'elapsedMs');if(elapsedMs<0)throw new TypeError('elapsedMs must be nonnegative');
      if(this.paused)return this.readout();
      // Suspended windows do not trigger an unbounded catch-up burst.
      invalidate(this);
      this.elapsedMs+=Math.min(elapsedMs,100);
      if(this.elapsedMs>=INTERVAL_MS){this.elapsedMs-=INTERVAL_MS;return this.step(input);}
      return this.readout();
    }
    setPaused(paused){invalidate(this);this.paused=Boolean(paused);}
    readout(){return {backend:'original-asmodensius-creature001',sourceDigest:source.sourceDigest,status:this.paused?'paused':this.status,simulatedMinutes:this._creature.t(),tickIntervalMs:INTERVAL_MS,neurons:source.NNEU,motor2D:Array.from(this.motor2D),motor8:Array.from(this._creature.motor()),lastInput:Array.from(this.lastInput),lastStepDurationMs:this.lastStepDurationMs,metrics:this._creature.metrics(),lastError:this.lastError};}
    captureStatePayload() {
      // The original snapshot reads RNG closures and copies native state on the
      // model's thread. Formatting can then use an isolated worker snapshot.
      const state={seed:this.seed,profile:PROFILE,elapsedMs:this.elapsedMs,paused:this.paused,input:Array.from(this.lastInput),motor:Array.from(this.motor2D),native:this._creature.snapshot(),sets:collectSets(this._creature.o)};
      if(this._developmentAffinity)state.developmentAffinity=this._developmentAffinity.map(row=>({...row,values:row.values.slice()}));
      return state;
    }
    exportState() {
      const state=this.captureStatePayload();
      if(typeof scope.AliveGenomeCodec?.formatAuthenticState==='function')return scope.AliveGenomeCodec.formatAuthenticState(state,source.sourceDigest);
      // Preserve standalone browser use when the genome codec is not loaded.
      const payload=stringify(state);
      if(payload.length>LIMIT_BYTES)throw new Error('Authentic checkpoint exceeds 8 MiB; state was not saved');
      return {schema:SCHEMA,sourceDigest:source.sourceDigest,checksum:checksum(payload),payload};
    }
    prepareImportState(envelope,context) { return prepareFor(this,envelope,context); }
    recheckPrepared(handle,context) {
      const plan=admitPrepared(this,handle,context);
      return preparedReceipt('ready',plan);
    }
    commitPrepared(handle,context) { return commitFor(this,handle,context); }
    discardPrepared(handle) {
      const plan=preparedImports.get(handle);
      if(!plan||plan.target!==this)return false;
      preparedImports.delete(handle);return true;
    }
    importState(envelope) {
      let handle;
      try {
        handle=prepareFor(this,envelope,importContext);
        commitFor(this,handle,importContext);return true;
      } catch(error){
        if(handle)preparedImports.delete(handle);
        // Compatibility wrapper keeps its boolean/error API. Never invoke an
        // externally replaced lastError setter while reporting rejection.
        if(instances.has(this)){
          invalidate(this);
          const field=ownDescriptor(this,'lastError');
          if(field&&Object.hasOwn(field,'value')&&field.writable)this.lastError=error.message;
        }
        return false;
      }
    }
  }
  scope.AuthenticAsmodensiusAdapter=AuthenticAsmodensiusAdapter;
  if(typeof module!=='undefined'&&module.exports)module.exports={AuthenticAsmodensiusAdapter};
})(typeof window!=='undefined'?window:globalThis);
