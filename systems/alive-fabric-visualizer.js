/* ALIVE Synaptic Fabric visualizer: a data-only live analytics panel.
 *
 * Every mark is bound to measured runtime or model state; nothing here is a
 * decorative animation. Sources:
 *   - window.aliveOverdrive.snapshot(false)       scheduler jobs, lanes, metrics
 *   - window.aliveFabric.snapshot()               coupling graph, utilities, spans
 *   - humunculusRuntime.aliveNeuralCoupling       24 brain/precision streams + gates
 *   - humunculusRuntime.neuralSubstrateTelemetry  substrate numerical readouts
 *   - humunculusRuntime (hub, connectome, world model, colony), research policy
 * Sampling runs at 1 Hz into bounded ring buffers; drawing runs at 4 Hz only
 * while the panel is open. Values that are absent are drawn as absent, never
 * substituted.
 */
(function (root) {
  'use strict';
  if (!root || !root.document || root.aliveFabricVisualizer) return;
  const doc = root.document;
  const HISTORY = 240;
  const STATUS_COLOR = { completed: '#34d399', observed: '#22d3ee', running: '#f0f9ff', blocked: '#fbbf24', unavailable: '#475569',
    error: '#f43f5e', timeout: '#fb7185', idle: '#64748b', queued: '#a78bfa', stopped: '#334155' };
  const LANE_ORDER = ['observe', 'cognition', 'mutation', 'planner', 'backend', 'diagnostic'];
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const runtime = () => (typeof humunculusRuntime !== 'undefined' ? humunculusRuntime : root.humunculusRuntime) || null;

  // ---------- bounded sampling -------------------------------------------
  const series = new Map();
  function push(name, value) {
    let ring = series.get(name);
    if (!ring) { ring = []; series.set(name, ring); }
    ring.push(finite(value) ? value : null);
    if (ring.length > HISTORY) ring.shift();
  }
  const gateHistory = [];
  let last = { completions: null, excitations: null, potentiations: null, backprop: null, stdp: null, feedback: null };
  let latest = { controller: null, fabric: null, coupling: null };
  const delta = (key, value) => {
    if (!finite(value)) return null;
    const previous = last[key]; last[key] = value;
    return finite(previous) ? Math.max(0, value - previous) : null;
  };
  function sample() {
    const controller = root.aliveOverdrive?.snapshot?.(false) || null;
    const fabric = root.aliveFabric?.snapshot?.() || null;
    const h = runtime();
    let coupling = null;
    try { coupling = h?.aliveNeuralCoupling?.snapshot?.() || null; } catch (_) { coupling = null; }
    latest = { controller, fabric, coupling };
    const jobs = controller?.jobs || [];
    push('completions/s', delta('completions', jobs.reduce((a, j) => a + (j.completedCount || 0), 0)));
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
      if (gateHistory.length > 120) gateHistory.shift();
    }
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
  function sparkline(ctx, x, y, w, h, values, label, color) {
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
      const px = x + (i / Math.max(1, HISTORY - 1)) * w, py = y + h - ((value - min) / span) * (h - 14);
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
    const concurrency = new Array(120).fill(0);
    for (const span of fabric.spans) {
      const end = span.end === null ? now : span.end;
      if (end < now - windowMs) continue;
      const row = ids.indexOf(span.id); if (row < 0) continue;
      const x0 = xOf(Math.max(span.start, now - windowMs)), x1 = Math.max(x0 + 1.5, xOf(end));
      ctx.fillStyle = STATUS_COLOR[span.end === null ? 'running' : span.status] || '#64748b';
      ctx.fillRect(x0, 4 + row * rowH + 1, x1 - x0, Math.max(2, rowH - 2));
      for (let b = 0; b < 120; b++) {
        const t0 = now - windowMs + b * 500, t1 = t0 + 500;
        if (span.start < t1 && end > t0 && end - span.start >= 1) concurrency[b]++;
      }
    }
    const base = height - 6, top = 4 + ids.length * rowH + 4, maxC = Math.max(1, ...concurrency);
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = '#22d3ee';
    concurrency.forEach((c, b) => { const h = (c / maxC) * (base - top); ctx.fillRect(left + (b / 120) * (right - left), base - h, (right - left) / 120 - 0.5, h); });
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
        ctx.fillRect(heatX + (c / 120) * heatW, y + 1, heatW / 120 + 0.5, rowH - 2);
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
      sparkline(ctx, x, y + 2, cellW - 14, cellH - 6, series.get(name), name.replace(/^substrate:/, ''), colors[i % colors.length]);
    });
  }

  // ---------- 7. ghost faculties and creatures (text, measured) ----------
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
    rows.push(`creatures: primary ${h?.agentId || '—'} + ${colony.length} offspring`);
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

  // ---------- panel ------------------------------------------------------
  let panel = null, drawTimer = null;
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
    const reset = doc.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset weights';
    reset.title = 'Restore every learned synapse weight and utility to its declared initial value';
    reset.addEventListener('click', () => root.aliveFabric?.reset?.());
    const close = doc.createElement('button'); close.type = 'button'; close.textContent = 'Close';
    close.addEventListener('click', () => toggle(false));
    for (const b of [reset, close]) b.style.cssText = 'margin-left:6px;background:#0b1720;color:#a5f3fc;border:1px solid #155e75;border-radius:4px;padding:2px 8px;cursor:pointer';
    controls.append(reset, close);
    header.append(title, controls);
    panel.append(header);
    const graph = canvas('alive-fabric-graph', 440), raster = canvas('alive-fabric-raster', 420), brains = canvas('alive-fabric-brains', 320),
      utility = canvas('alive-fabric-utility', 300), runtimeSeries = canvas('alive-fabric-series', 240), substrate = canvas('alive-fabric-substrate', 260);
    const tables = doc.createElement('pre');
    tables.style.cssText = 'margin:0;white-space:pre;overflow:auto;background:#05090f;border:1px solid #13232f;border-radius:4px;padding:6px;color:#cbd5e1;font:10px/1.35 Consolas,monospace';
    panel.append(
      section('1 · Coupling graph — all faculties, learned synapses', graph),
      section('2 · Concurrency raster — last 60 s, every faculty, every lane', raster),
      section('3 · 14 brains × 7 precision × Ising × Omega — coupling gates', brains),
      section('4 · Utility and adaptive cadence', utility),
      section('5 · Runtime, learning and plasticity time series (1 Hz)', runtimeSeries),
      section('6 · Neural substrate telemetry (1 Hz)', substrate),
      section('7 · Ghost faculties, memory, creatures, fabric log', tables));
    sections.push(
      () => drawGraph(graph), () => drawRaster(raster), () => drawBrains(brains), () => drawUtility(utility),
      () => drawSeries(runtimeSeries, ['completions/s', 'in-flight', 'excitations/s', 'potentiations/s', 'mean edge weight', 'mean utility',
        'coupling updates/s', 'coupling reward', 'hub backprop/s', 'STDP updates/s', 'world pred error', 'research ranker loss'], ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#60a5fa']),
      () => drawSeries(substrate, Array.from(series.keys()).filter(name => name.startsWith('substrate:')).slice(0, 16), ['#60a5fa', '#34d399', '#fbbf24', '#f472b6']),
      () => renderTables(tables));
    doc.body.appendChild(panel);
  }
  function draw() { for (const fn of sections) { try { fn(); } catch (_) { /* one failed chart must not stop others */ } } }
  function toggle(force) {
    if (!panel) build();
    const show = typeof force === 'boolean' ? force : panel.hidden;
    panel.hidden = !show;
    clearInterval(drawTimer); drawTimer = null;
    if (show) { sample(); draw(); drawTimer = setInterval(draw, 250); }
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
  setInterval(sample, 1000);
  if (!mountButton()) {
    let attempts = 0;
    const retry = setInterval(() => { if (mountButton() || ++attempts > 120) clearInterval(retry); }, 500);
  }
  root.aliveFabricVisualizer = Object.freeze({ toggle, sample, series: () => new Map(series), isOpen: () => Boolean(panel && !panel.hidden) });
  root.toggleAliveFabricPanel = toggle;
})(typeof window !== 'undefined' ? window : null);
