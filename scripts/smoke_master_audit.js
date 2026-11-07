'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const { ERD_ENTITIES, ERD_RELATIONSHIPS, auditErdIntegrity } = require('../systems/erd-schema');
const { ERM_RISK_REGISTER, evaluateErmPosture } = require('../systems/erm-risk-engine');
const { ERP_RESOURCE_QUOTAS, evaluateErpPlan } = require('../systems/erp-resource-planner');
const { SOP_DOMAINS, SOP_500_ITEMS, summarizeSop500 } = require('../systems/sop-500-checklist');

const root = path.join(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

// 1. Verify JavaScript Syntax of Inline Scripts in index.html & pages/newtab.html
const indexHtml = readFile('index.html');
const newtabHtml = readFile('pages/newtab.html');
const preloadJs = readFile('preload.js');
const mainJs = readFile('main.js');
const sidecarPy = readFile('laya_sidecar.py');

function verifyInlineScripts(htmlContent, label) {
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  const allScripts = [];
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    count++;
    const code = match[1];
    allScripts.push(code);
    new vm.Script(code, { filename: `${label}#script-${count}` });
  }
  assert(count > 0, `Expected at least 1 inline <script> in ${label}`);
  return allScripts.join('\n');
}

const indexScript = verifyInlineScripts(indexHtml, 'index.html');
const newtabScript = verifyInlineScripts(newtabHtml, 'pages/newtab.html');

// 2. Verify 100% Bidirectional IPC Channel Parity (index.html <-> preload.js <-> main.js)
const invokeInIndex = new Set(
  [...indexScript.matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
);
const onInIndex = new Set(
  [...indexScript.matchAll(/ipcRenderer\.on\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
);

const preloadInvokeMatch = preloadJs.match(/const\s+ALLOWED_INVOKE\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/);
assert(preloadInvokeMatch, 'Could not locate ALLOWED_INVOKE in preload.js');
const preloadInvokeChannels = new Set(
  [...preloadInvokeMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
);

const preloadEventMatch = preloadJs.match(/const\s+ALLOWED_ON\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/);
assert(preloadEventMatch, 'Could not locate ALLOWED_ON in preload.js');
const preloadEventChannels = new Set(
  [...preloadEventMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
);

const mainHandledChannels = new Set(
  [...mainJs.matchAll(/ipcMain\.handle\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
);

for (const ch of invokeInIndex) {
  assert(preloadInvokeChannels.has(ch), `IPC channel invoked in index.html is missing from preload.js INVOKE_CHANNELS: "${ch}"`);
  assert(mainHandledChannels.has(ch), `IPC channel invoked in index.html is missing from main.js ipcMain.handle: "${ch}"`);
}
for (const ch of preloadInvokeChannels) {
  assert(mainHandledChannels.has(ch), `IPC channel in preload.js INVOKE_CHANNELS is missing from main.js ipcMain.handle: "${ch}"`);
}
for (const ch of onInIndex) {
  assert(preloadEventChannels.has(ch), `IPC event channel in index.html is missing from preload.js EVENT_CHANNELS: "${ch}"`);
}

// 3. Verify 100% Inline Event Handler & DOM Element ID Resolution in index.html & pages/newtab.html
function verifyDomIdsAndHandlers(htmlContent, scriptContent, label) {
  const allHtmlIds = new Set([
    ...[...htmlContent.matchAll(/\bid=["']([^"'$]+)["']/g)].map((m) => m[1]),
    ...[...scriptContent.matchAll(/\.id\s*=\s*['"]([^'"$]+)['"]/g)].map((m) => m[1])
  ]);
  const queriedIds = new Set(
    [...scriptContent.matchAll(/document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
  );
  const guestPageIds = new Set(['__NEXT_DATA__', '__NUXT__']);
  for (const id of queriedIds) {
    if (guestPageIds.has(id)) continue;
    assert(allHtmlIds.has(id), `${label}: document.getElementById("${id}") does not match any id="${id}" in ${label}`);
  }

  const definedFns = new Set([
    ...[...scriptContent.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g)].map((m) => m[1]),
    ...[...scriptContent.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/g)].map((m) => m[1])
  ]);
  const builtinAllowed = new Set(['if', 'event', 'window', 'document', 'this', 'console', 'localStorage', 'location']);

  const handlerMatches = [...htmlContent.matchAll(/\bon(?:click|change|input|keydown|submit)=["']([a-zA-Z0-9_$]+)\s*\(/g)];
  for (const m of handlerMatches) {
    const fnName = m[1];
    if (builtinAllowed.has(fnName)) continue;
    assert(definedFns.has(fnName), `${label}: inline handler calls "${fnName}(...)" which is not defined in ${label}`);
  }
  return { idCount: allHtmlIds.size, queriedCount: queriedIds.size, fnCount: definedFns.size };
}

const indexDomAudit = verifyDomIdsAndHandlers(indexHtml, indexScript, 'index.html');
const newtabDomAudit = verifyDomIdsAndHandlers(newtabHtml, newtabScript, 'pages/newtab.html');

// 4. Verify 100% Python Sidecar Endpoint Parity (index.html + main.js <-> laya_sidecar.py)
const mainSidecarPosts = new Set([
  ...[...mainJs.matchAll(/['"](\/(?:health|route|classify|embed|rerank|ner_pii|knowledge_graph|deception_radar|ast_analyze|intent|semantic_diff|extract_structured|summarize_extractive|page_outline|query_memory|seo_accessibility_audit|table_to_markdown|tts|reflex\/dom|agent_plan))['"]/g)].map((m) => m[1]),
  ...[...indexScript.matchAll(/endpoint\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
]);
for (const endpoint of mainSidecarPosts) {
  assert(
    sidecarPy.includes(`"${endpoint}"`) || sidecarPy.includes(`'${endpoint}'`),
    `Sidecar endpoint "${endpoint}" called in main.js is missing from laya_sidecar.py`
  );
}
for (const backendKey of ['embeddings', 'reranker', 'ner_pii', 'extractive_summarizer', 'page_outline', 'seo_accessibility_audit', 'table_to_markdown', 'tts']) {
  assert(
    sidecarPy.includes(`"${backendKey}":`),
    `laya_sidecar.py build_health()["backends"] is missing key "${backendKey}"`
  );
}

// 5. Verify 500-Point SOP, 12-Entity ERD (including object-wrapped session.json), 12-Risk ERM, and ERP
assert.strictEqual(SOP_DOMAINS.length, 10, 'Expected 10 SOP domains');
assert.strictEqual(SOP_500_ITEMS.length, 500, 'Expected 500 SOP items');
const sopSummary = summarizeSop500();
assert.strictEqual(sopSummary.totalItems, 500, 'Expected 500 total SOP items');
assert.strictEqual(sopSummary.verifiedCount, 500, 'Expected 500 verified SOP items');
assert.strictEqual(sopSummary.byAspect.Backend + sopSummary.byAspect.Frontend + sopSummary.byAspect['Full-Stack'], 500);

assert.strictEqual(Object.keys(ERD_ENTITIES).length, 12, 'Expected 12 ERD entities');
assert.strictEqual(ERD_RELATIONSHIPS.length, 9, 'Expected 9 ERD relationships');

// Verify ERD integrity works when session.json is stored as { tabs: [...], savedAt: '...' }
const erdObjectSessionReport = auditErdIntegrity({
  tabSessions: { tabs: [{ id: 'tab_1', url: 'https://example.com', title: 'Example' }], savedAt: new Date().toISOString() }
});
assert.strictEqual(erdObjectSessionReport.ok, true, 'Expected ERD integrity check to pass on { tabs: [...] } session.json');
assert.strictEqual(erdObjectSessionReport.violationCount, 0);

assert.strictEqual(ERM_RISK_REGISTER.length, 12, 'Expected 12 ERM risks');
const ermReport = evaluateErmPosture({ piiScrubEnabled: true, sidecarHealthy: true, failedAiCalls: 0 });
assert.strictEqual(ermReport.grade, 'A', 'Expected ERM posture Grade A');

assert(Object.keys(ERP_RESOURCE_QUOTAS).length >= 3, 'Expected >= 3 ERP resource quota groups');
const erpSnap = evaluateErpPlan({ vramUsedMb: 1450, vramTotalMb: 8192, aiP50Ms: 65, aiP95Ms: 180 });
assert.strictEqual(erpSnap.ok, true, 'Expected ERP plan ok === true');

// 6. Verify 100% Agent Action Execution Coverage (agent-actions.js <-> index.html + main.js)
const agentActionsJs = readFile('agent-actions.js');
const actionsMatch = agentActionsJs.match(/const\s+ACTIONS\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/);
assert(actionsMatch, 'Could not locate ACTIONS in agent-actions.js');
const agentActionNames = [...actionsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
const handledActions = new Set([
  ...[...indexScript.matchAll(/cmd\.action\s*===\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
  ...[...mainJs.matchAll(/cmd\.action\s*===\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
]);
for (const act of agentActionNames) {
  assert(handledActions.has(act), `Agent action "${act}" in agent-actions.js is not handled in index.html executeParsedAction or main.js cdp-execute`);
}
assert.strictEqual(agentActionNames.length, 36, `Expected 36 total agent actions, found ${agentActionNames.length}`);

// 6b. Verify OpenRouter Free Top Omni Multimodal Defaults Across Config, Main, and UI
const { DEFAULTS } = require('../config');
assert.strictEqual(DEFAULTS.openRouterModel, 'nvidia/nemotron-3.5-super-vl:free', 'Expected DEFAULTS.openRouterModel to be nvidia/nemotron-3.5-super-vl:free');
assert(mainJs.includes('FREE_OMNI_MODELS'), 'main.js must define FREE_OMNI_MODELS failover cascade');
assert(/<option value="ultra" selected>/i.test(indexHtml), 'index.html #brain-mode must default to OpenRouter Free Omni (ultra)');
assert(/id="send-screenshot"\s+checked/i.test(indexHtml), 'index.html #send-screenshot must be checked by default for Multimodal Vision');

// 6c. Verify All 100 Dream Browser Wishlist Features (1..100) Catalog & Operational Execution Branches
for (let wId = 1; wId <= 100; wId++) {
  assert(
    new RegExp(`\\{\\s*id:\\s*${wId}\\s*,`).test(indexScript),
    `WISHLIST_100_CATALOG is missing entry for id: ${wId}`
  );
  assert(
    new RegExp(`if\\s*\\(\\s*num\\s*===\\s*${wId}\\s*\\)`).test(indexScript),
    `runWishlistFeature(num) is missing execution branch for num === ${wId}`
  );
}

// 7. Verify Security & Sandboxing Invariants
assert(!indexHtml.includes("require('electron')"), 'index.html must not call require("electron") directly');
assert(mainJs.includes('contextIsolation: true'), 'main.js must enforce contextIsolation: true');
assert(mainJs.includes('nodeIntegration: false'), 'main.js must enforce nodeIntegration: false');

// 8. Verify DSD-16 + Continuous World Model + Multivector Metacognition + sLTC/SSM/Connectome + Deep/Dark Web + Quantum Biomimeticry + 6-Omni Hard-Wiring
assert(indexScript.includes('multivectorMetacognitionEngine'), 'index.html must initialize multivectorMetacognitionEngine');
assert(indexScript.includes('stepMultivectorMetacognition60Hz'), 'index.html must define and run stepMultivectorMetacognition60Hz at 60Hz');
assert(indexScript.includes('scoreDoorByDsdAndMetacognition'), 'index.html must define scoreDoorByDsdAndMetacognition for DOM door selection');
assert(indexScript.includes('sixOmniMatrix'), 'index.html must expose sixOmniMatrix (Omniscient, Omnipotent, Omnigradient, Omnilogical, Omnirational, Omniphilosophical)');
assert(indexScript.includes("'/metacognition_quantum'") && sidecarPy.includes('"/metacognition_quantum"'), 'laya_sidecar.py and index.html must register and invoke /metacognition_quantum');
assert(indexScript.includes('deepDarkWebSubstrateEngine') && indexScript.includes('neuralSubstrateTelemetry'), 'index.html must initialize deepDarkWebSubstrateEngine and neuralSubstrateTelemetry');
assert(indexScript.includes('stepNeuralConnectomeAndDeepDarkWeb60Hz'), 'index.html must run stepNeuralConnectomeAndDeepDarkWeb60Hz at 60Hz');
assert(indexScript.includes('resolveDeepDarkWebGatewayUrl') && indexScript.includes('triggerDeepDarkWebExpedition'), 'index.html must define resolveDeepDarkWebGatewayUrl and triggerDeepDarkWebExpedition');
assert(indexScript.includes("'/deep_dark_web_intel'") && sidecarPy.includes('"/deep_dark_web_intel"'), 'laya_sidecar.py and index.html must register and invoke /deep_dark_web_intel');
assert(preloadJs.includes("'deep-dark-web-probe'") && mainJs.includes("'deep-dark-web-probe'"), 'preload.js and main.js must expose and handle deep-dark-web-probe');

console.log(
  `master lab audit ok: ${invokeInIndex.size} IPC invoke channels, ${onInIndex.size} IPC event channels, ` +
  `${indexDomAudit.idCount} HTML IDs (${indexDomAudit.queriedCount} queried), ${indexDomAudit.fnCount} JS functions, ` +
  `${agentActionNames.length} agent actions, ${mainSidecarPosts.size} sidecar endpoints, 500/500 SOP items`
);
