/* Coherent bounded tensor snapshots with content verification before restore. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveCheckpoints = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 64 * 1024 * 1024;
  const MAX_TENSORS = 4096;
  const MAX_NODES = 20000;
  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const aborted = signal => { if (signal?.aborted) throw new Error('Checkpoint operation cancelled'); };
  const safePath = path => Array.isArray(path) && path.length > 0 && path.length <= 10 && path.every(key => typeof key === 'string' && !['__proto__', 'prototype', 'constructor'].includes(key));
  function atPath(roots, group, path) {
    if (!Object.prototype.hasOwnProperty.call(roots, group) || !safePath(path)) throw new Error('Invalid checkpoint tensor path');
    let value = roots[group];
    for (const key of path) {
      if (!value || !Object.prototype.hasOwnProperty.call(value, key)) throw new Error(`Missing checkpoint tensor: ${group}.${path.join('.')}`);
      value = value[key];
    }
    return value;
  }
  function capture(roots, metadata, options = {}) {
    const tensors = [], seen = new Set();
    let bytes = 0, nodes = 0;
    const visit = (value, group, path, depth) => {
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      if (depth === 0 && !ArrayBuffer.isView(value)) return;
      if (++nodes > MAX_NODES) throw new Error('Checkpoint object count exceeds bounded capacity');
      seen.add(value);
      if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        bytes += value.byteLength;
        if (bytes > (options.maxBytes || MAX_BYTES) || tensors.length >= MAX_TENSORS) throw new Error('Checkpoint tensor size exceeds bounded capacity');
        const copy = new value.constructor(value);
        tensors.push({ group, path, type: value.constructor.name, length: value.length, buffer: copy.buffer });
        return;
      }
      for (const key of Object.keys(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
        visit(value[key], group, path.concat(key), depth - 1);
      }
    };
    // This function contains no await. All copies belong to one renderer turn;
    // neural stepping cannot interleave while different tensors are captured.
    for (const [group, value] of Object.entries(roots)) visit(value, group, [], group === 'policy' ? 1 : 5);
    if (!tensors.length) throw new Error('No model tensors available to checkpoint');
    return { version: 2, metadata: JSON.parse(JSON.stringify(metadata)), tensors, bytes };
  }
  async function sha256(buffer, cryptoProvider) {
    return new Uint8Array(await cryptoProvider.subtle.digest('SHA-256', buffer));
  }
  function rawCid(digest) {
    const bytes = new Uint8Array([1, 0x55, 0x12, 32, ...digest]);
    let bits = 0, value = 0, encoded = '';
    for (const byte of bytes) {
      value = (value << 8) | byte; bits += 8;
      while (bits >= 5) { encoded += 'abcdefghijklmnopqrstuvwxyz234567'[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits) encoded += 'abcdefghijklmnopqrstuvwxyz234567'[(value << (5 - bits)) & 31];
    return 'b' + encoded;
  }
  async function seal(captured, { signal, crypto: cryptoProvider = globalThis.crypto } = {}) {
    aborted(signal);
    const entries = [];
    for (const tensor of captured.tensors) {
      entries.push({ group: tensor.group, path: tensor.path, type: tensor.type, length: tensor.length, hash: hex(await sha256(tensor.buffer, cryptoProvider)) });
      aborted(signal);
    }
    const manifest = { version: 2, scope: 'model tensors plus body and policy identity; not an exact replay of every runtime scalar', metadata: captured.metadata, tensors: entries };
    const cid = rawCid(await sha256(new TextEncoder().encode(JSON.stringify(manifest)), cryptoProvider));
    aborted(signal);
    return { cid, manifest, tensors: captured.tensors, bytes: captured.bytes };
  }
  async function verify(record, { signal, crypto: cryptoProvider = globalThis.crypto } = {}) {
    aborted(signal);
    if (!record || record.manifest?.version !== 2 || !Array.isArray(record.tensors) || !Array.isArray(record.manifest.tensors) || record.tensors.length === 0 || record.tensors.length !== record.manifest.tensors.length || record.tensors.length > MAX_TENSORS) throw new Error('Invalid checkpoint schema');
    const expectedCid = rawCid(await sha256(new TextEncoder().encode(JSON.stringify(record.manifest)), cryptoProvider));
    if (record.cid !== expectedCid) throw new Error('Checkpoint manifest CID mismatch');
    let bytes = 0;
    const paths = new Set();
    for (let i = 0; i < record.tensors.length; i++) {
      const tensor = record.tensors[i], expected = record.manifest.tensors[i];
      const key = JSON.stringify([tensor.group, tensor.path]);
      if (!safePath(tensor.path) || paths.has(key)) throw new Error('Invalid or duplicate tensor path');
      paths.add(key);
      if (tensor.group !== expected.group || tensor.type !== expected.type || tensor.length !== expected.length || JSON.stringify(tensor.path) !== JSON.stringify(expected.path)) throw new Error('Checkpoint tensor metadata mismatch');
      if (!(tensor.buffer instanceof ArrayBuffer)) throw new Error('Invalid checkpoint tensor buffer');
      bytes += tensor.buffer.byteLength;
      if (bytes > MAX_BYTES) throw new Error('Checkpoint exceeds bounded capacity');
      if (hex(await sha256(tensor.buffer, cryptoProvider)) !== expected.hash) throw new Error(`Checkpoint tensor hash mismatch: ${key}`);
      aborted(signal);
    }
    return { cid: expectedCid, tensorCount: record.tensors.length, bytes };
  }
  function preflight(record, roots) {
    for (const tensor of record.tensors) {
      const target = atPath(roots, tensor.group, tensor.path);
      if (!ArrayBuffer.isView(target) || target instanceof DataView || target.constructor.name !== tensor.type || target.length !== tensor.length || target.byteLength !== tensor.buffer.byteLength) throw new Error(`Checkpoint shape mismatch: ${tensor.group}.${tensor.path.join('.')}`);
    }
    return { tensorCount: record.tensors.length };
  }
  function applyVerified(record, roots) {
    // Validate every destination and allocate every source before changing any
    // model state. Apply is synchronous; no inference sees a half-restored model.
    const assignments = record.tensors.map(tensor => {
      const target = atPath(roots, tensor.group, tensor.path);
      if (!ArrayBuffer.isView(target) || target instanceof DataView || target.constructor.name !== tensor.type || target.length !== tensor.length || target.byteLength !== tensor.buffer.byteLength) throw new Error(`Checkpoint shape mismatch: ${tensor.group}.${tensor.path.join('.')}`);
      return { target, source: new target.constructor(tensor.buffer) };
    });
    for (const { target, source } of assignments) target.set(source);
    for (const { target, source } of assignments) {
      const aligned = target.byteOffset % 4 === 0 && source.byteOffset % 4 === 0;
      const words = aligned ? Math.floor(target.byteLength / 4) : 0;
      if (words) {
        const targetWords = new Uint32Array(target.buffer, target.byteOffset, words);
        const sourceWords = new Uint32Array(source.buffer, source.byteOffset, words);
        for (let i = 0; i < words; i++) if (targetWords[i] !== sourceWords[i]) throw new Error('Checkpoint restore readback mismatch');
      }
      const offset = words * 4;
      const targetBytes = new Uint8Array(target.buffer, target.byteOffset + offset, target.byteLength - offset);
      const sourceBytes = new Uint8Array(source.buffer, source.byteOffset + offset, source.byteLength - offset);
      for (let i = 0; i < targetBytes.length; i++) if (targetBytes[i] !== sourceBytes[i]) throw new Error('Checkpoint restore readback mismatch');
    }
    return { tensorCount: assignments.length, bytes: assignments.reduce((sum, item) => sum + item.target.byteLength, 0) };
  }
  return { capture, seal, verify, preflight, applyVerified };
});
