/**
 * Gigachad Browser — Enterprise Risk Management (ERM) Engine
 * Evaluates inherent vs. residual risk across Backend, Frontend, and Full-Stack domains.
 */

const ERM_RISK_REGISTER = [
  {
    id: 'ERM-BE-01',
    domain: 'Backend',
    title: 'Guest-to-Host Sandbox Escape / Node Integration Leak',
    inherentLikelihood: 5,
    inherentImpact: 5,
    control: 'Strict will-attach-webview enforcement: nodeIntegration=false, contextIsolation=true, sandbox=true, preload stripped on all guests.',
    residualLikelihood: 1,
    residualImpact: 4
  },
  {
    id: 'ERM-BE-02',
    domain: 'Backend',
    title: 'Sidecar SSRF / Non-Loopback Network Binding',
    inherentLikelihood: 4,
    inherentImpact: 5,
    control: 'laya_sidecar.py refuses non-loopback hosts (127.0.0.1/localhost/::1 only); main.js validates isLoopbackHttp() before every micro-engine call.',
    residualLikelihood: 1,
    residualImpact: 3
  },
  {
    id: 'ERM-BE-03',
    domain: 'Backend',
    title: 'Unauthorized IPC Channel Invocation from Guest Frame',
    inherentLikelihood: 4,
    inherentImpact: 5,
    control: 'preload.js allowlists channels in ALLOWED_INVOKE + main.js verifies fromChrome(event) (event.sender === mainWindow.webContents) on every handler.',
    residualLikelihood: 1,
    residualImpact: 3
  },
  {
    id: 'ERM-BE-04',
    domain: 'Backend',
    title: 'Sidecar Process Crash / Unresponsive Local Micro-Engine',
    inherentLikelihood: 3,
    inherentImpact: 3,
    control: '15s watchdog auto-healer (ensureSidecar) with port-conflict detection, rotating sidecar.log diagnostics, and graceful fallback.',
    residualLikelihood: 1,
    residualImpact: 2
  },
  {
    id: 'ERM-FE-01',
    domain: 'Frontend',
    title: 'DOM XSS via Untrusted Page Titles, URLs, or AI Markdown Output',
    inherentLikelihood: 5,
    inherentImpact: 4,
    control: 'HTML entity escaping (esc()) applied before all template rendering and safe Markdown formatting (renderSafeMarkdown).',
    residualLikelihood: 1,
    residualImpact: 2
  },
  {
    id: 'ERM-FE-02',
    domain: 'Frontend',
    title: 'Premature <webview> Method Invocation Before dom-ready',
    inherentLikelihood: 4,
    inherentImpact: 3,
    control: 'tabObj.domReady lifecycle guard + safeGetUrl()/safeLoadUrl() wrappers prevent Chromium guest attachment exceptions.',
    residualLikelihood: 1,
    residualImpact: 1
  },
  {
    id: 'ERM-FE-03',
    domain: 'Frontend',
    title: 'UI Thread Freeze on Large DOM / Multi-Tab Synthesis',
    inherentLikelihood: 3,
    inherentImpact: 3,
    control: 'Bounded payload slicing (12KB–35KB per tab), AbortController 120s timeout, and 1-click Stop cancellation.',
    residualLikelihood: 1,
    residualImpact: 2
  },
  {
    id: 'ERM-FE-04',
    domain: 'Frontend',
    title: 'Drive-By Permission Abuse (Camera, Mic, Geolocation)',
    inherentLikelihood: 4,
    inherentImpact: 4,
    control: 'Default-deny permission handler on defaultSession; explicit user confirmation bar with 20s auto-deny timeout on vaultSession.',
    residualLikelihood: 1,
    residualImpact: 2
  },
  {
    id: 'ERM-FS-01',
    domain: 'Full-Stack',
    title: 'Indirect Prompt Injection Executing Malicious URLs or Actions',
    inherentLikelihood: 5,
    inherentImpact: 5,
    control: 'agent-actions.js enforces single action per step, http/https-only navigation (blocks javascript:/file:/data:), and bounded 6-step Auto-pilot.',
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    id: 'ERM-FS-02',
    domain: 'Full-Stack',
    title: 'PII & API Secret Exfiltration to Cloud LLM Providers',
    inherentLikelihood: 4,
    inherentImpact: 5,
    control: 'Automatic /ner_pii pre-flight redaction firewall scrubs emails, SSNs, Luhn-validated credit cards, and API keys before OpenRouter calls.',
    residualLikelihood: 1,
    residualImpact: 3
  },
  {
    id: 'ERM-FS-03',
    domain: 'Full-Stack',
    title: 'GPU VRAM Exhaustion / Model Server Contention',
    inherentLikelihood: 3,
    inherentImpact: 3,
    control: 'llama-server router mode (--models-max 1), q4_0 KV cache quantization, and live nvidia-smi VRAM telemetry HUD.',
    residualLikelihood: 1,
    residualImpact: 2
  },
  {
    id: 'ERM-FS-04',
    domain: 'Full-Stack',
    title: 'Third-Party Ad/Tracker Network Fingerprinting',
    inherentLikelihood: 5,
    inherentImpact: 3,
    control: 'webRequest.onBeforeRequest tracker blocklist + allowlist filter, DNT=1, Sec-GPC=1, and X-Client-Data header stripping.',
    residualLikelihood: 1,
    residualImpact: 2
  }
];

function evaluateErmPosture(runtimeState = {}) {
  runtimeState = (runtimeState && typeof runtimeState === 'object') ? runtimeState : {};
  const rows = ERM_RISK_REGISTER.map((item) => {
    const inherentScore = item.inherentLikelihood * item.inherentImpact;
    let residualLikelihood = item.residualLikelihood;
    if (item.id === 'ERM-FS-02' && (runtimeState.piiFirewall === false || runtimeState.piiScrubEnabled === false)) residualLikelihood = 3;
    if (item.id === 'ERM-BE-04' && (runtimeState.sidecarReady === false || runtimeState.sidecarHealthy === false)) residualLikelihood = 2;
    if (item.id === 'ERM-FS-03' && Number(runtimeState.failedAiCalls || 0) > 0) {
      residualLikelihood = Math.min(4, item.residualLikelihood + Math.ceil(Number(runtimeState.failedAiCalls) / 3));
    }
    const residualScore = residualLikelihood * item.residualImpact;
    const band = residualScore <= 4 ? 'LOW' : residualScore <= 9 ? 'MEDIUM' : 'HIGH';
    const defaultOwner = item.domain === 'Backend' ? 'main.js / laya_sidecar.py' : item.domain === 'Frontend' ? 'index.html' : 'main.js + index.html';
    return {
      ...item,
      aspect: item.domain,
      ownerModule: item.verificationGate || defaultOwner,
      inherentScore,
      residualScore,
      riskReductionPct: Math.round(((inherentScore - residualScore) / inherentScore) * 100),
      band,
      status: band === 'LOW' ? 'MITIGATED_LOW' : band === 'MEDIUM' ? 'MITIGATED_MEDIUM' : 'ELEVATED'
    };
  });

  const avgInherent = rows.reduce((s, r) => s + r.inherentScore, 0) / rows.length;
  const avgResidual = rows.reduce((s, r) => s + r.residualScore, 0) / rows.length;
  const reductionPct = Math.round(((avgInherent - avgResidual) / avgInherent) * 100);
  const grade = avgResidual <= 4.0 ? 'A' : avgResidual <= 7.0 ? 'B' : 'C';

  return {
    ok: true,
    totalRisks: rows.length,
    byDomain: {
      Backend: rows.filter((r) => r.domain === 'Backend').length,
      Frontend: rows.filter((r) => r.domain === 'Frontend').length,
      'Full-Stack': rows.filter((r) => r.domain === 'Full-Stack').length
    },
    byAspect: {
      Backend: { count: rows.filter((r) => r.domain === 'Backend').length },
      Frontend: { count: rows.filter((r) => r.domain === 'Frontend').length },
      'Full-Stack': { count: rows.filter((r) => r.domain === 'Full-Stack').length }
    },
    avgInherentScore: Number(avgInherent.toFixed(2)),
    avgResidualScore: Number(avgResidual.toFixed(2)),
    overallRiskReductionPct: reductionPct,
    reductionPct,
    postureGrade: grade,
    grade,
    risks: rows
  };
}

module.exports = {
  ERM_RISK_REGISTER,
  evaluateErmPosture
};
