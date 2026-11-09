'use strict';

// Verification only: runs inside the existing isolated Electron probe. This
// module never discovers, attaches to, or launches a normal-profile window.
function validateFixtureUrls(values) {
  if (!Array.isArray(values) || values.length !== 2) throw new Error('Two owned fixture URLs are required');
  const urls = values.map(value => new URL(value));
  for (const url of urls) {
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
        url.username || url.password || url.search || url.hash ||
        !/^\/\.alive-probe-\d+\/habitat(?:-second)?\.html$/.test(url.pathname)) {
      throw new Error('Split probe requires exact owned loopback fixture URLs');
    }
  }
  if (urls[0].origin !== urls[1].origin || urls[0].pathname.replace(/[^/]+$/, '') !== urls[1].pathname.replace(/[^/]+$/, '') ||
      !urls[0].pathname.endsWith('/habitat.html') || !urls[1].pathname.endsWith('/habitat-second.html')) {
    throw new Error('Split fixtures must share the same owned server and directory');
  }
  return urls.map(url => url.href);
}

async function verifySplitHabitat(options, validate) {
  const allowed = validate(options?.fixtureUrls); // Reject before touching host state.
  const began = performance.now(), deadline = began + 45000;
  const result = { requested: true, startedAt: began, cases: [], ratios: [], events: [], errors: [],
    scope: 'Actual isolated offline fixtures, production authority, exploration, collider cache and host bodies; no public-web or intelligence benchmark.' };
  const api = window.aliveAuthority, executor = window.AliveGuestExecution, controller = window.aliveOverdrive;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
  let left, right;
  const listeners = [];
  const onError = event => result.errors.push({ type: event.type, message: String(event.message || event.reason || 'unknown').slice(0, 600) });
  const requireFixture = tab => {
    if (!tab?.wv || !allowed.includes(String(safeGetUrl(tab)).split('#')[0])) throw new Error('Split probe refused a non-fixture guest');
  };
  async function until(predicate, label, budget = 6500) {
    const end = Math.min(deadline, performance.now() + budget);
    do { if (await predicate()) return; await sleep(30); } while (performance.now() < end);
    throw new Error('Split probe timed out: ' + label);
  }
  function record(id, passed, evidence) {
    result.cases.push({ id, passed: passed === true, evidence });
    if (!passed) throw new Error('Split probe assertion failed: ' + id);
  }
  const cols = () => clone(window.__hostLastDomColliders || []);
  const bodyJob = () => controller.snapshot(false).jobs.find(job => job.id === 'dom-body');
  const receipt = () => clone(bodyJob());
  function sampleBodies() {
    const canvas = document.getElementById('host-alife-viewport-canvas');
    return { width: canvas?.width, height: canvas?.height, ratio: splitRatioPct,
      frame: chromeCrawlerState?.frameCount,
      bodies: (chromeCrawlerState?.viewportSwarm || []).map((body, index) => ({ index, id: body.id, x: body.x, y: body.y, vx: body.vx, vy: body.vy })) };
  }
  function bodiesWithinPanes(sample) {
    if (!sample || sample.bodies.length !== 5 || !(sample.width > 0) || !(sample.height > 0)) return false;
    return sample.bodies.every((body, index) => {
      const pane = window.AliveHabitat.bounds(sample.width, sample.height, true, sample.ratio, index >= 3);
      return Number.isFinite(body.x) && Number.isFinite(body.y) && body.x >= pane.minX - .01 && body.x <= pane.maxX + .01 &&
        body.y >= pane.minY - .01 && body.y <= pane.maxY + .01;
    });
  }
  async function read(tab) {
    requireFixture(tab);
    return Promise.race([tab.wv.executeJavaScript(`(() => {
      if (!${JSON.stringify(allowed)}.includes(location.href.split('#')[0])) return { refused: true };
      const auth = window.__aliveAuthority, secondary = window.__aliveSecondarySensors;
      return { url: location.href, scrollY, height: innerHeight,
        scrollHeight: (document.scrollingElement || document.documentElement).scrollHeight,
        exploration: window.__alivePageExploration || null,
        secondarySensorAuthorized: Boolean(secondary && auth?.current(secondary.token)),
        primaryResourcesPresent: Boolean(window.__humunculusAuthorityResources),
        userInputAt: window.__aliveUserInputAt ?? null };
    })()`), sleep(1200).then(() => { throw new Error('Split read-only guest diagnostic timed out'); })]);
  }
  async function resetOwnedViewport(tab) {
    requireFixture(tab);
    if (!api.leaseFor(tab.id)) await api.grant(tab.id);
    const token = api.leaseFor(tab.id);
    const reset = await executor.run(tab.wv, `(() => {
      if (!${JSON.stringify(allowed)}.includes(location.href.split('#')[0])) return { refused: true };
      // Explicit fixture setup; subsequent movements use the unmodified controller.
      window.scrollTo({ top: 0, behavior: 'instant' }); window.__alivePageExploration = null;
      return { reset: true, url: location.href, scrollY };
    })()`, { authorityToken: token, tag: 'split-probe-setup', timeoutMs: 1200 });
    if (reset?.reset !== true || reset.scrollY !== 0) throw new Error('Owned fixture viewport did not reset');
  }
  async function observeBoth(after) {
    controller.request('dom-body');
    await until(() => {
      const job = bodyJob(), current = cols();
      return job?.lastSuccessfulAt >= after && job.evidence?.secondary?.status === 'observed' &&
        current.some(c => c.pane === 'left' && c.tabId === left.id) &&
        current.some(c => c.pane === 'right' && c.tabId === right.id);
    }, 'acknowledged observations and current colliders in both panes');
  }
  async function pause() {
    stopAlienBrainAutonomy();
    await until(() => !controller.running && api.snapshot().paused && !api.snapshot().transitioning, 'Pause acknowledgement');
    if (!await executor.waitForIdle(null, { timeoutMs: 3000 })) throw new Error('Split guest work did not drain');
  }
  try {
    if (!api || !executor || !controller || !window.AliveHabitat || !window.AlivePageExploration ||
        typeof observeAliveSecondaryPane !== 'function') throw new Error('Split runtime contract is unavailable');
    window.addEventListener('error', onError); window.addEventListener('unhandledrejection', onError);
    await pause(); window.alienAutoNavigateLinks = false;
    window.aliveWorkspace?.closePanels();
    left = tabs.find(tab => tab.domReady && String(safeGetUrl(tab)).split('#')[0] === allowed[0]);
    if (!left) left = createTab(allowed[0], { title: 'Split verification left' });
    if (!await ensureTabDomReady(left, 5000)) throw new Error('Left fixture did not load');
    right = tabs.find(tab => tab.id !== left.id && tab.domReady && String(safeGetUrl(tab)).split('#')[0] === allowed[1]);
    if (!right) right = createTab(allowed[1], { title: 'Split verification right' });
    if (!await ensureTabDomReady(right, 5000)) throw new Error('Right fixture did not load');
    requireFixture(left); requireFixture(right);
    switchTab(left.id); secondaryTabId = right.id;
    if (!splitViewActive) toggleSplitView(); else updateSplitViewClasses();
    window.startAliveOverdrive(); window.alienAutoNavigateLinks = false;
    await window.selectAliveGuest(left.id, { reason: 'isolated-split-verification' });
    await until(() => Boolean(api.leaseFor(left.id)) && !api.snapshot().transitioning, 'primary lease');
    result.tabs = { left: left.id, right: right.id, fixtureUrls: allowed };
    for (const ratio of [25, 50, 75]) {
      setSplitRatio(ratio); await sleep(120);
      await resetOwnedViewport(left); await resetOwnedViewport(right);
      const before = { left: await read(left), right: await read(right) }, started = performance.now();
      await observeBoth(started);
      await sleep(700);
      const samples = [];
      for (let i = 0; i < 5; i++) { samples.push(sampleBodies()); await sleep(35); }
      const after = { left: await read(left), right: await read(right) };
      const entry = { ratio, before, after, receipt: receipt(), colliders: cols(), samples,
        primaryToken: clone(api.leaseFor(left.id)), secondaryToken: clone(api.leaseFor(right.id)) };
      result.ratios.push(entry);
      record('ratio-' + ratio, samples.every(bodiesWithinPanes) &&
        samples.at(-1).frame > samples[0].frame &&
        entry.secondaryToken?.kind === 'auxiliary' && entry.receipt.evidence?.secondary?.tabId === right.id &&
        after.left.scrollY > before.left.scrollY && after.right.scrollY > before.right.scrollY,
      { ratio, frames: samples.at(-1).frame - samples[0].frame, leftScroll: after.left.scrollY - before.left.scrollY,
        rightScroll: after.right.scrollY - before.right.scrollY, receiptAt: entry.receipt.lastSuccessfulAt });
    }
    setSplitRatio(50); await sleep(120);
    await resetOwnedViewport(left); await resetOwnedViewport(right); await observeBoth(performance.now());
    const oldToken = clone(api.leaseFor(right.id)), oldIdentity = clone(executor.documentIdentity(right.wv));
    const invalidation = event => {
      if (result.events.length < 24) result.events.push({ type: event.type, isMainFrame: event.isMainFrame,
        at: performance.now(), rightColliders: cols().filter(c => c.pane === 'right').length,
        ready: right.domReady, identity: clone(executor.documentIdentity(right.wv)) });
    };
    for (const type of ['did-start-navigation', 'did-navigate', 'dom-ready']) {
      right.wv.addEventListener(type, invalidation); listeners.push([right.wv, type, invalidation]);
    }
    requireFixture(right); right.wv.reload();
    await until(() => right.domReady && executor.documentIdentity(right.wv).generation > oldIdentity.generation, 'secondary replacement document');
    record('secondary-cache-invalidated', result.events.some(event =>
      ['did-start-navigation', 'did-navigate'].includes(event.type) && event.rightColliders === 0) && !api.isCurrent(oldToken, right.wv),
    { oldToken, oldIdentity, events: clone(result.events) });
    await observeBoth(performance.now());
    const replacementToken = clone(api.leaseFor(right.id)), replacementCols = cols().filter(c => c.pane === 'right');
    record('secondary-observation-rebound', replacementToken?.documentGeneration > oldToken.documentGeneration &&
      replacementToken.documentNonce !== oldToken.documentNonce && replacementCols.length > 0 &&
      replacementCols.every(c => c.documentGeneration === replacementToken.documentGeneration && api.isCurrent(c.authority, right.wv)),
    { replacementToken, colliders: replacementCols, receipt: receipt() });
    await sleep(700); await pause();
    const beforePause = { left: await read(left), right: await read(right), bodyRuns: bodyJob().runCount };
    await sleep(900);
    const afterPause = { left: await read(left), right: await read(right), bodyRuns: bodyJob().runCount };
    const unchanged = ['left', 'right'].every(pane => beforePause[pane].exploration?.scrollCommands === afterPause[pane].exploration?.scrollCommands &&
      beforePause[pane].exploration?.observations === afterPause[pane].exploration?.observations &&
      Math.abs(beforePause[pane].scrollY - afterPause[pane].scrollY) < 1);
    result.pause = { before: beforePause, after: afterPause, authority: api.snapshot(), pending: executor.pendingSnapshot() };
    record('pause-stops-exploration', unchanged && beforePause.bodyRuns === afterPause.bodyRuns &&
      afterPause.right.secondarySensorAuthorized === false && afterPause.left.primaryResourcesPresent === false &&
      result.pause.authority.leases.length === 0 && result.pause.pending.length === 0, result.pause);
    record('no-runtime-errors', result.errors.length === 0, result.errors);
    result.completed = true;
  } catch (error) { result.error = String(error.stack || error).slice(0, 2400); }
  finally {
    try { if (api && controller) await pause(); }
    catch (error) { result.cleanupError = String(error.message || error); }
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onError);
    result.final = { running: Boolean(controller?.running), authority: api?.snapshot?.(),
      pending: executor?.pendingSnapshot?.() || [], split: typeof splitViewActive === 'boolean' ? splitViewActive : null,
      ratio: typeof splitRatioPct === 'number' ? splitRatioPct : null,
      bodies: typeof chromeCrawlerState !== 'undefined' ? sampleBodies() : null };
    result.durationMs = performance.now() - began;
    result.screenshotReady = result.completed === true && result.final.split && result.final.ratio === 50;
    result.cleanupScope = 'Owned fixture tabs retained paused for screenshot; outer isolated probe owns process and fixture teardown.';
  }
  return result;
}

function assessSplitHabitat(result) {
  const required = ['ratio-25', 'ratio-50', 'ratio-75', 'secondary-cache-invalidated',
    'secondary-observation-rebound', 'pause-stops-exploration', 'no-runtime-errors'];
  const reasons = [];
  if (result?.completed !== true || result?.error || result?.cleanupError) reasons.push(result?.error || result?.cleanupError || 'Split phase did not complete');
  for (const id of required) if (!result?.cases?.some(entry => entry.id === id && entry.passed === true)) reasons.push('Missing passing case: ' + id);
  if (result?.cases?.some(entry => entry.passed !== true)) reasons.push('At least one split case failed');
  for (const ratio of [25, 50, 75]) {
    const entries = result?.ratios?.filter(entry => entry.ratio === ratio) || [];
    const entry = entries[0];
    if (entries.length !== 1 || !Array.isArray(entry.samples) || entry.samples.length < 2 ||
        !entry.samples.every(sample => Number.isFinite(sample.width) && sample.width > 0 && Number.isFinite(sample.height) && sample.height > 0 &&
          sample.ratio === ratio && sample.bodies?.length === 5 && sample.bodies.every((body, index) => Number.isFinite(body.x) && Number.isFinite(body.y) &&
            body.y >= 0 && body.y <= sample.height && (index < 3 ? body.x >= 0 && body.x < sample.width * ratio / 100
              : body.x > sample.width * ratio / 100 && body.x <= sample.width))) ||
        !(entry.samples.at(-1).frame > entry.samples[0].frame) ||
        !['left', 'right'].every(pane => Number.isFinite(entry.before?.[pane]?.scrollY) && Number.isFinite(entry.after?.[pane]?.scrollY) &&
          entry.after[pane].scrollY > entry.before[pane].scrollY) ||
        entry.secondaryToken?.kind !== 'auxiliary' || entry.secondaryToken?.tabId !== result?.tabs?.right ||
        entry.receipt?.evidence?.secondary?.status !== 'observed' || entry.receipt?.evidence?.secondary?.tabId !== result?.tabs?.right ||
        !['left', 'right'].every(pane => entry.colliders?.some(c => c.pane === pane && c.tabId === result.tabs[pane]))) {
      reasons.push('Incomplete or inconsistent actual ratio evidence: ' + ratio);
    }
  }
  const pause = result?.pause;
  if (!pause || !['left', 'right'].every(pane => Number.isFinite(pause.before?.[pane]?.exploration?.scrollCommands) &&
      pause.before[pane].exploration.scrollCommands === pause.after?.[pane]?.exploration?.scrollCommands &&
      pause.before[pane].exploration.observations === pause.after?.[pane]?.exploration?.observations &&
      Number.isFinite(pause.before[pane].scrollY) && Math.abs(pause.before[pane].scrollY - pause.after?.[pane]?.scrollY) < 1) ||
      pause.before?.bodyRuns !== pause.after?.bodyRuns || pause.after?.right?.secondarySensorAuthorized !== false ||
      pause.after?.left?.primaryResourcesPresent !== false) reasons.push('Paused scroll/sensor invariance was not proved');
  if (result?.final?.running !== false || result?.final?.authority?.paused !== true || result?.final?.authority?.transitioning !== false ||
      result?.final?.authority?.leases?.length !== 0 || result?.final?.pending?.length !== 0) reasons.push('Final paused cleanup was not proved');
  if (result?.screenshotReady !== true) reasons.push('Final owned split fixture was not ready for a screenshot');
  return { ok: reasons.length === 0, reasons, requiredCases: required };
}

function splitHabitatExpression(options) {
  const fixtureUrls = validateFixtureUrls(options?.fixtureUrls);
  return '(' + verifySplitHabitat.toString() + ')(' + JSON.stringify({ fixtureUrls }) + ',(' + validateFixtureUrls.toString() + '))';
}

module.exports = { validateFixtureUrls, verifySplitHabitat, assessSplitHabitat, splitHabitatExpression };
