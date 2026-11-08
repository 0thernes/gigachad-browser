const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_INVOKE = new Set([
  'cdp-init-tab',
  'cdp-get-sniffed-apis',
  'cdp-execute',
  'devsecops-scan',
  'sre-metrics',
  'sre-network-throttle',
  'kanban-get',
  'kanban-save',
  'cicd-run-checks',
  'gpu-telemetry',
  'laya-classify-page',
  'micro-engine-call',
  'save-scraped-file',
  'scraper-export-file',
  'openrouter-sync-free',
  'media-get-streams',
  'media-download-ytdlp',
  'media-download-direct',
  'open-media-folder',
  'onetab-save-group',
  'onetab-get',
  'onetab-delete-group',
  'memory-save',
  'memory-list',
  'memory-delete',
  'vibe-patch-save',
  'vibe-patch-get',
  'vibe-patch-delete',
  'vibe-patch-list',
  'tts-synthesize',
  'ai-query',
  'config-get',
  'config-save',
  'llm-list-models',
  'sidecar-health',
  'ai-cancel',
  'history-add',
  'history-get',
  'history-clear',
  'bookmark-toggle',
  'bookmark-list',
  'bookmark-delete',
  'session-save',
  'session-load',
  'downloads-list',
  'permission-reply',
  'tab-record-closed',
  'tab-reopen-closed',
  'omnibox-suggest',
  'memory-search',
  'page-snapshot-pdf',
  'page-screenshot-save',
  'systems-audit',
  'sop-500-query',
  'pass-100-audit',
  'openrouter-verify-key',
  'openrouter-oauth-start',
  'openrouter-oauth-exchange',
  'browser-memory-stats',
  'browser-memory-purge',
  'wishlist-api-fetch',
  'hybrid-brain-portals',
  'deep-dark-web-probe',
  'alife-neural-weights-sync',
  'cortex-binary-weights-sync',
  'cyber-hat-inspect'
]);

const ALLOWED_ON = new Set(['adblock-tick', 'open-url', 'command', 'permission-request', 'download-update', 'context-action', 'openrouter-oauth-complete', 'ai-thinking-step']);

const gigachadBridgeApi = {
  invoke(channel, ...args) {
    if (!ALLOWED_INVOKE.has(channel)) {
      return Promise.reject(new Error('IPC channel is not exposed: ' + channel));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  on(channel, listener) {
    if (!ALLOWED_ON.has(channel) || typeof listener !== 'function') return () => {};
    const wrapped = (_event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
};

contextBridge.exposeInMainWorld('gigachad', gigachadBridgeApi);
contextBridge.exposeInMainWorld('gigachadBridge', gigachadBridgeApi);
