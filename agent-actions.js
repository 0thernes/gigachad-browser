(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GigachadActions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ACTIONS = new Set([
    'click', 'type', 'scroll', 'navigate', 'download_media',
    'patch_site', 'insert_only', 'done', 'reload',
    'press_key', 'wait', 'hover', 'back', 'forward', 'extract_table',
    'open_tab', 'switch_tab', 'save_memory', 'export_pdf', 'screenshot', 'download_links',
    'close_tab', 'select_option', 'check', 'double_click', 'right_click',
    'scroll_to', 'extract_structured', 'unlock_page', 'swarm_research',
    'drag', 'watch_page', 'make_artifact', 'run_playbook', 'fill_form', 'upload_file'
  ]);
  const ALLOWED_KEYS = new Set([
    'Enter', 'Escape', 'Tab', 'Backspace', 'Space',
    'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight',
    'PageDown', 'PageUp', 'Home', 'End'
  ]);

  function stripTrailingCommas(text) {
    return String(text || '').replace(/,\s*([}\]])/g, '$1');
  }

  function tryParse(text) {
    try {
      return JSON.parse(stripTrailingCommas(String(text || '').trim()));
    } catch (_) {
      return null;
    }
  }

  function normalizeUrl(raw) {
    const text = String(raw || '').trim();
    if (!text) return { error: 'navigate needs a url' };
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text) ? text : 'https://' + text;
    let parsed;
    try {
      parsed = new URL(withScheme);
    } catch (_) {
      return { error: 'navigate url is not valid' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: 'navigate only allows http and https' };
    }
    return { url: parsed.href };
  }

  function normalizeOne(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'action must be an object' };
    let action = String(raw.action || '').trim().toLowerCase();
    if (action === 'goto' || action === 'open' || action === 'go') action = 'navigate';
    if (action === 'enter' || action === 'input') action = 'type';
    if (action === 'wheel') action = 'scroll';
    if (action === 'refresh') action = 'reload';
    if (action === 'key' || action === 'keypress') action = 'press_key';
    if (action === 'sleep' || action === 'pause') action = 'wait';
    if (!ACTIONS.has(action)) return { error: 'unsupported action: ' + (raw.action || '(missing)') };
    const cmd = { action };
    if (raw.mark != null && String(raw.mark).trim() !== '') {
      const mark = Number(raw.mark);
      if (!Number.isInteger(mark) || mark < 1) return { error: 'mark must be a positive integer' };
      cmd.mark = mark;
    }
    if (raw.x != null && raw.x !== '') {
      const nx = Number(raw.x);
      if (Number.isFinite(nx)) cmd.x = nx;
    }
    if (raw.y != null && raw.y !== '') {
      const ny = Number(raw.y);
      if (Number.isFinite(ny)) cmd.y = ny;
    }
    if (action === 'type' || action === 'insert_only') cmd.text = String(raw.text == null ? '' : raw.text);
    if (action === 'type' && raw.pressEnter === false) cmd.pressEnter = false;
    if (action === 'scroll') cmd.direction = String(raw.direction || 'down').toLowerCase() === 'up' ? 'up' : 'down';
    if (action === 'navigate' || action === 'open_tab') {
      const url = normalizeUrl(raw.url);
      if (url.error) return url;
      cmd.url = url.url;
    }
    if (action === 'switch_tab') {
      if (raw.index != null && raw.index !== '') cmd.index = Math.max(1, Number(raw.index) || 1);
      if (raw.query) cmd.query = String(raw.query).slice(0, 120);
    }
    if (action === 'save_memory') {
      cmd.title = String(raw.title || 'Agent Note').slice(0, 180);
      cmd.content = String(raw.content || raw.summary || raw.text || '').slice(0, 4000);
    }
    if (action === 'download_links') {
      cmd.filter = String(raw.filter || 'all').toLowerCase().slice(0, 40);
    }
    if (action === 'close_tab') {
      if (raw.index != null && raw.index !== '') cmd.index = Math.max(1, Number(raw.index) || 1);
    }
    if (action === 'select_option') {
      cmd.value = String(raw.value ?? raw.text ?? '').slice(0, 200);
    }
    if (action === 'check') {
      cmd.checked = raw.checked !== false;
    }
    if (action === 'scroll_to') {
      cmd.target = String(raw.target || 'bottom').toLowerCase().slice(0, 40);
    }
    if (action === 'swarm_research') {
      cmd.query = String(raw.query || raw.topic || raw.text || '').slice(0, 240);
    }
    if (action === 'drag') {
      if (raw.toMark != null && String(raw.toMark).trim() !== '') {
        const tm = Number(raw.toMark);
        if (Number.isInteger(tm) && tm >= 1) cmd.toMark = tm;
      }
      if (raw.toX != null && raw.toX !== '') {
        const ntx = Number(raw.toX);
        if (Number.isFinite(ntx)) cmd.toX = ntx;
      }
      if (raw.toY != null && raw.toY !== '') {
        const nty = Number(raw.toY);
        if (Number.isFinite(nty)) cmd.toY = nty;
      }
    }
    if (action === 'watch_page') {
      if (raw.url != null && String(raw.url).trim() !== '') {
        const u = normalizeUrl(raw.url);
        if (u.error) return u;
        cmd.url = u.url;
      }
      const sec = Number(raw.intervalSec ?? raw.interval ?? 60);
      cmd.intervalSec = Number.isFinite(sec) ? Math.max(15, Math.min(3600, Math.round(sec))) : 60;
      cmd.goal = String(raw.goal || raw.query || 'Monitor page changes').slice(0, 200);
    }
    if (action === 'make_artifact') {
      cmd.title = String(raw.title || 'Generated Mini-App').slice(0, 140);
      cmd.html = String(raw.html || raw.code || raw.content || '').slice(0, 120000);
    }
    if (action === 'run_playbook') {
      cmd.id = String(raw.id || raw.name || 'morning_radar').slice(0, 80);
    }
    if (action === 'fill_form') {
      cmd.fields = (raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields)) ? raw.fields : {};
    }
    if (action === 'upload_file') {
      cmd.filePath = String(raw.filePath || raw.path || '').slice(0, 500);
      cmd.selector = String(raw.selector || 'input[type="file"]').slice(0, 160);
    }
    if (action === 'press_key') {
      const k = String(raw.key || 'Enter').trim();
      const matched = Array.from(ALLOWED_KEYS).find((ak) => ak.toLowerCase() === k.toLowerCase());
      if (!matched) return { error: 'unsupported key: ' + k };
      cmd.key = matched;
    }
    if (action === 'wait') {
      const ms = Number(raw.ms ?? raw.duration ?? 800);
      cmd.ms = Number.isFinite(ms) ? Math.max(100, Math.min(5000, Math.round(ms))) : 800;
    }
    if (action === 'download_media') cmd.format = String(raw.format || '').toLowerCase() === 'mp3' ? 'mp3' : 'mp4';
    if (action === 'patch_site') {
      cmd.css = String(raw.css || '');
      cmd.js = String(raw.js || '');
    }
    if (action === 'done') cmd.summary = String(raw.summary || '').slice(0, 500);
    if (raw.reason) cmd.reason = String(raw.reason).slice(0, 240);
    return { cmd };
  }

  function explainAction(cmd) {
    if (!cmd || !cmd.action) return 'Unknown action';
    const why = cmd.reason ? ` (${cmd.reason})` : '';
    if (cmd.action === 'navigate') return `Navigate to ${cmd.url}${why}`;
    if (cmd.action === 'click') return `Click ${cmd.mark ? 'Mark #' + cmd.mark : `(${cmd.x},${cmd.y})`}${why}`;
    if (cmd.action === 'hover') return `Hover ${cmd.mark ? 'Mark #' + cmd.mark : `(${cmd.x},${cmd.y})`}${why}`;
    if (cmd.action === 'type') return `Type "${String(cmd.text || '').slice(0, 32)}" into ${cmd.mark ? 'Mark #' + cmd.mark : 'input'}${why}`;
    if (cmd.action === 'press_key') return `Press ${cmd.key}${why}`;
    if (cmd.action === 'scroll') return `Scroll ${cmd.direction || 'down'}${why}`;
    if (cmd.action === 'wait') return `Wait ${cmd.ms || 800}ms${why}`;
    if (cmd.action === 'back') return `Navigate Back${why}`;
    if (cmd.action === 'forward') return `Navigate Forward${why}`;
    if (cmd.action === 'extract_table') return `Extract HTML table rows${why}`;
    if (cmd.action === 'open_tab') return `Open new tab: ${cmd.url}${why}`;
    if (cmd.action === 'switch_tab') return `Switch tab (${cmd.query || '#' + (cmd.index || 1)})${why}`;
    if (cmd.action === 'save_memory') return `Save to Memory Vault: "${cmd.title}"${why}`;
    if (cmd.action === 'export_pdf') return `Export current page as PDF${why}`;
    if (cmd.action === 'screenshot') return `Capture full-page PNG screenshot${why}`;
    if (cmd.action === 'download_links') return `Download matching page files (${cmd.filter || 'all'})${why}`;
    if (cmd.action === 'close_tab') return `Close tab ${cmd.index ? '#' + cmd.index : '(active)'}${why}`;
    if (cmd.action === 'select_option') return `Select "${cmd.value}" in ${cmd.mark ? 'Mark #' + cmd.mark : 'dropdown'}${why}`;
    if (cmd.action === 'check') return `${cmd.checked ? 'Check' : 'Uncheck'} ${cmd.mark ? 'Mark #' + cmd.mark : 'checkbox'}${why}`;
    if (cmd.action === 'double_click') return `Double-click ${cmd.mark ? 'Mark #' + cmd.mark : `(${cmd.x},${cmd.y})`}${why}`;
    if (cmd.action === 'right_click') return `Right-click ${cmd.mark ? 'Mark #' + cmd.mark : `(${cmd.x},${cmd.y})`}${why}`;
    if (cmd.action === 'scroll_to') return `Scroll to ${cmd.mark ? 'Mark #' + cmd.mark : cmd.target}${why}`;
    if (cmd.action === 'extract_structured') return `Extract structured links, prices & emails${why}`;
    if (cmd.action === 'unlock_page') return `Unlock page overlays & hidden JSON state${why}`;
    if (cmd.action === 'swarm_research') return `Run 3-tab Ghost Swarm on "${cmd.query}"${why}`;
    if (cmd.action === 'drag') return `Drag ${cmd.mark ? 'Mark #' + cmd.mark : `(${cmd.x},${cmd.y})`} to ${cmd.toMark ? 'Mark #' + cmd.toMark : `(${cmd.toX},${cmd.toY})`}${why}`;
    if (cmd.action === 'watch_page') return `Start background watcher (${cmd.intervalSec || 60}s): "${cmd.goal}"${why}`;
    if (cmd.action === 'make_artifact') return `Build interactive artifact: "${cmd.title}"${why}`;
    if (cmd.action === 'run_playbook') return `Execute autonomous playbook: "${cmd.id}"${why}`;
    if (cmd.action === 'fill_form') return `Autofill ${Object.keys(cmd.fields || {}).length} form field(s)${why}`;
    if (cmd.action === 'upload_file') return `Upload file to ${cmd.selector || 'input[type="file"]'}${why}`;
    if (cmd.action === 'done') return `Done: ${cmd.summary || 'completed'}`;
    return `${cmd.action}${why}`;
  }

  function collectObjects(value, out) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectObjects(item, out));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (value.action) out.push(value);
    if (Array.isArray(value.actions)) collectObjects(value.actions, out);
  }

  function extractBalanced(text, start) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    return '';
  }

  function extractActionObjects(text) {
    const found = [];
    const re = /"action"\s*:/g;
    let match;
    while ((match = re.exec(text))) {
      const start = text.lastIndexOf('{', match.index);
      if (start < 0) continue;
      const slice = extractBalanced(text, start);
      const parsed = slice ? tryParse(slice) : null;
      if (parsed) found.push(parsed);
      if (found.length >= 4) break;
    }
    return found;
  }

  function parseAgentReply(text) {
    const source = String(text || '');
    const fences = [];
    const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
    let match;
    while ((match = fenceRe.exec(source))) fences.push(match[1]);
    const chunks = fences.length ? fences.map((chunk) => tryParse(chunk)).filter(Boolean) : extractActionObjects(source);
    if (!chunks.length) {
      if (fences.length) return { actions: [], error: 'Could not parse the JSON action block', ignored: 0 };
      return { actions: [], error: null, ignored: 0 };
    }
    const objects = [];
    chunks.forEach((chunk) => collectObjects(chunk, objects));
    if (!objects.length) return { actions: [], error: 'JSON block had no action', ignored: 0 };
    const actions = [];
    for (const obj of objects) {
      const normalized = normalizeOne(obj);
      if (normalized.error) return { actions: [], error: normalized.error, ignored: 0 };
      actions.push(normalized.cmd);
    }
    return { actions: actions.slice(0, 1), error: null, ignored: Math.max(0, actions.length - 1) };
  }

  return { ACTIONS: Array.from(ACTIONS), parseAgentReply, normalizeUrl, explainAction };
});
