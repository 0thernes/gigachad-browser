/**
 * Bounded diagnostic fixture: 50 distinct predicates exercised in 10 iterations.
 * Source-token inspection and synthetic-state checks do not certify security,
 * donor fidelity, scientific claims, real-time performance, or release readiness.
 * Historical exported names and codes remain for existing callers.
 */
(function (globalScope) {
  'use strict';

  const FORENSIC_25_PASS_DEFINITIONS = [
    { pass: 1, code: 'PASS_01_OWASP_TOP_10_ASVS_L3', domain: 'DEVSECOPS', title: 'Source guard tokens and fixture brain/precision counts' },
    { pass: 2, code: 'PASS_02_ELECTRON_SANDBOX_IPC', domain: 'DEVSECOPS', title: 'Source isolation tokens, brain catalog and persistence methods' },
    { pass: 3, code: 'PASS_03_CSP_ZERO_TELEMETRY', domain: 'PRIVACY', title: 'Source CSP/permission tokens and bounded fixture motors' },
    { pass: 4, code: 'PASS_04_7TIER_HETEROGENEOUS_PRECISION', domain: 'TENSOR_ARENA', title: 'Typed-array allocation and one FP16 subnormal roundtrip' },
    { pass: 5, code: 'PASS_05_1245184_CORTEX_PLASTICITY', domain: 'DEEP_CORTEX', title: 'Declared fixture parameter count and actor/critic array types' },
    { pass: 6, code: 'PASS_06_SLTC_CONDUCTANCE_ODE', domain: 'SPIKING_sLTC', title: 'Finite positive fixture ODE time constant' },
    { pass: 7, code: 'PASS_07_512_CONNECTOME_262K_SYNAPSES', domain: 'CONNECTOME', title: 'Fixture synapse and eligibility dimensions' },
    { pass: 8, code: 'PASS_08_AOT_TOT_GOT_CORECURSIVE_DECURSIVE', domain: 'DSA_REASONING', title: 'AoT fixture node counts, finite value and update counter' },
    { pass: 9, code: 'PASS_09_DSD24_NULLSPACE_DEDUPLICATION', domain: 'DECURSIVE_DSA', title: 'Fixture deduplication basis type and dimensions' },
    { pass: 10, code: 'PASS_10_CLIFFORD_CL40_CURVATURE', domain: 'GEOMETRY', title: 'Cyclotomic fixture scalar and shell invariant count' },
    { pass: 11, code: 'PASS_11_BRAIN01_ASMODENSIUS_C001', domain: 'PORTED_BRAINS', title: 'Asmodensius surrogate dimensions and finite update metrics' },
    { pass: 12, code: 'PASS_12_BRAIN02_GLITCHLING_RESILIENCE', domain: 'PORTED_BRAINS', title: 'Glitchling surrogate finite metrics and update counter' },
    { pass: 13, code: 'PASS_13_BRAIN03_CQM_SUPERMIND', domain: 'PORTED_BRAINS', title: 'CQM surrogate winner index and finite scores' },
    { pass: 14, code: 'PASS_14_BRAIN04_APEX_HYDRA_11ORGANS', domain: 'PORTED_BRAINS', title: 'Hydra surrogate finite metrics and update counter' },
    { pass: 15, code: 'PASS_15_BRAIN05_XENOMIMIC_SCHRODINGER', domain: 'PORTED_BRAINS', title: 'Xenomimic surrogate norm and update counter' },
    { pass: 16, code: 'PASS_16_BRAIN06_XYLOS_MANIFOLD_48', domain: 'PORTED_BRAINS', title: 'Xylos surrogate group index and update counter' },
    { pass: 17, code: 'PASS_17_BRAIN07_MECHALOGODROM_10SHELL', domain: 'PORTED_BRAINS', title: 'Mechalogodrom surrogate shell label and update counter' },
    { pass: 18, code: 'PASS_18_BRAIN08_GLYPH_PANTHEON_25K', domain: 'PORTED_BRAINS', title: 'Glyph surrogate loss and update counter' },
    { pass: 19, code: 'PASS_19_BRAIN09_THALER_DABUS_CUSP', domain: 'PORTED_BRAINS', title: 'Thaler surrogate marker count and self-reported ablation flags' },
    { pass: 20, code: 'PASS_20_BRAIN10_11_12_CELEGANS_TSOTCHKE_BH', domain: 'PORTED_BRAINS', title: 'Surrogate brain metrics present and within fixture bounds' },
    { pass: 21, code: 'PASS_21_ZIG_WASM_18_NATIVE_KERNELS', domain: 'WASM_SIMD', title: 'CQM fixture topological metric values' },
    { pass: 22, code: 'PASS_22_25_BLEEDING_EDGE_MODELS_CYBER', domain: 'FRONTIER_25', title: 'Frontier fixture model count and positive metrics' },
    { pass: 23, code: 'PASS_23_DSA_COMPLEXITY_NAN_IMMUNITY', domain: 'DSA_STABILITY', title: 'Selected fixture latent arrays finite' },
    { pass: 24, code: 'PASS_24_FORTUNE100_DOCS_ERD_ERM_ERP_CICD', domain: 'ENTERPRISE', title: 'Documentation files present and fixture export dimensions' },
    { pass: 25, code: 'PASS_25_PROPRIETARY_LICENSE_ENFORCEMENT', domain: 'LEGAL_IP', title: 'Catalog metadata and license text markers present' },
  ];

  class Forensic25Pass10IterationAuditor {
    constructor() {
      this.passDefinitions = FORENSIC_25_PASS_DEFINITIONS;
      this._codebaseCache = null;
    }

    _getCodebaseVerificationCache(refresh = false) {
      if (!refresh && this._codebaseCache) return this._codebaseCache;
      let owaspOk = false;
      let sandboxIpcOk = false;
      let cspPrivacyOk = false;
      let enterpriseDocsOk = false;
      let licenseTextOk = false;
      let inspectionStatus = 'NOT_RUN';
      let inspectionError = 'Filesystem inspection unavailable.';
      const sources = [];
      if (typeof require === 'function') {
        try {
          const fs = require('fs');
          const path = require('path');
          const rootDir = path.join(__dirname, '..');
          const crypto = require('crypto');
          const readSource = (rel) => {
            const bytes = fs.readFileSync(path.join(rootDir, rel));
            sources.push({ path: rel, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
            return bytes.toString('utf8');
          };
          const mainSrc = readSource('main.js');
          const preloadSrc = readSource('preload.js');
          const indexSrc = readSource('index.html');
          const owaspDoc = readSource('docs/OWASP_DEVSECOPS_FORTUNE100.md');
          owaspOk =
            mainSrc.includes('isAllowedGuestUrl') &&
            mainSrc.includes('isSafeExternalUrl') &&
            mainSrc.includes('isInsideBrainsDir') &&
            owaspDoc.includes('A01:2021') &&
            owaspDoc.includes('A10:2021');
          sandboxIpcOk =
            mainSrc.includes('contextIsolation: true') &&
            mainSrc.includes('nodeIntegration: false') &&
            (mainSrc.includes('sandbox: true') || mainSrc.includes('sandbox = true')) &&
            mainSrc.includes('fromChrome(event)') &&
            preloadSrc.includes('contextBridge.exposeInMainWorld');
          const newtabSrc = readSource('pages/newtab.html');
          cspPrivacyOk =
            indexSrc.includes('http-equiv="Content-Security-Policy"') &&
            newtabSrc.includes('http-equiv="Content-Security-Policy"') &&
            mainSrc.includes('setPermissionRequestHandler') &&
            mainSrc.includes('setPermissionCheckHandler');
          const requiredFiles = [
            'ARCHITECTURE.md',
            'BIBLE.md',
            'GLOSSARY.md',
            'INDEX.md',
            'KANBAN.md',
            'ISSUES.md',
            'README.md',
            'LICENSE',
            '.github/workflows/ci.yml',
            'systems/erd-schema.js',
            'systems/erm-risk-engine.js',
            'systems/erp-resource-planner.js',
            'systems/sop-500-checklist.js'
          ];
          enterpriseDocsOk = requiredFiles.every((rel) => fs.existsSync(path.join(rootDir, rel)));
          const licenseText = readSource('LICENSE');
          licenseTextOk = /DOWNLOAD-AND-USE-ONLY/i.test(licenseText) && licenseText.includes('NO COMMERCIAL USE') && licenseText.includes('NO MODIFICATION');
          inspectionStatus = [owaspOk, sandboxIpcOk, cspPrivacyOk, enterpriseDocsOk, licenseTextOk].every(Boolean) ? 'PASS' : 'FAIL';
          inspectionError = inspectionStatus === 'FAIL' ? 'One or more source metadata checks failed.' : null;
        } catch (error) {
          owaspOk = sandboxIpcOk = cspPrivacyOk = enterpriseDocsOk = licenseTextOk = false;
          inspectionStatus = 'FAIL';
          inspectionError = error.code || error.message || String(error);
        }
      }
      this._codebaseCache = { owaspOk, sandboxIpcOk, cspPrivacyOk, enterpriseDocsOk, licenseTextOk, status: inspectionStatus, error: inspectionError, evidenceKind: 'SOURCE_INSPECTION', requirementStatus: 'NOT_RUN', sources };
      return this._codebaseCache;
    }

    /**
     * Evaluates two domain-specific atomic invariants [inv1, inv2] for pass index pIdx (0..24)
     */
    _evaluatePassInvariants(pIdx, passDef, pantheon, bleedingEdge, mockRuntime) {
      const baseMetaOk = Boolean(passDef && passDef.code && passDef.title && passDef.domain);
      if (!pantheon || !pantheon.latestSnapshot || !pantheon.precisionArena) return [false, false];
      const snap = pantheon.latestSnapshot;
      const arena = pantheon.precisionArena;
      const cb = this._getCodebaseVerificationCache();
      switch (pIdx) {
        case 0: // PASS 1: OWASP Top 10 & ASVS L3
          return [
            cb.owaspOk && snap.activeBrainsCount === 14 && snap.totalPantheonBrainsCount === 14,
            snap.precisionTiersCount === 7 && Number.isFinite(snap.consciousness10Score)
          ];
        case 1: // PASS 2: Electron Sandbox & IPC
          return [
            cb.sandboxIpcOk && Array.isArray(pantheon.brainsCatalog10) && pantheon.brainsCatalog10.length === 14,
            typeof pantheon.exportLearnedState === 'function' && typeof pantheon.importLearnedState === 'function'
          ];
        case 2: // PASS 3: CSP & Zero-Telemetry
          return [
            cb.cspPrivacyOk && Number.isFinite(pantheon.councilConsensusMotor2D[0]) && Math.abs(pantheon.councilConsensusMotor2D[0]) <= 1.0,
            Number.isFinite(pantheon.councilConsensusMotor2D[1]) && Math.abs(pantheon.councilConsensusMotor2D[1]) <= 1.0
          ];
        case 3: // PASS 4: 7-Tier Heterogeneous Precision Arena (including IEEE-754 subnormal FP16 round-trip)
          return [
            Boolean(arena.backingBuffer && arena.backingBuffer.byteLength === 131072 && arena.decodeFp16(arena.encodeFp16(0.00001)) > 0),
            arena.f64QuantumAndRls instanceof Float64Array &&
              arena.u64SwarHypervectors instanceof BigUint64Array &&
              arena.i32CsrAndUnionFind instanceof Int32Array &&
              arena.u16Fp16FastWeights instanceof Uint16Array &&
              arena.i8StochasticQ8Weights instanceof Int8Array &&
              arena.u8TernaryBitNet instanceof Uint8Array &&
              arena.stochasticRoundUpdatesCount > 0
          ];
        case 4: { // PASS 5: 1,245,184-Param Deep Cortex
          const dc = (mockRuntime && mockRuntime.deepCortex) || {};
          const wCrit = dc.W_critic || dc.W_critic_out || (mockRuntime && mockRuntime.W_critic);
          const wAct = dc.W_actor || dc.W_actor_out || (mockRuntime && mockRuntime.W_actor);
          return [
            dc.totalParams === 1245184,
            wCrit instanceof Float32Array && wAct instanceof Float32Array
          ];
        }
        case 5: // PASS 6: Spiking sLTC Conductance ODE
          return [
            bleedingEdge ? bleedingEdge.multiPrecisionSummary.f64OdeMeanTau > 0 : false,
            bleedingEdge ? Number.isFinite(bleedingEdge.multiPrecisionSummary.f64OdeMeanTau) : false
          ];
        case 6: { // PASS 7: 512-Node Bio-Connectome & 262,144 Synapses
          const cn = (mockRuntime && mockRuntime.connectome512) || {};
          const dc = (mockRuntime && mockRuntime.deepCortex) || {};
          const synW = cn.synWeights262K || cn.synapticWeights || dc.W_connectome_synapses;
          const elig = cn.eligibilityTraces || dc.W_stdp_elig;
          return [
            Boolean(synW && synW.length === 262144),
            Boolean((elig && elig.length === 262144) || cn.stdpUpdatesCount > 0 || cn.totalSynapses === 262144)
          ];
        }
        case 7: // PASS 8: AoT ⇄ ToT ⇄ GoT Corecursive/Decursive Engine
          return [
            bleedingEdge ? bleedingEdge.aotTotGot.totNodeCount === 21 && bleedingEdge.aotTotGot.gotVertexCount === 16 : false,
            bleedingEdge ? Number.isFinite(bleedingEdge.aotTotGot.gotApexValueQ) && bleedingEdge.aotTotGot.aotContractionsCount > 0 : false
          ];
        case 8: { // PASS 9: DSD-24 Nullspace Deduplication
          const dsd = (mockRuntime && mockRuntime.decursiveSelfDeduplicator) || {};
          return [
            dsd.banishedBasis8x64 instanceof Float32Array,
            Boolean(dsd.banishedBasis8x64 && dsd.banishedBasis8x64.length === 512)
          ];
        }
        case 9: // PASS 10: Clifford Cl(4,0) & Curvature
          return [
            bleedingEdge ? bleedingEdge.multiPrecisionSummary.cyclotomicNormExactI64 === '1' : false,
            Number.isFinite(snap.mechalogodrom.mobiusTorsion) && pantheon.brain7Mechalogodrom.invariants10.length === 10
          ];
        case 10: // PASS 11: Brain #1 Asmodensius-v40 Creature 001
          return [
            snap.asmodensius.neurons === 272 && Number.isFinite(snap.asmodensius.q3Entropy),
            Number.isFinite(snap.asmodensius.rlsMse) && snap.asmodensius.kalmanR >= 0 && pantheon.brain1Asmodensius.plasticUpdatesCount > 0
          ];
        case 11: // PASS 12: Brain #2 Glitchling Resilience & Cerebellar Un-Mirroring
          return [
            Number.isFinite(snap.glitchling.efferenceMismatchMse) && Number.isFinite(snap.glitchling.deltaNetNorm),
            snap.glitchling.stochasticInt8Updates > 0 && Number.isFinite(snap.glitchling.cerebellarGainDiag)
          ];
        case 12: // PASS 13: Brain #3 CQM SuperMind 5-Stage & Reverse-Mode AD
          return [
            snap.cqmSuperMind.winningVariantIdx >= 0 && snap.cqmSuperMind.winningVariantIdx < 25,
            Number.isFinite(snap.cqmSuperMind.winningScore) && snap.cqmSuperMind.adGradNorm >= 0
          ];
        case 13: // PASS 14: Brain #4 Apex Hydra 11 Organs
          return [
            Number.isFinite(snap.apexHydra.lyapunovLambda1),
            Number.isFinite(snap.apexHydra.godelResidual) && pantheon.brain4ApexHydra.plasticUpdatesCount > 0
          ];
        case 14: // PASS 15: Brain #5 Xenomimic Unitary Crank-Nicolson Schrödinger
          return [
            Number.isFinite(snap.xenomimic.wavepacketNorm) && Math.abs(snap.xenomimic.wavepacketNorm - 1.0) < 1e-6,
            Number.isFinite(snap.xenomimic.mimicPolarity) && pantheon.brain5Xenomimic.plasticUpdatesCount > 0
          ];
        case 15: // PASS 16: Brain #6 Xylos 48-Foci / 192-Edge Recurrent Manifold
          return [
            snap.xylosManifold.winningGwtGroup >= 0 && snap.xylosManifold.winningGwtGroup < 6,
            Number.isFinite(snap.xylosManifold.slope0) && pantheon.brain6XylosManifold.plasticUpdatesCount > 0
          ];
        case 16: // PASS 17: Brain #7 Mechalogodrom 10-Shell Differential Geometry
          return [
            typeof snap.mechalogodrom.dominantShell === 'string' && snap.mechalogodrom.dominantShell.length > 0,
            Number.isFinite(snap.mechalogodrom.mobiusTorsion) && pantheon.brain7Mechalogodrom.plasticUpdatesCount > 0
          ];
        case 17: // PASS 18: Brain #8 Glyph Pantheon 25K & FP16 Fast-Weight Overlay
          return [
            snap.glyphPantheon.fastWeightEnergy >= 0,
            Number.isFinite(snap.glyphPantheon.predictorLoss) && pantheon.brain8GlyphPantheon.plasticUpdatesCount > 0
          ];
        case 18: // PASS 19: Brain #9 Thaler DABUS + 9 Constitutive Markers + 4 Honest Ablation Gates
          return [
            Number.isFinite(snap.thalerDabus.cuspXi) && Object.keys(pantheon.brain9ThalerDabus.nineMarkers).length === 9,
            pantheon.brain9ThalerDabus.ablationResults.passedAllAblations === true && pantheon.brain9ThalerDabus.plasticUpdatesCount > 0
          ];
        case 19: // PASS 20: Brains #10..14 (C. elegans GOAP + Tsotchke Dale/STP/DDIM + Kerr-Newman BH/Lemire + Consciousness + Grimoire)
          return [
            snap.activeBrainsCount === 14 && snap.graphCrystal.louvainQ > 0 && snap.tsotchkeDale.daleEiRatio > 0 && snap.tsotchkeDale.stpResource >= 0.05,
            snap.blackHolePage.sBH > 0 && snap.blackHolePage.rPhotonSphere > 0 && snap.blackHolePage.qnmOmegaReal > 0 &&
              snap.blackHolePage.pageEntropy >= 0 && snap.blackHolePage.lemireGlyphIdx >= 0 && snap.blackHolePage.lemireGlyphIdx < 518 &&
              (snap.consciousnessConsortium && snap.consciousnessConsortium.tononiPhi > 0) &&
              (snap.thingmakerGrimoire && snap.thingmakerGrimoire.leyLineConductance > 0)
          ];
        case 20: // PASS 21: Zig 0.17.0 WebAssembly 18 Native Kernels
          return [
            bleedingEdge ? bleedingEdge.siblingBrainFusion.cqmMetrics.bdgSkyrmionMzmCount === 2 : false,
            bleedingEdge ? Math.abs(bleedingEdge.siblingBrainFusion.cqmMetrics.qwzChernNumber - 1.0) < 1e-4 : false
          ];
        case 21: // PASS 22: 25 Bleeding-Edge Neural Models
          return [
            bleedingEdge ? bleedingEdge.activeModelsCount === 25 && bleedingEdge.jepaLossMse > 0 : false,
            bleedingEdge ? bleedingEdge.mambaMeanDelta > 0 && bleedingEdge.cfmVectorFieldLoss > 0 : false
          ];
        case 22: { // PASS 23: DSA Complexity & NaN/Inf Immunity Across All Latent Tensors
          const wm = (mockRuntime && mockRuntime.continuousWorldModel) || {};
          const hub = (mockRuntime && mockRuntime.trainableAlifeNeuralHub) || {};
          return [
            Boolean(wm.latentZ64 && Array.from(wm.latentZ64.subarray(0, 16)).every(Number.isFinite)),
            Boolean(hub.zPerc16 && Array.from(hub.zPerc16).every(Number.isFinite))
          ];
        }
        case 23: // PASS 24: Enterprise Docs, ERD/ERM/ERP & Online Plasticity Accumulation
          return [
            cb.enterpriseDocsOk && pantheon.totalOnlinePlasticUpdates > 0 && pantheon.stepCount > 0,
            (() => {
              const exported = pantheon.exportLearnedState();
              return Boolean(
                exported &&
                  Array.isArray(exported.asmodensiusRlsW8x2) && exported.asmodensiusRlsW8x2.length === 16 &&
                  Array.isArray(exported.glitchlingCerebellar2x2) && exported.glitchlingCerebellar2x2.length === 4 &&
                  Array.isArray(exported.cqmSuperMindOrganW30x8) && exported.cqmSuperMindOrganW30x8.length === 240 &&
                  Array.isArray(exported.apexHydraReadoutW11x4) && exported.apexHydraReadoutW11x4.length === 44 &&
                  Array.isArray(exported.xenomimicW1_6x8) && exported.xenomimicW1_6x8.length === 48 &&
                  Array.isArray(exported.xylosEdgeWeight192) && exported.xylosEdgeWeight192.length === 192 &&
                  Array.isArray(exported.mechalogodromSubBrainW10x8) && exported.mechalogodromSubBrainW10x8.length === 80 &&
                  Array.isArray(exported.glyphFp16FastSlots16) && exported.glyphFp16FastSlots16.length === 16 &&
                  Array.isArray(exported.dabusAutoassoc8x8) && exported.dabusAutoassoc8x8.length === 64 &&
                  Array.isArray(exported.graphCrystalW6x6) && exported.graphCrystalW6x6.length === 36 &&
                  Array.isArray(exported.tsotchkeDaleRaw16x16) && exported.tsotchkeDaleRaw16x16.length === 256 &&
                  Number.isFinite(exported.blackHoleEvaporationFraction) &&
                  Array.isArray(exported.consortiumW10x8) && exported.consortiumW10x8.length === 80 &&
                  Array.isArray(exported.thingmakerMorph8x8) && exported.thingmakerMorph8x8.length === 64
              );
            })()
          ];
        case 24: // PASS 25: Proprietary Download-and-Use-Only License Enforcement
        default: {
          return [baseMetaOk && passDef.pass === 25, cb.licenseTextOk];
        }
      }
    }

    /**
     * Runs all 10 Iterations × 25 Forensic Passes (250 pass executions, 500 atomic checks)
     */
    runFull10Iteration25PassAudit(options = {}) {
      this._getCodebaseVerificationCache(true);
      const owns = (key) => Object.prototype.hasOwnProperty.call(options, key);
      let PortedPantheonCtor = globalScope.PortedMultiverseBrainsFederation;
      let BleedingEdgeCtor = globalScope.BleedEdge25AlifeEngine;

      if (!PortedPantheonCtor && typeof require === 'function') {
        try {
          PortedPantheonCtor = require('./ported-multiverse-brains.js').PortedMultiverseBrainsFederation;
        } catch (_) {}
      }
      if (!BleedingEdgeCtor && typeof require === 'function') {
        try {
          BleedingEdgeCtor = require('./alife-25-bleeding-edge-models.js').BleedEdge25AlifeEngine;
        } catch (_) {}
      }

      const pantheon = owns('pantheon') ? options.pantheon : ((options.runtime && options.runtime.portedMultiverseBrains) || (PortedPantheonCtor ? new PortedPantheonCtor() : null));
      const bleedingEdge = owns('bleedingEdge') ? options.bleedingEdge : ((options.runtime && options.runtime.bleedingEdge25Engine) || (BleedingEdgeCtor ? new BleedingEdgeCtor() : null));

      // Runtime harness for deterministic 10-iteration stress & plasticity verification
      const mockRuntime = options.runtime || {
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
          learnedMotorThrust2D: [0.15, -0.12]
        },
        deepCortex: {
          totalParams: 1245184,
          W_critic: Float32Array.from({ length: 256 }, (_, i) => Math.sin(i + 1) * 0.25),
          W_actor: Float32Array.from({ length: 256 }, (_, i) => Math.cos(i + 1) * 0.25),
          W_moe_experts: Float32Array.from({ length: 65536 }, (_, i) => Math.sin(i * 0.1) * 0.15)
        },
        connectome512: {
          synWeights262K: Float32Array.from({ length: 262144 }, (_, i) => Math.cos(i * 0.05) * 0.2),
          eligibilityTraces: new Float32Array(262144).fill(0.1),
          neuropilRates6: [0.52, 0.48, 0.61, 0.44, 0.57, 0.63],
          stdpUpdatesCount: 262144
        },
        decursiveSelfDeduplicator: {
          banishedBasis8x64: Float32Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.2) * 0.1)
        }
      };

      const savedLatent16 =
        options.runtime && mockRuntime.continuousWorldModel && mockRuntime.continuousWorldModel.latentZ64
          ? Float32Array.from(mockRuntime.continuousWorldModel.latentZ64.subarray(0, 16))
          : null;
      const savedZPerc16 =
        options.runtime && mockRuntime.trainableAlifeNeuralHub && mockRuntime.trainableAlifeNeuralHub.zPerc16
          ? Float32Array.from(mockRuntime.trainableAlifeNeuralHub.zPerc16.subarray(0, 16))
          : null;
      const savedTdDelta =
        options.runtime && mockRuntime.trainableAlifeNeuralHub
          ? mockRuntime.trainableAlifeNeuralHub.tdAdvantageDelta
          : null;
      const savedIcmReward =
        options.runtime && mockRuntime.trainableAlifeNeuralHub
          ? mockRuntime.trainableAlifeNeuralHub.icmCuriosityReward
          : null;
      const savedMotorThrust2D =
        options.runtime && mockRuntime.trainableAlifeNeuralHub && mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D
          ? [mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D[0], mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D[1]]
          : null;

      const iterationReports = [];
      const checkExecutions = [];
      const errors = [];
      let totalAtomicPointsPassed = 0;
      let totalPassesCompleted = 0;
      const totalAtomicPointsTarget = 500; // Repeated executions, not distinct controls.

      try {
      for (let iter = 1; iter <= 10; iter++) {
        // Perturb sensory state & reward delta on each iteration and step all engines
        for (let k = 0; k < 16; k++) {
          const v = Math.tanh(Math.sin(iter * 0.73 + k * 0.41) * 0.65);
          if (mockRuntime.continuousWorldModel && mockRuntime.continuousWorldModel.latentZ64) {
            mockRuntime.continuousWorldModel.latentZ64[k] = v;
          }
          if (mockRuntime.trainableAlifeNeuralHub && mockRuntime.trainableAlifeNeuralHub.zPerc16) {
            mockRuntime.trainableAlifeNeuralHub.zPerc16[k] = v;
          }
        }
        if (mockRuntime.trainableAlifeNeuralHub) {
          mockRuntime.trainableAlifeNeuralHub.tdAdvantageDelta = 0.08 * Math.cos(iter * 0.5) + 0.05;
        }

        let stepError = null;
        try {
          if (!pantheon || !bleedingEdge) throw new Error('Required pantheon or bleeding-edge engine unavailable.');
          pantheon.step60Hz(mockRuntime, iter * 6, iter);
          mockRuntime._auditAlreadySteppedPantheonFrame = iter;
          bleedingEdge.step60Hz(mockRuntime, iter * 6, iter);
          if (!bleedingEdge.aotTotGot) throw new Error('Required AoT engine unavailable.');
          bleedingEdge.aotTotGot.step60Hz(mockRuntime, iter * 6, iter);
        } catch (error) {
          stepError = error.message || String(error);
          errors.push({ iteration: iter, phase: 'step', error: stepError });
        }

        let iterPassesCompleted = 0;
        let iterPointsPassed = 0;

        for (let pIdx = 0; pIdx < 25; pIdx++) {
          const passDef = this.passDefinitions[pIdx];
          let values = [false, false];
          let checkError = stepError;
          if (!stepError) {
            try { values = this._evaluatePassInvariants(pIdx, passDef, pantheon, bleedingEdge, mockRuntime); }
            catch (error) { checkError = error.message || String(error); errors.push({ iteration: iter, pass: passDef.code, error: checkError }); }
          }
          const [inv1, inv2] = values.map(Boolean);
          values.forEach((value, idx) => checkExecutions.push({
            id: `DIAGNOSTIC-${String(pIdx + 1).padStart(2, '0')}-${idx + 1}`,
            iteration: iter,
            evidenceKind: [0, 1, 2, 23, 24].includes(pIdx) ? 'SOURCE_AND_FIXTURE_CHECK' : 'FIXTURE_CHECK',
            status: stepError ? 'BLOCKED' : checkError ? 'FAIL' :
              this._codebaseCache.status === 'NOT_RUN' && (([0, 1, 2, 23].includes(pIdx) && idx === 0) || (pIdx === 24 && idx === 1)) ? 'NOT_RUN' : value ? 'PASS' : 'FAIL',
            observed: checkError ? null : Boolean(value),
            error: checkError,
            requirementStatus: 'NOT_RUN'
          }));
          if (inv1) iterPointsPassed++;
          if (inv2) iterPointsPassed++;
          if (inv1 && inv2) iterPassesCompleted++;
        }

        totalAtomicPointsPassed += iterPointsPassed;
        totalPassesCompleted += iterPassesCompleted;
        iterationReports.push({
          iteration: iter,
          passesCompleted: iterPassesCompleted,
          passesTarget: 25,
          atomicPointsPassed: iterPointsPassed,
          atomicPointsTarget: 50,
          totalOnlinePlasticUpdates: pantheon ? pantheon.totalOnlinePlasticUpdates : null,
          stochasticInt8Updates: pantheon && pantheon.precisionArena ? pantheon.precisionArena.stochasticRoundUpdatesCount : null,
          status: iterPassesCompleted === 25 && iterPointsPassed === 50 ? 'DIAGNOSTICS_PASS' : stepError ? 'BLOCKED' : 'FAIL'
        });
      }

      } finally {
      delete mockRuntime._auditAlreadySteppedPantheonFrame;
      if (savedLatent16 && mockRuntime.continuousWorldModel && mockRuntime.continuousWorldModel.latentZ64) {
        mockRuntime.continuousWorldModel.latentZ64.set(savedLatent16, 0);
      }
      if (savedZPerc16 && mockRuntime.trainableAlifeNeuralHub && mockRuntime.trainableAlifeNeuralHub.zPerc16) {
        mockRuntime.trainableAlifeNeuralHub.zPerc16.set(savedZPerc16, 0);
      }
      if (savedTdDelta !== null && mockRuntime.trainableAlifeNeuralHub) {
        mockRuntime.trainableAlifeNeuralHub.tdAdvantageDelta = savedTdDelta;
      }
      if (savedIcmReward !== null && mockRuntime.trainableAlifeNeuralHub) {
        mockRuntime.trainableAlifeNeuralHub.icmCuriosityReward = savedIcmReward;
      }
      if (savedMotorThrust2D && mockRuntime.trainableAlifeNeuralHub && mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D) {
        mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D[0] = savedMotorThrust2D[0];
        mockRuntime.trainableAlifeNeuralHub.learnedMotorThrust2D[1] = savedMotorThrust2D[1];
      }

      }
      const diagnosticStatusCounts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].map((status) => [status, checkExecutions.filter((check) => check.status === status).length]));
      const report = {
        ok: totalAtomicPointsPassed === totalAtomicPointsTarget && totalPassesCompleted === 250 && errors.length === 0 && this._codebaseCache.status === 'PASS',
        runtimeDiagnosticsOk: diagnosticStatusCounts.FAIL === 0 && diagnosticStatusCounts.BLOCKED === 0 && diagnosticStatusCounts.PASS > 0 && errors.length === 0,
        scope: 'Bounded source and synthetic runtime diagnostics; no product requirement certification.',
        releaseVerified: false,
        releaseStatus: 'NOT_RUN',
        verifiedControlCount: 0,
        engineeringCyclesCompleted: 0,
        uniqueDiagnosticChecks: 50,
        diagnosticExecutionCount: checkExecutions.filter((check) => check.status === 'PASS' || check.status === 'FAIL').length,
        diagnosticDispositionCount: checkExecutions.length,
        diagnosticStatusCounts,
        checkExecutions,
        errors,
        sourceInspection: this._codebaseCache,
        runtimeScope: options.runtime ? 'CALLER_SUPPLIED_MUTABLE_FIXTURE' : 'SYNTHETIC_FIXTURE',
        mutatesSuppliedRuntime: Boolean(options.runtime),
        iterationsCompleted: iterationReports.filter((entry) => entry.status !== 'BLOCKED').length,
        iterationsAttempted: iterationReports.length,
        passesPerIteration: 25,
        passesCount: 25,
        iterationsCount: 10,
        totalPassExecutions: checkExecutions.filter((check) => check.status !== 'BLOCKED').length / 2,
        passedPassIterations: totalPassesCompleted,
        totalPassIterations: 250,
        totalAtomicAuditPointsPassed: totalAtomicPointsPassed,
        totalAtomicAuditPointsTarget: totalAtomicPointsTarget,
        auditPointsEarned: totalAtomicPointsPassed,
        auditPointsTotal: totalAtomicPointsTarget,
        headline: `50 diagnostic predicates, ${totalAtomicPointsPassed}/${totalAtomicPointsTarget} successful executions; release requirements NOT_RUN`,
        passCatalog: this.passDefinitions,
        iterationReports,
        finalPantheonSnapshot: pantheon ? pantheon.latestSnapshot : null,
        precisionArenaAudit: pantheon && pantheon.precisionArena && typeof pantheon.precisionArena.getPrecisionAuditSummary === 'function' ? pantheon.precisionArena.getPrecisionAuditSummary() : null
      };
      this.latestReport = report;
      return report;
    }

    runFull25PassBy10IterationAudit(runtimeOrOptions = {}) {
      if (runtimeOrOptions && (runtimeOrOptions.portedMultiverseBrains || runtimeOrOptions.deepCortex)) {
        return this.runFull10Iteration25PassAudit({
          runtime: runtimeOrOptions,
          pantheon: runtimeOrOptions.portedMultiverseBrains,
          bleedingEdge: runtimeOrOptions.bleedingEdge25Engine
        });
      }
      return this.runFull10Iteration25PassAudit(runtimeOrOptions);
    }
  }

  globalScope.FORENSIC_25_PASS_DEFINITIONS = FORENSIC_25_PASS_DEFINITIONS;
  globalScope.Forensic25Pass10IterationAuditor = Forensic25Pass10IterationAuditor;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FORENSIC_25_PASS_DEFINITIONS,
      Forensic25Pass10IterationAuditor
    };
    if (typeof require !== 'undefined' && require.main === module) {
      const r = new Forensic25Pass10IterationAuditor().runFull10Iteration25PassAudit();
      console.log(
        JSON.stringify(
          {
            ok: r.ok,
            runtimeDiagnosticsOk: r.runtimeDiagnosticsOk,
            releaseVerified: r.releaseVerified,
            releaseStatus: r.releaseStatus,
            uniqueDiagnosticChecks: r.uniqueDiagnosticChecks,
            diagnosticExecutionCount: r.diagnosticExecutionCount,
            diagnosticStatusCounts: r.diagnosticStatusCounts,
            errors: r.errors,
            iterations: r.iterationsCompleted,
            passes: `${r.passedPassIterations}/${r.totalPassExecutions}`,
            points: `${r.totalAtomicAuditPointsPassed}/${r.totalAtomicAuditPointsTarget}`,
            headline: r.headline
          },
          null,
          2
        )
      );
      if (!r.ok) process.exit(1);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
