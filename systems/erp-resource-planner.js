/**
 * Gigachad Browser — Enterprise Resource Planning (ERP) & Capacity Governor
 * Plans and monitors VRAM, Latency SLAs, Storage Quotas, and Process Budgets.
 */

const ERP_RESOURCE_QUOTAS = {
  compute: {
    vramTargetCapMb: 7168,
    vramMaxRecommendedMb: 7168,
    maxConcurrentLocalModels: 1,
    defaultContextWindow: 8192,
    kvCacheQuantization: 'q4_0',
    sidecarMaxBodyBytes: 2_000_000
  },
  storage: {
    maxHistoryRecords: 400,
    maxBookmarks: 300,
    maxClosedTabs: 25,
    maxMemoryVaultNotes: 600,
    maxKanbanCards: 200,
    maxSniffedApisPerTab: 18,
    maxDirectDownloadBytes: 200 * 1024 * 1024
  },
  sla: {
    sidecarHealthTimeoutMs: 800,
    sidecarMicroEngineTimeoutMs: 4000,
    localLlmP50TargetMs: 1200,
    localLlmP95TargetMs: 4500,
    autopilotMaxSteps: 6
  }
};

function evaluateErpPlan(telemetry = {}, stores = {}) {
  telemetry = (telemetry && typeof telemetry === 'object') ? telemetry : {};
  stores = (stores && typeof stores === 'object') ? stores : {};
  const vramUsed = Number(telemetry.vramUsed ?? telemetry.vramUsedMb ?? 0);
  const vramTotal = Number(telemetry.vramTotal ?? telemetry.vramTotalMb ?? 12288);
  const vramUtilizationPct = vramTotal > 0 ? Math.round((vramUsed / vramTotal) * 100) : 0;
  const withinVramCap = vramUsed <= ERP_RESOURCE_QUOTAS.compute.vramTargetCapMb;

  const storageUsage = [
    {
      resource: 'Browsing History (history.json)',
      store: 'Browsing History (history.json)',
      layer: 'Backend',
      aspect: 'Backend',
      used: telemetry.historyCount ?? (stores.history || []).length,
      quota: ERP_RESOURCE_QUOTAS.storage.maxHistoryRecords,
      max: ERP_RESOURCE_QUOTAS.storage.maxHistoryRecords
    },
    {
      resource: 'Bookmarks (bookmarks.json)',
      store: 'Bookmarks (bookmarks.json)',
      layer: 'Full-Stack',
      aspect: 'Full-Stack',
      used: telemetry.bookmarkCount ?? (stores.bookmarks || []).length,
      quota: ERP_RESOURCE_QUOTAS.storage.maxBookmarks,
      max: ERP_RESOURCE_QUOTAS.storage.maxBookmarks
    },
    {
      resource: 'Closed Tabs LIFO Stack (closed_tabs.json)',
      store: 'Closed Tabs LIFO Stack (closed_tabs.json)',
      layer: 'Full-Stack',
      aspect: 'Full-Stack',
      used: telemetry.closedTabCount ?? (stores.closedTabs || []).length,
      quota: ERP_RESOURCE_QUOTAS.storage.maxClosedTabs,
      max: ERP_RESOURCE_QUOTAS.storage.maxClosedTabs
    },
    {
      resource: 'Memory Vault Vectors (memory_vault.json)',
      store: 'Memory Vault Vectors (memory_vault.json)',
      layer: 'Backend + Sidecar',
      aspect: 'Backend + Sidecar',
      used: telemetry.memoryVaultCount ?? (stores.memoryVault || []).length,
      quota: ERP_RESOURCE_QUOTAS.storage.maxMemoryVaultNotes,
      max: ERP_RESOURCE_QUOTAS.storage.maxMemoryVaultNotes
    },
    {
      resource: 'Kanban Sprint Cards (task_board.json)',
      store: 'Kanban Sprint Cards (task_board.json)',
      layer: 'Full-Stack',
      aspect: 'Full-Stack',
      used: telemetry.kanbanCount ?? (stores.kanbanBoard || []).length,
      quota: ERP_RESOURCE_QUOTAS.storage.maxKanbanCards,
      max: ERP_RESOURCE_QUOTAS.storage.maxKanbanCards
    }
  ].map((row) => ({
    ...row,
    utilizationPct: Math.round((row.used / row.quota) * 100),
    status: row.used <= row.quota ? 'OPTIMAL' : 'OVER_QUOTA'
  }));

  const p50 = Number(telemetry.aiP50Ms || 0);
  const p95 = Number(telemetry.aiP95Ms || 0);
  const p50Ok = p50 === 0 || p50 <= ERP_RESOURCE_QUOTAS.sla.localLlmP50TargetMs;
  const p95Ok = p95 === 0 || p95 <= ERP_RESOURCE_QUOTAS.sla.localLlmP95TargetMs;
  const slaStatus = (p50Ok && p95Ok) ? 'MEETING_SLA' : 'DEGRADED';

  return {
    ok: true,
    quotas: ERP_RESOURCE_QUOTAS,
    compute: {
      vramUsedMb: vramUsed,
      vramTotalMb: vramTotal,
      vramQuotaMb: ERP_RESOURCE_QUOTAS.compute.vramTargetCapMb,
      vramUtilizationPct,
      vramStatus: withinVramCap ? 'OPTIMAL' : 'NEAR_LIMIT'
    },
    vramBudget: {
      usedMb: vramUsed,
      totalMb: vramTotal,
      capMb: ERP_RESOURCE_QUOTAS.compute.vramTargetCapMb,
      utilizationPct: vramUtilizationPct,
      withinCap: withinVramCap
    },
    storage: storageUsage,
    storageUsage,
    sla: {
      aiP50Ms: p50,
      aiP95Ms: p95,
      p50Status: (p50 === 0 || p50 <= ERP_RESOURCE_QUOTAS.sla.localLlmP50TargetMs) ? 'PASS' : 'WARN',
      p95Status: (p95 === 0 || p95 <= ERP_RESOURCE_QUOTAS.sla.localLlmP95TargetMs) ? 'PASS' : 'WARN',
      slaStatus
    },
    slaMetrics: {
      aiP50Ms: p50,
      aiP95Ms: p95,
      targetP50Ms: ERP_RESOURCE_QUOTAS.sla.localLlmP50TargetMs,
      targetP95Ms: ERP_RESOURCE_QUOTAS.sla.localLlmP95TargetMs,
      slaStatus
    }
  };
}

module.exports = {
  ERP_RESOURCE_QUOTAS,
  evaluateErpPlan
};
