/* ALIVE Synaptic Fabric visualizer: a data-only live analytics panel.
 *
 * Every mark is bound to measured runtime or model state; nothing here is a
 * decorative animation. Sources:
 *   - window.aliveOverdrive.snapshot(false)       scheduler jobs, lanes, metrics
 *   - window.aliveFabric.snapshot()               coupling graph, utilities, spans
 *   - humunculusRuntime.aliveNeuralCoupling       24 brain/precision streams + gates
 *   - humunculusRuntime.neuralSubstrateTelemetry  substrate numerical readouts
 *   - humunculusRuntime (hub, connectome, world model, colony), research policy
 * Sampling runs at most once per second into bounded ring buffers, with drawing
 * only after a sample/open/resize while open and visible. Absent values stay absent,
 * substituted.
 */
(function (root) {
  'use strict';
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  function createRates() {
    const previous = new Map();
    return {
      read(key, value, at) {
        if (!finite(value) || !finite(at)) { previous.delete(key); return null; }
        const before = previous.get(key);
        if (before && at <= before.at) return null;
        previous.set(key, { value, at });
        return !before || value < before.value ? null : (value - before.value) * 1000 / (at - before.at);
      },
      reset() { previous.clear(); }
    };
  }
  function concurrentPeaks(spans, now, windowMs = 60000, bins = 120) {
    if (!finite(now) || !finite(windowMs) || windowMs <= 0 || !Number.isInteger(bins) || bins < 1) return { values: [], peak: 0 };
    const start = now - windowMs, events = [], values = [];
    for (const span of spans || []) {
      const end = span.end === null ? now : span.end;
      if (!finite(span.start) || !finite(end)) continue;
      const a = Math.max(start, span.start), b = Math.min(now, end);
      if (a >= b) continue;
      events.push({ at: a, delta: 1 }, { at: b, delta: -1 });
    }
    events.sort((a, b) => a.at - b.at || a.delta - b.delta); // [start,end): ends before starts at ties.
    let active = 0, index = 0;
    for (let bin = 0; bin < bins; bin++) {
      const left = start + bin * windowMs / bins, right = start + (bin + 1) * windowMs / bins;
      while (index < events.length && events[index].at <= left) active += events[index++].delta;
      let peak = active;
      while (index < events.length && events[index].at < right) { active += events[index++].delta; peak = Math.max(peak, active); }
      values.push(peak);
    }
    return { values, peak: Math.max(0, ...values) };
  }
  const metrics = { createRates, concurrentPeaks };
  if (typeof module === 'object' && module.exports) module.exports = metrics;
  if (root) root.AliveFabricVisualizationMetrics = metrics;
  if (!root || !root.document || root.aliveFabricVisualizer) return;
  const doc = root.document;
  const HISTORY = 240;
  const STATUS_COLOR = { completed: '#34d399', observed: '#22d3ee', running: '#f0f9ff', blocked: '#fbbf24', unavailable: '#475569',
    error: '#f43f5e', timeout: '#fb7185', idle: '#64748b', queued: '#a78bfa', stopped: '#334155' };
  const LANE_ORDER = ['observe', 'cognition', 'mutation', 'planner', 'backend', 'diagnostic'];
  const runtime = () => (typeof humunculusRuntime !== 'undefined' ? humunculusRuntime : root.humunculusRuntime) || null;
  const now = () => root.performance?.now?.() ?? Date.now();

  // ---------- bounded sampling -------------------------------------------
  const series = new Map(), seriesTimes = new Map();
  let samplingAt = null, lastSampleAt = null;
  function push(name, value) {
    let ring = series.get(name), times = seriesTimes.get(name);
    if (!ring) { ring = []; times = []; series.set(name, ring); seriesTimes.set(name, times); }
    ring.push(finite(value) ? value : null);
    times.push(samplingAt);
    if (ring.length > HISTORY) { ring.shift(); times.shift(); }
  }
  const gateHistory = [], gateTimes = [], rates = createRates();
  let latest = { controller: null, fabric: null, coupling: null };
  const delta = (key, value) => rates.read(key, value, samplingAt);
  function sample() {
    if (!panel || panel.hidden || doc.hidden || destroyed) return false;
    samplingAt = now();
    if (finite(lastSampleAt) && samplingAt >= lastSampleAt && samplingAt - lastSampleAt < 1000) return false;
    lastSampleAt = samplingAt;
    const controller = root.aliveOverdrive?.snapshot?.(false) || null;
    const fabric = root.aliveFabric?.snapshot?.() || null;
    const h = runtime();
    let coupling = null;
    try { coupling = h?.aliveNeuralCoupling?.snapshot?.() || null; } catch (_) { coupling = null; }
    latest = { controller, fabric, coupling, sampledAt: samplingAt };
    const jobs = controller?.jobs || [];
    push('completions/s', delta('completions', controller && jobs.every(j => finite(j.completedCount)) ? jobs.reduce((a, j) => a + j.completedCount, 0) : null));
    push('in-flight', controller ? controller.inFlight : null);
    push('tick sync ms', controller?.metrics?.syncDurationMs);
    push('excitations/s', delta('excitations', fabric?.totals?.excitations));
    push('potentiations/s', delta('potentiations', fabric?.totals?.potentiations));
    push('mean edge weight', fabric?.graph?.meanWeight);
    push('mean utility', fabric?.graph?.meanUtility);
    push('coupling updates/s', delta('feedback', coupling?.feedbackUpdates));
    push('coupling reward', coupling?.lastReward);
    push('world pred error', h?.worldPredError);
    push('hub backprop/s', delta('backprop', h?.trainableAlifeNeuralHub?.totalBackpropStepsTrained));
    push('STDP updates/s', delta('stdp', h?.connectome512?.stdpUpdatesCount));
    const research = root.aliveResearch?.snapshot?.();
    push('research frontier', research?.frontierCount);
    push('research ranker loss', research?.lastLoss);
    const telemetry = h?.neuralSubstrateTelemetry;
    if (telemetry && typeof telemetry === 'object') {
      let count = 0;
      for (const [key, value] of Object.entries(telemetry)) {
        if (!finite(value)) continue;
        push('substrate:' + key, value);
        if (++count >= 16) break;
      }
    }
    if (coupling?.sources) {
      gateHistory.push(coupling.sources.map(s => (s.available ? s.gate : null)));
      gateTimes.push(samplingAt);
      if (gateHistory.length > 120) { gateHistory.shift(); gateTimes.shift(); }
    }
    draw(); return true;
  }

  // ---------- drawing helpers --------------------------------------------
  function canvas(id, height) {
    const node = doc.createElement('canvas');
    node.id = id; node.dataset.height = String(height);
    node.style.cssText = `width:100%;height:${height}px;display:block;background:#05090f;border:1px solid #13232f;border-radius:4px`;
    return node;
  }
  function prepare(node) {
    const ratio = root.devicePixelRatio || 1, width = node.clientWidth || 700, height = Number(node.dataset.height);
    if (node.width !== Math.round(width * ratio) || node.height !== Math.round(height * ratio)) {
      node.width = Math.round(width * ratio); node.height = Math.round(height * ratio);
    }
    const ctx = node.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '10px Consolas, monospace';
    ctx.textBaseline = 'middle';
    return { ctx, width, height };
  }
  const fmt = v => (!finite(v) ? '—' : Math.abs(v) >= 1000 ? v.toExponential(2) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3));
  function sparkline(ctx, x, y, w, h, values, label, color, times = []) {
    const data = values || [];
    const known = data.filter(finite);
    ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left';
    ctx.fillText(label, x, y + 6);
    if (!known.length) { ctx.fillStyle = '#475569'; ctx.fillText('no measurement', x, y + h / 2 + 6); return; }
    const min = Math.min(...known), max = Math.max(...known), span = max - min || 1;
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'right';
    ctx.fillText(`${fmt(known[known.length - 1])}  [${fmt(min)} … ${fmt(max)}]`, x + w, y + 6);
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
    let pen = false;
    data.forEach((value, i) => {
      if (!finite(value)) { pen = false; return; }
      const fraction = (times[i] - (latest.sampledAt - HISTORY * 1000)) / (HISTORY * 1000);
      if (!finite(fraction) || fraction < 0 || fraction > 1) { pen = false; return; }
      if (i && times[i] - times[i - 1] > 1500) pen = false;
      const px = x + fraction * w, py = y + h - ((value - min) / span) * (h - 14);
      if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
    });
    ctx.stroke();
    ctx.textAlign = 'left';
  }

  // ---------- 1. coupling graph -------------------------------------------
  function drawGraph(node) {
    const { ctx, width, height } = prepare(node);
    const fabric = latest.fabric;
    if (!fabric) { ctx.fillStyle = '#64748b'; ctx.fillText('Synaptic Fabric not attached (runtime not started).', 10, 20); return; }
    const nodes = fabric.nodes.slice().sort((a, b) => (LANE_ORDER.indexOf(a.group) - LANE_ORDER.indexOf(b.group)) || a.id.localeCompare(b.id));
    const cx = width / 2, cy = height / 2 + 6, radius = Math.min(width, height) / 2 - 64;
    const position = new Map(nodes.map((n, i) => {
      const angle = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2;
      return [n.id, { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, angle }];
    }));
    for (const edge of fabric.edges) {
      const a = position.get(edge.from), b = position.get(edge.to);
      if (!a || !b) continue;
      const recent = finite(edge.lastExcitedAgoMs) && edge.lastExcitedAgoMs < 1500;
      const drift = edge.weight - edge.initial;
      ctx.strokeStyle = recent ? 'rgba(103,232,249,0.95)' : drift > 0.01 ? `rgba(52,211,153,${0.12 + edge.weight * 0.6})`
        : drift < -0.01 ? `rgba(244,63,94,${0.12 + edge.weight * 0.6})` : `rgba(148,163,184,${0.06 + edge.weight * 0.45})`;
      ctx.lineWidth = 0.4 + edge.weight * 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx + (a.x + b.x - 2 * cx) * 0.25, cy + (a.y + b.y - 2 * cy) * 0.25, b.x, b.y);
      ctx.stroke();
    }
    for (const n of nodes) {
      const p = position.get(n.id);
      const r = 4 + 7 * (n.utility + 1) / 2;
      ctx.fillStyle = STATUS_COLOR[n.status] || '#64748b';
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (finite(n.lastExcitedAgoMs) && n.lastExcitedAgoMs < 1500) { ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; ctx.stroke(); }
      const right = Math.cos(p.angle) >= 0;
      ctx.fillStyle = '#cbd5e1'; ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText(n.id, p.x + (right ? r + 4 : -r - 4), p.y);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#e2e8f0';
    const t = fabric.totals, g = fabric.graph;
    ctx.fillText(`${g.nodes} faculties · ${g.edges} synapses · mean w ${fmt(g.meanWeight)} · |Δw| ${fmt(g.weightDrift)} · mean utility ${fmt(g.meanUtility)}`, 8, 10);
    ctx.fillText(`excitations ${t.excitations} · suppressed ${t.suppressed} · LTP ${t.potentiations} · LTD ${t.depressions} · novel ${t.novel} / repeated ${t.repeated} · cadence adj ${t.cadenceAdjustments}`, 8, 24);
    ctx.fillStyle = '#64748b';
    ctx.fillText('node size = utility · color = last status · edge width = learned weight · green/red = potentiated/depressed · cyan = excited < 1.5 s', 8, height - 8);
  }

  // ---------- 2. concurrency raster --------------------------------------
  function drawRaster(node) {
    const { ctx, width, height } = prepare(node);
    const fabric = latest.fabric, controller = latest.controller;
    if (!fabric || !controller) { ctx.fillStyle = '#64748b'; ctx.fillText('No execution spans yet.', 10, 20); return; }
    const now = fabric.sampledAt, windowMs = 60000, left = 118, right = width - 6;
    const ids = fabric.nodes.slice().sort((a, b) => (LANE_ORDER.indexOf(a.group) - LANE_ORDER.indexOf(b.group)) || a.id.localeCompare(b.id)).map(n => n.id);
    const rowH = Math.max(4, Math.floor((height - 40) / Math.max(1, ids.length)));
    const xOf = t => left + (1 - (now - t) / windowMs) * (right - left);
    ctx.font = `${Math.max(7, Math.min(10, rowH))}px Consolas, monospace`;
    ids.forEach((id, row) => {
      const y = 4 + row * rowH;
      if (row % 2) { ctx.fillStyle = '#08111a'; ctx.fillRect(left, y, right - left, rowH); }
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right'; ctx.fillText(id, left - 4, y + rowH / 2);
    });
    for (const span of fabric.spans) {
      const end = span.end === null ? now : span.end;
      if (end < now - windowMs) continue;
      const row = ids.indexOf(span.id); if (row < 0) continue;
      const x0 = xOf(Math.max(span.start, now - windowMs)), x1 = Math.max(x0 + 1.5, xOf(end));
      ctx.fillStyle = STATUS_COLOR[span.end === null ? 'running' : span.status] || '#64748b';
      ctx.fillRect(x0, 4 + row * rowH + 1, x1 - x0, Math.max(2, rowH - 2));
    }
    const { values: concurrency, peak: maxC } = concurrentPeaks(fabric.spans, now, windowMs, 120);
    const base = height - 6, top = 4 + ids.length * rowH + 4, scale = Math.max(1, maxC);
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = '#22d3ee';
    concurrency.forEach((c, b) => { const h = (c / scale) * (base - top); ctx.fillRect(left + (b / 120) * (right - left), base - h, (right - left) / 120 - 0.5, h); });
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'right';
    ctx.fillText(`peak concurrent executions ${maxC} · lanes in flight now ${controller.inFlight}`, left - 4, base - 4);
    ctx.textAlign = 'left';
  }

  // ---------- 3. brain stream gates --------------------------------------
  function drawBrains(node) {
    const { ctx, width, height } = prepare(node);
    const coupling = latest.coupling;
    if (!coupling?.sources) { ctx.fillStyle = '#64748b'; ctx.fillText('Neural coupling is not installed.', 10, 20); return; }
    const sources = coupling.sources, rowH = Math.floor((height - 30) / sources.length), labelW = 160, barW = 120;
    const heatX = labelW + barW + 58, heatW = width - heatX - 6;
    // Gates are 0.15 + 0.7·σ(logit), so the bar spans that true domain. The
    // heatmap is contrast-normalized to the observed history range, printed below.
    const observed = gateHistory.flat().filter(finite);
    const lo = observed.length ? Math.min(...observed) : 0.15, hi = observed.length ? Math.max(...observed) : 0.85, range = hi - lo || 1e-6;
    sources.forEach((s, i) => {
      const y = 22 + i * rowH;
      ctx.fillStyle = s.available ? '#cbd5e1' : '#475569'; ctx.textAlign = 'right';
      ctx.fillText(s.id, labelW - 4, y + rowH / 2);
      ctx.fillStyle = '#0f1b26'; ctx.fillRect(labelW, y + 1, barW, rowH - 2);
      if (s.available && finite(s.gate)) {
        ctx.fillStyle = '#34d399'; ctx.fillRect(labelW, y + 1, barW * Math.max(0, Math.min(1, (s.gate - 0.15) / 0.7)), rowH - 2);
        ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left'; ctx.fillText(s.gate.toFixed(4), labelW + barW + 4, y + rowH / 2);
      } else { ctx.fillStyle = '#475569'; ctx.textAlign = 'left'; ctx.fillText('absent', labelW + barW + 4, y + rowH / 2); }
      const cols = gateHistory.length;
      for (let c = 0; c < cols; c++) {
        const value = gateHistory[c][i];
        const t = finite(value) ? (value - lo) / range : null;
        ctx.fillStyle = t === null ? '#0b1219' : `hsl(${220 - t * 200}, 85%, ${16 + t * 44}%)`;
        const fraction = (gateTimes[c] - (latest.sampledAt - 120000)) / 120000;
        if (fraction >= 0 && fraction <= 1) ctx.fillRect(heatX + fraction * heatW, y + 1, Math.max(1, heatW / 120), rowH - 2);
      }
    });
    ctx.textAlign = 'left'; ctx.fillStyle = '#e2e8f0';
    const available = sources.filter(s => s.available).length;
    ctx.fillText(`${available}/${sources.length} streams computed · ${coupling.trainableParameters} trainable coupling params · ${coupling.steps} steps · ${coupling.feedbackUpdates} gate updates · last reward ${fmt(coupling.lastReward)}`, 6, 9);
    ctx.fillStyle = '#64748b'; ctx.fillText(`bar: gate on its 0.15–0.85 domain · heatmap 120 s, blue→yellow = ${lo.toPrecision(7)} → ${hi.toPrecision(7)} (span ${(hi - lo).toExponential(2)})`, labelW, height - 6);
  }

  // ---------- 4. utility / cadence ---------------------------------------
  function drawUtility(node) {
    const { ctx, width, height } = prepare(node);
    const fabric = latest.fabric;
    if (!fabric) return;
    const nodes = fabric.nodes.slice().sort((a, b) => b.utility - a.utility);
    const cols = 2, perCol = Math.ceil(nodes.length / cols), colW = width / cols, rowH = Math.floor((height - 18) / perCol);
    nodes.forEach((n, i) => {
      const col = Math.floor(i / perCol), row = i % perCol, x = col * colW, y = 16 + row * rowH;
      const mid = x + 120 + 60;
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right'; ctx.fillText(n.id, x + 116, y + rowH / 2);
      ctx.fillStyle = '#0f1b26'; ctx.fillRect(x + 120, y + 1, 120, rowH - 2);
      ctx.fillStyle = n.utility >= 0 ? '#34d399' : '#f43f5e';
      ctx.fillRect(n.utility >= 0 ? mid : mid + n.utility * 60, y + 1, Math.abs(n.utility) * 60, rowH - 2);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`×${n.cadence.toFixed(2)}${n.paced ? ' paced' : ''} ${Math.round(n.effectiveIntervalMs / 100) / 10}s n${n.novel}/r${n.repeated}/f${n.failures} e${n.excited}`, x + 244, y + rowH / 2);
    });
    ctx.fillStyle = '#64748b'; ctx.fillText('utility EWMA (−1 … +1) · cadence factor · effective interval · novel/repeated/failed · times excited', 6, 7);
  }

  // ---------- 5/6. time series -------------------------------------------
  function drawSeries(node, names, colors) {
    const { ctx, width, height } = prepare(node);
    const cols = 2, rows = Math.ceil(names.length / cols), cellW = (width - 12) / cols, cellH = height / rows;
    names.forEach((name, i) => {
      const x = 6 + (i % cols) * cellW, y = Math.floor(i / cols) * cellH;
      sparkline(ctx, x, y + 2, cellW - 14, cellH - 6, series.get(name), name.replace(/^substrate:/, ''), colors[i % colors.length], seriesTimes.get(name));
    });
  }

  // ---------- 7. ghost faculties and creatures (text, measured) ----------
  let latestBenchmark = null, benchmarkBusy = false;
  let latestAblations = null, ablationsBusy = false;
  let latestRestartEq = null, restartEqBusy = false;
  let latestContinualTransfer = null, continualTransferBusy = false;
  async function runBenchmark() {
    if (benchmarkBusy || typeof root.AliveUnseenTaskBenchmark?.run !== 'function') return latestBenchmark;
    benchmarkBusy = true;
    try {
      latestBenchmark = await root.AliveUnseenTaskBenchmark.run();
      root.__aliveLatestUnseenBenchmark = latestBenchmark;
      draw();
      return latestBenchmark;
    } finally {
      benchmarkBusy = false;
    }
  }
  async function runAblations() {
    if (ablationsBusy || typeof root.AliveArchitectureAblations?.run !== 'function') return latestAblations;
    ablationsBusy = true;
    try {
      latestAblations = await root.AliveArchitectureAblations.run();
      root.__aliveLatestArchitectureAblations = latestAblations;
      draw();
      return latestAblations;
    } finally {
      ablationsBusy = false;
    }
  }
  async function runRestartEquivalence() {
    const runner = root.AliveRestartEquivalence;
    if (restartEqBusy || typeof runner?.run !== 'function') return latestRestartEq;
    restartEqBusy = true;
    try {
      latestRestartEq = await runner.run();
      root.__aliveLatestRestartEquivalence = latestRestartEq;
      draw();
      return latestRestartEq;
    } finally {
      restartEqBusy = false;
    }
  }
  async function runContinualTransfer() {
    const runner = root.AliveContinualMorphologyTransfer;
    if (continualTransferBusy || typeof runner?.run !== 'function') return latestContinualTransfer;
    continualTransferBusy = true;
    try {
      latestContinualTransfer = await runner.run();
      root.__aliveLatestContinualTransfer = latestContinualTransfer;
      draw();
      return latestContinualTransfer;
    } finally {
      continualTransferBusy = false;
    }
  }

  function renderTables(target) {
    const controller = latest.controller, h = runtime();
    const rows = [];
    for (const id of ['ghost-swarm', 'ghost-write', 'memory', 'metacognition', 'learning-five-seed']) {
      const job = controller?.jobs?.find(item => item.id === id);
      if (!job) { rows.push(`${id.padEnd(20)} not registered`); continue; }
      const evidence = job.evidence && typeof job.evidence === 'object' ? Object.entries(job.evidence)
        .filter(([, v]) => v !== null && typeof v !== 'object').slice(0, 8).map(([k, v]) => `${k}=${String(v).slice(0, 40)}`).join(' ') : String(job.evidence ?? '');
      rows.push(`${id.padEnd(20)} ${job.status.padEnd(10)} runs ${String(job.runCount).padStart(4)} ok ${String(job.completedCount).padStart(4)} err ${job.errorCount}  ${evidence || job.lastError || ''}`);
    }
    rows.push('');
    const colony = Array.isArray(h?.offspringColony) ? h.offspringColony : [];
    const lenses = root.aliveFabric?.creatureLenses?.(colony, latest.coupling) || [];
    rows.push(`creatures: primary ${h?.agentId || '—'} + ${colony.length} offspring (${lenses.length} role lenses)`);
    for (const lens of lenses) {
      rows.push(`  [${lens.lensId.padEnd(14)}] ${String(lens.name).slice(0, 22).padEnd(22)} act=${fmt(lens.activation)} util=${fmt(lens.nodeUtility)} gate=${fmt(lens.gateActivation)}`);
    }
    for (const child of colony.slice(0, 8)) {
      const numbers = Object.entries(child || {}).filter(([, v]) => finite(v)).slice(0, 6).map(([k, v]) => `${k}=${fmt(v)}`).join(' ');
      rows.push(`  ${String(child?.offspringId || child?.id || '?').slice(0, 28).padEnd(28)} ${numbers}`);
    }
    rows.push('');
    const events = latest.fabric?.events || [];
    rows.push('fabric events (latest):');
    for (const event of events.slice(-14).reverse()) {
      rows.push(`  ${event.kind.padEnd(10)} ${String(event.from || '').padEnd(18)} → ${String(event.to || '').padEnd(18)} w=${fmt(event.weight)}${finite(event.delta) ? ` Δ=${event.delta.toFixed(4)}` : ''}${finite(event.pulledMs) ? ` pulled ${event.pulledMs}ms` : ''}`);
    }
    const persistence = latest.fabric?.persistence;
    if (persistence) rows.push('', `fabric persistence: ${persistence.status}${persistence.bytes ? ` · ${persistence.bytes} bytes` : ''}${persistence.reason ? ` · ${persistence.reason}` : ''}`);
    const text = rows.join('\n');
    if (target.textContent !== text) target.textContent = text;
  }

  // ---------- 8. Pass 2 unseen task benchmark & colony role lenses --------
  function drawBenchmark(node) {
    const { ctx, width, height } = prepare(node);
    const h = runtime(), colony = Array.isArray(h?.offspringColony) ? h.offspringColony : [];
    const lenses = root.aliveFabric?.creatureLenses?.(colony, latest.coupling) || [];
    const splitX = Math.floor(width * 0.56);

    // Left: 5-seed unseen holdout benchmark comparison
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
    const report = latestBenchmark || root.__aliveLatestUnseenBenchmark;
    if (!report?.summary?.byController) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(benchmarkBusy ? 'Running 5-seed unseen holdout benchmark…' : 'Click "Run benchmark" above to evaluate 5-seed unseen holdout tasks.', 8, 18);
    } else {
      const s = report.summary;
      const dLearn = s.pairedDeltas?.learningVsFrozenReward?.mean;
      const dFab = s.pairedDeltas?.fabricVsLearningReward?.mean;
      ctx.fillText(`5 seeds · learn vs frozen Δ=${fmt(dLearn)} (${s.learningBeatFrozenSeeds}/5) · fabric vs learn Δ=${fmt(dFab)} (${s.fabricBeatLearningSeeds}/5)`, 8, 12);
      const modes = ['heuristic', 'frozen', 'learning', 'fabric-coupled'];
      const colors = { heuristic: '#64748b', frozen: '#f59e0b', learning: '#22d3ee', 'fabric-coupled': '#34d399' };
      const minR = -8, maxR = 16, zeroX = 110 + ((-minR) / (maxR - minR)) * (splitX - 210);
      const barW = Math.max(60, splitX - 210);
      modes.forEach((mode, idx) => {
        const entry = s.byController[mode];
        if (!entry) return;
        const y = 32 + idx * 38;
        const mean = entry.unseenHoldoutReward.mean;
        const [lo, hi] = entry.unseenHoldoutReward.ci95;
        const recall = entry.unseenTargetRecall.mean * 100;
        const avoid = entry.unseenTrapAvoidance.mean * 100;
        ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right';
        ctx.fillText(mode, 104, y + 10);
        ctx.fillStyle = '#0f1b26';
        ctx.fillRect(110, y, barW, 18);
        const xMean = 110 + Math.max(0, Math.min(1, (mean - minR) / (maxR - minR))) * barW;
        ctx.fillStyle = colors[mode] || '#38bdf8';
        ctx.fillRect(Math.min(zeroX, xMean), y + 2, Math.max(1.5, Math.abs(xMean - zeroX)), 14);
        // 95% CI whisker
        const xLo = 110 + Math.max(0, Math.min(1, (lo - minR) / (maxR - minR))) * barW;
        const xHi = 110 + Math.max(0, Math.min(1, (hi - minR) / (maxR - minR))) * barW;
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xLo, y + 9); ctx.lineTo(xHi, y + 9); ctx.stroke();
        ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
        ctx.fillText(`r=${mean.toFixed(2)} rec=${recall.toFixed(0)}% avd=${avoid.toFixed(0)}%`, 114 + barW, y + 10);
      });
      ctx.fillStyle = '#64748b'; ctx.textAlign = 'left';
      ctx.fillText('unseen holdout reward (mean ± 95% CI) · rec=target concept recall · avd=trap avoidance', 8, height - 8);
    }

    // Right: Colony Role Lenses
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
    ctx.fillText(`Colony specialized role lenses (${lenses.length})`, splitX + 8, 12);
    const lensBarW = Math.max(50, width - splitX - 180);
    lenses.slice(0, 5).forEach((lens, idx) => {
      const y = 32 + idx * 32;
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
      ctx.fillText(`${lens.lensId}`, splitX + 96, y + 9);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(splitX + 102, y, lensBarW, 16);
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(splitX + 102, y + 2, lensBarW * Math.max(0, Math.min(1, lens.activation)), 12);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`${(lens.activation * 100).toFixed(0)}% (u=${lens.nodeUtility.toFixed(2)} g=${lens.gateActivation.toFixed(2)})`, splitX + 106 + lensBarW, y + 9);
    });
  }

  // ---------- 9. Pass 3 architecture ablations (38 conditions, 5 seeds) ----
  function drawAblations(node) {
    const { ctx, width, height } = prepare(node);
    const report = latestAblations || root.__aliveLatestArchitectureAblations;
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
    if (!report?.ablations?.brains) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(ablationsBusy ? 'Running 38-condition 5-seed architecture ablations…' : 'Click "Run ablations" above to measure 5-seed causal deltas across all 14 brains, 7 precision routes, AoT/ToT/GoT, and specialists.', 8, 18);
      return;
    }
    const s = report.summary;
    ctx.fillText(`38 conditions × 5 seeds · 14 brains ΔL2=${fmt(s.all14BrainsGroupDelta?.mean)} · 7 precision ΔL2=${fmt(s.all7PrecisionGroupDelta?.mean)} · AoT/ToT/GoT Δmargin=${fmt(s.allReasoningGroupMarginLoss?.mean)}`, 8, 12);
    const colW = Math.floor((width - 16) / 3);

    // Column 1: 14 Brains + all-14-brains
    const brainEntries = Object.values(report.ablations.brains);
    const maxBrain = Math.max(1e-6, ...brainEntries.map(e => e.sensoryDeltaL2?.mean || 0));
    brainEntries.forEach((entry, i) => {
      const y = 26 + i * 16;
      const val = entry.sensoryDeltaL2?.mean || 0;
      ctx.fillStyle = entry.id === 'all-14-brains' ? '#67e8f9' : '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(entry.id.replace(/^brain\d+/, '').slice(0, 14), 94, y + 6);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(98, y, colW - 164, 12);
      ctx.fillStyle = entry.id === 'all-14-brains' ? '#22d3ee' : '#34d399';
      ctx.fillRect(98, y + 1, (colW - 164) * Math.min(1, val / maxBrain), 10);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`${val.toFixed(4)} (${entry.nonZeroSeeds}/5)`, 102 + colW - 164, y + 6);
    });

    // Column 2: 7 Precision + all-7-precision + 3 Strata
    const col2X = colW + 8;
    const precEntries = [
      ...Object.values(report.ablations.precision),
      ...['micro-ising', 'omega-lorenz', 'omega-izhikevich'].map(id => report.ablations.strataAndSpecialists[id]).filter(Boolean)
    ];
    const maxPrec = Math.max(1e-6, ...precEntries.map(e => e.sensoryDeltaL2?.mean || 0));
    precEntries.forEach((entry, i) => {
      const y = 26 + i * 20;
      const val = entry.sensoryDeltaL2?.mean || 0;
      ctx.fillStyle = entry.id === 'all-7-precision' ? '#fbbf24' : '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(entry.id.slice(0, 15), col2X + 94, y + 7);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(col2X + 98, y, colW - 164, 14);
      ctx.fillStyle = entry.tier === 'strata' ? '#a78bfa' : '#f59e0b';
      ctx.fillRect(col2X + 98, y + 1, (colW - 164) * Math.min(1, val / maxPrec), 12);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`${val.toFixed(4)} (${entry.nonZeroSeeds}/5)`, col2X + 102 + colW - 164, y + 7);
    });

    // Column 3: 5 Specialists + 4 Reasoning + 3 Fabric Pathways
    const col3X = colW * 2 + 12;
    const col3Rows = [
      ...['NMDA_sLTC_Sheet', 'Dreamer_WorldModel', 'FlyWire_Connectome', 'QGTL_Grover_Q3', 'Allostatic_AgRP'].map(id => {
        const e = report.ablations.strataAndSpecialists[id];
        return e ? { label: id.slice(0, 15), val: e.residualDeltaL2?.mean || 0, max: 0.4, color: '#38bdf8', seeds: e.nonZeroSeeds } : null;
      }),
      ...Object.values(report.ablations.reasoning).map(e => ({
        label: e.id.slice(0, 15), val: e.marginLoss?.mean || 0, max: 2.2, color: '#f472b6', seeds: e.nonZeroSeeds
      })),
      ...Object.values(report.ablations.fabricPathways || {}).map(e => ({
        label: e.id.slice(0, 15), val: e.holdoutRewardLossWhenAblated?.mean || 0, max: 20, color: '#34d399', seeds: e.nonZeroSeeds
      }))
    ].filter(Boolean);
    col3Rows.forEach((row, i) => {
      const y = 26 + i * 20;
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
      ctx.fillText(row.label, col3X + 94, y + 7);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(col3X + 98, y, colW - 164, 14);
      ctx.fillStyle = row.color;
      ctx.fillRect(col3X + 98, y + 1, (colW - 164) * Math.min(1, row.val / row.max), 12);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`${row.val.toFixed(3)} (${row.seeds}/5)`, col3X + 102 + colW - 164, y + 7);
    });
  }

  // ---------- 10. Pass 4 state contracts & restart equivalence (5 seeds) ---
  function drawRestartEquivalence(node) {
    const { ctx, width, height } = prepare(node);
    const report = latestRestartEq || root.__aliveLatestRestartEquivalence;
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
    if (!report?.summary?.domainNecessity) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(restartEqBusy ? 'Running 5-seed split-horizon restart equivalence check…' : 'Click "Run restart check" above to verify 6-domain state contracts and split-horizon restart equivalence across 5 seeds.', 8, 18);
      return;
    }
    const s = report.summary;
    const splitX = Math.floor(width * 0.44);
    ctx.fillText(`5 seeds · exact SHA-256 restart equivalence ${s.exactRestartEquivalenceSeeds}/5 · full restore ΔL2=${fmt(s.fullRestoreStateL2Drift?.mean)} · all 6 domains required: ${s.all6DomainsNecessaryOn5Seeds}`, 8, 12);

    // Left: per-seed SHA-256 & trajectory verification
    (report.runs || []).slice(0, 5).forEach((run, idx) => {
      const y = 30 + idx * 30;
      ctx.fillStyle = run.finalDigestMatch ? '#34d399' : '#f43f5e';
      ctx.fillRect(10, y, 10, 14);
      ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'left';
      const digestShort = String(run.finalRestoredDigestSha256 || '').slice(0, 12);
      ctx.fillText(`seed ${run.seed} · SHA256=${digestShort}… · ΔL2=${run.fullRestoreL2Drift.toFixed(6)} · stg=${run.finalCurriculumStage} · rep=${run.finalReplayOccupancy} · rng=${run.finalPrngDraws}`, 26, y + 8);
    });

    // Right: Leave-One-Domain-Out necessity bars
    const domains = Object.values(s.domainNecessity);
    const maxDrift = Math.max(1e-6, ...domains.map(d => d.stateL2DriftWhenOmitted?.mean || 0));
    const barW = Math.max(60, width - splitX - 220);
    domains.forEach((d, idx) => {
      const y = 28 + idx * 26;
      const val = d.stateL2DriftWhenOmitted?.mean || 0;
      const mVal = d.motorL2DriftWhenOmitted?.mean || 0;
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
      ctx.fillText(`omit-${d.domain}`, splitX + 98, y + 8);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(splitX + 104, y, barW, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(splitX + 104, y + 1, barW * Math.min(1, Math.sqrt(val / maxDrift)), 12);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`Δstate=${val.toFixed(4)} Δmot=${mVal.toFixed(4)} (${d.divergingSeeds}/5)`, splitX + 108 + barW, y + 8);
    });
    ctx.fillStyle = '#64748b'; ctx.textAlign = 'left';
    ctx.fillText('left: full 6-domain restore (0.0 drift, identical SHA-256) · right: post-restore trajectory drift when each domain is omitted', 8, height - 6);
  }

  // ---------- 11. Pass 5 continual learning, retention & morphology transfer ---
  function drawContinualTransfer(node) {
    const { ctx, width, height } = prepare(node);
    const report = latestContinualTransfer || root.__aliveLatestContinualTransfer;
    ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
    if (!report?.summary?.byController) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(continualTransferBusy ? 'Running 5-seed continual learning & morphology transfer suite…' : 'Click "Run continual" above to measure 4-phase continual learning, distinct-task retention and morphology transfer across 5 seeds.', 8, 18);
      return;
    }
    const s = report.summary;
    const splitX = Math.floor(width * 0.52);
    const retGain = s.pairedDeltas?.fullVsNaiveRetentionGainPct?.mean || 0;
    const forgRed = s.pairedDeltas?.fullVsNaiveForgettingReduction?.mean || 0;
    ctx.fillText(`5 seeds · retention gain +${retGain.toFixed(1)}% (${s.fullBeatNaiveRetentionSeeds}/5) · forgetting Δ=-${forgRed.toFixed(3)} (${s.fullReducedForgettingSeeds}/5) · morph transfer (${s.metamorphBeatNaiveTransferSeeds}/5)`, 8, 12);

    const modes = ['frozen-baseline', 'naive-continual', 'metamorph-transfer-only', 'full-continual-living'];
    const colors = {
      'frozen-baseline': '#64748b',
      'naive-continual': '#f59e0b',
      'metamorph-transfer-only': '#38bdf8',
      'full-continual-living': '#34d399'
    };

    // Left: Prior-task retention % & Final 4-task mean return with 95% CIs
    const barW = Math.max(60, splitX - 245);
    modes.forEach((mode, idx) => {
      const entry = s.byController[mode];
      if (!entry) return;
      const y = 30 + idx * 38;
      const retPct = entry.priorTaskRetentionPct?.mean || 0;
      const allRet = entry.finalAllTasksMeanReturn?.mean || 0;
      const unseenMorph = entry.unseenMorphHoldoutReturn?.mean || 0;
      const forg = entry.catastrophicForgetting?.mean || 0;
      ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right';
      ctx.fillText(mode.slice(0, 18), 114, y + 10);
      ctx.fillStyle = '#0f1b26';
      ctx.fillRect(120, y, barW, 18);
      ctx.fillStyle = colors[mode] || '#38bdf8';
      ctx.fillRect(120, y + 2, barW * Math.max(0, Math.min(1, allRet / 0.85)), 14);
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
      ctx.fillText(`all=${allRet.toFixed(3)} ret=${retPct.toFixed(1)}% frg=${forg.toFixed(3)} mE=${unseenMorph.toFixed(3)}`, 124 + barW, y + 10);
    });

    // Right: 4-phase continual learning trajectory (Phase 1..4 seen-task return curves)
    const chartX = splitX + 24, chartY = 28, chartW = Math.max(80, width - splitX - 44), chartH = height - 52;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
    ctx.strokeRect(chartX, chartY, chartW, chartH);
    const minY = 0.30, maxY = 0.82;
    modes.forEach(mode => {
      const curves = s.byController[mode]?.phaseCurves || [];
      if (!curves.length) return;
      ctx.strokeStyle = colors[mode]; ctx.lineWidth = 1.6;
      ctx.beginPath();
      curves.forEach((pt, idx) => {
        const val = pt.meanAllTasksReturn?.mean ?? 0;
        const px = chartX + (idx / Math.max(1, curves.length - 1)) * chartW;
        const py = chartY + chartH - Math.max(0, Math.min(1, (val - minY) / (maxY - minY))) * chartH;
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
    ctx.fillStyle = '#64748b'; ctx.textAlign = 'left';
    ctx.fillText('left: 4-task final return, prior-task retention %, forgetting & unseen Morph E · right: Phase 1→4 trajectory', 8, height - 6);
  }

  // ---------- panel ------------------------------------------------------
  let panel = null, sampleTimer = null, mountTimer = null, destroyed = false;
  const sections = [];
  function section(title, child) {
    const wrap = doc.createElement('section');
    wrap.style.cssText = 'margin:0 0 10px 0';
    const heading = doc.createElement('h3');
    heading.textContent = title;
    heading.style.cssText = 'margin:4px 0;font:700 11px Consolas,monospace;color:#67e8f9;letter-spacing:.04em';
    wrap.append(heading, child);
    return wrap;
  }
  function build() {
    panel = doc.createElement('aside');
    panel.id = 'alive-fabric-panel';
    panel.setAttribute('aria-label', 'Synaptic Fabric live analytics');
    panel.hidden = true;
    panel.style.cssText = 'position:fixed;top:64px;right:8px;bottom:8px;width:min(780px,62vw);z-index:2147483000;overflow:auto;padding:10px 12px;background:rgba(3,7,12,0.97);border:1px solid #155e75;border-radius:8px;color:#e2e8f0;font:11px Consolas,monospace';
    const header = doc.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px';
    const title = doc.createElement('strong'); title.textContent = 'SYNAPTIC FABRIC · live data';
    const controls = doc.createElement('span');
    const benchBtn = doc.createElement('button'); benchBtn.type = 'button'; benchBtn.textContent = 'Run benchmark';
    benchBtn.title = 'Run 5-seed unseen holdout benchmark comparing heuristic, frozen, learning and fabric-coupled controllers';
    benchBtn.addEventListener('click', () => { runBenchmark(); });
    const ablateBtn = doc.createElement('button'); ablateBtn.type = 'button'; ablateBtn.textContent = 'Run ablations';
    ablateBtn.title = 'Run 38-condition 5-seed architecture ablations across all 14 brains, 7 precision routes, AoT/ToT/GoT, and specialists';
    ablateBtn.addEventListener('click', () => { runAblations(); });
    const restartBtn = doc.createElement('button'); restartBtn.type = 'button'; restartBtn.textContent = 'Run restart check';
    restartBtn.title = 'Run 5-seed split-horizon restart equivalence check across optimizer, recurrent, replay, RNG, curriculum and fabric domains';
    restartBtn.addEventListener('click', () => { runRestartEquivalence(); });
    const continualBtn = doc.createElement('button'); continualBtn.type = 'button'; continualBtn.textContent = 'Run continual';
    continualBtn.title = 'Run 5-seed 4-phase continual learning, distinct-task retention and morphology transfer suite';
    continualBtn.addEventListener('click', () => { runContinualTransfer(); });
    const reset = doc.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset weights';
    reset.title = 'Restore every learned synapse weight and utility to its declared initial value';
    reset.addEventListener('click', () => root.aliveFabric?.reset?.());
    const close = doc.createElement('button'); close.type = 'button'; close.textContent = 'Close';
    close.addEventListener('click', () => toggle(false));
    for (const b of [benchBtn, ablateBtn, restartBtn, continualBtn, reset, close]) b.style.cssText = 'margin-left:6px;background:#0b1720;color:#a5f3fc;border:1px solid #155e75;border-radius:4px;padding:2px 8px;cursor:pointer';
    controls.append(benchBtn, ablateBtn, restartBtn, continualBtn, reset, close);
    header.append(title, controls);
    panel.append(header);
    const graph = canvas('alive-fabric-graph', 440), raster = canvas('alive-fabric-raster', 420), brains = canvas('alive-fabric-brains', 320),
      utility = canvas('alive-fabric-utility', 300), runtimeSeries = canvas('alive-fabric-series', 240), substrate = canvas('alive-fabric-substrate', 260),
      benchmarkCanvas = canvas('alive-fabric-benchmark', 210), ablationsCanvas = canvas('alive-fabric-ablations', 280),
      restartEqCanvas = canvas('alive-fabric-restart-eq', 200), continualCanvas = canvas('alive-fabric-continual-transfer', 200);
    const tables = doc.createElement('pre');
    tables.style.cssText = 'margin:0;white-space:pre;overflow:auto;background:#05090f;border:1px solid #13232f;border-radius:4px;padding:6px;color:#cbd5e1;font:10px/1.35 Consolas,monospace';
    panel.append(
      section('1 · Coupling graph — all faculties, learned synapses', graph),
      section('2 · Concurrency raster — last 60 s, every faculty, every lane', raster),
      section('3 · 14 brains × 7 precision × Ising × Omega — coupling gates', brains),
      section('4 · Utility and adaptive cadence', utility),
      section('5 · Runtime, learning and plasticity time series (1 Hz)', runtimeSeries),
      section('6 · Neural substrate telemetry (1 Hz)', substrate),
      section('7 · Ghost faculties, memory, creatures, fabric log', tables),
      section('8 · Unseen task benchmark (5 seeds) & colony role lenses', benchmarkCanvas),
      section('9 · Architecture ablations — 14 brains × 7 precision × AoT/ToT/GoT × specialists', ablationsCanvas),
      section('10 · State contracts & restart equivalence — optimizer · recurrent · replay · RNG · curriculum · fabric', restartEqCanvas),
      section('11 · Continual learning, distinct-task retention & morphology transfer (5 seeds)', continualCanvas));
    sections.push(
      () => drawGraph(graph), () => drawRaster(raster), () => drawBrains(brains), () => drawUtility(utility),
      () => drawSeries(runtimeSeries, ['completions/s', 'in-flight', 'excitations/s', 'potentiations/s', 'mean edge weight', 'mean utility',
        'coupling updates/s', 'coupling reward', 'hub backprop/s', 'STDP updates/s', 'world pred error', 'research ranker loss'], ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#60a5fa']),
      () => drawSeries(substrate, Array.from(series.keys()).filter(name => name.startsWith('substrate:')).slice(0, 16), ['#60a5fa', '#34d399', '#fbbf24', '#f472b6']),
      () => renderTables(tables),
      () => drawBenchmark(benchmarkCanvas),
      () => drawAblations(ablationsCanvas),
      () => drawRestartEquivalence(restartEqCanvas),
      () => drawContinualTransfer(continualCanvas));
    if (root.aliveWorkspace?.registerPanel) root.aliveWorkspace.registerPanel('fabric', panel, () => toggle(false));
    else doc.body.appendChild(panel);
  }
  function draw() { if (!panel || panel.hidden || doc.hidden || destroyed) return; for (const fn of sections) { try { fn(); } catch (_) { /* one failed chart must not stop others */ } } }
  function cancelSampling() { if (sampleTimer !== null) { root.clearInterval(sampleTimer); sampleTimer = null; } }
  function beginSampling() { if (!panel?.hidden && !doc.hidden && !destroyed && sampleTimer === null) sampleTimer = root.setInterval(sample, 1000); }
  function toggle(force) {
    if (destroyed) return false;
    if (!panel) build();
    const show = typeof force === 'boolean' ? force : panel.hidden;
    if (show) root.aliveWorkspace?.prepareExternalPanel?.('fabric');
    const changed = panel.hidden === show;
    panel.hidden = !show;
    if (!show) { cancelSampling(); rates.reset(); }
    else { if (changed && !sample()) draw(); beginSampling(); }
    const button = doc.getElementById('alive-fabric-button');
    if (button) button.setAttribute('aria-pressed', String(show));
    return show;
  }
  function mountButton() {
    const bar = doc.getElementById('alive-runtime-bar');
    if (!bar || doc.getElementById('alive-fabric-button')) return Boolean(bar);
    const button = doc.createElement('button');
    button.type = 'button'; button.id = 'alive-fabric-button'; button.textContent = 'Fabric';
    button.title = 'Live data: coupling graph, concurrency, brain gates, utilities, learning curves';
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => toggle());
    bar.appendChild(button);
    return true;
  }
  function visibility() { if (doc.hidden) { cancelSampling(); rates.reset(); } else if (panel && !panel.hidden) { if (!sample()) draw(); beginSampling(); } }
  function resized() { draw(); }
  doc.addEventListener?.('visibilitychange', visibility); root.addEventListener?.('resize', resized);
  if (!mountButton()) {
    let attempts = 0;
    mountTimer = root.setInterval(() => { if (mountButton() || ++attempts > 120) { root.clearInterval(mountTimer); mountTimer = null; } }, 500);
  }
  function destroy() {
    toggle(false); destroyed = true; cancelSampling(); if (mountTimer !== null) root.clearInterval(mountTimer);
    doc.removeEventListener?.('visibilitychange', visibility); root.removeEventListener?.('resize', resized);
    root.aliveWorkspace?.unregisterPanel?.('fabric'); panel?.remove?.(); doc.getElementById('alive-fabric-button')?.remove?.(); sections.length = 0;
  }
  root.aliveFabricVisualizer = Object.freeze({ toggle, sample, runBenchmark, runAblations, runRestartEquivalence, runContinualTransfer, destroy, series: () => new Map([...series].map(([name, values]) => [name, values.slice()])), timestamps: () => new Map([...seriesTimes].map(([name, values]) => [name, values.slice()])), isOpen: () => Boolean(panel && !panel.hidden) });
  root.toggleAliveFabricPanel = toggle;
})(typeof window !== 'undefined' ? window : null);
