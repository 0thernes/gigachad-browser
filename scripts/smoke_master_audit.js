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
const genomeIpcJs = readFile('systems/alive-genome-ipc.cjs');
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
  [...(mainJs + '\n' + genomeIpcJs).matchAll(/ipcMain\.handle\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
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
const microEndpointsMatch = mainJs.match(/const\s+MICRO_ENDPOINTS\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/);
assert(microEndpointsMatch, 'Could not locate MICRO_ENDPOINTS in main.js');
const mainMicroEndpoints = new Set(
  [...microEndpointsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
);
const indexEndpoints = new Set(
  [...indexScript.matchAll(/endpoint\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
);
for (const ep of indexEndpoints) {
  assert(
    mainMicroEndpoints.has(ep),
    `Sidecar endpoint "${ep}" invoked via micro-engine-call in index.html is missing from main.js MICRO_ENDPOINTS`
  );
}

const mainSidecarPosts = new Set([
  ...[...mainJs.matchAll(/['"](\/(?:health|route|classify|embed|rerank|ner_pii|knowledge_graph|deception_radar|ast_analyze|intent|semantic_diff|extract_structured|summarize_extractive|page_outline|query_memory|seo_accessibility_audit|table_to_markdown|tts|reflex\/dom|agent_plan|decursive_dedup|metacognition_quantum|deep_dark_web_intel))['"]/g)].map((m) => m[1]),
  ...indexEndpoints
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
assert.strictEqual(sopSummary.metadataValidCount, 500, 'Expected 500 valid candidate definitions');
assert.strictEqual(sopSummary.verifiedCount, 0, 'Metadata must not certify product requirements');
assert.strictEqual(sopSummary.statusCounts.NOT_RUN, 500);
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
assert(indexScript.includes('synapseRowDedupCount') && indexScript.includes('sltcTauDedupSwapsCount') && indexScript.includes('ssmEigenRepulsionsCount') && indexScript.includes('onionBloomFilter64'), 'index.html must implement DSD Pillars 17..20 (synapseRowDedupCount, sltcTauDedupSwapsCount, ssmEigenRepulsionsCount, onionBloomFilter64)');
assert(indexHtml.includes('id="hybrid-tier-btn-5"'), 'index.html must include Tier 5 visualizer button #hybrid-tier-btn-5');
assert(indexScript.includes('htsrPowerLawAlpha') && indexScript.includes('yangMillsWilsonHolonomy') && indexScript.includes('gueRepulsionFactorR2'), 'index.html must compute HTSR heavy-tailed spectral alpha, Yang-Mills Wilson holonomy, and Montgomery-Odlyzko GUE level repulsion');
assert(indexScript.includes('poincareDiskCoords24') && indexScript.includes('wlColorHash32') && indexScript.includes('sinkhornTransport4x4') && indexScript.includes('lz78PhraseRing64'), 'index.html must implement DSD Pillars 21..24 (poincareDiskCoords24, wlColorHash32, sinkhornTransport4x4, lz78PhraseRing64)');
assert(indexScript.includes('perelmanWEntropy') && indexScript.includes('ryuTakayanagiBulkEntropy') && indexScript.includes('hodgeHarmonicFlowPct') && indexScript.includes('astrocyteMeanCaUm'), 'index.html must compute Perelman Ricci W-entropy, Ryu-Takayanagi bulk entanglement entropy, Hodge-de Rham harmonic flow, and astrocyte Ca2+ waves');
assert(newtabHtml.includes('id="newtab-neural-strip-canvas"'), 'pages/newtab.html must include #newtab-neural-strip-canvas');
const legacyMisnomerRe = new RegExp('Structured' + '\\s+' + 'Liquid', 'i');
assert(!legacyMisnomerRe.test(indexHtml) && !legacyMisnomerRe.test(newtabHtml), 'Must use Spiking Liquid Time-Constant (sLTC), never legacy misnomer');
assert(indexScript.includes('trainableAlifeNeuralHub') && indexScript.includes('stepTrainableAlifeNeuralHub60Hz'), 'index.html must initialize trainableAlifeNeuralHub and stepTrainableAlifeNeuralHub60Hz');
assert(indexScript.includes('f64InterIntraCoupling16x16') && indexScript.includes('b158TernaryMorphism256') && indexScript.includes('fp16PersistentWeights256'), 'index.html must include Multi-Precision Float64 16x16 Inter/Intra coupling, BitNet b1.58 ternary morphisms, and FP16 storage');
assert(indexScript.includes('visionDomGrid8x8') && indexScript.includes('samSpatialAffordance16') && indexScript.includes('W_icm_inv') && indexScript.includes('icmCuriosityReward') && indexScript.includes('learnedMotorThrust2D'), 'index.html must include Embodied Robot Vision-DOM SAM + Action-Physics ICM/LAM + Intrinsic Curiosity Actor-Critic');
const frontierEngineJs = readFile('alife_neural_cyber_engine.js');
assert(indexHtml.includes('<script src="alife_neural_cyber_engine.js"></script>'), 'index.html must load external alife_neural_cyber_engine.js');
assert(frontierEngineJs.includes('UNPRECEDENTED_25_CATALOG') && frontierEngineJs.includes('compileInMemoryWasmNeuralKernel') && frontierEngineJs.includes('alife-neural-weights-sync'), 'alife_neural_cyber_engine.js must define UNPRECEDENTED_25_CATALOG, in-memory Wasm JIT kernel, and disk binary weight sync');
const bleeding25Js = readFile('systems/alife-25-bleeding-edge-models.js');
assert(bleeding25Js.includes('AotTotGotCorecursiveDecursiveEngine') && bleeding25Js.includes('totLatentArena21x16') && bleeding25Js.includes('gotAdjMatrix16x16') && bleeding25Js.includes('W_aot_contractor'), 'systems/alife-25-bleeding-edge-models.js must implement AotTotGotCorecursiveDecursiveEngine (AoT, ToT, GoT)');
assert(indexScript.includes('aotTotGotEngine') && indexScript.includes("mode === 'aottotgot'"), 'index.html must wire aotTotGotEngine and aottotgot terminal view');

// 9. Verify 14-Brain Multiverse Pantheon, 7-Tier Mixed-Precision Arena, 25x10 Forensic Auditor & Proprietary License
const { PortedMultiverseBrainsFederation, Heterogeneous7TierPrecisionArena } = require('../systems/ported-multiverse-brains');
const { SiblingBrainFusionEngine, BleedEdge25AlifeEngine } = require('../systems/alife-25-bleeding-edge-models');
const { Forensic25Pass10IterationAuditor } = require('../systems/forensic-25-pass-10-iteration-auditor');
const enterpriseArchKebab = require('../systems/enterprise-architecture');
const enterpriseArchSnake = require('../systems/enterprise_architecture');
assert.strictEqual(enterpriseArchKebab.PortedMultiverseBrainsFederation, PortedMultiverseBrainsFederation, 'systems/enterprise-architecture.js must export PortedMultiverseBrainsFederation');
assert.strictEqual(enterpriseArchKebab.BleedEdge25AlifeEngine, BleedEdge25AlifeEngine, 'systems/enterprise-architecture.js must export BleedEdge25AlifeEngine');
assert.strictEqual(enterpriseArchKebab.Forensic25Pass10IterationAuditor, enterpriseArchSnake.Forensic25Pass10IterationAuditor, 'enterprise-architecture.js and enterprise_architecture.js must match');

const pantheonTest = new PortedMultiverseBrainsFederation();
assert.strictEqual(pantheonTest.brainsCatalog10.length, 14, `Expected 14 ported multiverse brains, got ${pantheonTest.brainsCatalog10.length}`);
assert.strictEqual(pantheonTest.latestSnapshot.activeBrainsCount, 0, 'Initialized brain objects are not evidence of completed execution');
assert.strictEqual(pantheonTest.latestSnapshot.stateOrigin, 'initialized');
assert.strictEqual(pantheonTest.latestSnapshot.totalPantheonBrainsCount, 14, 'Expected totalPantheonBrainsCount === 14');
assert.strictEqual(pantheonTest.brain9ThalerDabus.ablationResults.passedAllAblations, true, 'Expected Brain 9 Thaler DABUS 4 honest ablation gates to pass');
assert.strictEqual(Object.keys(pantheonTest.brain9ThalerDabus.nineMarkers).length, 9, 'Expected all 9 Thaler constitutive markers');
assert.ok(pantheonTest.brain2Glitchling.bestSiteFrac > 0, 'Expected Glitchling selectable bestSiteFrac > 0');
assert.strictEqual(pantheonTest.brain2Glitchling.realVizEventsCount, 189, 'Expected Glitchling 189 real flaw events restored');
assert.strictEqual(pantheonTest.brain13ConsciousnessConsortium.researcherCount, 10, 'Expected 10 Consciousness Researchers in Brain 13');
assert.ok(pantheonTest.brain14ThingmakerGrimoire.arcaneLeyLineConductance > 0, 'Expected Brain 14 Thingmaker/Grimoire leyLineConductance > 0');
assert.strictEqual(pantheonTest.brain11TsotchkeDale.loadedBinaryChaosEmb, true, 'Expected binary chaos_emb.f32 (6,144 B) loaded in Brain 11 Tsotchke');
for (const rootDoc of ['ARCHITECTURE.md', 'BIBLE.md', 'GLOSSARY.md', 'INDEX.md', 'KANBAN.md', 'ISSUES.md', 'CHANGELOG.md', 'CITATION.cff', 'AUTHORS.md', 'CODEOWNERS', 'VERSION']) {
  assert(fs.existsSync(path.join(root, rootDoc)), `Expected root GitHub governance file ${rootDoc} to exist`);
}
assert.strictEqual(pantheonTest.precisionArena instanceof Heterogeneous7TierPrecisionArena, true, 'Expected 7-Tier Heterogeneous Precision Arena');
assert.strictEqual(pantheonTest.precisionArena.getPrecisionAuditSummary().tierCount, 7, 'Expected 7 hardware precision tiers');

const forensicReport = new Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit({ pantheon: pantheonTest });
assert.strictEqual(forensicReport.ok, true, 'Expected bounded diagnostic fixture to pass');
assert.strictEqual(forensicReport.releaseVerified, false);
assert.strictEqual(forensicReport.releaseStatus, 'NOT_RUN');
assert.strictEqual(forensicReport.uniqueDiagnosticChecks, 50);
assert.strictEqual(forensicReport.diagnosticExecutionCount, 500);
assert.strictEqual(forensicReport.iterationsCompleted, 10, 'Expected 10 iterations completed');
assert.strictEqual(forensicReport.totalPassExecutions, 250, 'Expected 250 pass executions (25 passes x 10 iterations)');
assert.strictEqual(forensicReport.passedPassIterations, 250, 'Expected 250 passed pass iterations');
assert.strictEqual(forensicReport.totalAtomicAuditPointsPassed, 500, 'Expected 500/500 atomic audit points passed');

// Verify Forensic25Pass10IterationAuditor against a real HumunculusTokenlessRuntime-shaped object
const liveShapedRuntime = {
  W_actor: Float32Array.from({ length: 256 }, (_, i) => Math.cos(i + 1) * 0.25),
  W_critic: Float32Array.from({ length: 256 }, (_, i) => Math.sin(i + 1) * 0.25),
  continuousWorldModel: {
    latentZ64: Float32Array.from({ length: 64 }, (_, i) => Math.sin((i + 1) * 0.37) * 0.45),
    rssmDeterH256: new Float32Array(256)
  },
  trainableAlifeNeuralHub: {
    zPerc16: Float32Array.from({ length: 16 }, (_, i) => Math.cos((i + 1) * 0.51) * 0.4),
    adaptivePlasticityLr: 0.0085,
    tdAdvantageDelta: 0.12,
    worldDynamicsLossMse: 0.032,
    icmCuriosityReward: 0.68,
    spatialExplorationCoveragePct: 84.5,
    learnedMotorThrust2D: new Float32Array([0.15, -0.12]),
    bestReasoningAction8: new Float32Array(8)
  },
  deepCortex: {
    totalParams: 1245184,
    W_actor_out: Float32Array.from({ length: 256 }, (_, i) => Math.cos(i + 1) * 0.25),
    W_critic_out: Float32Array.from({ length: 64 }, (_, i) => Math.sin(i + 1) * 0.25),
    W_moe_experts: Float32Array.from({ length: 65536 }, (_, i) => Math.sin(i * 0.1) * 0.15),
    W_connectome_synapses: Float32Array.from({ length: 262144 }, (_, i) => Math.cos(i * 0.05) * 0.2),
    W_stdp_elig: new Float32Array(262144).fill(0.1)
  },
  connectome512: {
    neuropilRates6: new Float32Array([0.62, 0.14, 0.58, 0.66, 0.54, 0.49]),
    totalSynapses: 262144,
    stdpUpdatesCount: 0
  },
  decursiveSelfDeduplicator: {
    banishedBasis8x64: Float32Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.2) * 0.1)
  },
  bleedingEdge25Engine: new BleedEdge25AlifeEngine(),
  portedMultiverseBrains: new PortedMultiverseBrainsFederation()
};
const liveRuntimeForensicReport = new Forensic25Pass10IterationAuditor().runFull25PassBy10IterationAudit(liveShapedRuntime);
assert.strictEqual(liveRuntimeForensicReport.ok, true, 'Expected runFull25PassBy10IterationAudit on HumunculusTokenlessRuntime-shaped object to pass 500/500');
assert.strictEqual(liveRuntimeForensicReport.passedPassIterations, 250, 'Expected 250/250 passed passes on live-shaped runtime');
assert.ok(liveShapedRuntime.connectome512.stdpUpdatesCount > 0, 'Expected 262,144-synapse DA-STDP updates on live-shaped runtime');

// Verify exportLearnedState / importLearnedState round-trip persistence across ALL 14 Ported Brains
const exportedState = pantheonTest.exportLearnedState();
assert.strictEqual(exportedState.version, 'PORTED_14_BRAINS_V1');
assert.ok(exportedState.totalOnlinePlasticUpdates > 0, 'Expected totalOnlinePlasticUpdates > 0 after 10-iteration audit');
const restoredPantheon = new PortedMultiverseBrainsFederation();
assert.strictEqual(restoredPantheon.importLearnedState(exportedState), true, 'Expected importLearnedState to succeed');
assert.strictEqual(restoredPantheon.totalOnlinePlasticUpdates, exportedState.totalOnlinePlasticUpdates, 'Expected round-trip totalOnlinePlasticUpdates parity');
assert.ok(Math.abs(restoredPantheon.brain1Asmodensius.rlsW16x2[0] - pantheonTest.brain1Asmodensius.rlsW16x2[0]) < 1e-6, 'Expected Brain 1 Asmodensius RLS weight parity');
assert.ok(Math.abs(restoredPantheon.brain2Glitchling.cerebellarCalib2x2[0] - pantheonTest.brain2Glitchling.cerebellarCalib2x2[0]) < 1e-6, 'Expected Brain 2 Glitchling cerebellar parity');
assert.ok(Math.abs(restoredPantheon.brain3CqmSuperMind.organNetWeights30x8[0] - pantheonTest.brain3CqmSuperMind.organNetWeights30x8[0]) < 1e-6, 'Expected Brain 3 CQM SuperMind weight parity');
assert.ok(Math.abs(restoredPantheon.brain4ApexHydra.organReadoutWeights11x4[0] - pantheonTest.brain4ApexHydra.organReadoutWeights11x4[0]) < 1e-6, 'Expected Brain 4 Apex Hydra weight parity');
assert.ok(Math.abs(restoredPantheon.brain5Xenomimic.W2_8x5[0] - pantheonTest.brain5Xenomimic.W2_8x5[0]) < 1e-6, 'Expected Brain 5 Xenomimic MLP weight parity');
assert.ok(Math.abs(restoredPantheon.brain6XylosManifold.edgeWeight192[0] - pantheonTest.brain6XylosManifold.edgeWeight192[0]) < 1e-6, 'Expected Brain 6 Xylos Manifold edge weight parity');
assert.ok(Math.abs(restoredPantheon.brain7Mechalogodrom.subBrainWeights10x8[0] - pantheonTest.brain7Mechalogodrom.subBrainWeights10x8[0]) < 1e-6, 'Expected Brain 7 Mechalogodrom weight parity');
assert.strictEqual(restoredPantheon.precisionArena.u16Fp16FastWeights[3], pantheonTest.precisionArena.u16Fp16FastWeights[3], 'Expected Brain 8 Glyph Pantheon FP16 fast-weight parity');
assert.ok(Math.abs(restoredPantheon.brain9ThalerDabus.W_autoassoc8x8[0] - pantheonTest.brain9ThalerDabus.W_autoassoc8x8[0]) < 1e-6, 'Expected Brain 9 Thaler DABUS weight parity');
assert.ok(Math.abs(restoredPantheon.brain10GraphCrystal.W_tree6x6[0] - pantheonTest.brain10GraphCrystal.W_tree6x6[0]) < 1e-6, 'Expected Brain 10 GraphCrystal weight parity');
assert.ok(Math.abs(restoredPantheon.brain11TsotchkeDale.daleRawWeights16x16[0] - pantheonTest.brain11TsotchkeDale.daleRawWeights16x16[0]) < 1e-6, 'Expected Brain 11 Tsotchke Dale weight parity');
assert.ok(Math.abs(restoredPantheon.brain12BlackHolePage.evaporationFraction - pantheonTest.brain12BlackHolePage.evaporationFraction) < 1e-6, 'Expected Brain 12 BlackHole evaporation parity');
assert.ok(Math.abs(restoredPantheon.brain13ConsciousnessConsortium.W_consortium10x8[0] - pantheonTest.brain13ConsciousnessConsortium.W_consortium10x8[0]) < 1e-6, 'Expected Brain 13 Consciousness Consortium weight parity');
assert.ok(Math.abs(restoredPantheon.brain14ThingmakerGrimoire.W_morphArcane8x8[0] - pantheonTest.brain14ThingmakerGrimoire.W_morphArcane8x8[0]) < 1e-6, 'Expected Brain 14 Thingmaker/Grimoire weight parity');

// Verify SiblingBrainFusionEngine.hydrateFromBridgePayload with real Wasm & chaos_emb.f32 base64 buffers
const sbfTest = new SiblingBrainFusionEngine();
const wasmBuf = fs.readFileSync(path.join(root, 'brains', 'cqm-xylos', 'cqm_kernels.wasm'));
const chaosBuf = fs.readFileSync(path.join(root, 'brains', 'tsotchke-diffusion', 'models', 'chaos_emb.f32'));
assert.strictEqual(
  sbfTest.hydrateFromBridgePayload({
    ok: true,
    wasmBase64: wasmBuf.toString('base64'),
    chaosEmbBase64: chaosBuf.subarray(0, 6144).toString('base64'),
    celegansStats: { totalEdges: 7379, uniqueNeurons: 302, chemicalEdges: 6393, gapJunctionEdges: 986 }
  }),
  true,
  'Expected SiblingBrainFusionEngine.hydrateFromBridgePayload to succeed'
);
assert.strictEqual(sbfTest.cqmWasmLoaded, true, 'Expected CQM Zig Wasm to be loaded after bridge hydration');
assert.strictEqual(sbfTest.cqmWasmExportsCount, 19, 'Expected 19 CQM Zig Wasm exports (18 kernel functions + 1 linear memory)');

// Verify corrupt/NaN base64 (0xFFFFFFFF = NaN floats) is rejected by hydrateChaosEmbFromBase64
assert.strictEqual(
  sbfTest.multiverse10Pantheon.brain11TsotchkeDale.hydrateChaosEmbFromBase64('////'.repeat(2048)),
  false,
  'hydrateChaosEmbFromBase64 must reject all-NaN base64 buffers'
);

// Verify all 17 standalone brain portal HTML files in brains/ have zero missing script/img/link assets
const standalonePortals17 = [
  'dimension-omega-singularity/index.html',
  'dimension-omega-singularity/studio.html',
  'asmodensius-v40/creatures/001/index.html',
  'asmodensius-v40/creatures/001/index.v3.html',
  'quantum_neural_manifold_3d.html',
  'cqm-xylos/index.html',
  'cqm-xylos/bible.html',
  'cqm-xylos/specs.html',
  'cqm-xylos/docs.html',
  'cqm-xylos/lab/consciousness.html',
  'cqm-xylos/lab/sentience.html',
  'cqm-xylos/lab/quantum-wildbeyond.html',
  'glitchling/index.html',
  'glitchling/brain-viz/index.html',
  'tsotchke-diffusion/index.html',
  'thingmaker/index.html',
  'grimoire-arcane/index.html'
];
for (const relPortal of standalonePortals17) {
  const fullPortal = path.join(root, 'brains', relPortal);
  assert(fs.existsSync(fullPortal), `Standalone portal ${relPortal} must exist`);
  const portalDir = path.dirname(fullPortal);
  const portalHtml = fs.readFileSync(fullPortal, 'utf8');
  for (const m of portalHtml.matchAll(/<(?:script|img|link)\b[^>]*?\b(?:src|href)=["']([^"'#?]+)["']/gi)) {
    const u = m[1];
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('javascript:') || u.startsWith('//') || u.startsWith('${')) continue;
    assert(fs.existsSync(path.resolve(portalDir, u)), `Missing asset "${u}" referenced in brains/${relPortal}`);
  }
}

// Verify UI/HUD & Persistence Wiring in index.html
assert(indexHtml.includes('data-hview="forensic25x10"'), 'index.html must include [🔬✅ 25×10 FORENSIC] terminal tab button');
assert(indexHtml.includes('[🧬⚛️ 14-BRAIN × 7-PREC]'), 'index.html must display [🧬⚛️ 14-BRAIN × 7-PREC] terminal tab button');
assert(indexScript.includes('portedPantheonBonus') && indexScript.includes('portedPantheonLearned'), 'index.html must wire portedPantheonBonus into door scoring and portedPantheonLearned into genome persistence');

const licenseTxt = readFile('LICENSE');
assert(licenseTxt.includes('DOWNLOAD AND PERSONAL EXECUTION ONLY') && licenseTxt.includes('NO COMMERCIAL USE') && licenseTxt.includes('NO MODIFICATION'), 'LICENSE must enforce Download-and-Use-Only restrictions');

// 10. Adversarial NaN / Infinity Poisoning Immunity & Dynamic Ablation Verification
assert(indexHtml.includes('http-equiv="Content-Security-Policy"'), 'index.html must include a Content-Security-Policy meta tag');
assert(newtabHtml.includes('http-equiv="Content-Security-Policy"'), 'pages/newtab.html must include a Content-Security-Policy meta tag');
const poisonedPantheon = new PortedMultiverseBrainsFederation();
const poisonedZ16 = new Float32Array(16);
for (let i = 0; i < 16; i++) {
  poisonedZ16[i] = i % 3 === 0 ? NaN : (i % 3 === 1 ? Infinity : -Infinity);
}
poisonedPantheon.step60Hz({
  trainableAlifeNeuralHub: {
    zPerc16: poisonedZ16,
    tdAdvantageDelta: Infinity,
    adaptivePlasticityLr: NaN,
    learnedMotorThrust2D: new Float32Array([NaN, -Infinity])
  }
});
assert.ok(
  Number.isFinite(poisonedPantheon.councilConsensusMotor2D[0]) && Number.isFinite(poisonedPantheon.councilConsensusMotor2D[1]),
  'councilConsensusMotor2D must remain finite after NaN/Infinity sensory injection'
);
assert.ok(
  Number.isFinite(poisonedPantheon.latestSnapshot.asmodensius.rlsMse) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.glitchling.efferenceMismatchMse) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.apexHydra.lyapunovLambda1) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.xenomimic.wavepacketNorm) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.thalerDabus.cuspXi) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.tsotchkeDale.ddimScore) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.blackHolePage.sBH) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.consciousnessConsortium.tononiPhi) &&
  Number.isFinite(poisonedPantheon.latestSnapshot.thingmakerGrimoire.leyLineConductance),
  'All 14 brains telemetry metrics must remain strictly finite under NaN/Infinity perturbation'
);

// Verify FP16 NaN/Infinity bit patterns (exponent 0x7c00) in importLearnedState are sanitized
poisonedPantheon.importLearnedState({ glyphFp16FastSlots16: new Array(16).fill(0x7eff) });
assert.ok(
  Number.isFinite(poisonedPantheon.precisionArena.decodeFp16(poisonedPantheon.precisionArena.u16Fp16FastWeights[3])),
  'importLearnedState must sanitize FP16 NaN/Infinity bit patterns (exponent 0x7c00)'
);

// Verify BleedEdge25AlifeEngine, AotTotGotCorecursiveDecursiveEngine, and SiblingBrainFusionEngine remain finite under NaN/Infinity poisoning
const poisonedBe = new BleedEdge25AlifeEngine();
const poisonedRuntime = {
  continuousWorldModel: {
    latentZ64: Float32Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? NaN : Infinity))
  },
  trainableAlifeNeuralHub: {
    zPerc16: Float32Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? -Infinity : NaN)),
    adaptivePlasticityLr: Infinity,
    tdAdvantageDelta: NaN,
    icmCuriosityReward: NaN,
    learnedMotorThrust2D: new Float32Array([NaN, -Infinity])
  },
  deepCortex: {
    totalParams: 1245184,
    W_critic: new Float32Array(256).fill(0.1),
    W_actor: new Float32Array(256).fill(0.1),
    W_moe_experts: new Float32Array(65536).fill(0.05)
  },
  connectome512: {
    synWeights262K: new Float32Array(262144).fill(0.05),
    eligibilityTraces: new Float32Array(262144).fill(0.1)
  },
  decursiveSelfDeduplicator: {
    banishedBasis8x64: Float32Array.from({ length: 512 }, () => NaN)
  }
};
poisonedBe.step60Hz(poisonedRuntime, NaN, Infinity);
poisonedBe.aotTotGot.step60Hz(poisonedRuntime, NaN, Infinity);
assert.ok(
  Number.isFinite(poisonedBe.jepaLossMse) &&
  Number.isFinite(poisonedBe.mambaMeanDelta) &&
  Number.isFinite(poisonedBe.cfmVectorFieldLoss) &&
  Number.isFinite(poisonedBe.multiPrecisionSummary.f64OdeMeanTau) &&
  Number.isFinite(poisonedBe.aotTotGot.gotApexValueQ) &&
  Array.from(poisonedRuntime.continuousWorldModel.latentZ64.subarray(0, 16)).every(Number.isFinite) &&
  Array.from(poisonedRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D).every(Number.isFinite),
  'BleedEdge25AlifeEngine, AotTotGotCorecursiveDecursiveEngine, and SiblingBrainFusionEngine must remain finite under NaN/Infinity poisoning'
);

// Verify Thaler DABUS runHonestAblations() dynamically reflects actual neural weights rather than static literals
const abBefore = poisonedPantheon.brain9ThalerDabus.runHonestAblations().intactQuality;
for (let i = 0; i < 64; i++) poisonedPantheon.brain9ThalerDabus.W_autoassoc8x8[i] *= 1.35;
for (let i = 0; i < 8; i++) poisonedPantheon.brain9ThalerDabus.W_hotButtonCritic8[i] *= 1.35;
const abAfter = poisonedPantheon.brain9ThalerDabus.runHonestAblations().intactQuality;
assert.notStrictEqual(abBefore, abAfter, 'Thaler DABUS runHonestAblations() must dynamically compute quality from live neural weights');

// Verify Complete Ported Corpora in brains/stephen-thaler-corpus and brains/consciousness-researchers
for (const subPath of [
  ['brains', 'stephen-thaler-corpus', 'papers', '1995-virtual-input-phenomena', 'README.md'],
  ['brains', 'stephen-thaler-corpus', 'rag', 'corpus.jsonl'],
  ['brains', 'stephen-thaler-corpus', 'scripts', 'verify.py'],
  ['brains', 'stephen-thaler-corpus', 'NOTICE.md'],
  ['brains', 'consciousness-researchers', 'scripts', 'verify.py'],
  ['brains', 'consciousness-researchers', 'NOTICE.md']
]) {
  assert(fs.existsSync(path.join(root, ...subPath)), `Expected ported corpus file ${subPath.join('/')} to exist`);
}

console.log(
  `master lab audit ok: ${invokeInIndex.size} IPC invoke channels, ${onInIndex.size} IPC event channels, ` +
  `${indexDomAudit.idCount} HTML IDs (${indexDomAudit.queriedCount} queried), ${indexDomAudit.fnCount} JS functions, ` +
  `${agentActionNames.length} agent actions, ${mainSidecarPosts.size} sidecar endpoints, 500 SOP candidate definitions (0 verified), ` +
  `${pantheonTest.brainsCatalog10.length}/${pantheonTest.brainsCatalog10.length} fixture brain entries, 7/7 precision array types, 50 unique diagnostic predicates / 500 executions; release NOT_RUN, 17/17 portal asset-reference scans`
);
