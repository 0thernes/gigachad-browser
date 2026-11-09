/* Trusted descriptor registry. No application component catalog is implied.
 *
 * await compile(definition, { codec, crypto }) produces:
 *   capture(roots, snapshot, { generation, provenance? }) -> owned codec input
 *   preflight(codecDecodedHandle, roots, { generation }) -> opaque frozen plan
 *   apply(plan, roots, { generation }) -> synchronous readback receipt
 *
 * Fixed tensors declare native type/shape/backing and all aliases. Fixed states
 * declare their own-data leaf paths and bounded scalar/container schemas.
 * Families declare preallocated slots plus registered count/indices/cursor
 * state IDs. Their capacity/templates are static architecture; occupancy is
 * runtime data. Only occupied rows are serialized, with exact expected IDs.
 * Capture has no awaits; callers must fence their model writers before it.
 * Apply rechecks generation, identity, alias topology and destination contents
 * before its first write. Prepared data is private and plans are single-use.
 * The exported scope lists deliberate unsupported integration boundaries.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveLearnedStateRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITS = Object.freeze({ tensors: 4096, states: 8192, aliases: 16384, tensorBytes: 16 * 1024 * 1024,
    nodes: 100000, depth: 24, stringUnits: 2 * 1024 * 1024, overlapBytes: 32 * 1024 * 1024, capacity: 1024 });
  const SCOPE = Object.freeze({ kind: 'declared-preallocated-state-only', completeApplicationCatalog: false,
    missingFamilySlots: 'unsupported-allocation: all declared destination slots must already exist',
    nativeImports: 'unsupported: no callbacks, native instance replacement, or closure import',
    objectAliases: 'declared paths preserve one state value; undeclared nested/shared object aliases are rejected',
    roots: 'trusted ordinary objects/native typed views; proxies and concurrent shared memory are unsupported',
    coverage: 'Exact registered instance roster; independent component inventory and mutation audit remain required',
    resume: 'Resume rules are compared and returned as data; browser authority/reset actions are not executed' });
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  const constructors = { Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Int8Array,
    Uint16Array, Int16Array, Uint32Array, Int32Array, BigInt64Array, BigUint64Array };
  const tp = Object.getPrototypeOf(Uint8Array.prototype);
  const getter = name => Object.getOwnPropertyDescriptor(tp, name).get;
  const native = { buffer: getter('buffer'), offset: getter('byteOffset'), bytes: getter('byteLength'), length: getter('length'),
    dtype: Object.getOwnPropertyDescriptor(tp, Symbol.toStringTag).get, set: Uint8Array.prototype.set,
    bufferBytes: Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get,
    mapSize: Object.getOwnPropertyDescriptor(Map.prototype, 'size').get,
    setSize: Object.getOwnPropertyDescriptor(Set.prototype, 'size').get };
  const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const fail = message => { throw new Error('Learned-state registry: ' + message); };
  const integer = (n, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) && !Object.is(n, -0) && n >= min && n <= max;
  function key(value) { if (typeof value !== 'string' || !value.length || value.length > 128 || /[\x00-\x1f\x7f]/.test(value) || forbidden.has(value)) fail('unsafe identifier/path key'); return value; }
  function plain(value) { return value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)); }
  function exact(value, required, optional = []) {
    if (!plain(value) || Object.getOwnPropertySymbols(value).length) fail('expected plain own-data record');
    const names = Object.getOwnPropertyNames(value);
    if (required.some(k => !own(value, k)) || names.some(k => !required.includes(k) && !optional.includes(k))) fail('missing or unknown descriptor field');
    for (const name of names) if (!own(Object.getOwnPropertyDescriptor(value, name), 'value')) fail('accessor descriptors are unsupported');
  }
  function boundedCopy(value, budget = { nodes: 0, strings: 0 }, depth = 0) {
    if (++budget.nodes > LIMITS.nodes || depth > LIMITS.depth) fail('metadata work/depth bound exceeded');
    if (typeof value === 'string') { budget.strings += value.length; if (budget.strings > LIMITS.stringUnits) fail('metadata string bound exceeded'); return value; }
    if (value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || !Array.isArray(value) && !plain(value)) fail('metadata must contain plain data only');
    if (Array.isArray(value) && Object.getPrototypeOf(value) !== Array.prototype) fail('custom metadata array prototype is unsupported');
    if (Object.getOwnPropertySymbols(value).length) fail('symbol metadata is unsupported');
    const result = Array.isArray(value) ? [] : {};
    const names = Object.getOwnPropertyNames(value).filter(k => !(Array.isArray(value) && k === 'length'));
    if (Array.isArray(value) && (names.length !== value.length || names.some((k, i) => k !== String(i)))) fail('sparse/custom metadata arrays are unsupported');
    for (const name of names) {
      key(name); const d = Object.getOwnPropertyDescriptor(value, name);
      if (!own(d, 'value')) fail('metadata accessors are unsupported');
      Object.defineProperty(result, name, { value: boundedCopy(d.value, budget, depth + 1), writable: true, configurable: true, enumerable: true });
    }
    return result;
  }
  function freeze(value) { if (value && typeof value === 'object') { for (const v of Object.values(value)) freeze(v); Object.freeze(value); } return value; }
  function path(value) {
    exact(value, ['root', 'keys']); key(value.root);
    if (!Array.isArray(value.keys) || !value.keys.length || value.keys.length > 16) fail('path depth invalid');
    value.keys.forEach(key); return value;
  }
  function relativePaths(paths) {
    if (!Array.isArray(paths) || !paths.length || paths.length > 32) fail('alias count invalid');
    for (const keys of paths) { if (!Array.isArray(keys) || !keys.length || keys.length > 14) fail('relative path depth invalid'); keys.forEach(key); }
  }
  function resolve(roots, p, checks, writable = false) {
    let object = roots;
    const names = [p.root, ...p.keys];
    for (let i = 0; i < names.length; i++) {
      if (!object || typeof object !== 'object') fail('missing own-data path ' + JSON.stringify(p));
      const name = names[i], d = Object.getOwnPropertyDescriptor(object, name);
      if (!d || !own(d, 'value')) fail('missing/accessor own-data path ' + JSON.stringify(p));
      if (i === names.length - 1 && writable && d.writable !== true) fail('state destination is not writable');
      checks?.push({ object, name, value: d.value, writable: d.writable, configurable: d.configurable, enumerable: d.enumerable });
      if (i === names.length - 1) return { parent: object, name, value: d.value };
      object = d.value;
    }
  }
  function viewInfo(view) {
    if (!ArrayBuffer.isView(view)) fail('expected native typed view');
    let info;
    try { info = { view, dtype: native.dtype.call(view), buffer: native.buffer.call(view), offset: native.offset.call(view), bytes: native.bytes.call(view), length: native.length.call(view) }; }
    catch (_) { fail('unsupported or detached typed view'); }
    if (!own(constructors, info.dtype) || !(info.buffer instanceof ArrayBuffer)) fail('unsupported dtype/shared backing');
    // Constructing a view rejects a detached ArrayBuffer, including zero-length views.
    new Uint8Array(info.buffer, info.offset, info.bytes);
    return info;
  }
  function shape(row) {
    if (!own(constructors, row.dtype) || !Array.isArray(row.dimensions) || !row.dimensions.length || row.dimensions.length > 8) fail('dtype or rank invalid');
    let product = 1;
    for (const n of row.dimensions) { if (!integer(n, 0, LIMITS.tensorBytes)) fail('dimension invalid'); product *= n; if (!Number.isSafeInteger(product) || product > LIMITS.tensorBytes) fail('dimension product exceeds bound'); }
    const bytes = product * constructors[row.dtype].BYTES_PER_ELEMENT;
    if (!integer(bytes, 0, LIMITS.tensorBytes) || !integer(row.backingOffset, 0, LIMITS.tensorBytes) ||
        !integer(row.backingByteLength, 0, LIMITS.tensorBytes) || row.backingOffset + bytes > row.backingByteLength ||
        row.backingOffset % constructors[row.dtype].BYTES_PER_ELEMENT) fail('backing range invalid');
    return { length: product, byteLength: bytes };
  }
  function policy(value, dtype) {
    exact(value, ['format', 'finite'], ['min', 'max']);
    if (!['native', 'f16', 'bf16'].includes(value.format) || typeof value.finite !== 'boolean' || value.format !== 'native' && dtype !== 'Uint16Array') fail('tensor numeric policy invalid');
    const big = /Big/.test(dtype);
    for (const name of ['min', 'max']) if (own(value, name)) {
      if (big ? typeof value[name] !== 'string' || !/^-?(0|[1-9][0-9]*)$/.test(value[name]) : typeof value[name] !== 'number' || !Number.isFinite(value[name])) fail('tensor range invalid');
    }
    if (own(value, 'min') && own(value, 'max') && (big ? BigInt(value.min) > BigInt(value.max) : value.min > value.max)) fail('inverted tensor range');
  }
  function tensor(row, family = false) {
    exact(row, ['id', 'role', 'paths', 'dtype', 'dimensions', 'backingGroup', 'backingOffset', 'backingByteLength', 'policy'], family ? [] : ['componentId']);
    if (!family && !own(row, 'componentId')) fail('tensor component missing');
    key(row.id); key(row.role); key(row.backingGroup);
    if (family) relativePaths(row.paths); else { key(row.componentId); if (!Array.isArray(row.paths) || !row.paths.length || row.paths.length > 32) fail('tensor aliases invalid'); row.paths.forEach(path); }
    shape(row); policy(row.policy, row.dtype);
  }
  function schema(s, depth = 0) {
    if (depth > 12 || !plain(s)) fail('state schema depth/type invalid');
    const range = () => { for (const k of ['min', 'max']) if (own(s, k) && (typeof s[k] !== 'number' || !Number.isFinite(s[k]))) fail('scalar bound invalid'); if (s.min > s.max) fail('inverted scalar range'); };
    switch (s.type) {
      case 'f64': case 'i53': exact(s, ['type'], ['min', 'max']); range(); break;
      case 'bigint': exact(s, ['type', 'signed', 'bits']); if (typeof s.signed !== 'boolean' || ![8,16,32,64,128,256].includes(s.bits)) fail('bigint schema invalid'); break;
      case 'boolean': case 'null': exact(s, ['type']); break;
      case 'string': exact(s, ['type', 'maxLength'], ['minLength']); if (!integer(s.maxLength, 0, 65536) || own(s, 'minLength') && !integer(s.minLength, 0, s.maxLength)) fail('string schema bound invalid'); break;
      case 'tensor': exact(s, ['type', 'id']); key(s.id); break;
      case 'array': exact(s, ['type', 'items', 'maxLength'], ['minLength', 'unique']); if (!integer(s.maxLength, 0, 8192) || own(s, 'minLength') && !integer(s.minLength, 0, s.maxLength) || own(s, 'unique') && typeof s.unique !== 'boolean') fail('array schema bound invalid'); schema(s.items, depth + 1); break;
      case 'object': exact(s, ['type', 'fields']); if (!plain(s.fields) || Object.keys(s.fields).length > 256) fail('object schema invalid'); for (const [k,v] of Object.entries(s.fields)) { key(k); schema(v, depth + 1); } break;
      case 'map': exact(s, ['type', 'keys', 'values', 'maxEntries']); if (!integer(s.maxEntries, 0, 8192)) fail('map bound invalid'); schema(s.keys, depth + 1); schema(s.values, depth + 1); if (!['f64','i53','bigint','boolean','null','string'].includes(s.keys.type)) fail('map keys must be scalar'); break;
      case 'set': exact(s, ['type', 'items', 'maxEntries']); if (!integer(s.maxEntries, 0, 8192)) fail('set bound invalid'); schema(s.items, depth + 1); if (!['f64','i53','bigint','boolean','null','string'].includes(s.items.type)) fail('set members must be scalar'); break;
      default: fail('unknown state schema type');
    }
  }
  function state(row, family = false) {
    exact(row, ['id','role','paths','schemaVersion','required','schema'], family ? [] : ['componentId']);
    if (!family && !own(row, 'componentId')) fail('state component missing');
    key(row.id); key(row.role); if (!integer(row.schemaVersion, 1) || typeof row.required !== 'boolean') fail('state descriptor invalid');
    if (family) relativePaths(row.paths); else { key(row.componentId); if (!Array.isArray(row.paths) || !row.paths.length || row.paths.length > 64) fail('state aliases invalid'); row.paths.forEach(path); }
    schema(row.schema);
  }
  function rowWire(row) { const { length, byteLength } = shape(row); return { id: row.id, componentId: row.componentId, role: row.role,
    paths: row.paths, dtype: row.dtype, dimensions: row.dimensions, length, byteLength, byteOrder: 'LE',
    backingGroup: row.backingGroup, backingOffset: row.backingOffset, backingByteLength: row.backingByteLength }; }
  const stateWire = row => ({ id: row.id, componentId: row.componentId, role: row.role, valueType: row.schema.type, schemaVersion: row.schemaVersion, required: row.required });
  const sortID = (a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  function equalBytes(a,b) { if (a.byteLength !== b.byteLength) return false; for (let i=0;i<a.length;i++) if (a[i] !== b[i]) return false; return true; }
  function numeric(bytes, row) {
    const C = constructors[row.dtype], values = new C(bytes.buffer, bytes.byteOffset, bytes.byteLength / C.BYTES_PER_ELEMENT), p = row.policy;
    const big = /Big/.test(row.dtype), min = own(p,'min') ? big ? BigInt(p.min) : p.min : null, max = own(p,'max') ? big ? BigInt(p.max) : p.max : null;
    if (p.format === 'native' && p.finite === true && min === null && max === null &&
        (row.dtype === 'Float32Array' || row.dtype === 'Float64Array')) {
      for (let i = 0; i < values.length; i++) if (!Number.isFinite(values[i])) fail('tensor numeric policy rejected ' + row.id);
      return;
    }
    const scratch = new DataView(new ArrayBuffer(4));
    for (const raw of values) {
      let v = raw;
      if (p.format === 'f16') { const exp = raw >>> 10 & 31, fraction = raw & 1023, sign = raw & 0x8000 ? -1 : 1;
        v = exp === 31 ? fraction ? NaN : sign * Infinity : sign * (exp ? 1 + fraction / 1024 : fraction / 1024) * 2 ** (exp ? exp - 15 : -14); }
      else if (p.format === 'bf16') { scratch.setUint32(0, raw << 16, true); v = scratch.getFloat32(0,true); }
      if (p.finite && !big && !Number.isFinite(v) || !big && Number.isNaN(v) && (min !== null || max !== null) || min !== null && v < min || max !== null && v > max) fail('tensor numeric policy rejected ' + row.id);
    }
  }
  async function compile(input, { codec, crypto } = {}) {
    if (!littleEndian) fail('unsupported host byte order');
    if (!codec?.fingerprintDescriptors || !codec?.canonicalDescriptorJSON || !codec?.untagValue || !codec?.verifiedCopy) fail('compatible learned-state codec required');
    const def = boundedCopy(input);
    exact(def, ['registryVersion','components','tensors','states','families','resumeRules']);
    if (!integer(def.registryVersion,1) || !Array.isArray(def.components) || !def.components.length || def.components.length > 64 ||
        !Array.isArray(def.tensors) || !Array.isArray(def.states) || !Array.isArray(def.families) || !Array.isArray(def.resumeRules)) fail('registry collections/version invalid');
    const components = new Map();
    for (const c of def.components) { exact(c,['id','schemaVersion','implementationDigest','present']); key(c.id);
      if (components.has(c.id) || !integer(c.schemaVersion,1) || !/^[a-f0-9]{64}$/.test(c.implementationDigest) || typeof c.present !== 'boolean') fail('component descriptor invalid'); components.set(c.id,c); }
    const ids = new Set(), paths = new Set(), declaredPaths = []; let bytes = 0, aliases = 0, tensorCount = 0, stateCount = 0;
    function register(row, isTensor) {
      if (!components.get(row.componentId)?.present || ids.has(row.id)) fail('unknown/absent component or duplicate ID'); ids.add(row.id);
      for (const p of row.paths) { path(p); const encoded = JSON.stringify(p); if (paths.has(encoded)) fail('duplicate declared path'); paths.add(encoded); declaredPaths.push({path:p,isTensor}); }
      aliases += row.paths.length;
      if (isTensor) { tensorCount++; bytes += shape(row).byteLength; } else stateCount++;
      if (tensorCount > LIMITS.tensors || stateCount > LIMITS.states || aliases > LIMITS.aliases || bytes > LIMITS.tensorBytes) fail('registry worst-case capacity exceeded');
    }
    def.tensors.forEach(r => { tensor(r); register(r,true); }); def.states.forEach(r => { state(r); register(r,false); });
    const families = new Set();
    function expand(f, index) {
      const base = `${f.id}/${index}/`, pathsFor = paths => paths.map(keys => ({ root:f.slotPath.root, keys:[...f.slotPath.keys,String(index),...keys] }));
      return { tensors: f.tensors.map(r => ({ ...r,id:base+r.id,componentId:f.componentId,backingGroup:base+r.backingGroup,paths:pathsFor(r.paths) })),
        states:f.states.map(r => ({ ...r,id:base+r.id,componentId:f.componentId,paths:pathsFor(r.paths) })) };
    }
    for (const f of def.families) {
      exact(f,['id','componentId','capacity','slotPath','countStateId','indicesStateId','cursorStateId','tensors','states']); key(f.id); key(f.componentId); path(f.slotPath);
      if (families.has(f.id) || !components.get(f.componentId)?.present || !integer(f.capacity,1,LIMITS.capacity) || !Array.isArray(f.tensors) || !Array.isArray(f.states)) fail('family schema invalid'); families.add(f.id);
      for (const name of ['countStateId','indicesStateId','cursorStateId']) if (!def.states.some(r => r.id === f[name])) fail('family metadata must reference fixed registered state');
      const countSchema=def.states.find(r=>r.id===f.countStateId).schema,cursorSchema=def.states.find(r=>r.id===f.cursorStateId).schema,indicesSchema=def.states.find(r=>r.id===f.indicesStateId).schema;
      if(countSchema.type!=='i53'||cursorSchema.type!=='i53'||indicesSchema.type!=='array'||indicesSchema.items.type!=='i53')fail('family occupancy schema must declare integer count/cursor and integer indices');
      f.tensors.forEach(r => tensor(r,true)); f.states.forEach(r => state(r,true));
      f.tensors.sort(sortID);f.states.sort(sortID);
      for (let i=0;i<f.capacity;i++) { const rows=expand(f,i); rows.tensors.forEach(r=>register(r,true)); rows.states.forEach(r=>register(r,false)); }
    }
    // A replaced state container cannot also be a parent of another registered leaf.
    // Such publication needs a component-specific staged-container adapter.
    const statePrefixes=new Set();for(const d of declaredPaths)if(!d.isTensor)statePrefixes.add(JSON.stringify([d.path.root,...d.path.keys]));
    for(const d of declaredPaths){const parts=[d.path.root,...d.path.keys];for(let i=2;i<parts.length;i++)if(statePrefixes.has(JSON.stringify(parts.slice(0,i))))fail('unsupported overlapping state/container paths');}
    const rules = new Set(); for (const r of def.resumeRules) { exact(r,['id','action','reason','version']); key(r.id); key(r.action);
      if (rules.has(r.id) || typeof r.reason !== 'string' || !r.reason.length || r.reason.length > 1024 || !integer(r.version,1)) fail('resume rule invalid'); rules.add(r.id); }
    def.components.sort(sortID); def.tensors.sort(sortID); def.states.sort(sortID); def.families.sort(sortID); def.resumeRules.sort(sortID);
    const fingerprint = await codec.fingerprintDescriptors(def, { crypto }); freeze(def);
    const architecture = freeze({ registryVersion:def.registryVersion,fingerprint,components:boundedCopy(def.components) });
    const canonical = value => codec.canonicalDescriptorJSON(value);
    const plans = new WeakMap();
    function generation(value) { if (!integer(value)) fail('model generation required'); }
    function makeContext(refs) { return { refs,nodes:0,strings:0,seen:new Set() }; }
    function transform(value,s,ctx,decoded=false,depth=0) {
      if (++ctx.nodes > LIMITS.nodes || depth > LIMITS.depth) fail('state work/depth bound exceeded');
      const recur = (v,t) => transform(v,t,ctx,decoded,depth+1);
      const range = () => { if (s.min !== undefined && value < s.min || s.max !== undefined && value > s.max) fail('scalar range invalid'); };
      switch(s.type) {
        case 'f64': if (typeof value !== 'number' || !Number.isFinite(value)) fail('finite scalar required'); range(); return {tag:codec.float64(value),value};
        case 'i53': if (!integer(value,-Number.MAX_SAFE_INTEGER)) fail('integer scalar required'); range(); return {tag:codec.integer(value),value};
        case 'bigint': if (typeof value !== 'bigint') fail('bigint scalar required'); return {tag:codec.bigint(value,{signed:s.signed,bits:s.bits}),value};
        case 'boolean': if (typeof value !== 'boolean') fail('boolean scalar required'); return {tag:value,value};
        case 'null': if (value !== null) fail('null required'); return {tag:null,value};
        case 'string': if (typeof value !== 'string' || value.length > s.maxLength || value.length < (s.minLength||0)) fail('string bound invalid'); ctx.strings+=value.length; if(ctx.strings>LIMITS.stringUnits)fail('state string budget exceeded'); return {tag:value,value};
        case 'tensor': { const ref=ctx.refs.get(s.id); if(!ref)fail('unknown tensor reference');
          if(decoded) { exact(value,['$type','id']); if(value.$type!=='tensor'||value.id!==s.id)fail('tensor reference mismatch'); }
          else if(value!==ref)fail('live tensor reference mismatch'); return {tag:codec.tensorRef(s.id),value:ref}; }
      }
      if (!value || typeof value!=='object' || ctx.seen.has(value)) fail('undeclared object alias or cycle'); ctx.seen.add(value);
      if (s.type==='array') {
        if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>s.maxLength||value.length<(s.minLength||0)||Object.getOwnPropertySymbols(value).length||Object.getOwnPropertyNames(value).length!==value.length+1)fail('array shape invalid');
        const items=[],values=[]; for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!own(d,'value'))fail('array hole/accessor');const x=recur(d.value,s.items);items.push(x.tag);values.push(x.value);}
        if(s.unique&&new Set(values).size!==values.length)fail('duplicate array member'); return {tag:{$type:'array',items},value:values};
      }
      if(s.type==='object') {
        if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.getOwnPropertySymbols(value).length)fail('plain state object required');
        const names=Object.getOwnPropertyNames(value);if(names.length!==Object.keys(s.fields).length||names.some(k=>!own(s.fields,k)))fail('missing/unknown state object key');
        const entries=[],out={};for(const k of names){const d=Object.getOwnPropertyDescriptor(value,k);if(!own(d,'value'))fail('state accessor');const x=recur(d.value,s.fields[k]);entries.push([k,x.tag]);Object.defineProperty(out,k,{value:x.value,writable:true,configurable:true,enumerable:true});}
        return {tag:{$type:'object',entries},value:out};
      }
      if(s.type==='map') {
        if(!(value instanceof Map)||Object.getPrototypeOf(value)!==Map.prototype||Object.getOwnPropertyNames(value).length||Object.getOwnPropertySymbols(value).length||native.mapSize.call(value)>s.maxEntries)fail('map bound/type invalid');const entries=[],out=new Map();
        Map.prototype.forEach.call(value,(v,k)=>{const a=recur(k,s.keys),b=recur(v,s.values);entries.push([a.tag,b.tag]);out.set(a.value,b.value);});return{tag:{$type:'map',entries},value:out};
      }
      if(s.type==='set') {
        if(!(value instanceof Set)||Object.getPrototypeOf(value)!==Set.prototype||Object.getOwnPropertyNames(value).length||Object.getOwnPropertySymbols(value).length||native.setSize.call(value)>s.maxEntries)fail('set bound/type invalid');const values=[],out=new Set();
        Set.prototype.forEach.call(value,v=>{const x=recur(v,s.items);values.push(x.tag);out.add(x.value);});return{tag:{$type:'set',values},value:out};
      }
      fail('unsupported state value');
    }
    function stateValue(row,roots,checks,ctx) {
      const slots=row.paths.map(p=>resolve(roots,p,checks,true)),value=slots[0].value;
      if(slots.some(s=>!Object.is(s.value,value)))fail('state alias mismatch '+row.id);
      return {...transform(value,row.schema,ctx),slots};
    }
    function instance(fixedValues,roots,checks) {
      const tensors=def.tensors.slice(),states=def.states.slice();
      for(const f of def.families){const count=fixedValues.get(f.countStateId),indices=fixedValues.get(f.indicesStateId),cursor=fixedValues.get(f.cursorStateId);
        if(!integer(count,0,f.capacity)||!Array.isArray(indices)||count!==indices.length||new Set(indices).size!==count||indices.some(i=>!integer(i,0,f.capacity-1))||!integer(cursor,0,f.capacity-1))fail('family occupancy/count/cursor mismatch '+f.id);
        const container=resolve(roots,f.slotPath,checks).value;
        if(!Array.isArray(container)||Object.getPrototypeOf(container)!==Array.prototype||container.length!==f.capacity)fail('unsupported-allocation: preallocated family capacity required '+f.id);
        for(const index of indices){const slot=Object.getOwnPropertyDescriptor(container,String(index));if(!slot||!own(slot,'value')||!slot.value||typeof slot.value!=='object')fail('unsupported-allocation: missing family slot '+f.id+'/'+index);
          const rows=expand(f,index);tensors.push(...rows.tensors);states.push(...rows.states);}
      }
      return {tensors:tensors.sort(sortID),states:states.sort(sortID)};
    }
    function bind(rows,roots,checks) {
      const refs=new Map(),groups=new Map(),buffers=new Map(),views=new Set();
      for(const row of rows){const aliases=row.paths.map(p=>resolve(roots,p,checks).value),info=viewInfo(aliases[0]),wire=rowWire(row);
        if(aliases.some(v=>v!==info.view)||views.has(info.view))fail('tensor alias/ID mismatch '+row.id);views.add(info.view);
        if(info.dtype!==wire.dtype||info.length!==wire.length||info.bytes!==wire.byteLength||info.offset!==wire.backingOffset||native.bufferBytes.call(info.buffer)!==wire.backingByteLength)fail('tensor shape/backing mismatch '+row.id);
        if(groups.has(wire.backingGroup)&&groups.get(wire.backingGroup)!==info.buffer||buffers.has(info.buffer)&&buffers.get(info.buffer)!==wire.backingGroup)fail('backing alias topology mismatch');
        groups.set(wire.backingGroup,info.buffer);buffers.set(info.buffer,wire.backingGroup);refs.set(row.id,info.view);
      }return refs;
    }
    function overlap(tensors) {
      let compared=0;const groups=new Map();
      for(const row of tensors){if(!groups.has(row.backingGroup))groups.set(row.backingGroup,[]);groups.get(row.backingGroup).push(row);}
      for(const rows of groups.values()){rows.sort((a,b)=>a.backingOffset-b.backingOffset);for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
        const a=rows[i],b=rows[j],end=Math.min(a.backingOffset+a.byteLength,b.backingOffset+b.byteLength);if(b.backingOffset>=a.backingOffset+a.byteLength)break;
        const length=end-b.backingOffset;if((compared+=length)>LIMITS.overlapBytes)fail('overlap work budget exceeded');
        const av=new Uint8Array(a.bytes),bv=new Uint8Array(b.bytes);for(let k=0;k<length;k++)if(av[b.backingOffset-a.backingOffset+k]!==bv[k])fail('conflicting serialized overlap');
      }}
    }
    const selectors=new Set(def.families.flatMap(f=>[f.countStateId,f.indicesStateId,f.cursorStateId]));
    function fixed(roots,checks) {
      const refs=bind(def.tensors,roots,checks),ctx=makeContext(refs),values=new Map();
      for(const row of def.states)if(selectors.has(row.id))values.set(row.id,stateValue(row,roots,checks,ctx).value);return values;
    }
    function capture(roots,snapshot,{generation:gen,provenance}={}) {
      generation(gen);const checks=[],rows=instance(fixed(roots,checks),roots,checks),refs=bind(rows.tensors,roots,checks),ctx=makeContext(refs),stateValues={};
      const tensors=rows.tensors.map(row=>{const info=viewInfo(refs.get(row.id)),bytes=new Uint8Array(info.buffer,info.offset,info.bytes).slice();numeric(bytes,row);return {...rowWire(row),bytes:bytes.buffer};});
      for(const row of rows.states)Object.defineProperty(stateValues,row.id,{value:stateValue(row,roots,checks,ctx).tag,enumerable:true,writable:true,configurable:true});
      overlap(tensors);
      const result={architecture:boundedCopy(architecture),snapshot:boundedCopy(snapshot),tensors,stateManifest:rows.states.map(stateWire),stateValues,resumeRules:boundedCopy(def.resumeRules)};
      if(provenance!==undefined)result.provenance=boundedCopy(provenance);return result;
    }
    function preflight(decoded,roots,{generation:gen}={}) {
      generation(gen);decoded=codec.verifiedCopy(decoded);
      if(canonical(boundedCopy(decoded.architecture))!==canonical(architecture)||canonical(boundedCopy(decoded.resumeRules))!==canonical(def.resumeRules))fail('architecture or resume rules mismatch');
      const checks=[],refsFixed=bind(def.tensors,roots,checks),fixedValues=new Map(),decodedTags=boundedCopy(decoded.stateValues),decodeCtx=makeContext(refsFixed);
      for(const row of def.states)if(selectors.has(row.id)){if(!own(decodedTags,row.id))fail('missing registered state '+row.id);const tag=decodedTags[row.id],value=codec.untagValue(tag),x=transform(value,row.schema,decodeCtx,true);if(canonical(x.tag)!==canonical(tag))fail('state tag/schema mismatch');fixedValues.set(row.id,x.value);}
      const rows=instance(fixedValues,roots,checks),refs=bind(rows.tensors,roots,checks);
      if(!Array.isArray(decoded.tensors)||decoded.tensors.length!==rows.tensors.length||!Array.isArray(decoded.stateManifest)||
          canonical(boundedCopy(decoded.stateManifest))!==canonical(rows.states.map(stateWire))||Object.keys(decodedTags).length!==rows.states.length||rows.states.some(r=>!own(decodedTags,r.id)))fail('complete tensor/state roster mismatch');
      const assignments=[];
      for(let i=0;i<rows.tensors.length;i++){const row=rows.tensors[i],source=decoded.tensors[i],expected=rowWire(row);
        const descriptor={};for(const k of Object.keys(expected)){const d=Object.getOwnPropertyDescriptor(source,k);if(!d||!own(d,'value'))fail('missing/accessor tensor metadata');descriptor[k]=boundedCopy(d.value);}
        if(canonical(descriptor)!==canonical(expected)||Object.keys(source).some(k=>!own(expected,k)&&!['bytes','blobOffset','sha256'].includes(k)))fail('tensor descriptor mismatch');
        const bd=Object.getOwnPropertyDescriptor(source,'bytes');if(!bd||!own(bd,'value')||!(bd.value instanceof ArrayBuffer)||bd.value.byteLength!==expected.byteLength)fail('tensor source bytes mismatch');
        const bytes=new Uint8Array(bd.value).slice();numeric(bytes,row);const target=viewInfo(refs.get(row.id));
        assignments.push({...expected,bytes:bytes.buffer,target,original:new Uint8Array(target.buffer,target.offset,target.bytes).slice()});
      }
      overlap(assignments);
      const states=[],ctx=makeContext(refs),liveCtx=makeContext(refs);
      for(const row of rows.states){const tag=decodedTags[row.id],x=transform(codec.untagValue(tag),row.schema,ctx,true);if(canonical(x.tag)!==canonical(tag))fail('state tag/schema mismatch');
        const live=stateValue(row,roots,checks,liveCtx);states.push({row,value:x.value,tag:canonical(x.tag),originalTag:canonical(live.tag),slots:live.slots});}
      const prepared=Object.freeze({registryVersion:def.registryVersion,fingerprint,tensorCount:assignments.length,stateCount:states.length,generation:gen});
      plans.set(prepared,{roots,generation:gen,checks,assignments,states,rows,refs,used:false});return prepared;
    }
    function apply(prepared,roots,{generation:gen}={}) {
      generation(gen);const plan=plans.get(prepared);if(!plan||plan.used||plan.roots!==roots||plan.generation!==gen)fail('stale/foreign prepared plan');
      for(const c of plan.checks){const d=Object.getOwnPropertyDescriptor(c.object,c.name);if(!d||!own(d,'value')||!Object.is(d.value,c.value)||d.writable!==c.writable||d.configurable!==c.configurable||d.enumerable!==c.enumerable)fail('stale own-data slot identity');}
      bind(plan.rows.tensors,roots,[]);
      for(const a of plan.assignments)if(!equalBytes(new Uint8Array(a.target.buffer,a.target.offset,a.target.bytes),a.original))fail('destination tensor changed since preflight');
      const beforeCtx=makeContext(plan.refs);for(const s of plan.states)if(canonical(stateValue(s.row,roots,[],beforeCtx).tag)!==s.originalTag)fail('destination state changed since preflight');
      plan.used=true;
      try {
        for(const a of plan.assignments)native.set.call(new Uint8Array(a.target.buffer,a.target.offset,a.target.bytes),new Uint8Array(a.bytes));
        for(const s of plan.states)for(const slot of s.slots)Object.defineProperty(slot.parent,slot.name,{value:s.value});
        for(const a of plan.assignments)if(!equalBytes(new Uint8Array(a.target.buffer,a.target.offset,a.target.bytes),new Uint8Array(a.bytes)))fail('tensor readback failed');
        const afterCtx=makeContext(plan.refs);for(const s of plan.states)if(canonical(stateValue(s.row,roots,[],afterCtx).tag)!==s.tag)fail('state readback failed');
      } catch(error) {
        let rollbackVerified=false;
        try {for(const a of plan.assignments)native.set.call(new Uint8Array(a.target.buffer,a.target.offset,a.target.bytes),a.original);
          for(const s of plan.states)for(const slot of s.slots)Object.defineProperty(slot.parent,slot.name,{value:slot.value});
          rollbackVerified=plan.assignments.every(a=>equalBytes(new Uint8Array(a.target.buffer,a.target.offset,a.target.bytes),a.original))&&plan.states.every(s=>s.slots.every(slot=>Object.is(Object.getOwnPropertyDescriptor(slot.parent,slot.name)?.value,slot.value)));
        }catch(_){}
        const failure=new Error('Learned-state apply failed; rollback '+(rollbackVerified?'verified':'unverified')+': '+error.message);failure.rollbackVerified=rollbackVerified;failure.partialApplication=!rollbackVerified;throw failure;
      }
      return {status:'applied',tensorCount:plan.assignments.length,stateCount:plan.states.length,readbackVerified:true,generation:gen,scope:SCOPE.kind};
    }
    return Object.freeze({architecture,scope:SCOPE,capture,preflight,apply});
  }
  return Object.freeze({compile,limits:LIMITS,scope:SCOPE});
});
