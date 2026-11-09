'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalizeURL } = require('../systems/alive-research-policy.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const helperStart = source.indexOf('    function readAlivePageSourceText(');
const helperEnd = source.indexOf('\n    }', helperStart) + 6;
assert.ok(helperStart > 0 && helperEnd > helperStart);
const helperSource = source.slice(helperStart, helperEnd).trim();
const readSourceText = vm.runInNewContext('(' + helperSource + ')');
const bodyStart = source.indexOf('    async function performWeirdAlienDomExperiment(');

// Exercise the actual production guest snippets, including template decoding;
// the DOM below supplies only ordinary text, ancestry and geometry primitives.
function snippet(startMarker, endMarker, from = bodyStart) {
  const start = source.indexOf(startMarker, from), end = source.indexOf(endMarker, start);
  assert.ok(start >= from && end > start, startMarker);
  const raw = source.slice(start, end);
  assert.ok(!raw.includes('${'), 'snippet has no host interpolation');
  return vm.runInNewContext('`' + raw.replace(/`/g, '\\`') + '`');
}
const doorCode = snippet('          const normalizeHref = (raw) => {', '          const stNow = window.__humunculusCreatureState');
const badgeCode = snippet('          const entityRoster12 = [', '          if (window.__humunculusOverdrive)');
const zalgoCode = snippet('          const zalgoMarks = [', '          // (ii) ETA');
const astCode = snippet('          const codeBlocksOnPage = ', '          // (iv) THETA');
const manualStart = source.indexOf('    async function triggerEldritchZalgoBrowserFuckery(');
assert.ok(manualStart > 0);
const manualZalgoCode = snippet('          const zMarks = [', '          // Inject Forensic Feeder-Bug Canary', manualStart);

function descendants(root) {
  const found = [];
  for (const node of root.childNodes || []) { found.push(node); found.push(...descendants(node)); }
  return found;
}
function matches(el, selector) {
  return selector.split(',').some(raw => {
    const part = raw.trim();
    const attr = part.match(/^(?:span)?\[([^=\]^]+)(\^?=)?["']?([^"'\]]*)["']?\]$/);
    if (attr) {
      const value = el.getAttribute(attr[1]);
      return value !== null && (!attr[2] || (attr[2] === '^=' ? value.startsWith(attr[3]) : value === attr[3]));
    }
    if (part.startsWith('#')) return el.getAttribute('id') === part.slice(1);
    if (part === 'a[href]') return el.tagName === 'A' && el.getAttribute('href') !== null;
    if (part === 'nav a') return el.tagName === 'A' && !!el.parentElement?.closest('nav');
    return /^[a-z]+$/i.test(part) && el.tagName === part.toUpperCase();
  });
}
class Element {
  constructor(doc, tag) {
    this.nodeType = 1; this.ownerDocument = doc; this.tagName = tag.toUpperCase();
    this.parentElement = null; this.childNodes = []; this.attrs = {}; this.dataset = {};
    this.style = {}; this.classList = { add() {} };
  }
  get children() { return this.childNodes.filter(node => node.nodeType === 1); }
  get textContent() { return this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.childNodes = []; this.appendChild(this.ownerDocument.createTextNode(String(value))); }
  get innerText() {
    return this.childNodes.filter(node => !(node.nodeType === 1 && node.getAttribute('data-asmodenius-live-badge')))
      .map(node => node.nodeType === 1 ? node.innerText : node.textContent).join('');
  }
  get href() { return this.attrs.href || ''; }
  set href(value) { this.attrs.href = value; }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  appendChild(node) { node.parentElement = this; this.childNodes.push(node); return node; }
  prepend(node) { node.parentElement = this; this.childNodes.unshift(node); }
  closest(selector) { for (let el = this; el; el = el.parentElement) if (matches(el, selector)) return el; return null; }
  querySelectorAll(selector) { return descendants(this).filter(node => node.nodeType === 1 && matches(node, selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getBoundingClientRect() { return { left: 30, top: 200, width: 260, height: 30, bottom: 230 }; }
}
function fixture(label = 'Explore habitat topic 1') {
  const doc = {
    walkerReads: 0,
    createElement(tag) { return new Element(this, tag); },
    createTextNode(text) { return { nodeType: 3, parentElement: null, ownerDocument: this, nodeValue: text,
      get textContent() { return this.nodeValue; } }; },
    createTreeWalker(root, mask) {
      const nodes = descendants(root).filter(node => mask === 0xFFFFFFFF || mask & (1 << (node.nodeType - 1)));
      let i = 0; return { nextNode: () => { this.walkerReads++; return nodes[i++] || null; } };
    },
    querySelectorAll(selector) { return this.root.querySelectorAll(selector); },
    querySelector(selector) { return matches(this.root, selector) ? this.root : this.root.querySelector(selector); }
  };
  doc.root = doc.createElement('main');
  const nav = doc.root.appendChild(doc.createElement('nav'));
  const anchor = nav.appendChild(doc.createElement('a'));
  anchor.href = 'https://archive.example/second#topic-0'; anchor.textContent = label;
  const context = vm.createContext({ document: doc, readSourceText, URL,
    window: { innerHeight: 1000 }, location: { href: 'https://archive.example/first' }, blocks: [anchor],
    topConcepts: ['paleontology', 'transmission'], conceptPairs: ['paleontology transmission'],
    cogCfg: { activeVerb: 'FORMULATE & DEVELOP' }, pageMetrics: { shannonEntropyBits: 4.251 },
    kolmogorovLzRatio: 0.716, domWeirdAction: '', visitedTaboo: new Set(), anchorTaboo: new Set(),
    Math: Object.assign(Object.create(Math), { random: () => 0 }) });
  const execute = code => vm.runInContext('(() => {' + code + '})()', context);
  return { doc, anchor, context, execute, doors: () => vm.runInContext('(() => {' + doorCode + 'return doors;})()', context) };
}
function annotate(f) { f.execute(badgeCode); f.execute(zalgoCode); f.execute(manualZalgoCode); }

test('actual automatic and manual annotations cannot erase a valid observed door', () => {
  const f = fixture(), original = f.anchor.textContent;
  assert.equal(f.doors()[0].text, original);
  annotate(f);
  assert.ok(f.anchor.textContent.length > 130, 'reproduces the previously rejected decorated label');
  assert.equal(f.anchor.querySelectorAll('[data-asmodenius-zalgo-badge]').length, 2, 'both production Zalgo writers mark only their generated child');
  assert.equal(f.doors()[0].text, original);
  for (let i = 0; i < 25; i++) {
    f.context.cogCfg.activeVerb = i % 2 ? 'CONTEMPLATE & THINK' : 'FORMULATE & DEVELOP';
    annotate(f);
    assert.equal(f.doors().length, 1);
    assert.equal(f.doors()[0].text, original);
  }
  f.anchor.childNodes[0].nodeValue = 'Revised manuscript transmission';
  assert.equal(f.doors()[0].text, 'Revised manuscript transmission', 'authored updates are read afresh');
  Object.defineProperty(f.anchor, 'innerText', { get() { throw new Error('Source discovery must not depend on visual innerText'); } });
  assert.equal(f.doors().length, 1);
});

test('authored label thresholds and existing destination/taboo filters remain enforced', () => {
  for (const [length, accepted] of [[8, false], [9, true], [130, true], [131, false], [10000, false]]) {
    const f = fixture('x'.repeat(length));
    assert.equal(f.doors().length, Number(accepted), 'authored length ' + length);
  }
  const f = fixture('Privacy policy');
  assert.equal(f.doors().length, 0);
  f.anchor.textContent = 'Explore manuscript archive';
  for (const href of ['javascript:alert(1)', 'https://archive.example/account', 'https://archive.example/file.exe']) {
    f.anchor.href = href; assert.equal(f.doors().length, 0, href);
  }
  f.anchor.href = 'https://archive.example/second';
  f.context.visitedTaboo.add(f.anchor.href); assert.equal(f.doors().length, 0);
  f.context.visitedTaboo.clear(); f.context.anchorTaboo.add('explore manuscript archive'); assert.equal(f.doors().length, 0);
  // The host research policy remains responsible for private destinations;
  // candidateLinks never claimed to enforce that independent boundary.
  assert.equal(normalizeURL('http://127.0.0.1/fixture'), null);
  assert.equal(normalizeURL('http://10.0.0.1/fixture'), null);
});

test('nested authored text, combining marks and fresh aria fallback survive without caching', () => {
  const f = fixture('micro'), em = f.anchor.appendChild(f.doc.createElement('em'));
  em.textContent = 'scope'; f.anchor.appendChild(f.doc.createTextNode(' cafe\u0301\t archive'));
  assert.equal(f.doors()[0].text, 'microscope cafe\u0301 archive');
  annotate(f);
  assert.equal(f.doors()[0].text, 'microscope cafe\u0301 archive');
  f.anchor.textContent = '';
  const generated = f.anchor.appendChild(f.doc.createElement('span'));
  generated.setAttribute('data-asmodenius-zalgo-badge', '1'); generated.textContent = 'generated tempting archive';
  assert.equal(f.doors().length, 0, 'annotation-only links supply no source label');
  f.anchor.setAttribute('aria-label', 'Accessible manuscript archive');
  assert.equal(f.doors()[0].text, 'Accessible manuscript archive');
  f.anchor.setAttribute('aria-label', 'Revised accessible archive');
  assert.equal(f.doors()[0].text, 'Revised accessible archive');
  f.anchor.setAttribute('aria-label', ' '.repeat(50000) + 'Accessible archive');
  assert.equal(f.doors().length, 0, 'over-budget aria input is rejected before whitespace normalization');
  f.anchor.setAttribute('aria-label', '  Accessible\t manuscript  archive  ');
  assert.equal(f.doors()[0].text, 'Accessible manuscript archive');
});

test('research source text excludes all owned children and preserves annotated parent content', () => {
  const f = fixture('Authored archive text'); annotate(f);
  f.anchor.setAttribute('data-asmodenius-zalgo-injected', '1');
  f.anchor.setAttribute('data-asmodenius-fuckery-stamped', '1');
  const neo = f.anchor.appendChild(f.doc.createElement('span'));
  neo.setAttribute('data-neo-split-badge', '1'); neo.textContent = 'generated neo concept';
  const code = f.doc.root.appendChild(f.doc.createElement('pre'));
  code.textContent = 'const authoredComputation = 12345;';
  f.execute(astCode);
  assert.ok(code.querySelector('[data-asmodenius-ast-annotation]'));
  assert.equal(readSourceText(f.doc.root, { separateNodes: true }).text, 'Authored archive text const authoredComputation = 12345;');
  assert.equal(readSourceText(code).text, 'const authoredComputation = 12345;');
  // No heuristic removal of old, unmarked glyphs or ordinary page badges.
  const authored = f.anchor.appendChild(f.doc.createElement('span'));
  authored.textContent = ' ⟦authored glyphs⟧'; authored.style.cssText = 'color:#f43f5e;';
  assert.equal(readSourceText(f.anchor).text, 'Authored archive text ⟦authored glyphs⟧');
});

test('source reader bounds all descendant visits and inspected text, rejecting incomplete labels', () => {
  const f = fixture('Explore archive');
  for (let i = 0; i < 300; i++) f.anchor.appendChild(f.doc.createElement('span'));
  f.doc.walkerReads = 0;
  assert.equal(readSourceText(f.anchor, { maxChars: 131, maxNodes: 256 }).truncated, true);
  assert.equal(f.doc.walkerReads, 257);
  assert.equal(f.doors().length, 0, 'a short prefix cannot authorize an incomplete traversal');
  const spaces = fixture('Explore archive' + ' '.repeat(10000) + ' hidden suffix');
  assert.equal(readSourceText(spaces.anchor, { maxChars: 131 }).truncated, true);
  assert.equal(spaces.doors().length, 0);
  const labels = fixture('Explore archive');
  for (let i = 0; i < 150; i++) {
    const badge = labels.anchor.appendChild(labels.doc.createElement('span'));
    badge.setAttribute('data-asmodenius-live-badge', '1'); badge.textContent = 'generated';
  }
  assert.equal(labels.doors().length, 0, 'annotation-heavy traversal also respects the visit budget');
});

test('all creature source consumers use the self-contained serialized reader', () => {
  assert.equal((source.match(/const readSourceText = \(\$\{readAlivePageSourceText\.toString\(\)\}\);/g) || []).length, 3);
  for (const expression of [
    'readSourceText(root, { separateNodes: true }).text',
    '.map(el => readSourceText(el, { maxChars: 2048, maxNodes: 256 }).text)',
    'text: readSourceText(el, { maxChars: 48, maxNodes: 256 }).text',
    'text: readSourceText(el, { maxChars: 120, maxNodes: 256 }).text',
    'const sourceLabel = readSourceText(a, { maxChars: 131, maxNodes: 256 });'
  ]) assert.ok(source.includes(expression), expression);
  const independent = vm.runInNewContext('(' + readSourceText.toString() + ')');
  assert.equal(independent(fixture().anchor).text, 'Explore habitat topic 1');
});
