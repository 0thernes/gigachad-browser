/* Read-only live evidence: samples declared runtime receipts, never runs a model. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AliveFacultyVisuals = api;
  if (root?.document && !root.aliveFacultyVisuals) {
    const mount = () => { if (!root.aliveFacultyVisuals) root.aliveFacultyVisuals = api.create(root); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const LIMITS = Object.freeze({ jobs: 96, tensors: 256, fields: 160, history: 60, events: 80, sources: 24 });
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const text = (value, limit = 1000) => value == null ? 'unavailable' : String(value).slice(0, limit);
  const number = value => finite(value) ? Number.isInteger(value) ? value.toLocaleString('en-US') : Number(value.toPrecision(6)).toString() : 'unmeasured';
  function age(now, at) {
    if (!finite(now) || !finite(at) || at > now) return 'age unavailable';
    const seconds = Math.floor((now - at) / 1000);
    return seconds < 60 ? `${seconds}s ago` : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : `${Math.floor(seconds / 3600)}h ago`;
  }
  function fields(value, limit = LIMITS.fields) {
    const result = [], seen = new Set();
    function visit(item, path, depth) {
      if (result.length >= limit) return;
      if (item == null || typeof item !== 'object') { result.push({ path: path || 'value', value: item }); return; }
      if (seen.has(item)) { result.push({ path, value: '[circular reference]' }); return; }
      if (depth >= 7) { result.push({ path, value: '[nested readout omitted]' }); return; }
      seen.add(item);
      const keys = Object.keys(item).slice(0, limit - result.length);
      if (!keys.length) result.push({ path: path || 'value', value: '[empty]' });
      for (const key of keys) visit(item[key], path ? `${path}.${key}` : key, depth + 1);
      seen.delete(item);
    }
    visit(value, '', 0);
    return result;
  }
  function trace(points, width = 540, height = 78) {
    const valid = points.filter(p => finite(p.at) && finite(p.value)).slice(-LIMITS.history);
    if (!valid.length) return { points: '', min: null, max: null, samples: 0 };
    const min = Math.min(...valid.map(p => p.value)), max = Math.max(...valid.map(p => p.value));
    const first = valid[0].at, last = valid[valid.length - 1].at;
    return { min, max, samples: valid.length, points: valid.map(p => {
      const x = last === first ? width / 2 : 6 + (p.at - first) / (last - first) * (width - 12);
      const y = max === min ? height / 2 : 6 + (max - p.value) / (max - min) * (height - 12);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') };
  }
  // Runtime events use its monotonic sampledAt clock; faculty events use epoch ms.
  // Convert only when the paired clock is known, never guess from magnitude.
  function timeline(runtime, faculty, now) {
    const events = [];
    if (finite(runtime?.sampledAt)) for (const event of (runtime.events || []).slice(-LIMITS.events)) {
      if (!finite(event.at) || event.at > runtime.sampledAt) continue;
      events.push({ ...event, at: now - (runtime.sampledAt - event.at), source: 'runtime' });
    }
    for (const event of (faculty?.events || []).slice(-LIMITS.events)) {
      if (finite(event.at) && event.at <= now) events.push({ ...event, source: 'faculties' });
    }
    return events.sort((a, b) => a.at - b.at).slice(-LIMITS.events);
  }
  function create(root) {
    const doc = root.document;
    let opened = false, destroyed = false, timer = null, returnFocus = null, filter = '';
    let latestRuntime = null, latestFaculty = null, latestTensors = null, sampleCount = 0, lastSampleAt = null, tensorPage = 0;
    const cards = new Map(), taskCards = new Map();
    const make = (tag, content, attributes = {}) => {
      const node = doc.createElement(tag);
      if (content !== undefined) node.textContent = content;
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      return node;
    };
    const svg = (tag, attributes = {}) => {
      const node = doc.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      return node;
    };
    const button = (label, action, attributes = {}) => {
      const node = make('button', label, { type: 'button', ...attributes }); node.addEventListener('click', action); return node;
    };
    const style = make('style', `
      #alive-evidence-panel{position:fixed;right:16px;top:100px;bottom:20px;width:min(690px,calc(100vw - 32px));z-index:2147483000;background:#0b1220;color:#e5edf8;border:1px solid #526982;border-radius:12px;box-shadow:0 14px 50px #0009;overflow:auto;padding:16px;font:13px/1.5 system-ui,sans-serif;box-sizing:border-box;}
      #alive-evidence-panel[hidden]{display:none!important}#alive-evidence-panel h2{font-size:19px;margin:0}#alive-evidence-panel h3{font-size:15px;margin:16px 0 7px}#alive-evidence-panel p{margin:7px 0;color:#c2d0df}#alive-evidence-panel button,#alive-evidence-panel select,#alive-evidence-panel input{background:#18273b;color:#edf4fc;border:1px solid #67829c;border-radius:5px;padding:6px 9px;font:inherit}#alive-evidence-panel :focus-visible,#alive-evidence-button:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}#alive-evidence-panel .ae-head{display:flex;align-items:center;justify-content:space-between;gap:12px}#alive-evidence-panel .ae-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}#alive-evidence-panel .ae-count{padding:10px;background:#132236;border:1px solid #2e465f;border-radius:7px}#alive-evidence-panel .ae-count strong{font-size:22px;display:block;color:#a5f3fc}#alive-evidence-panel .ae-muted{color:#aebed1;font-size:12px}#alive-evidence-panel details{margin:8px 0;padding:9px;border:1px solid #354c64;border-radius:6px}#alive-evidence-panel summary{cursor:pointer;font-weight:600;overflow-wrap:anywhere}#alive-evidence-panel table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}#alive-evidence-panel th,#alive-evidence-panel td{padding:5px;border-bottom:1px solid #294057;text-align:left;vertical-align:top;overflow-wrap:anywhere}#alive-evidence-panel pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,Consolas,monospace;margin:8px 0}#alive-evidence-panel svg{display:block;width:100%;height:auto;background:#080f19;border:1px solid #294057;border-radius:5px}#alive-evidence-panel .ae-card-chart{margin-top:8px}#alive-evidence-panel select,#alive-evidence-search{max-width:100%;width:100%}#alive-evidence-panel ol{padding-left:24px;max-height:200px;overflow:auto}#alive-evidence-panel li{padding:3px;overflow-wrap:anywhere}#alive-evidence-panel .ae-status{white-space:pre-wrap}#alive-evidence-panel a{color:#7dd3fc}#alive-evidence-panel .ae-history-label{font-size:11px;color:#b6cbe0}#alive-evidence-button{font-weight:700;border-color:#5b9cac}
    `);
    (doc.head || doc.body).append(style);
    const toggle = button('Brain evidence', () => opened ? close() : open(), { id: 'alive-evidence-button', 'aria-controls': 'alive-evidence-panel', 'aria-expanded': 'false', title: 'Inspect live cognition, learning, parameters, memory and browser outcomes' });
    const bar = doc.getElementById('alive-runtime-bar') || doc.getElementById('tools-ribbon');
    if (bar) bar.append(toggle);
    else { toggle.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147482999'; doc.body.append(toggle); }
    const panel = make('aside', undefined, { id: 'alive-evidence-panel', role: 'region', 'aria-label': 'Live brain and faculty evidence' }); panel.hidden = true;
    const heading = make('div', undefined, { class: 'ae-head' });
    heading.append(make('h2', 'Live brain evidence'), button('Close', close, { 'aria-label': 'Close brain evidence' }));
    const status = make('p', 'Waiting for a runtime snapshot.', { class: 'ae-status', role: 'status' });
    const counts = make('div', undefined, { class: 'ae-grid' });
    const countNodes = {};
    for (const [key, label] of [['jobs','Capabilities'],['exercised','With outcomes'],['pages','Observed pages'],['memory','Memory entries']]) {
      const cell = make('div', undefined, { class: 'ae-count' }), value = make('strong', '—');
      cell.append(value, make('span', label)); counts.append(cell); countNodes[key] = value;
    }
    panel.append(heading, make('p', 'Shared controller and faculties across the creature habitat. Expand any capability to inspect its actual readouts.', { class: 'ae-muted' }), status, counts);
    panel.append(make('h3', 'Execution timeline · last 60 seconds'));
    const eventChart = svg('svg', { viewBox: '0 0 600 90', role: 'img', 'aria-label': 'Recorded scheduler and faculty events from the last sixty seconds' });
    const eventCaption = make('p', 'No recorded events.', { class: 'ae-muted' });
    panel.append(eventChart, eventCaption, make('p', 'Blue: scheduler receipts · green: faculty receipts. Dots are actual events, not an activity animation. Overlapping events may share a position.', { class: 'ae-muted' }));
    panel.append(make('h3', 'Ghost Swarm · delegated research'));
    const swarmStatus = make('p'), tasks = make('div'); panel.append(swarmStatus, tasks);
    const sourcesDetails = make('details'), sourcesList = make('ol'); sourcesDetails.append(make('summary', 'Observed source provenance'), sourcesList); panel.append(sourcesDetails);
    panel.append(make('h3', 'Ghost Write · source-bound draft'));
    const draftStatus = make('p'), draft = make('pre'), draftSources = make('p', undefined, { class: 'ae-muted' }); panel.append(draftStatus, draft, draftSources);
    panel.append(make('h3', 'All capabilities · model, body, memory and tools'));
    const search = make('input', undefined, { id: 'alive-evidence-search', type: 'search', placeholder: 'Filter brain, precision, synapse, memory, training…', 'aria-label': 'Filter capability evidence' });
    search.addEventListener('input', () => { filter = search.value.toLowerCase(); tensorPage = 0; renderTensorPanel(latestTensors, lastSampleAt); filterCards(); });
    const jobsContainer = make('div');
    panel.append(search, make('p', 'Charts contain snapshots collected only while this panel is open. Scalar readouts and bounded tensor excerpts do not display every weight or establish model quality. Missing data stays unavailable.', { class: 'ae-muted' }), jobsContainer);
    panel.append(make('h3', 'Weights, biases, activations and synapses'));
    const tensorStatus = make('p', undefined, { class: 'ae-muted' }), tensorContainer = make('div');
    const tensorNavigation = make('div', undefined, { class: 'ae-head' });
    const previousTensors = button('Previous tensors', () => { tensorPage = Math.max(0, tensorPage - 1); renderTensorPanel(latestTensors, lastSampleAt); filterCards(); });
    const nextTensors = button('Next tensors', () => { tensorPage++; renderTensorPanel(latestTensors, lastSampleAt); filterCards(); });
    const tensorPageLabel = make('span', undefined, { class: 'ae-muted' });
    tensorNavigation.append(previousTensors, tensorPageLabel, nextTensors); panel.append(tensorStatus, tensorNavigation, tensorContainer);
    const hostDetails = make('details'), hostReadout = make('pre'); hostDetails.append(make('summary', 'Runtime health, authority, persistence and acceptance'), hostReadout); panel.append(hostDetails);
    const logs = make('details'), logList = make('ol'); logs.append(make('summary', 'Recent outcome log'), logList); panel.append(logs);
    const scopeNote = make('p', undefined, { class: 'ae-muted' }); panel.append(scopeNote);
    if (!root.aliveWorkspace?.registerPanel?.('brain-evidence', panel, close)) doc.body.append(panel);

    function filterCards() { for (const card of cards.values()) card.node.hidden = Boolean(filter && !card.searchText.includes(filter)); }
    function makeCard(job, target = jobsContainer) {
      const node = make('details'), summary = make('summary'), info = make('p', undefined, { class: 'ae-muted' });
      const selection = make('select', undefined, { 'aria-label': `Numeric metric for ${text(job.label || job.id)}` });
      const chart = svg('svg', { viewBox: '0 0 540 78', role: 'img', class: 'ae-card-chart' });
      const line = svg('polyline', { fill: 'none', stroke: '#7dd3fc', 'stroke-width': '2' }), dot = svg('circle', { r: 0, fill: '#7dd3fc' }); chart.append(line, dot);
      const caption = make('p', undefined, { class: 'ae-history-label' });
      const table = make('table'), head = make('thead'), row = make('tr'), body = make('tbody');
      row.append(make('th', 'Evidence field', { scope: 'col' }), make('th', 'Observed value', { scope: 'col' })); head.append(row); table.append(head, body);
      node.append(summary, info, selection, chart, caption, table); target.append(node);
      const card = { node, summary, info, selection, chart, line, dot, caption, body, histories: new Map(), rows: new Map(), selected: '', searchText: '' };
      selection.addEventListener('change', () => { card.selected = selection.value; drawMetric(card); });
      cards.set(job.id, card); return card;
    }
    function drawMetric(card) {
      const points = card.histories.get(card.selected) || [], plotted = trace(points);
      card.line.setAttribute('points', plotted.points);
      const endpoint = plotted.points.split(' ').at(-1)?.split(',');
      card.dot.setAttribute('r', plotted.samples ? 3 : 0);
      if (plotted.samples) { card.dot.setAttribute('cx', endpoint[0]); card.dot.setAttribute('cy', endpoint[1]); }
      card.chart.setAttribute('aria-label', `${card.selected || 'Numeric readout'}: ${plotted.samples} observed samples; minimum ${number(plotted.min)}, maximum ${number(plotted.max)}`);
      card.caption.textContent = plotted.samples ? `${card.selected} · ${plotted.samples} display samples · min ${number(plotted.min)} · max ${number(plotted.max)} · latest ${number(points.at(-1)?.value)}` : 'No finite numeric measurements received.';
    }
    function renderJob(job, runtime, now, target) {
      const card = cards.get(job.id) || makeCard(job, target);
      card.summary.textContent = job.tensor ? `${text(job.label)} · ${text(job.evidence.dtype)}[${number(job.evidence.length)}] · ${text(job.evidence.inspection)} inspection` : `${text(job.label || job.id)} · ${text(job.status)} · ${number(job.completedCount)} outcomes`;
      card.info.textContent = job.tensor ? `Owner: ${text(job.evidence.owner)} · ${age(now, job.evidenceAt)} · summary statistics and a bounded value excerpt; no per-weight change count is inferred` : `Lane: ${text(job.group)} · ${age(runtime.sampledAt, job.evidenceAt)} · last call ${number(job.lastDurationMs)} ms${job.waitingFor?.length ? ` · waiting for ${job.waitingFor.join(', ')}` : ''}${job.lastError ? ` · ${text(job.lastError)}` : ''}`;
      const entries = fields(job.evidence), numeric = entries.filter(entry => finite(entry.value));
      card.searchText = `${job.id} ${job.label} ${entries.map(entry => entry.path).join(' ')}`.toLowerCase();
      const keys = new Set(entries.map(entry => entry.path));
      for (const [key, row] of card.rows) if (!keys.has(key)) { row.remove(); card.rows.delete(key); }
      for (const entry of entries) {
        let row = card.rows.get(entry.path);
        if (!row) { row = make('tr'); row.append(make('th', entry.path, { scope: 'row' }), make('td')); card.body.append(row); card.rows.set(entry.path, row); }
        row.children[1].textContent = finite(entry.value) ? number(entry.value) : text(entry.value, 1200);
      }
      const numericKeys = new Set(numeric.map(entry => entry.path));
      for (const key of card.histories.keys()) if (!numericKeys.has(key)) card.histories.delete(key);
      for (const entry of numeric) {
        const history = card.histories.get(entry.path) || [];
        if (!history.length || history.at(-1).at !== now) history.push({ at: now, value: entry.value });
        if (history.length > LIMITS.history) history.shift();
        card.histories.set(entry.path, history);
      }
      if (!numericKeys.has(card.selected)) card.selected = job.tensor && numericKeys.has('mean') ? 'mean' : numeric[0]?.path || '';
      const optionKeys = [...card.selection.children].map(option => option.value);
      if (optionKeys.join('\0') !== [...numericKeys].join('\0')) {
        card.selection.replaceChildren(...numeric.map(entry => make('option', entry.path, { value: entry.path })));
      }
      card.selection.value = card.selected; card.selection.disabled = !numeric.length;
      drawMetric(card);
    }
    function renderTimeline(events, now) {
      eventChart.replaceChildren();
      for (const [y, label] of [[28, 'Runtime'], [63, 'Faculties']]) {
        eventChart.append(svg('line', { x1: 75, x2: 590, y1: y, y2: y, stroke: '#354c64' }));
        const title = svg('text', { x: 6, y: y + 4, fill: '#c2d0df', 'font-size': 11 }); title.textContent = label; eventChart.append(title);
      }
      const recent = events.filter(event => now - event.at <= 60000 && event.at <= now);
      for (const event of recent) {
        const dot = svg('circle', { cx: 75 + (1 - (now - event.at) / 60000) * 515, cy: event.source === 'runtime' ? 28 : 63, r: 4, fill: event.source === 'runtime' ? '#7dd3fc' : '#6ee7b7' });
        const title = svg('title'); title.textContent = `${age(now, event.at)} · ${text(event.id || event.source)} · ${text(event.type)}`; dot.append(title); eventChart.append(dot);
      }
      eventCaption.textContent = `${recent.length} retained events in this window · left: 60s ago · right: now · retained event list capped at ${LIMITS.events}`;
      logList.replaceChildren(...events.slice(-30).reverse().map(event => make('li', `${age(now, event.at)} · ${text(event.id || event.source)} · ${text(event.type)}${event.detail ? ` · ${typeof event.detail === 'object' ? fields(event.detail, 12).map(item => `${item.path}: ${text(item.value, 160)}`).join('; ') : text(event.detail, 400)}` : ''}`)));
    }
    function renderTensorPanel(tensors, now) {
      const rows = Array.isArray(tensors?.rows) ? tensors.rows : [];
      const filtered = rows.filter(row => !filter || `${row.id} ${row.owner} ${row.dtype} ${row.inspection} ${Object.keys(row).join(' ')}`.toLowerCase().includes(filter));
      const pages = Math.max(1, Math.ceil(filtered.length / LIMITS.tensors)); tensorPage = Math.min(tensorPage, pages - 1);
      const visible = filtered.slice(tensorPage * LIMITS.tensors, (tensorPage + 1) * LIMITS.tensors), currentIds = new Set(visible.map(row => `tensor:${row.id}`));
      for (const [id, card] of cards) if (id.startsWith('tensor:') && !currentIds.has(id)) { card.node.remove(); cards.delete(id); }
      tensorStatus.textContent = tensors?.readError ? `Tensor read failed: ${tensors.readError}` : !tensors ? 'Tensor inspection hook unavailable; no weights or parameter statistics invented.' : `${rows.length} returned tensor readouts · ${filtered.length} match filter · ${text(tensors.status)}${tensors.collecting ? ' · scan in progress (showing last completed results)' : ''} · ${number(tensors.omitted)} omitted by collection limits · ${number(tensors.valuesScanned)} values scanned · ${text(tensors.scope || 'Each tensor declares full or sampled inspection. Excerpts contain a limited number of values.', 1200)}`;
      tensorPageLabel.textContent = `Page ${tensorPage + 1} / ${pages} · up to ${LIMITS.tensors} per page`;
      previousTensors.disabled = tensorPage === 0; nextTensors.disabled = tensorPage + 1 >= pages;
      for (const row of visible) renderJob({ id: `tensor:${row.id}`, tensor: true, label: row.id, evidence: row, evidenceAt: tensors.sampledAt }, {}, now, tensorContainer);
    }
    function renderFaculties(faculty, now) {
      const swarm = faculty?.swarm, writing = faculty?.writing;
      swarmStatus.textContent = `${text(swarm?.status)} · ${text(swarm?.topic || swarm?.reason)} · ${age(now, swarm?.completedAt)} · ${number(swarm?.linksQueued)} links queued`;
      const currentTasks = (swarm?.tasks || []).slice(0, 12), taskIds = new Set(currentTasks.map(task => task.id));
      for (const [id, card] of taskCards) if (!taskIds.has(id)) { card.node.remove(); taskCards.delete(id); }
      for (const task of currentTasks) {
        let card = taskCards.get(task.id);
        if (!card) { card = { node: make('details'), summary: make('summary'), query: make('p'), result: make('pre') }; card.node.append(card.summary, card.query, card.result); tasks.append(card.node); taskCards.set(task.id, card); }
        card.summary.textContent = `${text(task.label || task.id)} · ${text(task.status)} · ${number(task.sourceCount)} sources`;
        card.query.textContent = `Query: ${text(task.query)}`; card.result.textContent = text(task.result || task.reason, 3000);
      }
      sourcesList.replaceChildren(...(swarm?.sources || []).slice(0, LIMITS.sources).map(source => {
        const item = make('li'); item.append(make('strong', text(source.title || source.url, 300)), make('p', text(source.url, 2000)), make('p', text(source.excerpt, 1500))); return item;
      }));
      if (!sourcesList.children.length) sourcesList.append(make('li', 'No observed source receipts.'));
      draftStatus.textContent = `${text(writing?.status)} · ${number(writing?.sourceCount)} sources · ${age(now, writing?.completedAt)}${writing?.reason ? ` · ${text(writing.reason)}` : ''}`;
      draft.textContent = writing?.text ? text(writing.text, 16000) : 'No source-bound draft has completed.';
      draftSources.textContent = writing?.sourceUrls?.length ? `Draft sources: ${writing.sourceUrls.slice(0, LIMITS.sources).map(url => text(url, 2000)).join(' · ')}` : 'Draft source URLs: unavailable';
      scopeNote.textContent = text(faculty?.scope || 'This panel reads bounded snapshots. Running counters, simulated features and allocated tensor sizes do not establish consciousness, physical quantum computation or research-gate qualification.', 1500);
    }
    function read(fn) { try { return typeof fn === 'function' ? fn() : null; } catch (error) { return { readError: text(error?.message || error, 300) }; } }
    function sample() {
      if (!opened || destroyed || doc.hidden) return null;
      const now = root.Date?.now ? root.Date.now() : Date.now();
      if (finite(lastSampleAt) && now >= lastSampleAt && now - lastSampleAt < 1000) return { runtime: latestRuntime, faculty: latestFaculty };
      lastSampleAt = now;
      const runtime = read(() => root.aliveOverdrive?.snapshot()), faculty = read(() => root.aliveCognitiveFaculties?.snapshot());
      latestRuntime = runtime; latestFaculty = faculty; sampleCount++;
      const jobs = (runtime?.jobs || []).slice(0, LIMITS.jobs);
      status.textContent = runtime?.readError ? `Runtime read failed: ${runtime.readError}` : !runtime ? 'Runtime unavailable.' : `${runtime.running ? runtime.suspended ? 'Suspended' : 'Running' : 'Paused'} · ${number(runtime.inFlight)} executing · ${number(runtime.queued)} queued · ${number(runtime.health?.issues)} capability issues · refreshed ${new Date(now).toLocaleTimeString()}`;
      if (faculty?.readError) status.textContent += ` · Faculty read failed: ${faculty.readError}`;
      countNodes.jobs.textContent = runtime ? String(jobs.length) : '—';
      countNodes.exercised.textContent = runtime ? String(jobs.filter(job => finite(job.completedCount) && job.completedCount > 0).length) : '—';
      countNodes.pages.textContent = number(faculty?.observedPages); countNodes.memory.textContent = number(faculty?.memory?.entries);
      latestTensors = read(() => root.getAliveTensorEvidence?.());
      const currentIds = new Set(jobs.map(job => job.id));
      for (const [id, card] of cards) if (!id.startsWith('tensor:') && !currentIds.has(id)) { card.node.remove(); cards.delete(id); }
      for (const job of jobs) renderJob(job, runtime, now);
      renderTensorPanel(latestTensors, now);
      filterCards(); renderTimeline(timeline(runtime, faculty, now), now); renderFaculties(faculty, now);
      const host = read(() => root.getAliveRuntimeEvidence?.() || root.getAliveOverdriveEvidence?.());
      hostReadout.textContent = fields({ schedulerMetrics: runtime?.metrics, schedulerHealth: runtime?.health, host }, 200).map(item => `${item.path}: ${finite(item.value) ? number(item.value) : text(item.value, 700)}`).join('\n');
      return { runtime, faculty };
    }
    function schedule() {
      if (!opened || destroyed || doc.hidden || timer !== null) return;
      timer = root.setTimeout(() => { timer = null; sample(); schedule(); }, 1000);
    }
    function cancelTimer() { if (timer !== null) { root.clearTimeout(timer); timer = null; } }
    function open() {
      root.aliveWorkspace?.prepareExternalPanel?.('brain-evidence');
      if (destroyed || opened) return;
      returnFocus = doc.activeElement; opened = true; panel.hidden = false; toggle.setAttribute('aria-expanded', 'true');
      sample(); schedule(); search.focus?.();
    }
    function close() {
      if (!opened) return;
      opened = false; panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); cancelTimer();
      if (returnFocus?.isConnected) returnFocus.focus?.(); else toggle.focus?.();
    }
    function visibility() { cancelTimer(); if (opened && !doc.hidden) { sample(); schedule(); } }
    function keydown(event) { if (opened && event.key === 'Escape') { event.preventDefault(); close(); } }
    doc.addEventListener('visibilitychange', visibility); doc.addEventListener('keydown', keydown);
    const clear = doc.getElementById('alive-clear-button'); clear?.addEventListener('click', close);
    function destroy() {
      close(); destroyed = true; cancelTimer(); doc.removeEventListener('visibilitychange', visibility); doc.removeEventListener('keydown', keydown); clear?.removeEventListener('click', close);
      root.aliveWorkspace?.unregisterPanel?.('brain-evidence');
      panel.remove(); toggle.remove(); style.remove(); cards.clear(); taskCards.clear();
    }
    return Object.freeze({ open, close, sample, destroy, snapshot: () => ({ opened, sampleCount, capabilities: [...cards.keys()].filter(id => !id.startsWith('tensor:')).length, tensors: [...cards.keys()].filter(id => id.startsWith('tensor:')).length, tensorTotal: latestTensors?.rows?.length || 0, tensorPage: tensorPage + 1, retainedDisplaySamplesPerMetric: LIMITS.history, runtimeAvailable: Boolean(latestRuntime && !latestRuntime.readError), facultiesAvailable: Boolean(latestFaculty && !latestFaculty.readError) }) });
  }
  return { create, fields, trace, timeline, age, number, LIMITS };
});
