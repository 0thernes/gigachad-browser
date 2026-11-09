/* Pure pane geometry shared by visual bodies and measured DOM observations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AliveHabitat = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, finite(n, (a + b) / 2)));
  function bounds(width, height, split, ratio = 50, right = false) {
    width = Math.max(1, finite(width, 1)); height = Math.max(1, finite(height, 1));
    const divider = width * clamp(ratio, 25, 75) / 100;
    const left = split && right ? divider : 0, end = split && !right ? divider : width;
    const inset = Math.min(44, (end - left) * 0.16), vertical = Math.min(44, height * 0.16);
    return { left, right: end, minX: left + inset, maxX: end - inset,
      minY: vertical, maxY: height - Math.min(56, height * 0.18) };
  }
  function contains(pane, point) { return Number.isFinite(point?.x) && point.x >= pane.left && point.x <= pane.right; }
  function constrain(entity, pane) {
    const x = clamp(entity.x, pane.minX, pane.maxX), y = clamp(entity.y, pane.minY, pane.maxY);
    if (x !== entity.x) entity.vx = 0;
    if (y !== entity.y) entity.vy = 0;
    entity.x = x; entity.y = y;
    return entity;
  }
  function mapColliders(colliders, { width, height, split, ratio = 50, right = false, viewportWidth, tabId, documentGeneration } = {}) {
    const pane = bounds(width, height, split, ratio, right);
    const scale = (pane.right - pane.left) / Math.max(1, finite(viewportWidth, pane.right - pane.left));
    return (Array.isArray(colliders) ? colliders : []).slice(0, 18)
      .filter(c => Number.isFinite(c?.cx) && Number.isFinite(c?.cy) && Number.isFinite(c?.w) && Number.isFinite(c?.h))
      .map(c => {
        const x1 = clamp(pane.left + (c.cx - Math.max(0, c.w) / 2) * scale, pane.left, pane.right);
        const x2 = clamp(pane.left + (c.cx + Math.max(0, c.w) / 2) * scale, pane.left, pane.right);
        const y1 = clamp(c.cy - Math.max(0, c.h) / 2, 0, Math.max(1, height));
        const y2 = clamp(c.cy + Math.max(0, c.h) / 2, 0, Math.max(1, height));
        return { ...c, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1,
          pane: right && split ? 'right' : 'left', tabId, documentGeneration };
      }).filter(c => c.w > 0 && c.h > 0);
  }
  return { bounds, contains, constrain, mapColliders };
});
