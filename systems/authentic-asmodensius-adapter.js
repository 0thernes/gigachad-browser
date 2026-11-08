(function (scope) {
  'use strict';
  const source = scope.GigachadAsmodensiusSource || (typeof require === 'function' ? require('./generated/authentic-asmodensius.js') : null);
  const SCHEMA = 'gigachad.authentic-asmodensius.state.v1';
  const PROFILE = Object.freeze({mind:'v40', entropy:'seeded', substrate:'synthetic', noise:'quantum', access:'all'});
  const INTERVAL_MS = 250; // 4 simulated minutes per active wall-clock second; never claims biological real time.
  const LIMIT_BYTES = 8 * 1024 * 1024;
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
  class AuthenticAsmodensiusAdapter {
    constructor({seed=1}={}) {
      if(!source)throw new Error('Authentic Asmodensius source bundle unavailable');
      this.seed=integer(seed,0,4294967295,'seed');
      this._creature=new source.Creature001(this.seed,PROFILE);
      this.elapsedMs=0;this.paused=false;this.lastInput=new Float64Array(16);this.motor2D=new Float64Array(2);this.lastError=null;
      this.status='ready';this.lastStepDurationMs=0;
    }
    static get sourceDigest(){return source.sourceDigest;}
    static get intervalMs(){return INTERVAL_MS;}
    static observeChrome({width,height,x,y,vx,vy,tabCount,focused,loading}) {
      const w=Math.max(1,finite(width,'width')),h=Math.max(1,finite(height,'height'));
      const px=unit(x/w),py=unit(y/h),dx=Math.tanh(finite(vx,'vx')/10),dy=Math.tanh(finite(vy,'vy')/10);
      return Float64Array.from([unit(w/3840),unit(h/2160),px,py,1-px,1-py,(1+dx)/2,(1+dy)/2,unit(tabCount/16),focused?1:0,loading?1:0,unit(Math.hypot(vx,vy)/20),unit(Math.min(px,1-px)*2),unit(Math.min(py,1-py)*2),w>=h?1:0,1]);
    }
    step(input) {
      if(this.paused)return this.readout();
      if(!input || input.length!==16)throw new TypeError('Original Creature001 requires exactly 16 sensory lines');
      const values=Array.from(input,unit);
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
      this.elapsedMs+=Math.min(elapsedMs,100);
      if(this.elapsedMs>=INTERVAL_MS){this.elapsedMs-=INTERVAL_MS;return this.step(input);}
      return this.readout();
    }
    setPaused(paused){this.paused=Boolean(paused);}
    readout(){return {backend:'original-asmodensius-creature001',sourceDigest:source.sourceDigest,status:this.paused?'paused':this.status,simulatedMinutes:this._creature.t(),tickIntervalMs:INTERVAL_MS,neurons:source.NNEU,motor2D:Array.from(this.motor2D),motor8:Array.from(this._creature.motor()),lastInput:Array.from(this.lastInput),lastStepDurationMs:this.lastStepDurationMs,metrics:this._creature.metrics(),lastError:this.lastError};}
    exportState() {
      const payload=stringify({seed:this.seed,profile:PROFILE,elapsedMs:this.elapsedMs,paused:this.paused,input:Array.from(this.lastInput),motor:Array.from(this.motor2D),native:this._creature.snapshot(),sets:collectSets(this._creature.o)});
      if(payload.length>LIMIT_BYTES)throw new Error('Authentic checkpoint exceeds 8 MiB; state was not saved');
      return {schema:SCHEMA,sourceDigest:source.sourceDigest,checksum:checksum(payload),payload};
    }
    importState(envelope) {
      try {
        if(!envelope || envelope.schema!==SCHEMA || envelope.sourceDigest!==source.sourceDigest || typeof envelope.payload!=='string' || envelope.payload.length>LIMIT_BYTES || envelope.checksum!==checksum(envelope.payload))throw new TypeError('Invalid, incompatible or corrupted authentic checkpoint');
        const data=parse(envelope.payload);
        validateTree(data,null);
        integer(data.seed,0,4294967295,'seed');
        if(JSON.stringify(data.profile)!==JSON.stringify(PROFILE))throw new TypeError('Unsupported source profile');
        if(typeof data.paused!=='boolean' || data.elapsedMs<0 || data.elapsedMs>=INTERVAL_MS)throw new TypeError('Invalid scheduler state');
        finite(data.elapsedMs,'elapsedMs');
        if(!Array.isArray(data.input)||data.input.length!==16||data.input.some(x=>x<0||x>1)||!Array.isArray(data.motor)||data.motor.length!==2||data.motor.some(x=>Math.abs(x)>1))throw new TypeError('Invalid adapter vector shape/range');
        const candidate=new source.Creature001(data.seed,PROFILE);
        const fresh=candidate.snapshot();candidate.step();const warm=candidate.snapshot();
        if(!data.native || !data.native.org || Object.keys(data.native).sort().join(',')!=='lastSite,nChoices,org')throw new TypeError('Missing original state');
        const keys=Object.keys(data.native.org),allowed=Object.keys(fresh.org),required=allowed.filter(k=>fresh.org[k]!==undefined);
        if(required.some(k=>!Object.hasOwn(data.native.org,k))||keys.some(k=>!allowed.includes(k)&&k!=='c10got'))throw new TypeError('Incomplete or unknown organism fields');
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
        if(!Array.isArray(data.sets)||data.sets.length>10)throw new TypeError('Invalid collection records');
        const expectedSets=collectSets(candidate.o);
        if(data.sets.length!==expectedSets.length)throw new TypeError('Incomplete collection state');
        const seen=new Set();
        for(const record of data.sets){
          if(!expectedSets.some(s=>s.part===record.part&&s.field===record.field)||!Array.isArray(record.values)||record.values.length>64||record.values.some(x=>typeof x!=='string')||seen.has(record.part+'.'+record.field))throw new TypeError('Invalid collection record');
          seen.add(record.part+'.'+record.field);candidate.o[record.part][record.field]=new Set(record.values);
        }
        if(stringify(candidate.snapshot())!==stringify(data.native))throw new TypeError('Restored source state does not round trip exactly');
        this._creature=candidate;this.seed=data.seed;this.elapsedMs=data.elapsedMs;this.paused=data.paused;this.lastInput.set(data.input);this.motor2D.set(data.motor);this.status=candidate.t()?(candidate.alive()?'running':'organism-dead'):'ready';this.lastError=null;return true;
      } catch(error){this.lastError=error.message;return false;}
    }
  }
  scope.AuthenticAsmodensiusAdapter=AuthenticAsmodensiusAdapter;
  if(typeof module!=='undefined'&&module.exports)module.exports={AuthenticAsmodensiusAdapter};
})(typeof window!=='undefined'?window:globalThis);
