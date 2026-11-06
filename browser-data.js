function isHttpUrl(raw) {
  try {
    const parsed = new URL(String(raw || ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function addHistory(list, entry, limit = 400) {
  const current = Array.isArray(list) ? list : [];
  const url = String(entry && entry.url || '');
  if (!isHttpUrl(url)) return current;
  const row = {
    url,
    title: String((entry && entry.title) || url).slice(0, 180),
    at: (entry && entry.at) || new Date().toISOString()
  };
  return [row, ...current.filter((item) => item && item.url !== url)].slice(0, limit);
}

function toggleBookmark(list, entry) {
  const current = Array.isArray(list) ? list.filter(Boolean) : [];
  const url = String(entry && entry.url || '');
  if (!isHttpUrl(url)) return { list: current, added: false, error: 'Only http(s) pages can be bookmarked' };
  const title = String(entry.title || url).slice(0, 180);
  if (current.some((item) => item.url === url)) {
    return { list: current.filter((item) => item.url !== url), added: false };
  }
  return {
    list: [{ url, title, at: new Date().toISOString() }, ...current].slice(0, 300),
    added: true
  };
}

const VALID_WORKSPACES = new Set(['All', 'Work', 'Research', 'Dev', 'Personal']);

function sanitizeSession(tabs) {
  return (Array.isArray(tabs) ? tabs : [])
    .filter((tab) => tab && isHttpUrl(tab.url))
    .slice(0, 30)
    .map((tab) => {
      const base = {
        url: String(tab.url),
        title: String(tab.title || tab.url).slice(0, 180)
      };
      if (tab.pinned === true) base.pinned = true;
      if (tab.muted === true) base.muted = true;
      if (tab.workspace && VALID_WORKSPACES.has(tab.workspace) && tab.workspace !== 'All') {
        base.workspace = tab.workspace;
      }
      return base;
    });
}

function sortTabsByPinned(tabs) {
  const list = Array.isArray(tabs) ? [...tabs] : [];
  const pinned = list.filter((t) => t && t.pinned);
  const unpinned = list.filter((t) => t && !t.pinned);
  return [...pinned, ...unpinned];
}

function filterBookmarks(list, query) {
  const current = Array.isArray(list) ? list.filter(Boolean) : [];
  const q = String(query || '').trim().toLowerCase();
  if (!q) return current;
  return current.filter((item) =>
    String(item.title || '').toLowerCase().includes(q) ||
    String(item.url || '').toLowerCase().includes(q)
  );
}

function filterHistory(list, query) {
  const current = Array.isArray(list) ? list.filter(Boolean) : [];
  const q = String(query || '').trim().toLowerCase();
  if (!q) return current;
  return current.filter((item) =>
    String(item.title || '').toLowerCase().includes(q) ||
    String(item.url || '').toLowerCase().includes(q)
  );
}

function recordClosedTab(stack, entry, limit = 25) {
  const current = Array.isArray(stack) ? stack.filter(Boolean) : [];
  const url = String(entry && entry.url || '');
  if (!isHttpUrl(url)) return current;
  const row = {
    url,
    title: String((entry && entry.title) || url).slice(0, 180),
    closedAt: new Date().toISOString()
  };
  return [row, ...current.filter((item) => item.url !== url)].slice(0, limit);
}

function popClosedTab(stack) {
  const current = Array.isArray(stack) ? stack.filter(Boolean) : [];
  if (!current.length) return { tab: null, stack: [] };
  return { tab: current[0], stack: current.slice(1) };
}

function suggestOmnibox(query, sources = {}, limit = 8) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const candidates = [];
  const seen = new Set();

  const scoreItem = (title, url, baseWeight) => {
    const t = String(title || '').toLowerCase();
    const u = String(url || '').toLowerCase();
    if (!t.includes(q) && !u.includes(q)) return 0;
    let s = baseWeight;
    if (t.startsWith(q)) s += 40;
    else if (t.includes(q)) s += 25;
    if (u.includes(q)) s += 15;
    return s;
  };

  for (const tab of (sources.tabs || [])) {
    if (!tab || !tab.url) continue;
    const sc = scoreItem(tab.title, tab.url, 100);
    if (sc > 0 && !seen.has('tab:' + tab.id)) {
      seen.add('tab:' + tab.id);
      candidates.push({ kind: 'tab', tabId: tab.id, title: String(tab.title || tab.url).slice(0, 120), url: String(tab.url), score: sc });
    }
  }

  for (const bm of (sources.bookmarks || [])) {
    if (!bm || !isHttpUrl(bm.url) || seen.has(bm.url)) continue;
    const sc = scoreItem(bm.title, bm.url, 80);
    if (sc > 0) {
      seen.add(bm.url);
      candidates.push({ kind: 'bookmark', title: String(bm.title || bm.url).slice(0, 120), url: String(bm.url), score: sc });
    }
  }

  for (const v of (sources.vault || [])) {
    if (!v || !isHttpUrl(v.url) || seen.has(v.url)) continue;
    const sc = scoreItem(v.title, v.url, 70);
    if (sc > 0) {
      seen.add(v.url);
      candidates.push({ kind: 'vault', title: String(v.title || v.url).slice(0, 120), url: String(v.url), score: sc });
    }
  }

  for (const h of (sources.history || []).slice(0, 120)) {
    if (!h || !isHttpUrl(h.url) || seen.has(h.url)) continue;
    const sc = scoreItem(h.title, h.url, 50);
    if (sc > 0) {
      seen.add(h.url);
      candidates.push({ kind: 'history', title: String(h.title || h.url).slice(0, 120), url: String(h.url), score: sc });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = {
  isHttpUrl,
  addHistory,
  toggleBookmark,
  sanitizeSession,
  filterBookmarks,
  filterHistory,
  recordClosedTab,
  popClosedTab,
  suggestOmnibox,
  sortTabsByPinned
};
