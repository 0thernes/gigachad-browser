'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const habitat = require('../systems/alive-habitat.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const begin = source.indexOf('          const baseSpeed = isOD ? 6.2');
const end = source.indexOf('            // For Lead Robot ALPHA', begin);
assert.ok(begin > 0 && end > begin);
const movement = new vm.Script('(() => {\n' + source.slice(begin, end) + '\n}})()');
function fixture(ratio = 50, rightTarget = 800, pellets = []) {
  const swarm = Array.from({ length: 5 }, (_, i) => ({ x: i < 3 ? 200 : 750, y: 250, vx: 0, vy: 0, angle: 0, targetIdx: 0, nextSaccadeIn: 10 }));
  const ctx = { window: { AliveHabitat: habitat }, sw: 1000, sh: 600, splitX: ratio * 10, splitRatioPct: ratio,
    splitViewActive: true, tabs: [{}, {}], vSwarm: swarm, alpha: swarm[0], isOD: true, alienBrainActive: true,
    cols: [{ cx: 150, cy: 200 }, { cx: rightTarget, cy: 450 }], formationMode: 'PENTAGRAM_SYNAPSE',
    mouse: { active: false }, st: { tick: 0 }, h: { trainableAlifeNeuralHub: { learnedMotorThrust2D: [0.5, -0.4] } },
    hybridQrng: { u64: () => 0n }, pellets, shockwaves: [], particles: [], hybridBrainMesh: { viscera: { glc: 0.5 } } };
  return { ctx, swarm, step() { movement.runInNewContext(ctx); } };
}
test('actual host movement retains all five bodies in assigned panes despite food and neural thrust', () => {
  for (const ratio of [25, 50, 75]) {
    const f = fixture(ratio, 900, [{ x: 80, y: 80 }, { x: 920, y: 80 }]);
    for (let i = 0; i < 120; i++) {
      f.ctx.h.trainableAlifeNeuralHub.learnedMotorThrust2D = [i % 2 ? 5 : -5, 3];
      f.step();
      f.swarm.forEach((entity, index) => {
        const pane = habitat.bounds(1000, 600, true, ratio, index > 2);
        assert.ok(entity.x >= pane.minX && entity.x <= pane.maxX, `ratio ${ratio}, body ${index}`);
      });
    }
  }
});
test('secondary measured colliders causally drive DELTA independently of unchanged primary data', () => {
  const a = fixture(50, 610), b = fixture(50, 940); a.step(); b.step();
  assert.equal(a.swarm[0].vx, b.swarm[0].vx);
  assert.notEqual(a.swarm[3].vx, b.swarm[3].vx);
});
test('pane mapping uses actual split ratio and bounds even in very small layouts', () => {
  const mapped = habitat.mapColliders([{ cx: 100, cy: 80, w: 60, h: 30 }],
    { width: 1000, height: 600, split: true, ratio: 25, right: true, viewportWidth: 750, tabId: 'right', documentGeneration: 3 });
  assert.equal(mapped[0].cx, 350); assert.equal(mapped[0].pane, 'right'); assert.equal(mapped[0].documentGeneration, 3);
  for (const width of [1, 80, 1000]) for (const right of [false, true]) {
    const pane = habitat.bounds(width, 20, true, 75, right);
    assert.ok(pane.minX <= pane.maxX); assert.ok(pane.minY <= pane.maxY);
    const entity = habitat.constrain({ x: NaN, y: Infinity, vx: 100, vy: -100 }, pane);
    assert.ok(Number.isFinite(entity.x) && Number.isFinite(entity.y));
  }
});

test('collider rectangles are clipped to the visible viewport and offscreen rectangles are discarded', () => {
  const options = { width: 1000, height: 600, split: true, right: true, viewportWidth: 500 };
  const result = habitat.mapColliders([{ cx: 100, cy: -100, w: 300, h: 1200 }, { cx: 100, cy: -500, w: 100, h: 100 }], options);
  assert.equal(result.length, 1); assert.equal(result[0].cy, 250); assert.equal(result[0].h, 500);
  assert.ok(result[0].cx - result[0].w / 2 >= 500);
});

function actualFunction(name) {
  const begin = source.indexOf('    function ' + name + '(');
  const end = source.indexOf('\n    }', begin) + 6;
  return source.slice(begin, end);
}
test('all collider-cache consumers lose stale geometry immediately on pause, navigation, swap, close or resize', () => {
  for (const scenario of ['pause', 'navigation', 'swap', 'close', 'resize', 'ratio', 'single']) {
    const canvas = { width: 1000, height: 600 }, tabs = [{ id: 'a', domReady: true, wv: {} }, { id: 'b', domReady: true, wv: {} }];
    let current = true;
    const context = vm.createContext({ window: { aliveAuthority: { isCurrent: () => current } }, document: { getElementById: () => canvas },
      splitViewActive: true, splitRatioPct: 50, activeTabId: 'a', secondaryTabId: 'b', tabs,
      getTab: id => tabs.find(t => t.id === id), isWebviewGuestReady: () => true });
    vm.runInContext(actualFunction('installAliveColliderCache') + '\ninstallAliveColliderCache();', context);
    context.window.__hostLastDomColliders = [{ tabId: 'a', pane: 'left', authority: {}, layoutWidth: 1000, layoutHeight: 600, layoutSplit: true, layoutRatio: 50 },
      { tabId: 'b', pane: 'right', authority: {}, layoutWidth: 1000, layoutHeight: 600, layoutSplit: true, layoutRatio: 50 }];
    assert.equal(context.window.__hostLastDomColliders.length, 2);
    if (scenario === 'pause') current = false;
    if (scenario === 'navigation') tabs[1].domReady = false;
    if (scenario === 'swap') { context.activeTabId = 'b'; context.secondaryTabId = 'a'; }
    if (scenario === 'close') tabs.pop();
    if (scenario === 'resize') canvas.width = 800;
    if (scenario === 'ratio') context.splitRatioPct = 75;
    if (scenario === 'single') context.splitViewActive = false;
    const remaining = context.window.__hostLastDomColliders;
    assert.equal(remaining.length, scenario === 'navigation' ? 1 : 0, scenario);
    assert.ok(!remaining.some(c => c.tabId === 'b'), scenario);
  }
});
