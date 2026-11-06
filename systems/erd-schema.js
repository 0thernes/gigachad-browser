/**
 * Gigachad Browser — Enterprise Data Architecture & ERD Schema Validator
 * Covers Backend, Frontend, and Full-Stack persistence entities & relationships.
 */

const ERD_ENTITIES = [
  {
    entity: 'TabSession',
    layer: 'Full-Stack',
    storage: 'session.json + Renderer state',
    pk: 'id',
    fks: [],
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'url', type: 'url(http|https|file:newtab)', required: true },
      { name: 'title', type: 'string(<=180)', required: true },
      { name: 'pinned', type: 'boolean', required: false },
      { name: 'muted', type: 'boolean', required: false }
    ]
  },
  {
    entity: 'HistoryRecord',
    layer: 'Backend',
    storage: 'history.json',
    pk: 'url',
    fks: [{ field: 'url', references: 'TabSession.url', relation: 'N:1' }],
    fields: [
      { name: 'url', type: 'url(http|https)', required: true },
      { name: 'title', type: 'string(<=180)', required: true },
      { name: 'at', type: 'iso8601', required: true }
    ]
  },
  {
    entity: 'BookmarkItem',
    layer: 'Full-Stack',
    storage: 'bookmarks.json',
    pk: 'url',
    fks: [{ field: 'url', references: 'TabSession.url', relation: '1:1' }],
    fields: [
      { name: 'url', type: 'url(http|https)', required: true },
      { name: 'title', type: 'string(<=180)', required: true },
      { name: 'at', type: 'iso8601', required: true }
    ]
  },
  {
    entity: 'ClosedTabEntry',
    layer: 'Full-Stack',
    storage: 'closed_tabs.json',
    pk: 'url',
    fks: [{ field: 'url', references: 'TabSession.url', relation: '1:1' }],
    fields: [
      { name: 'url', type: 'url(http|https)', required: true },
      { name: 'title', type: 'string(<=180)', required: true },
      { name: 'closedAt', type: 'iso8601', required: true }
    ]
  },
  {
    entity: 'MemoryVaultVector',
    layer: 'Backend + Sidecar',
    storage: 'memory_vault.json',
    pk: 'id',
    fks: [{ field: 'url', references: 'TabSession.url', relation: 'N:1' }],
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'url', type: 'string(<=500)', required: true },
      { name: 'title', type: 'string(<=180)', required: true },
      { name: 'summary', type: 'string(<=4000)', required: true },
      { name: 'embedding', type: 'float32[768]', required: false },
      { name: 'embeddingImplementation', type: 'string', required: true },
      { name: 'timestamp', type: 'iso8601', required: true }
    ]
  },
  {
    entity: 'OneTabGroup',
    layer: 'Full-Stack',
    storage: 'onetab_vault.json',
    pk: 'id',
    fks: [{ field: 'tabs[].url', references: 'TabSession.url', relation: '1:N' }],
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'timestamp', type: 'string', required: true },
      { name: 'tabs', type: 'array<{title,url}>', required: true }
    ]
  },
  {
    entity: 'VibeSitePatch',
    layer: 'Frontend + CDP',
    storage: 'page_patches.json',
    pk: 'domain',
    fks: [{ field: 'domain', references: 'TabSession.hostname', relation: '1:N' }],
    fields: [
      { name: 'domain', type: 'hostname', required: true },
      { name: 'css', type: 'string(<=100000)', required: false },
      { name: 'js', type: 'string(<=100000)', required: false }
    ]
  },
  {
    entity: 'TemporalSnapshot',
    layer: 'Backend + Sidecar',
    storage: 'temporal_snapshots.json',
    pk: 'url',
    fks: [{ field: 'url', references: 'TabSession.url', relation: '1:1' }],
    fields: [
      { name: 'url', type: 'url', required: true },
      { name: 'text', type: 'string(<=20000)', required: true },
      { name: 'timestamp', type: 'iso8601', required: true }
    ]
  },
  {
    entity: 'KanbanSprintCard',
    layer: 'Full-Stack',
    storage: 'task_board.json',
    pk: 'id',
    fks: [],
    fields: [
      { name: 'id', type: 'string(<=40)', required: true },
      { name: 'title', type: 'string(<=240)', required: true },
      { name: 'col', type: 'enum(backlog|progress|done)', required: true },
      { name: 'tag', type: 'string(<=40)', required: true }
    ]
  },
  {
    entity: 'DownloadArtifact',
    layer: 'Backend',
    storage: 'GigachadMedia + runtime memory',
    pk: 'id',
    fks: [{ field: 'url', references: 'TabSession.url', relation: 'N:1' }],
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'filename', type: 'string', required: true },
      { name: 'url', type: 'url', required: true },
      { name: 'path', type: 'filepath', required: true },
      { name: 'state', type: 'enum(progressing|paused|completed|cancelled)', required: true }
    ]
  },
  {
    entity: 'SecurityAuditReport',
    layer: 'Backend + CDP',
    storage: 'securityHeadersMap (in-memory per webContents)',
    pk: 'wcId',
    fks: [{ field: 'wcId', references: 'TabSession.wcId', relation: '1:1' }],
    fields: [
      { name: 'wcId', type: 'number', required: true },
      { name: 'score', type: 'number(0..100)', required: true },
      { name: 'grade', type: 'enum(A|B|C|F)', required: true },
      { name: 'headerChecks', type: 'array', required: true },
      { name: 'cookieAudit', type: 'object', required: true }
    ]
  },
  {
    entity: 'ErpResourceSample',
    layer: 'Backend + GPU + Sidecar',
    storage: 'sreTelemetry (runtime)',
    pk: 'timestamp',
    fks: [],
    fields: [
      { name: 'uptimeSec', type: 'number', required: true },
      { name: 'vramUsedMb', type: 'number', required: false },
      { name: 'vramTotalMb', type: 'number', required: false },
      { name: 'aiP50Ms', type: 'number', required: true },
      { name: 'aiP95Ms', type: 'number', required: true }
    ]
  }
];

const ERD_RELATIONSHIPS = [
  { from: 'TabSession', to: 'HistoryRecord', cardinality: '1:N', key: 'url', description: 'Every http(s) tab navigation appends a deduplicated HistoryRecord.' },
  { from: 'TabSession', to: 'BookmarkItem', cardinality: '1:1', key: 'url', description: 'A tab URL may be starred into persistent BookmarkItems.' },
  { from: 'TabSession', to: 'ClosedTabEntry', cardinality: '1:N', key: 'url', description: 'Closing an http(s) tab pushes onto the LIFO ClosedTabEntry stack.' },
  { from: 'TabSession', to: 'MemoryVaultVector', cardinality: '1:N', key: 'url', description: 'Saving a note indexes page text + 768-d embedding in MemoryVaultVector.' },
  { from: 'OneTabGroup', to: 'TabSession', cardinality: '1:N', key: 'tabs[].url', description: 'Hibernating background tabs serializes them into a OneTabGroup.' },
  { from: 'TabSession', to: 'VibeSitePatch', cardinality: 'N:1', key: 'hostname->domain', description: 'Each domain maps to persistent CSS/JS patches injected on dom-ready.' },
  { from: 'TabSession', to: 'TemporalSnapshot', cardinality: '1:1', key: 'url', description: 'Stores baseline page text per URL for semantic drift comparison.' },
  { from: 'TabSession', to: 'SecurityAuditReport', cardinality: '1:1', key: 'wcId', description: 'CDP Network.responseReceived populates OWASP headers & cookie audits per tab.' },
  { from: 'TabSession', to: 'DownloadArtifact', cardinality: '1:N', key: 'url', description: 'Media rips, PDFs, screenshots, and file downloads link back to source URL.' }
];

function auditErdIntegrity(stores = {}) {
  const rawSession = stores.sessionTabs || stores.tabSessions || [];
  const sessionTabs = Array.isArray(rawSession) ? rawSession : (Array.isArray(rawSession?.tabs) ? rawSession.tabs : []);
  const history = stores.history || stores.historyRecords || [];
  const bookmarks = stores.bookmarks || stores.bookmarkItems || [];
  const closedTabs = stores.closedTabs || stores.closedTabStack || [];
  const memoryVault = stores.memoryVault || stores.memoryVaultNotes || [];
  const oneTabVault = stores.oneTabVault || stores.oneTabGroups || [];
  const vibePatches = stores.vibePatches || stores.vibeSitePatches || {};
  const temporalSnapshots = stores.temporalSnapshots || {};
  const kanbanBoard = stores.kanbanBoard || stores.kanbanCards || [];
  const downloads = stores.downloads || stores.downloadsList || [];

  const counts = {
    TabSession: Array.isArray(sessionTabs) ? sessionTabs.length : 0,
    HistoryRecord: Array.isArray(history) ? history.length : 0,
    BookmarkItem: Array.isArray(bookmarks) ? bookmarks.length : 0,
    ClosedTabEntry: Array.isArray(closedTabs) ? closedTabs.length : 0,
    MemoryVaultVector: Array.isArray(memoryVault) ? memoryVault.length : 0,
    OneTabGroup: Array.isArray(oneTabVault) ? oneTabVault.length : 0,
    VibeSitePatch: vibePatches && typeof vibePatches === 'object' ? Object.keys(vibePatches).length : 0,
    TemporalSnapshot: temporalSnapshots && typeof temporalSnapshots === 'object' ? Object.keys(temporalSnapshots).length : 0,
    KanbanSprintCard: Array.isArray(kanbanBoard) ? kanbanBoard.length : 0,
    DownloadArtifact: Array.isArray(downloads) ? downloads.length : 0
  };

  const violations = [];
  for (const h of history) {
    if (!h || !/^https?:\/\//i.test(String(h.url || ''))) violations.push('HistoryRecord contains non-http(s) URL');
  }
  for (const b of bookmarks) {
    if (!b || !/^https?:\/\//i.test(String(b.url || ''))) violations.push('BookmarkItem contains non-http(s) URL');
  }
  for (const k of kanbanBoard) {
    if (!k || !['backlog', 'progress', 'done'].includes(k.col)) violations.push(`KanbanSprintCard ${k?.id} has invalid col`);
  }

  return {
    ok: violations.length === 0,
    entityCount: ERD_ENTITIES.length,
    relationshipCount: ERD_RELATIONSHIPS.length,
    violationCount: violations.length,
    counts,
    recordCounts: counts,
    violations,
    entities: ERD_ENTITIES,
    relationships: ERD_RELATIONSHIPS
  };
}

module.exports = {
  ERD_ENTITIES,
  ERD_RELATIONSHIPS,
  auditErdIntegrity
};
