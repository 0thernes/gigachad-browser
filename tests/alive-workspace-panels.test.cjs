'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../systems/alive-workspace-ui.js'), 'utf8');

test('external evidence panels dock in workspace and share inspector exclusivity and Clear view', () => {
  const children = [], inspector = { style: { display: 'flex' }, classList: { remove() {} } };
  const controls = { hidden: false }, logs = { style: { display: 'flex' } };
  const workspace = { append(node) { children.push(node); } };
  const nodes = { workspace, 'alive-controls-panel': controls, 'alien-brain-drawer': inspector, 'alife-left-omni-dock': logs };
  const document = { readyState: 'loading', addEventListener() {}, getElementById: id => nodes[id] || null,
    querySelectorAll: () => [inspector] };
  const window = { document };
  vm.runInNewContext(source, { window });
  const api = window.aliveWorkspace;
  const create = () => ({ hidden: false, classes: [], classList: { add(value) { this.owner.classes.push(value); } } });
  const evidence = create(), fabric = create(); evidence.classList.owner = evidence; fabric.classList.owner = fabric;
  assert.equal(api.registerPanel('evidence', evidence, () => { evidence.hidden = true; }), true);
  assert.equal(api.registerPanel('fabric', fabric, () => { fabric.hidden = true; }), true);
  assert.deepEqual(children, [evidence, fabric]); assert.ok(evidence.classes.includes('alive-external-panel'));
  api.prepareExternalPanel('evidence');
  assert.equal(evidence.hidden, false); assert.equal(fabric.hidden, true);
  assert.equal(controls.hidden, true); assert.equal(inspector.style.display, 'none'); assert.equal(logs.style.display, 'none');
  api.prepareExternalPanel('fabric'); fabric.hidden = false;
  assert.equal(evidence.hidden, true); assert.equal(fabric.hidden, false);
  api.closePanels(); assert.equal(fabric.hidden, true);
  api.unregisterPanel('fabric'); assert.equal(api.prepareExternalPanel('fabric'), false);
});
