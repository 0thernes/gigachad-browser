'use strict';

// Actual application integration with an isolated smoke profile and an owned
// loopback fixture. Provider calls, downloads and public navigation stay blocked.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(process.env.GIGACHAD_CONTINUOUS_PROBE_OUTPUT || path.join(root, 'research_notes', 'continuous-cognition'));
fs.mkdirSync(outputDir, { recursive: true });

if (!process.versions.electron) {
  const { spawnSync } = require('node:child_process');
  const env = { ...process.env, GIGACHAD_SMOKE: '1', GIGACHAD_TEST_MODE: '1' };
  for (const name of ['ELECTRON_RUN_AS_NODE', 'OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'GIGACHAD_LLM_API_KEY']) delete env[name];
  const started = Date.now();
  const result = spawnSync(require('electron'), [__filename], { cwd: root, env, windowsHide: true, encoding: 'utf8', timeout: 150000, maxBuffer: 4 * 1024 * 1024 });
  fs.writeFileSync(path.join(outputDir, 'launcher.json'), JSON.stringify({ startedAt: new Date(started).toISOString(), durationMs: Date.now() - started, status: result.status, signal: result.signal, error: result.error?.message || null }, null, 2));
  fs.writeFileSync(path.join(outputDir, 'stdout.log'), result.stdout || '');
  fs.writeFileSync(path.join(outputDir, 'stderr.log'), result.stderr || '');
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  process.exit(result.status === 0 && /CONTINUOUS_COGNITION_OK/.test(result.stdout || '') ? 0 : result.status || 1);
}

const { app, BrowserWindow } = require('electron');
const Module = require('node:module');
for (const flag of ['disable-background-timer-throttling', 'disable-backgrounding-occluded-windows', 'disable-renderer-backgrounding']) app.commandLine.appendSwitch(flag);
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
process.env.GIGACHAD_SMOKE = '1'; process.env.GIGACHAD_TEST_MODE = '1';
const appPath = path.join(root, 'main.js');
let source = fs.readFileSync(appPath, 'utf8');
const smokeRunner = /  if \(SMOKE\) \{\r?\n    const fail = \(message\) => \{/;
if (!smokeRunner.test(source)) throw new Error('Smoke boot changed; review the isolated probe adapter.');
source = source.replace(smokeRunner, '  if (false) {\n    const fail = (message) => {');
const application = new Module(appPath, module); application.filename = appPath; application.paths = Module._nodeModulePaths(root);
application._compile(source, appPath);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { probe: 'continuous-cognition-production-electron', startedAt: new Date().toISOString(), ok: false,
  runtime: { electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node, platform: process.platform, arch: process.arch },
  isolation: { smokeProfile: true, providersDisabled: true, downloadsDisabled: true, publicRequestsBlocked: true, userInputExcluded: true },
  sourceHashes: {}, console: [], checks: [],
  limitations: ['An isolated software-rendered smoke window is transparent and non-interactive, marked visible solely to exercise production document-visibility gates.', 'The fixture and notebook are synthetic test data; no public-web quality, actual model inference, Tor, independent learning advantage or scientific gate qualification is established.'] };
for (const file of ['index.html', 'main.js', 'systems/alive-startup-loader.js', 'systems/alive-overdrive-runtime.js', 'systems/alive-overdrive-adapters.js', 'systems/alive-cognitive-faculties.js', 'systems/alive-faculty-visuals.js', 'systems/alive-tensor-evidence.js', 'systems/alive-synaptic-fabric.js', 'systems/alive-fabric-visualizer.js', 'systems/alive-workspace-ui.js', 'assets/alive-workspace.css', 'scripts/alive-continuous-cognition-probe.cjs']) {
  report.sourceHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
}
let win = null, fixtureDirectory = null, finished = false;
const watchdog = setTimeout(() => finish(new Error('Probe exceeded its 135-second deadline')), 135000);
function check(id, passed, evidence) { report.checks.push({ id, passed: Boolean(passed), evidence }); if (!passed) throw new Error(`Check failed: ${id}`); }
async function finish(error) {
  if (finished) return; finished = true; clearTimeout(watchdog);
  if (error) report.error = String(error.stack || error).slice(0, 5000);
  try {
    if (win && !win.isDestroyed()) {
      report.cleanup = await Promise.race([win.webContents.executeJavaScript(`(async () => {
        window.aliveFacultyVisuals?.close(); window.aliveFabricVisualizer?.toggle(false); window.stopAlienBrainAutonomy?.();
        const settled = await window.AliveGuestExecution?.waitForIdle(null, { timeoutMs: 5000 });
        return { settled, running: window.aliveOverdrive?.snapshot().running, authority: window.aliveAuthority?.snapshot(), pending: window.AliveGuestExecution?.pendingCount() };
      })()`), sleep(6000).then(() => ({ timeout: true }))]);
    }
  } catch (cause) { report.cleanup = { error: String(cause.message) }; }
  report.sourceChanges = Object.entries(report.sourceHashes).filter(([file, hash]) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') !== hash).map(([file]) => file);
  report.checks.push({ id: 'sources-unchanged-during-probe', passed: report.sourceChanges.length === 0, evidence: report.sourceChanges });
  report.ok = !report.error && report.checks.length >= 9 && report.checks.every(item => item.passed) && report.cleanup?.settled === true && report.cleanup?.running === false;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  // The fixture directory is newly created by this process. Remove only the two
  // exact known files and then the empty directory; never recursively delete.
  if (fixtureDirectory) {
    for (const name of ['habitat.html', 'second.html']) { const file = path.join(fixtureDirectory, name); if (fs.existsSync(file)) fs.unlinkSync(file); }
    try { fs.rmdirSync(fixtureDirectory); } catch (_) {}
  }
  console.log(`${report.ok ? 'CONTINUOUS_COGNITION_OK' : 'CONTINUOUS_COGNITION_FAIL'} ${JSON.stringify({ outputDir, checks: report.checks.map(({ id, passed }) => ({ id, passed })), error: report.error || null })}`);
  app.exit(report.ok ? 0 : 1);
}

async function main() {
  await app.whenReady();
  for (let i = 0; i < 150 && !win; i++) { win = BrowserWindow.getAllWindows()[0]; if (!win) await sleep(50); }
  if (!win) throw new Error('Owned smoke application window was not created');
  win.setFocusable(false); win.setIgnoreMouseEvents(true); win.setOpacity(0); win.webContents.setBackgroundThrottling(false); win.showInactive();
  win.webContents.on('console-message', event => { if (['warning', 'error'].includes(event.level) && report.console.length < 80) report.console.push({ level: event.level, message: String(event.message).slice(0, 1200) }); });
  const evaluate = expression => win.webContents.executeJavaScript(expression, true);
  let ready = false;
  for (let i = 0; i < 200; i++) {
    try {
      const startup = await evaluate('window.aliveStartup?.snapshot() || null');
      if (startup?.phase === 'failed') throw new Error(`Renderer startup failed: ${startup.error}`);
      ready = startup?.phase === 'ready';
    } catch (error) { if (/Renderer startup failed/.test(error.message)) throw error; }
    if (ready) break; await sleep(100);
  }
  check('startup-ready', ready, await evaluate('window.aliveStartup?.snapshot()'));
  report.modules = await evaluate(`({ jobs: window.aliveOverdrive?.snapshot().jobs.map(j => j.id), faculties: !!window.aliveCognitiveFaculties, visuals: !!window.aliveFacultyVisuals, tensors: typeof window.getAliveTensorEvidence, hidden: document.hidden, scripts: [...document.querySelectorAll('script[data-alive-startup="post"]')].map(s => s.getAttribute('src').split('/').at(-1)) })`);
  check('36-capabilities-and-faculty-modules', report.modules.jobs?.length === 36 && report.modules.faculties && report.modules.visuals && report.modules.tensors === 'function' && report.modules.hidden === false, report.modules);
  const portals = await evaluate("window.gigachad.invoke('hybrid-brain-portals')");
  if (!portals.httpBaseUrl) throw new Error('Owned loopback asset server unavailable');
  fixtureDirectory = path.join(root, 'brains', `.alive-continuous-probe-${process.pid}`); fs.mkdirSync(fixtureDirectory);
  const base = `${portals.httpBaseUrl.replace(/\/$/, '')}/.alive-continuous-probe-${process.pid}/`;
  const fixtureUrl = `${base}habitat.html`;
  const html = `<!doctype html><meta charset="utf-8"><title>Continuous cognition architecture and evidence fixture</title><style>body{font:18px/1.6 system-ui;background:#eef4f8;color:#182d3b;margin:0}main{max-width:820px;margin:40px auto;padding:30px}h1{font-size:38px}section{background:white;border-radius:12px;padding:22px;margin:18px 0}a{display:block;color:#075985;padding:8px}input{font:inherit}</style><main><h1>Continuous cognition architecture and evidence</h1><p>Owned offline fixture. Model design, source code implementation and benchmark limitations are ordinary page observations.</p><section><h2>Primary mechanisms</h2><p>The observed source describes recurrent architecture, memory and code. This synthetic excerpt establishes browser plumbing only.</p><a href="https://example.org/architecture">Architecture mechanisms primary source</a><a href="https://example.org/code">Source code implementation algorithm</a><a href="https://example.org/evidence">Benchmarks limitations counterexamples evidence</a><a href="${base}second.html">Local second habitat</a></section><section><h2>Editable control</h2><label>Fixture note <input id="fixture-note" value="unchanged fixture input"></label><p>Writing must create a local notebook; this input must remain unchanged.</p></section></main>`;
  fs.writeFileSync(path.join(fixtureDirectory, 'habitat.html'), html); fs.writeFileSync(path.join(fixtureDirectory, 'second.html'), html.replace('Continuous cognition architecture and evidence fixture', 'Second owned fixture')); fs.writeFileSync(path.join(outputDir, 'fixture.html'), html);
  report.fixture = { scheme: 'owned-loopback-http', providerMode: 'disabled', url: fixtureUrl };
  const exercised = await evaluate(`(${exercise.toString()})(${JSON.stringify(fixtureUrl)})`);
  report.exercise = exercised;
  for (const entry of exercised.checks || []) check(entry.id, entry.passed, entry.evidence);
  if (exercised.error) throw new Error(exercised.error);
  report.screenshot = { file: 'brain-evidence.png', bytes: 0 };
  await evaluate('document.getElementById("alive-evidence-panel").scrollTop = 0');
  await sleep(500);
  const capture = await win.webContents.capturePage();
  const png = capture.toPNG(); fs.writeFileSync(path.join(outputDir, 'brain-evidence.png'), png); report.screenshot.bytes = png.length;
  check('evidence-screenshot-captured', !capture.isEmpty() && png.length > 1000, { bytes: png.length, size: capture.getSize() });
  const tensorVisible = await evaluate(`(() => {
    const panel = document.getElementById('alive-evidence-panel');
    const row = [...panel.querySelectorAll('details')].find(node => /inspection$/.test(node.querySelector('summary')?.textContent || ''));
    if (!row) return false; row.open = true; row.scrollIntoView({ block: 'start' }); return true;
  })()`);
  if (tensorVisible) {
    await sleep(300); const tensorCapture = await win.webContents.capturePage();
    fs.writeFileSync(path.join(outputDir, 'tensor-evidence.png'), tensorCapture.toPNG());
    report.tensorScreenshot = { file: 'tensor-evidence.png', size: tensorCapture.getSize() };
  }
  await evaluate('window.aliveFabricVisualizer.toggle(true)');
  await sleep(1100);
  const fabricCapture = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, 'fabric-evidence.png'), fabricCapture.toPNG());
  report.fabricScreenshot = { file: 'fabric-evidence.png', size: fabricCapture.getSize() };
  await finish();
}

async function exercise(fixtureUrl) {
  const out = { checks: [] }, wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (id, passed, evidence) => { out.checks.push({ id, passed: Boolean(passed), evidence }); if (!passed) throw new Error(id); };
  async function until(predicate, label, timeout = 10000) { const end = performance.now() + timeout; while (performance.now() < end) { const value = await predicate(); if (value) return value; await wait(50); } throw new Error(`Timeout: ${label}`); }
  const controller = window.aliveOverdrive;
  const job = id => controller.snapshot().jobs.find(item => item.id === id);
  async function runJob(id) {
    const before = job(id).runCount;
    for (const entry of controller.jobs.values()) entry.nextDueAt = Infinity;
    controller.request(id);
    const result = await until(() => { controller.tick(); const current = job(id); if (current.status === 'blocked' || current.status === 'unavailable') throw new Error(`${id}: ${current.lastError}`); return current.runCount > before && !controller.inFlight.has(id) ? current : null; }, id, 22000);
    controller.jobs.get(id).nextDueAt = Infinity;
    return result;
  }
  try {
    window.stopAlienBrainAutonomy(); window.alienAutoNavigateLinks = false;
    await until(() => !window.aliveAuthority.snapshot().transitioning, 'initial pause');
    await window.AliveGuestExecution.waitForIdle(null, { timeoutMs: 5000 });
    const tab = createTab(fixtureUrl, { title: 'Owned continuous cognition fixture' }); switchTab(tab.id);
    if (!await ensureTabDomReady(tab, 8000)) throw new Error('Fixture did not become ready');
    window.startAliveOverdrive(); controller.automatic = false; if (controller.timer !== null) { controller.clearTimer(controller.timer); controller.timer = null; }
    // Only explicit probe requests are pumped; all production adapters, guest
    // authority checks and result handlers remain unchanged.
    for (const entry of controller.jobs.values()) entry.nextDueAt = Infinity;
    const lease = await window.selectAliveGuest(tab.id, { reason: 'continuous-cognition-probe' });
    assert('current-fixture-authority', lease.status === 'completed' && !!window.aliveAuthority.leaseFor(tab.id), { status: lease.status, fixture: safeGetUrl(tab) === fixtureUrl });
    const observation = await runJob('dom-body');
    const faculties = window.aliveCognitiveFaculties.snapshot();
    assert('acknowledged-dom-observation-enters-faculties', observation.status === 'completed' && faculties.observedPages > 0 && faculties.revision > 0, { status: observation.status, evidence: observation.evidence, observedPages: faculties.observedPages, revision: faculties.revision });
    const architecture = [];
    for (const id of ['brains-precision', 'macro', 'meso', 'micro', 'body-curriculum', 'connectome', 'millennium', 'reasoning', 'memory', 'metacognition']) {
      const result = await runJob(id); architecture.push({ id, status: result.status, evidence: result.evidence });
    }
    assert('architecture-readouts-populate-live-inspector', architecture.every(item => ['observed', 'completed'].includes(item.status) && item.evidence), architecture);
    const researchBefore = window.aliveResearch.snapshot();
    const swarm = await runJob('ghost-swarm'), writing = await runJob('ghost-write');
    const learned = window.aliveCognitiveFaculties.snapshot(), researchAfter = window.aliveResearch.snapshot();
    assert('ghost-roles-and-query-enqueue', swarm.status === 'completed' && learned.swarm.tasks.length === 3 && learned.swarm.linksQueued > 0 && learned.swarm.inferenceStatus === 'unavailable', { status: swarm.status, tasks: learned.swarm.tasks, linksQueued: learned.swarm.linksQueued, inferenceStatus: learned.swarm.inferenceStatus, reason: learned.swarm.reason, frontierBefore: researchBefore.frontierCount, frontierAfter: researchAfter.frontierCount });
    const stored = JSON.parse(localStorage.getItem('gigachad_creature_notebook_v1') || 'null');
    const field = await tab.wv.executeJavaScript('document.getElementById("fixture-note")?.value');
    assert('source-notebook-persisted-without-field-write', writing.status === 'completed' && stored?.notes?.at(-1)?.text === learned.writing.text && learned.writing.sourceUrls.includes(fixtureUrl) && field === 'unchanged fixture input', { status: writing.status, characters: learned.writing.text.length, sources: learned.writing.sourceUrls, field, persistenceReadback: stored?.notes?.at(-1)?.text === learned.writing.text });
    const warp1 = await window.applyAliveDomWarp({ enabled: true }), warp2 = await window.applyAliveDomWarp({ enabled: true });
    const guestWarped = await tab.wv.executeJavaScript('({enabled:window.__humunculusDomRealityWarp===true, transform:document.querySelector("main").style.transform})');
    const restore = await window.applyAliveDomWarp({ enabled: false });
    const guestRestored = await tab.wv.executeJavaScript('({enabled:window.__humunculusDomRealityWarp===true, transform:document.querySelector("main").style.transform})');
    assert('dom-warp-idempotent-and-acknowledged', warp1?.evidence?.pageApplied === true && warp2?.evidence?.pageApplied === true && warp2?.evidence?.changed === false && guestWarped.enabled && guestWarped.transform.length > 0 && restore?.evidence?.pageApplied === true && !guestRestored.enabled && guestRestored.transform === '', { warp1, warp2, guestWarped, restore, guestRestored });
    const cssProperties = ['transform', 'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay', 'transition-behavior', 'box-shadow'];
    const cssRead = () => tab.wv.executeJavaScript(`Object.fromEntries(${JSON.stringify(cssProperties)}.map(key => [key, { value: document.querySelector('main').style.getPropertyValue(key), priority: document.querySelector('main').style.getPropertyPriority(key) }]))`);
    async function cssRoundtrip(id, declarations) {
      await tab.wv.executeJavaScript(`document.querySelector('main').style.cssText = ${JSON.stringify(declarations)}`);
      const before = await cssRead();
      const enabled = await window.applyAliveDomWarp({ enabled: true }), applied = await cssRead();
      const disabled = await window.applyAliveDomWarp({ enabled: false }), after = await cssRead();
      assert(id, enabled.evidence?.pageApplied && disabled.evidence?.pageApplied && applied.transform.value !== before.transform.value && applied.transform.priority === before.transform.priority && JSON.stringify(before) === JSON.stringify(after), { before, applied, after, acknowledged: enabled.evidence?.pageApplied && disabled.evidence?.pageApplied });
    }
    await cssRoundtrip('warp-restores-important-transform-and-duration-only', 'transform:translateX(3px) !important;transition-duration:2s');
    await cssRoundtrip('warp-restores-mixed-transition-priorities', 'transform:rotate(2deg) !important;transition-property:opacity !important;transition-duration:2s;transition-timing-function:linear !important;transition-delay:0.2s;transition-behavior:allow-discrete !important');
    await tab.wv.executeJavaScript("document.querySelector('main').style.cssText = 'transform:translateX(3px) !important;transition-duration:2s;transition-property:opacity !important;transition-behavior:allow-discrete !important'");
    const editBefore = await cssRead(); await window.applyAliveDomWarp({ enabled: true });
    const editApplied = await cssRead();
    await tab.wv.executeJavaScript("{ const style = document.querySelector('main').style; style.setProperty('transform', style.getPropertyValue('transform'), ''); style.setProperty('transition-duration', '3.25s', 'important'); }");
    const pageEdited = await cssRead(); await window.applyAliveDomWarp({ enabled: true });
    const reapplied = await cssRead(); await window.applyAliveDomWarp({ enabled: false });
    const editedRestored = await cssRead();
    assert('warp-preserves-page-authored-values-and-priorities', reapplied.transform.value === editApplied.transform.value && reapplied.transform.priority === '' && editedRestored.transform.value === pageEdited.transform.value && editedRestored.transform.priority === '' && editedRestored['transition-duration'].value === pageEdited['transition-duration'].value && editedRestored['transition-duration'].priority === 'important' && cssProperties.filter(key => !['transform', 'transition-duration'].includes(key)).every(key => JSON.stringify(editedRestored[key]) === JSON.stringify(editBefore[key])), { before: editBefore, applied: editApplied, pageEdited, reapplied, restored: editedRestored });
    await tab.wv.executeJavaScript("document.querySelector('main').style.cssText = ''");

    // Hold only the actual memory adapter's invocation, then release it unchanged.
    // Marker clones dispatched over the real renderer event channel must not be
    // accepted as outcomes of that in-flight operation.
    const memoryJob = controller.jobs.get('memory'), originalMemoryRun = memoryJob.adapter.run;
    let releaseMemory;
    try {
      const held = new Promise(resolve => { releaseMemory = resolve; });
      memoryJob.adapter.run = args => held.then(() => originalMemoryRun.call(memoryJob.adapter, args));
      for (const entry of controller.jobs.values()) entry.nextDueAt = Infinity;
      controller.request('memory'); controller.tick();
      await until(() => controller.inFlight.has('memory'), 'held memory execution');
      const owned = controller.events.findLast(event => event.id === 'memory' && event.type === 'running');
      const before = window.aliveFabric.snapshot(), nodeBefore = before.nodes.find(node => node.id === 'memory');
      for (const source of ['alive-overdrive', 'alive-authority']) window.dispatchEvent(new CustomEvent('alive-runtime-event', { detail: { ...owned, source, type: 'completed', evidence: { foreignFixture: true } } }));
      const afterForeign = window.aliveFabric.snapshot(), nodeAfter = afterForeign.nodes.find(node => node.id === 'memory');
      const spanAfter = afterForeign.spans.findLast(span => span.id === 'memory' && span.runId === owned.runId && span.generation === owned.generation);
      assert('fabric-rejects-foreign-same-id-terminal-events', controller.ownsEvent(owned) && !controller.ownsEvent({ ...owned }) && afterForeign.totals.foreign === before.totals.foreign + 2 && afterForeign.totals.events === before.totals.events && spanAfter?.end === null && ['utility', 'novel', 'repeated', 'failures'].every(key => nodeBefore[key] === nodeAfter[key]) && afterForeign.graph.weightDrift === before.graph.weightDrift, { runId: owned.runId, generation: owned.generation, foreignBefore: before.totals.foreign, foreignAfter: afterForeign.totals.foreign, nodeBefore, nodeAfter, span: spanAfter });
      releaseMemory();
      await until(() => !controller.inFlight.has('memory'), 'real memory completion');
      memoryJob.nextDueAt = Infinity;
      const after = window.aliveFabric.snapshot(), settledSpan = after.spans.findLast(span => span.id === 'memory' && span.runId === owned.runId && span.generation === owned.generation), settledNode = after.nodes.find(node => node.id === 'memory');
      assert('fabric-accepts-owned-real-memory-outcome', settledSpan?.end !== null && settledSpan?.status === 'observed' && settledNode.novel + settledNode.repeated === nodeBefore.novel + nodeBefore.repeated + 1, { status: job('memory').status, span: settledSpan, novel: settledNode.novel, repeated: settledNode.repeated });
    } finally { memoryJob.adapter.run = originalMemoryRun; releaseMemory?.(); }

    const rectangle = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const adjacent = (a, b) => a.width > 0 && b.width > 0 && (a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1);
    window.aliveWorkspace.openPanel('inspect');
    window.aliveFacultyVisuals.open();
    await wait(100);
    const evidencePanel = document.getElementById('alive-evidence-panel'), inspector = document.getElementById('alien-brain-drawer');
    const evidenceRect = rectangle(evidencePanel), evidenceGuestRect = rectangle(tab.wv);
    const evidenceDocked = evidencePanel.parentElement.id === 'workspace' && adjacent(evidenceRect, evidenceGuestRect) && getComputedStyle(inspector).display === 'none';
    window.aliveFabricVisualizer.toggle(true); await wait(100);
    const fabricPanel = document.getElementById('alive-fabric-panel'), fabricRect = rectangle(fabricPanel), fabricGuestRect = rectangle(tab.wv);
    const fabricDocked = fabricPanel.parentElement.id === 'workspace' && adjacent(fabricRect, fabricGuestRect) && evidencePanel.hidden && !fabricPanel.hidden;
    window.aliveFacultyVisuals.open(); await wait(100);
    assert('evidence-panels-docked-exclusive-and-adjacent', evidenceDocked && fabricDocked && fabricPanel.hidden && !evidencePanel.hidden, { evidenceRect, evidenceGuestRect, fabricRect, fabricGuestRect, evidenceDocked, fabricDocked, fabricHidden: fabricPanel.hidden, evidenceHidden: evidencePanel.hidden });
    let tensors = await until(() => { const current = window.getAliveTensorEvidence(); return current.status === 'completed' && current.rows?.length ? current : null; }, 'tensor inspection', 25000);
    await wait(1200); window.aliveFacultyVisuals.sample();
    const panel = document.getElementById('alive-evidence-panel');
    const firstModel = [...panel.querySelectorAll('details')].find(node => node.querySelector('summary')?.textContent.includes('14 Brain'));
    if (firstModel) firstModel.open = true;
    assert('live-evidence-panel-and-tensors', !panel.hidden && panel.querySelectorAll('svg').length > 1 && tensors.rows.length > 0 && panel.textContent.includes('Weights, biases, activations and synapses') && panel.textContent.includes(learned.writing.text.slice(0, 80)), { panel: window.aliveFacultyVisuals.snapshot(), tensorRows: tensors.rows.length, valuesScanned: tensors.valuesScanned, bytes: tensors.bytes, omitted: tensors.omitted, allFinite: tensors.rows.filter(row => row.finite === row.length).length, scope: tensors.scope, screenshotRegion: 'top of Brain evidence panel' });
    out.faculties = learned; out.tensorSummary = { rows: tensors.rows.length, valuesScanned: tensors.valuesScanned, scope: tensors.scope };
    window.stopAlienBrainAutonomy();
    await until(() => !window.aliveAuthority.snapshot().transitioning && !controller.inFlight.size, 'pause settlement', 12000);
    const settled = await window.AliveGuestExecution.waitForIdle(null, { timeoutMs: 5000 });
    assert('pause-settles-coordinator-and-guests', !controller.running && settled === true && window.aliveAuthority.snapshot().paused, { running: controller.running, settled, authority: window.aliveAuthority.snapshot().phase, pending: window.AliveGuestExecution.pendingCount() });
    // The read-only panel may remain open while paused for screenshot capture.
    await wait(1000); window.aliveFacultyVisuals.sample();
  } catch (error) { out.error = String(error.stack || error); }
  return out;
}

main().catch(finish);
