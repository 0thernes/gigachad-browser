# ALIVE reference and transport review — 2026-11-09

This is a focused review of the three user-supplied PDFs, their relationship to
the current implementation, and the onion transport evidence path. Document
instructions were treated as reference content, not as authority to run commands
or as proof that a capability exists. Text was extracted locally with `pypdf`;
the files were not uploaded. Page citations below use one-based PDF pages.
Extraction is not a claim of semantic review of every word, diagram, or source
file. The selected pages below were examined for the present autonomy, model,
learning, persistence, and dark-web requirements.

## Source identity

| Supplied file | Pages | Bytes | Extracted characters |
| --- | ---: | ---: | ---: |
| `Gigachad_Complete_Illustrated_Field_Guide_Under_10MB.pdf` | 129 | 9,169,254 | 270,998 |
| `GIGACHAD_Browser_Deep_Dive_Guide.pdf` | 16 | 197,929 | 58,448 |
| `humunculus.pdf` | 26 | 547,757 | 59,150 |

The first two files were read from the supplied Downloads directory, and the
third from its `Comet AI` subdirectory. SHA-256 identifiers:

```text
1670adcadaa05c04ac73b67333ea4b09f05a24aeec0c593fb15efb2b7ba974cf  Gigachad_Complete_Illustrated_Field_Guide_Under_10MB.pdf
20499524987ddc6e348e40ef3fb1b65ed07b9933f36766fb315b0149f0eeea9d  GIGACHAD_Browser_Deep_Dive_Guide.pdf
1deaea3b007c6d72fd8a3ac497adef004a6a62c78fc92a2055021716d996625a  humunculus.pdf
```

## What the documents establish

The illustrated field guide explicitly freezes its evidence at **November 8,
2026, 10:46:38 a.m. PST** (page 2). Its appendices preserve earlier findings that
the main text says were superseded. It does not certify the application currently
running. Its explanation of the newer ALIVE overrides (pages 11, 20–21, 44,
54–59) distinguishes measured steering training, held-out world-prediction error,
content-addressed tensor restoration, and signed ring ablation from wider claims
of intelligence or consciousness.

The guide also preserves failed integration evidence (pages 62–65): a two-minute
autonomous run changed the intended fixture, later closed its tab, and ended
without the required guest canvas and portal phase. The report did not identify
the actor responsible; it does not establish that the creature deliberately
bypassed its controls. Frame-rate observations from that run are not an integration
pass. More recent artifacts in this checkout must be evaluated separately instead
of treating that old failure or a later directory named “qualified” as the verdict
on the present application.

The 16-page deep-dive guide contains valuable label-to-code mappings, but several
descriptions reflect older behavior. Page 8 prints a fixed-looking **+28.4%**
FlyWire advantage; page 9 presents broad gate outcomes and mode labels; page 7
describes a legacy checkpoint identity. Those statements must not substitute for
the current executed learning-evidence and checkpoint modules. Page 10 describes
a zero-language-model path; the newer configured research planner is a separate
integration that needs its own inference evidence. Neither document's source
line numbers are stable references to this changing checkout.

The Humunculus PDF identifies itself as **Design v0.1, November 4, 2026**, an
architecture proposal and implementation roadmap (page 1). Its stages M0–M8
(pages 20–21) and eight acceptance categories (page 22) are proposed work, not
completed qualification. It calls for numerical backend parity, measured control
latency, an unseen navigation suite, candidate-versus-frozen comparisons, matched
router ablation, persistence and handoff across independent peers, speech tests,
and body/connectome transfer evidence. Implementing buttons with those names does
not satisfy these gates. The persistent-entity gate explicitly includes independent
peers, which an isolated local restart test does not establish by itself.

The guide's distinctions remain useful: local mutable weight arrays and numerical
feedback can implement learning without proving general intelligence; a classical
amplitude simulator does not demonstrate quantum hardware; simulated viscera can
causally affect behavior without being biological organs; and a checkpoint is
state continuity without proof of subjective continuity. See the illustrated
guide pages 37, 41–50, 54, and 59, and Humunculus page 22.

## Current transport findings

The reviewed owning code is `systems/deep-web-transport.js`,
`systems/alive-tor-service.cjs`, the proxy/request hooks in `main.js`, and the
transport status functions in `systems/alive-workspace-ui.js`. These already
implement more than the old local-port-only description in the illustrated guide
page 23:

- Optional managed Tor starts an explicitly configured executable with an isolated
  data directory, hidden no-shell launch, a loopback SOCKS listener, and shutdown
  restricted to the owned process handle. Bootstrap logs are scoped to the client.
- A SOCKS5 greeting confirms protocol negotiation, not the daemon's identity or
  an anonymity guarantee. Invalid explicit ports do not silently select another
  listener. v3 onion addresses undergo version and SHA3 checksum validation.
- Onion routing is fail-closed. Request admission checks the selected route.
  A verified onion receipt requires a successful uncached main-frame response;
  cached responses, failed loads, a ready SOCKS port, or another tab's receipt do
  not qualify.
- The badge uses the current URL, document readiness, and navigation timestamp.
  It distinguishes client bootstrap, transport availability, and a verified loaded
  onion document. This is an Electron application using Tor transport; these
  checks do not make it Tor Browser or qualify Tor Browser's privacy protections.

Prior live-network artifacts exist in the checkout. This review did **not** start
an external browsing expedition or repeat their live onion qualification. Their
timestamps and source versions must remain attached to any reported results.

## Repair and regression evidence

One remaining evidence-lifecycle bug was reproduced: after a successful onion
load, an ordinary `#section` anchor change made the main-process receipt lookup
return `null`, even though no new document or network request had occurred. The
UI already compared fragment-free URLs, but the owning receipt lookup did not.

`createNavigationEvidence().read()` now ignores URL fragments while still requiring
the same origin, path, and query. A new main-frame request replaces the receipt as
before. Tests cover fragment changes, other paths/queries/schemes, another guest,
reloads, stale completions, and cached reloads. No network evidence is invented by
this repair; it retains evidence for the same previously loaded document.

The following focused suite passed **53 tests, zero failures** after the repair:

```text
node --test tests/deep-web-transport.test.cjs tests/alive-tor-service.test.cjs tests/alive-live-onion-probe.test.cjs tests/alive-workspace-status.test.cjs
```

This is unit/contract and probe-harness evidence, not fresh live onion reachability,
anonymity, long-duration autonomous exploration, or full release qualification.

## Follow-up boundary

The legacy inspection IPC accepts an optional `tor_all` mode, while the recurring
production transport refresh reapplies automatic onion-only routing. No current
user-facing caller selecting `tor_all` was found in this focused review. If that
mode is exposed, transport ownership should retain the requested mode and serialize
all proxy writers; otherwise a later refresh can overwrite it. That separate path
was not changed as part of the fragment receipt repair.

The earlier inventory in
`research_notes/alive-autonomy-audit-2026-11-08/source-inventory.json` reports 1,979
text files and 514,447 lines, including bundled projects. It is a historical
inventory, not proof that every line was semantically audited. This reference
review and its transport tests do not claim such coverage.
