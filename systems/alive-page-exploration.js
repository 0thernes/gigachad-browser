/* Measured viewport exploration; usable in the host and as a guest-local function. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlivePageExploration = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Self-contained so the exact tested controller can run in an isolated guest.
  // Scheduling invokes it; elapsed time alone never reverses direction or counts
  // as progress. Only a subsequent measured viewport acknowledges a scroll.
  function decide(input = {}, previous = null) {
    const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const now = number(input.now), height = Math.max(1, number(input.viewportHeight, 1));
    const max = Math.max(0, number(input.scrollHeight) - height);
    const y = clamp(number(input.scrollY), 0, max);
    const old = previous && previous.version === 1 ? previous : null;
    const actualDelta = old ? y - number(old.scrollY) : 0;
    const content = String(input.signature || '').slice(0, 768);
    const rangeChanged = !old || Math.abs(max - number(old.maxScroll)) > height * 0.25;
    const changed = !old || content !== old.signature || rangeChanged;
    const wasPending = Boolean(old?.pending);
    const settling = wasPending && now - number(old.lastCommandAt) < 650;
    const progressed = Math.abs(y - number(wasPending ? old.commandFromY : old?.scrollY, y)) >= Math.min(32, height * 0.08);
    const priorStagnant = clamp(Math.floor(number(old?.stagnantObservations)), 0, 32);
    const stagnant = settling ? priorStagnant : wasPending && !progressed ? Math.min(32, priorStagnant + 1) : 0;
    const state = { version: 1, signature: content, scrollY: y, maxScroll: max, viewportHeight: height,
      actualDelta, observations: clamp(Math.floor(number(old?.observations)) + 1, 1, 1000000),
      stagnantObservations: stagnant, scrollCommands: clamp(Math.floor(number(old?.scrollCommands)), 0, 1000000),
      lastCommandAt: Number.isFinite(old?.lastCommandAt) ? old.lastCommandAt : null, pending: false, phase: 'exploring', reason: '',
      kind: 'hold', target: y, commandFromY: y, requestedDelta: 0 };
    state.stagnantObservations = Math.min(state.observations, state.stagnantObservations);
    if (input.yieldToUser === true || input.editableFocused === true) {
      state.phase = 'yielding'; state.reason = 'user-interaction'; return state;
    }
    if (max <= 2 || y >= max - 4) {
      state.phase = 'exhausted'; state.reason = max <= 2 ? 'single-viewport' : 'end-of-page'; return state;
    }
    if (stagnant >= 2) {
      state.phase = 'blocked'; state.reason = 'scroll-did-not-move'; return state;
    }
    if (old?.phase === 'blocked' && !rangeChanged && !progressed) {
      state.stagnantObservations = Math.min(state.observations, Math.max(2, priorStagnant));
      state.phase = 'blocked'; state.reason = 'scroll-did-not-move'; return state;
    }
    // Preserve pending evidence while a smooth scroll settles, instead of issuing
    // competing commands or clearing an unacknowledged command on a quick poll.
    if (settling) {
      state.pending = true; state.target = number(old.target, y);
      state.commandFromY = number(old.commandFromY, y);
      state.reason = 'awaiting-scroll'; return state;
    }
    const motor = clamp(number(input.motor), -1, 1);
    const stride = height * (0.78 + (motor + 1) * 0.22);
    state.target = Math.min(max, y + Math.max(1, Math.round(stride)));
    state.requestedDelta = state.target - y;
    state.kind = 'scroll'; state.reason = changed ? 'new-content' : 'unread-viewport';
    state.pending = true; state.lastCommandAt = now; state.scrollCommands++;
    return state;
  }
  return { decide };
});
