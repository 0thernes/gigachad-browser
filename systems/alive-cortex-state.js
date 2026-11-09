/* Exact local cortex/connectome storage. No stepping, I/O or browser access.
 * Callers fence all writers. Native view/buffer expandos are excluded metadata
 * and never inspected; their numeric index keys must not be enumerated.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveCortexState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COMPONENT_ID = 'deep-cortex-connectome', SCHEMA_VERSION = 1;
  const TENSOR_COUNT = 47, TENSOR_BYTES = 4994760, STATE_COUNT = 43;
  const SCOPE = Object.freeze({ kind: 'declared-local-cortex-connectome', completeApplicationCatalog: false,
    includes: '47 standalone native views, retained traversal history, 43 scalar/array state rows, and three connectome aliases into owned matrices',
    primaryAliases: 'Actor and critic aliases are identity-only bindings; their bytes belong to the primary component and are neither captured nor fenced here',
    excludes: 'Primary tensor bytes, other model components, global RNG, browser authority, external observations and input/order history, pending operations',
    continuation: 'Further numerical updates require independently equivalent omitted state and inputs; local storage does not establish whole-model continuation',
    nativeProperties: 'Custom JavaScript properties on native views/buffers are excluded non-model metadata and ignored without invoking them; native type/storage intrinsics determine all captured bytes',
    numericDomains: 'Finite floating storage; bounded phases/cursors/flags and nonnegative safe counters; nonnegative KL/gradient/mean-absolute-weight; exact coverage receipts match retained masks; populated expert labels match selected indices and paired gates; finite imported matrix weights have no invented global clamp',
    publication: 'In-place registered writes under a caller-owned generation fence with readback and best-effort verified rollback; not a whole-model transaction',
    inputs: 'Ordinary non-Proxy cortex/connectome own-data records and fixed nonshared native backings; unknown graph fields rejected' });
  const DC_FLOATS = [
    ['x64',[64]], ['h256',[256]], ['h128',[128]], ['rssmH',[128]], ['rssmZPrior',[128]], ['rssmZPost',[128]],
    ['nextRH',[128]], ['actH',[128]], ['decX64',[64]], ['act32',[32]], ['masterCmd64',[64]], ['attnWeights8',[8]],
    ['W_enc1',[256,64]], ['b_enc1',[256]], ['ln1_g',[256]], ['W_enc2',[128,256]], ['b_enc2',[128]], ['ln2_g',[128]],
    ['W_rssm_rec',[128,128]], ['W_rssm_in',[128,128]], ['W_prior',[128,128]], ['W_post',[128,128]], ['W_dec',[64,128]],
    ['W_attn_qkv',[192,64]], ['W_attn_out',[64,64]], ['W_actor_h',[128,128]], ['W_actor_out',[32,128]],
    ['W_critic_h',[64,128]], ['W_critic_out',[1,64]], ['M_hopfield',[128,128]], ['W_moe_experts',[2048,256]],
    ['W_connectome_synapses',[512,512]], ['W_stdp_elig',[512,512]], ['W_browser_master',[64,128]], ['W_body_genome',[51,64]],
    ['moeInput256',[256]], ['moeResidual256',[256]]
  ];
  const DC_BYTES = [['moeCoveragePhases8',[8]], ['moeCoverageMasks8',[8]], ['attentionQkvCoverage768',[768]], ['attentionOutputCoverage512',[512]]];
  const CN_FLOATS = [['v512',[512]], ['trace512',[512]], ['neuropilRates6',[6]]];
  const CN_BYTES = [['spikes512',[512]], ['axonCoveragePhases512',[512]], ['axonCoverageMasks512',[512]]];
  const f64 = (min, max) => ({ type: 'f64', ...(min === undefined ? {} : { min }), ...(max === undefined ? {} : { max }) });
  const i53 = (max = Number.MAX_SAFE_INTEGER) => ({ type: 'i53', min: 0, max });
  const DC_NUMBERS = {
    hopfieldWritePtr: i53(127), criticValue: f64(-1,1), rssmKlDivergence: f64(0,2), imaginedHorizon5Return: f64(), gradNormL2: f64(0),
    totalParams: { type:'i53',min:1245184,max:1245184 }, totalBytes: { type:'i53',min:4980736,max:4980736 },
    moeExplorationCursor: i53(7), moeParameterVisits: i53(), moeUniqueParametersVisited: i53(524288),
    moeParameterVisitsThisStep: i53(16384), moeParameterCoveragePct: f64(0,100),
    attentionQkvPhase: i53(767), attentionOutputPhase: i53(511), attentionQkvUniqueParameters: i53(12288),
    attentionOutputUniqueParameters: i53(4096), attentionParameterVisits: i53(), attentionParameterVisitsThisStep: i53(24),
    attentionParameterCoveragePct: f64(0,100), cortexCoverageStep: i53(), cortexPairedReadMask: i53(3),
    cortexGradientMask: i53(255), cortexPairedWeightVisitsThisStep: i53(32768), cortexGradientUpdatesThisStep: i53(1536)
  };
  const CN_NUMBERS = {
    totalSynapses: { type:'i53',min:262144,max:262144 }, activeSpikesCount: i53(512), activeSynapsesTraversed: i53(262144),
    stdpUpdatesCount: i53(), meanSynapticWeight: f64(0), axonalPresynapticCursor: i53(511), synapseVisits: i53(),
    uniqueSynapsesTraversed: i53(262144), processedPresynapticSpikes: i53(44), synapseCoveragePct: f64(0,100)
  };
  const DC_STRINGS = ['moeCoverageScope','attentionCoverageScope','hopfieldReadoutScope','cortexCoverageScope'];
  const CN_STRINGS = ['synapseCoverageScope'];
  const EXPERT_LABELS = ['EXP0:DOM_TOPOLOGY','EXP1:FLYWIRE_RING','EXP2:HIPPOCAMPAL_MEM','EXP3:HDC1024_ANALOGY',
    'EXP4:SVO_CAUSAL','EXP5:ALLOSTATIC_VISCERA','EXP6:VERLET_LOCOMOTION','EXP7:SOVEREIGN_MASTER'];
  const NEUROPILS = ['CX_ELLIPSOID_RING(0..85)','MB_KENYON_SPARSE(86..171)','HIP_CA3_CA1_LOOP(172..257)',
    'CTX_PYRAMIDAL_L23_L5(258..343)','BG_STRIATAL_D1_D2(344..429)','CER_PURKINJE_ERR(430..511)'];
  const CN_ALIASES = { synWeights262K:'W_connectome_synapses', synapticWeights:'W_connectome_synapses', eligibilityTraces:'W_stdp_elig' };
  const PRIMARY = [['W_actor',80],['W_critic',16]];
  const VIEWS = [...DC_FLOATS.map(([name,dimensions])=>({root:'dc',name,dimensions,dtype:'Float32Array'})),
    ...DC_BYTES.map(([name,dimensions])=>({root:'dc',name,dimensions,dtype:'Uint8Array'})),
    ...CN_FLOATS.map(([name,dimensions])=>({root:'cn',name,dimensions,dtype:'Float32Array'})),
    ...CN_BYTES.map(([name,dimensions])=>({root:'cn',name,dimensions,dtype:'Uint8Array'}))];
  const arraySchema = (items, minLength, maxLength, unique) => ({type:'array',items,minLength,maxLength,...(unique === undefined ? {} : {unique})});
  const DC_ARRAYS = {
    topMoEExperts: arraySchema({type:'string',maxLength:64},2,2,true),
    moeActiveExpertIndices: arraySchema(i53(7),0,2,true),
    moeActiveGates: arraySchema(f64(0,1),0,2)
  };
  const CN_ARRAYS = { neuropilNames: arraySchema({type:'string',maxLength:64},6,6,true) };
  const STATES = [
    ...Object.entries(DC_NUMBERS).map(([name,schema])=>({root:'dc',name,schema})),
    ...Object.entries(CN_NUMBERS).map(([name,schema])=>({root:'cn',name,schema})),
    ...DC_STRINGS.map(name=>({root:'dc',name,schema:{type:'string',maxLength:512}})),
    ...CN_STRINGS.map(name=>({root:'cn',name,schema:{type:'string',maxLength:512}})),
    ...Object.entries(DC_ARRAYS).map(([name,schema])=>({root:'dc',name,schema})),
    ...Object.entries(CN_ARRAYS).map(([name,schema])=>({root:'cn',name,schema}))];
  const dispositions = root => Object.freeze(Object.fromEntries([
    ...VIEWS.filter(r=>r.root===root).map(r=>[r.name,'exact-native-view']),
    ...STATES.filter(r=>r.root===root).map(r=>[r.name,'exact-state']),
    ...(root==='dc' ? PRIMARY.map(([name])=>[name,'primary-owned-identity-alias']) : Object.keys(CN_ALIASES).map(name=>[name,'owned-cortex-view-alias']))]));
  const FIELD_DISPOSITIONS = Object.freeze({dc:dispositions('dc'),cn:dispositions('cn')});
  const keySets = Object.fromEntries(Object.entries(FIELD_DISPOSITIONS).map(([root,fields])=>[root,new Set(Object.keys(fields))]));
  const own = (o,k)=>Object.prototype.hasOwnProperty.call(o,k), descriptor=Object.getOwnPropertyDescriptor;
  const tp=Object.getPrototypeOf(Uint8Array.prototype), get=key=>descriptor(tp,key).get;
  const native={buffer:get('buffer'),offset:get('byteOffset'),length:get('length'),bytes:get('byteLength'),dtype:descriptor(tp,Symbol.toStringTag).get,
    bufferBytes:descriptor(ArrayBuffer.prototype,'byteLength').get,resizable:descriptor(ArrayBuffer.prototype,'resizable')?.get};
  const constructors={Float32Array,Uint8Array};
  const fail=message=>{throw new TypeError('Cortex state: '+message);};
  const integer=value=>Number.isSafeInteger(value)&&!Object.is(value,-0)&&value>=0;
  const lengthOf=row=>row.dimensions.reduce((a,b)=>a*b,1);
  const sameDescriptor=(a,b)=>!!a&&!!b&&own(a,'value')&&own(b,'value')&&Object.is(a.value,b.value)&&a.writable===b.writable&&a.enumerable===b.enumerable&&a.configurable===b.configurable;
  function sameBytes(a,b) { if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true; }
  function data(object,key,writable=false) {
    const slot=descriptor(object,key);
    if(!slot||!own(slot,'value')||writable&&slot.writable!==true)fail('expected '+(writable?'writable ':'')+'own-data slot '+key);
    return slot;
  }
  function record(value,root) {
    if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('ordinary '+root+' record required');
    const keys=Reflect.ownKeys(value),expected=keySets[root];
    if(keys.length!==expected.size||keys.some(key=>typeof key!=='string'||!expected.has(key)))fail('unknown/missing '+root+' field');
  }
  function viewInfo(view,dtype,length) {
    const C=constructors[dtype];let buffer;
    try {
      if(Object.getPrototypeOf(view)!==C.prototype||native.dtype.call(view)!==dtype||native.length.call(view)!==length||native.offset.call(view)!==0||native.bytes.call(view)!==length*C.BYTES_PER_ELEMENT)fail('native tensor type/shape mismatch');
      buffer=native.buffer.call(view);
      if(Object.getPrototypeOf(buffer)!==ArrayBuffer.prototype||native.bufferBytes.call(buffer)!==length*C.BYTES_PER_ELEMENT||native.resizable?.call(buffer))fail('fixed standalone nonshared backing required');
      new Uint8Array(buffer); // rejects detached storage without property enumeration
    } catch(error) { fail('invalid native tensor: '+error.message); }
    return {view,buffer};
  }
  function tensorPolicy(row) {
    const id=row.root+'.'+row.name, ranges={
      'dc.attnWeights8':[0,1], 'cn.trace512':[0,1.5], 'cn.neuropilRates6':[0,1],
      'dc.moeCoveragePhases8':[0,7], 'cn.axonCoveragePhases512':[0,7],
      'dc.attentionQkvCoverage768':[0,1], 'dc.attentionOutputCoverage512':[0,1], 'cn.spikes512':[0,1]
    };
    return {format:'native',finite:true,...(ranges[id]?{min:ranges[id][0],max:ranges[id][1]}:{})};
  }
  function scalar(value,schema) {
    if(schema.type==='i53') {if(!integer(value))fail('nonnegative safe integer required');}
    else if(schema.type==='f64') {if(typeof value!=='number'||!Number.isFinite(value))fail('finite scalar required');}
    else if(schema.type==='string') {if(typeof value!=='string'||value.length>schema.maxLength)fail('bounded string required');return;}
    if(schema.min!==undefined&&value<schema.min||schema.max!==undefined&&value>schema.max)fail('scalar domain rejected');
  }
  function popcount(byte) {let n=0;while(byte){byte&=byte-1;n++;}return n;}
  function validateReceipts(dc,cn) {
    if(dc.topMoEExperts.some(label=>!EXPERT_LABELS.includes(label)))fail('unknown expert label');
    if(cn.neuropilNames.some((label,i)=>label!==NEUROPILS[i]))fail('constant neuropil names mismatch');
    const indices=dc.moeActiveExpertIndices,gates=dc.moeActiveGates;
    if(indices.length!==gates.length||![0,2].includes(indices.length))fail('paired expert selections must be empty or length two');
    if(indices.length===2&&indices.some((index,i)=>dc.topMoEExperts[i]!==EXPERT_LABELS[index]))fail('expert labels disagree with selected indices');
    if(gates.length&&(!(gates[1]>=.05&&gates[1]<=.5)||gates[0]!==1-gates[1]))fail('expert gates mismatch');
    const reduce=Uint8Array.prototype.reduce;
    const moeUnique=reduce.call(dc.moeCoverageMasks8,(sum,n)=>sum+popcount(n)*8192,0);
    const synUnique=reduce.call(cn.axonCoverageMasks512,(sum,n)=>sum+popcount(n)*64,0);
    const qkvUnique=reduce.call(dc.attentionQkvCoverage768,(sum,n)=>sum+n*16,0);
    const outUnique=reduce.call(dc.attentionOutputCoverage512,(sum,n)=>sum+n*8,0);
    if(dc.moeUniqueParametersVisited!==moeUnique||dc.moeParameterCoveragePct!==100*moeUnique/524288||
      cn.uniqueSynapsesTraversed!==synUnique||cn.synapseCoveragePct!==100*synUnique/262144||
      dc.attentionQkvUniqueParameters!==qkvUnique||dc.attentionOutputUniqueParameters!==outUnique||
      dc.attentionParameterCoveragePct!==100*(qkvUnique+outUnique)/16384)fail('coverage receipts disagree with retained masks');
  }
  function inspect(h,copyBytes=false) {
    if(!h||typeof h!=='object'||Array.isArray(h))fail('runtime object required');
    const checks=[],check=(object,key,writable=false)=>{const slot=data(object,key,writable);checks.push({object,key,slot});return slot.value;};
    const dc=check(h,'deepCortex'),cn=check(h,'connectome512');record(dc,'dc');record(cn,'cn');
    const roots={dc,cn},primaryBuffers=new Set();
    for(const [name,length] of PRIMARY) {
      const primary=check(h,name),alias=check(dc,name);
      if(alias!==primary)fail('primary alias identity mismatch '+name);
      const info=viewInfo(primary,'Float32Array',length);
      if(primaryBuffers.has(info.buffer))fail('primary backings overlap');primaryBuffers.add(info.buffer);
    }
    const buffers=new Set(),views=[];
    for(const row of VIEWS) {
      const view=check(roots[row.root],row.name),info=viewInfo(view,row.dtype,lengthOf(row));
      if(buffers.has(info.buffer)||primaryBuffers.has(info.buffer))fail('owned backing alias/primary overlap '+row.name);
      buffers.add(info.buffer);
      const p=tensorPolicy(row);
      // Large finite-only matrices are checked once on owned copied bytes by
      // registry.capture/preflight. Only small domain-constrained vectors need
      // this extra pass for receipt validation; no numeric keys are enumerated.
      if(p.min!==undefined||p.max!==undefined)for(let i=0;i<lengthOf(row);i++){const v=view[i];if(!Number.isFinite(v)||v<p.min||v>p.max)fail('tensor numeric domain rejected '+row.name);}
      views.push({...info,bytes:copyBytes?new Uint8Array(info.buffer).slice():null});
    }
    for(const [alias,name] of Object.entries(CN_ALIASES))if(check(cn,alias)!==data(dc,name).value)fail('connectome alias identity mismatch '+alias);
    for(const row of STATES) {
      const value=check(roots[row.root],row.name,true),s=row.schema;
      if(s.type!=='array'){scalar(value,s);continue;}
      if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype)fail('ordinary state array required');
      const length=check(value,'length');
      if(length<s.minLength||length>s.maxLength)fail('state array length invalid');
      const keys=Reflect.ownKeys(value);
      if(keys.length!==length+1||keys.some(key=>key!=='length'&&(typeof key!=='string'||!/^(0|[1-9][0-9]*)$/.test(key)||Number(key)>=length)))fail('state array hole/expando');
      const values=[];for(let i=0;i<length;i++){const item=check(value,String(i));scalar(item,s.items);values.push(item);}
      if(s.unique&&new Set(values).size!==values.length)fail('state array duplicates');
    }
    validateReceipts(dc,cn);
    return {h,hPrototype:Object.getPrototypeOf(h),dc,cn,dcPrototype:Object.getPrototypeOf(dc),cnPrototype:Object.getPrototypeOf(cn),checks,views};
  }
  function unchanged(before,h) {
    const after=inspect(h);
    if(before.h!==h||before.hPrototype!==after.hPrototype||before.dc!==after.dc||before.cn!==after.cn||before.dcPrototype!==after.dcPrototype||before.cnPrototype!==after.cnPrototype||
      before.checks.length!==after.checks.length||before.checks.some((c,i)=>c.object!==after.checks[i].object||c.key!==after.checks[i].key||!sameDescriptor(c.slot,after.checks[i].slot))||
      before.views.some((v,i)=>v.view!==after.views[i].view||v.buffer!==after.views[i].buffer||!sameBytes(v.bytes,new Uint8Array(v.buffer))))fail('destination changed since preflight');
    return after;
  }
  function definitionRows() {
    const tensors=VIEWS.map(row=>{
      const id=row.root+'.'+row.name,paths=[{root:row.root,keys:[row.name]}];
      if(row.root==='dc')for(const [alias,name]of Object.entries(CN_ALIASES))if(name===row.name)paths.push({root:'cn',keys:[alias]});
      return {id,componentId:COMPONENT_ID,role:row.root==='dc'?'cortex-local-view':'connectome-local-view',paths,dtype:row.dtype,
        dimensions:row.dimensions.slice(),backingGroup:id,backingOffset:0,backingByteLength:lengthOf(row)*constructors[row.dtype].BYTES_PER_ELEMENT,policy:tensorPolicy(row)};
    });
    const states=STATES.map(row=>({id:row.root+'.'+row.name,componentId:COMPONENT_ID,role:row.root==='dc'?'cortex-local-state':'connectome-local-state',
      paths:[{root:row.root,keys:[row.name]}],schemaVersion:1,required:true,schema:row.schema}));
    return {tensors,states,families:[],resumeRules:[]};
  }
  function blankRuntime() {
    const h={deepCortex:{},connectome512:{},W_actor:new Float32Array(80),W_critic:new Float32Array(16)},roots={dc:h.deepCortex,cn:h.connectome512};
    for(const row of VIEWS)roots[row.root][row.name]=new constructors[row.dtype](lengthOf(row));
    for(const row of STATES)roots[row.root][row.name]=row.schema.type==='array'?[]:row.schema.type==='string'?'':row.schema.min>0?row.schema.min:0;
    roots.dc.topMoEExperts=[EXPERT_LABELS[0],EXPERT_LABELS[4]];roots.cn.neuropilNames=NEUROPILS.slice();
    for(const [name] of PRIMARY)roots.dc[name]=h[name];
    for(const [alias,name]of Object.entries(CN_ALIASES))roots.cn[alias]=roots.dc[name];return h;
  }
  async function create({registry,codec,crypto}={}) {
    if(typeof registry?.compile!=='function'||typeof codec?.fingerprintDescriptors!=='function'||typeof codec?.verifiedCopy!=='function')fail('compatible codec and registry required');
    const rows=definitionRows();
    const implementationDigest=await codec.fingerprintDescriptors({componentId:COMPONENT_ID,schemaVersion:SCHEMA_VERSION,...rows,
      expertLabels:EXPERT_LABELS,neuropilNames:NEUROPILS,fieldDispositions:FIELD_DISPOSITIONS,interpretation:SCOPE},{crypto});
    const compiled=await registry.compile({registryVersion:1,components:[{id:COMPONENT_ID,schemaVersion:SCHEMA_VERSION,implementationDigest,present:true}],...rows},{codec,crypto});
    const bindings=new WeakMap(),plans=new WeakMap();
    const generation=value=>{if(!integer(value))fail('valid model generation required');};
    const summary=(status,gen)=>({status,...(gen===undefined?{}:{generation:gen}),tensorCount:TENSOR_COUNT,tensorBytes:TENSOR_BYTES,stateCount:STATE_COUNT,scope:SCOPE.kind});
    function roots(current) {
      let saved=bindings.get(current.h);
      if(saved&&(saved.dc!==current.dc||saved.cn!==current.cn))fail('cached cortex/connectome binding changed');
      if(!saved){saved={dc:current.dc,cn:current.cn};bindings.set(current.h,saved);}return saved;
    }
    function stage(decoded) {
      const h=blankRuntime(),bound=roots(inspect(h));
      compiled.apply(compiled.preflight(decoded,bound,{generation:0}),bound,{generation:0});inspect(h);
    }
    function planFor(prepared,h,gen) {
      generation(gen);const plan=plans.get(prepared);
      if(!plan||plan.h!==h||plan.generation!==gen)fail('stale or foreign cortex publication plan');return plan;
    }
    function recheck(prepared,h,{generation:gen}={}) {const plan=planFor(prepared,h,gen);unchanged(plan.before,h);return summary('ready',gen);}
    return Object.freeze({architecture:compiled.architecture,scope:SCOPE,
      capture(h,snapshot,{generation:gen,provenance}={}) {generation(gen);return compiled.capture(roots(inspect(h)),snapshot,{generation:gen,provenance});},
      validate(decoded) {stage(decoded);return summary('validated');},
      preflight(decoded,h,{generation:gen}={}) {
        generation(gen);const before=inspect(h,true),bound=roots(before);stage(decoded);unchanged(before,h);
        const compiledPlan=compiled.preflight(decoded,bound,{generation:gen}),prepared=Object.freeze(summary('prepared',gen));
        plans.set(prepared,{h,generation:gen,before,bound,compiledPlan});return prepared;
      },recheck,
      apply(prepared,h,{generation:gen}={}) {
        const plan=planFor(prepared,h,gen);unchanged(plan.before,h);plans.delete(prepared);
        const receipt=compiled.apply(plan.compiledPlan,plan.bound,{generation:gen});return {...summary('applied',gen),readbackVerified:receipt.readbackVerified};
      },
      discard(prepared){return plans.delete(prepared);}
    });
  }
  return Object.freeze({create,COMPONENT_ID,SCHEMA_VERSION,TENSOR_COUNT,TENSOR_BYTES,STATE_COUNT,fieldDispositions:FIELD_DISPOSITIONS,scope:SCOPE});
});
