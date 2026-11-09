'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('      // Cache viewport geometry outside presentation callbacks;');
const end = source.indexOf('      // End cached viewport geometry setup.', start);
const drawStart = source.indexOf("        const vpCv = document.getElementById('host-alife-viewport-canvas');", end);
const drawEnd = source.indexOf('          const vSwarm = st.viewportSwarm;', drawStart);
assert.ok(start >= 0 && end > start && drawStart > end && drawEnd > drawStart);
// Run the real setup and the real canvas-size/clear block, without models/Electron.
const install = new vm.Script(`(() => {
  ${source.slice(start, end)}
  return { geometry: viewportGeometry, draw() {
    ${source.slice(drawStart, drawEnd)}
      return { width: sw, height: sh };
    }
  }};
})()`);

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign(extra, {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    emit(type) { for (const callback of [...(listeners.get(type) || [])]) callback({ type }); },
    count(type) { return listeners.get(type)?.size || 0; }
  });
}
function fixture({ resizeObserver = true } = {}) {
  let reads = 0, prohibitReads = false, width = 1137, height = 647, timerId = 0;
  const pending = new Map(), observers = [], mutations = [];
  const workspace = eventTarget({ children: [] }), body = {};
  const stack = { parentElement: workspace,
    get clientWidth() { reads++; if (prohibitReads) throw new Error('Synchronous layout read'); return width; },
    get clientHeight() { reads++; if (prohibitReads) throw new Error('Synchronous layout read'); return height; }
  };
  workspace.children.push(stack);
  const window = eventTarget();
  const clears = [], canvas = { width: 0, height: 0, getContext() { return { clearRect(...args) { clears.push(args); } }; } };
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnects = 0; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnects++; }
  }
  class Mutations {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnects = 0; mutations.push(this); }
    observe(target, options) { this.targets.push({ target, options }); }
    disconnect() { this.disconnects++; this.targets = []; }
  }
  const context = { window, wvStack: stack,
    document: { body, getElementById(id) { return id === 'webviews-stack' ? stack : id === 'host-alife-viewport-canvas' ? canvas : null; } },
    ResizeObserver: resizeObserver ? Observer : undefined, MutationObserver: Mutations,
    setTimeout(callback) { pending.set(++timerId, callback); return timerId; },
    clearTimeout(id) { pending.delete(id); }
  };
  const api = install.runInNewContext(context);
  return { ...api, window, workspace, stack, canvas, clears, observers, mutations, pending,
    get reads() { return reads; }, prohibitReads(value = true) { prohibitReads = value; },
    size(w, h) { width = w; height = h; },
    flush() { for (const [id, callback] of [...pending]) { pending.delete(id); callback(); } }
  };
}

test('initial size comes from the actual stack and repeated drawing never reads layout', () => {
  const f = fixture();
  assert.equal(f.reads, 2);
  f.prohibitReads();
  for (let i = 0; i < 10; i++) f.draw();
  assert.equal(f.reads, 2);
  assert.equal(f.canvas.width, 1137);
  assert.equal(f.canvas.height, 647);
  assert.deepEqual(f.clears.at(-1), [0, 0, 1137, 647]);
});

test('ResizeObserver updates panel/window sizes without geometry reads or guessed margins', () => {
  const f = fixture(), observer = f.observers[0];
  assert.deepEqual(observer.targets, [f.stack]);
  f.prohibitReads();
  observer.callback([{ target: f.stack, contentRect: { width: 254.4, height: 401.6 } }]);
  f.draw();
  assert.equal(f.canvas.width, 254);
  assert.equal(f.canvas.height, 402);
  observer.callback([{ target: {}, contentRect: { width: 9000, height: 9000 } }]);
  observer.callback([{ target: f.stack, contentRect: { width: NaN, height: 500 } }]);
  f.draw();
  assert.equal(f.canvas.width, 254);
  assert.equal(f.reads, 2);
  observer.callback([{ target: f.stack, contentRect: { width: 1440, height: 800 } }]);
  f.draw();
  assert.equal(f.canvas.width, 1440);
  assert.equal(f.canvas.height, 800);
});

test('fallback resize events coalesce measurements outside the drawing callback', () => {
  const f = fixture({ resizeObserver: false });
  f.size(920, 540);
  f.prohibitReads();
  f.window.emit('resize'); f.window.emit('resize'); f.draw();
  assert.equal(f.pending.size, 1);
  assert.equal(f.reads, 2);
  assert.equal(f.canvas.width, 1137);
  f.prohibitReads(false); f.flush(); f.prohibitReads(); f.draw();
  assert.equal(f.reads, 4);
  assert.equal(f.canvas.width, 920);
  assert.equal(f.canvas.height, 540);
});

test('fallback observes new panels and final transitions without per-frame canvas attribute subscriptions', () => {
  const f = fixture({ resizeObserver: false }), observer = f.mutations[0];
  const panel = {}; f.workspace.children.push(panel);
  f.size(700, 580);
  observer.callback([{ type: 'childList', target: f.workspace }]);
  assert.ok(observer.targets.some(entry => entry.target === panel));
  assert.ok(observer.targets.every(entry => !entry.options.attributeFilter.includes('width')));
  assert.ok(observer.targets.every(entry => !entry.options.subtree));
  f.workspace.emit('transitionend');
  assert.equal(f.pending.size, 1);
  f.flush(); f.prohibitReads(); f.draw();
  assert.equal(f.canvas.width, 700);
  assert.equal(f.canvas.height, 580);
});

test('pagehide disconnects ResizeObserver and ignores an already queued delivery', () => {
  const f = fixture(), observer = f.observers[0];
  f.window.emit('pagehide');
  assert.equal(observer.disconnects, 1);
  assert.equal(f.window.count('pagehide'), 0);
  observer.callback([{ target: f.stack, contentRect: { width: 90, height: 80 } }]);
  f.prohibitReads(); f.draw();
  assert.equal(f.canvas.width, 1137);
});

test('fallback cleanup cancels queued reads and removes resize/transition observers', () => {
  const f = fixture({ resizeObserver: false }), observer = f.mutations[0];
  f.window.emit('resize');
  assert.equal(f.pending.size, 1);
  f.prohibitReads(); f.window.emit('pagehide'); f.flush();
  assert.equal(f.pending.size, 0);
  assert.equal(f.window.count('resize'), 0);
  assert.equal(f.workspace.count('transitionend'), 0);
  assert.equal(observer.targets.length, 0);
  observer.callback([{ type: 'attributes' }]);
  observer.callback([{ type: 'childList' }]);
  assert.equal(f.pending.size, 0);
  assert.equal(observer.targets.length, 0);
  assert.equal(f.reads, 2);
});
