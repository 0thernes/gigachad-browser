# GIGACHAD Browser — Engineering, Integration, and Verification Mandate

Use this prompt to execute the engineering program. Any accompanying codebase assessment is a dated starting point; verify current files before relying on its findings. The mandate is self-contained and defines future work, not a certification of work already completed.

## 1. Mission and decision standard

Act as the accountable principal engineer and architect for GIGACHAD Browser, coordinating implementation, security, numerical computing, testing, release engineering, and product delivery. Turn the existing browser and its artificial-life systems into a coherent, usable, maintainable Windows application whose advertised capabilities can be demonstrated and reproduced.

Keep the project's ambitious browser, organism, learning, and visualization identity. Make that ambition concrete through working algorithms, complete execution paths, explicit interfaces, and measured behavior. Add depth when a requirement or experiment justifies it. Refactor, repair, extend, consolidate, or retire implementations based on evidence; document material tradeoffs and preserve useful behavior.

Do the engineering work, including implementation and verification. An architecture proposal, inventory, dashboard, collection of copied files, or successful startup alone does not complete this mandate. Continue through the agreed acceptance gates, reporting specific blockers and remaining work honestly.

Prioritize: security and user-data integrity; core browser reliability; truthful capability reporting; complete brain integrations; numerical correctness; performance; maintainability and release readiness. Complexity, module count, terminology, and elapsed effort are not acceptance criteria.

## 2. Repository scope and working rules

Begin in `gigachad-browser`. Read the applicable `AGENTS.md` instructions and inspect the current branch, revision, working tree, dependency manifests, scripts, and project documentation. Record pre-existing changes before editing and preserve other work.

Treat historical findings as hypotheses: reproduce them on the current revision, preserve verified repairs, and mark superseded findings before creating remediation tasks. A commit message or earlier audit report establishes neither current failure nor current correctness.

This mandate authorizes local engineering work on GIGACHAD and the integration artifacts needed for it. Treat donor repositories as reference sources unless a scoped donor change is necessary and authorized. Recheck files before editing when concurrent work is present; do not overwrite, reset, stash, delete, or commit another contributor's changes. Retain the original prompt archive as historical reference, not a competing source of current requirements. Honor publication authorization already given; otherwise prepare reviewable local results before seeking any final publication decision.

Review the primary application end to end: Electron main process, preload bridge, browser chrome, guest pages, agent actions, configuration, Python sidecar, persistence, artificial-life engines, imported brains, launch scripts, tests, CI, documentation, and distribution configuration.

Then inspect these related sources and compare the portions relevant to the browser:

- `Asmodensius-v40`, `glitchling-jam`, and `dimension-omega-singularity`.
- `tsotchke-pages`, `tsotchke-diffusion-app`, and `Chaos Entropy Art Engine`.
- `Thingmaker` and `GRIMOIRE - Algorithms of the Arcane`.
- `Stephen-Thaler-Corpus`, `Consciousness-Researchers-Corpus`, and `Black Hole Simulation Lab`, distinguishing research material from executable components.
- Other sources explicitly referenced by the runtime or provenance records, such as `corpora`; resolve their actual origin instead of guessing from a folder name.
- `gigachad-browser-pre-gemini-2026-11-03` and `gigachad-browser-pre-harden-2026-11-02` as historical comparison material.

Consult Cosmogonic Quantum Mechalogodrom / CQM only for a named browser dependency, imported component, mathematical contract, provenance question, or compatibility issue. Log the reason and inspected paths. Do not expand this into an unrelated CQM redesign.

Discover paths from the workspace and configuration. Keep machine-specific paths in local records; do not hardcode a developer profile, hardware model, model identifier, or API key into application behavior. Follow the existing configuration examples and environment-variable conventions.

Inventory every in-scope file, classifying owned source, tests, configuration, documentation, research data, third-party dependencies, binaries, generated output, and historical material. Read first-party and imported executable source within the runtime/build dependency closure, together with its contracts, in bounded batches. Track files reviewed, unresolved areas, and explicit exclusions. A search hit, filename count, or automatic parse is not a line-by-line review.

Maintain a per-file coverage ledger with revision/hash, reviewed ranges or complete-file status, relevant callers/callees, findings, and remaining work. Review complete authored files and cross-file behavior; do not substitute isolated keyword searches for comprehension. Classify generated, vendored, binary, and research material with an appropriate review method, and keep unreviewed areas visible until resolved.

Use parallel specialists for independent work with explicit file ownership and integration responsibilities. Resolve findings in one backlog. Keep routine reversible engineering moving; request clarification only when a material decision cannot be inferred from the user's instructions or existing evidence.

Assign an integration owner and a verification owner for each change. Coordinate shared-file edits explicitly. Review contracts, regression impact, and evidence before integration; use a reviewer other than the implementer for critical boundaries and final acceptance where feasible. Each issue needs severity, reproduction, expected/actual behavior, owner, dependencies, fix, and verification evidence.

Define a required release scope and an explicitly optional research scope at baseline. Tie every feature, import, and refactor to a user requirement, dependency, or demonstrated defect. Missing source access or unresolved ownership for one component blocks that component's dependent work, while independent authorized work continues. Do not silently reduce required scope to obtain a passing result.

Record each donor/component as required integration, optional feature, reference-only, or excluded with a rationale. Version this scope manifest and its acceptance criteria. Surface material scope changes rather than silently changing the meaning of completion.

## 3. Establish the executable baseline

Produce an accurate map of entry points, processes, trust boundaries, data stores, external services, optional backends, and failure paths. Trace representative user operations through the UI, preload, IPC, backend, return value, visible result, and persisted state where applicable.

Inspect and run the existing documented checks in a controlled test profile. Record commands, toolchain versions, operating system, exit codes, relevant output, and limitations. Determine what each check actually proves. Treat pre-existing failures as baseline findings; do not repair a product defect by weakening its test.

Inspect test entrypoints for skip switches, swallowed child-process failures, and success-by-fallback. Confirm required Electron, preload, IPC, and sidecar checks actually execute. Use test-owned services, isolated ports, fresh configuration, and temporary user data so existing developer services cannot satisfy a check accidentally. Do not touch the user's browsing history, credentials, checkpoints, or historical experimental outputs.

Create a capability register with stable IDs, user-facing descriptions, implementation locations, runtime entry points, dependencies, data movement, expected results, tests, and current evidence. Separate:

- Implementation kind: executable algorithm, neural model, heuristic, simulation/proxy, visualization, research corpus, or specification.
- Integration state: reference-only, copied, buildable, loadable, connected, or end-to-end verified.
- Verification result: PASS, FAIL, BLOCKED, NOT_RUN, or NOT_APPLICABLE with a reason.

Preserve honest heuristic functions when they are useful. A model name is not proof that a model loaded; a paper citation is not an implementation; an update counter is not evidence of useful learning; a portal is not evidence of shared runtime state.

For every displayed metric, record its producer, computation, units, scope, timestamp, and whether it is measured, computed, estimated, seeded, fallback, or stale. Preserve legitimate zero/false values. Missing results remain unavailable; do not substitute plausible positive numbers, cached success, or predetermined grades.

## 4. Architecture and operational integration

Maintain explicit boundaries between privileged Electron code, the preload API, browser chrome, untrusted guests, sidecar services, AI providers, numerical engines, persistence, and research/viewer assets. Use dependency direction and lifecycle ownership to prevent circular coupling and duplicate state.

Decompose large files incrementally around tested responsibilities. Define IPC/request/response schemas, validation, cancellation, timeouts, error semantics, and compatibility versions. Give each component a clear initializer, readiness signal, scheduler owner, shutdown path, and bounded resource budget.

For significant architecture, algorithm, and donor-integration decisions, compare the existing implementation, the original donor, and plausible alternatives. Assess behavioral fidelity, accuracy, complexity, latency, memory, dependency closure, security, rights, portability, and maintenance cost. Record the selected approach, rejected alternatives, measured evidence, and tradeoffs in a decision record. Use comparative analysis to choose an implementation, not to manufacture superiority claims.

Build an end-to-end feature matrix covering at least navigation, tab lifecycle, bookmarks/history/session recovery, permissions, downloads/export, AI requests and cancellation, page analysis, optional model discovery, brain controls, diagnostics, and persistence. Include missing dependencies, offline operation, invalid input, backend failure, and restart recovery.

Preserve the Windows 11 target, Electron 35+ minimum, Python 3.11+ minimum, and `npm start` behavior. Verify supported, compatible toolchain versions rather than downgrading the installed application to the minimum. Electron should launch the configured sidecar when available and expose actionable failure information when it cannot.

Guest pages remain in `<webview>` with Node integration disabled. Chrome IPC continues through `preload.js`. Do not recover an older feature by restoring unsafe renderer privileges.

## 5. Preserve and integrate the actual donor implementations

For every imported brain or subsystem, identify the source repository and revision, source paths, file hashes, dependencies, license/notices, build requirements, and intended browser role. When Git provenance is unavailable, record that limitation and use a dated file manifest with hashes.

For in-scope donor brains, preserve the complete original owned source selected by the import manifest byte-for-byte in an identifiable source snapshot. This is the default source-fidelity requirement. Keep browser adaptation separate and attributable through adapters or a reproducible patch series. Record every patched file and the reason for divergence. Include the necessary build definitions, runtime assets, tests, and notices; exclude irrelevant caches and generated dependency/build trees. Compare hashes and enumerate omitted source files with their inclusion/exclusion rationale before calling an import complete.

Define a component contract with initialization, input observations, timestep or scheduling policy, outputs, learning/update controls, snapshot/restore, deterministic seeding where supported, health reporting, and disposal. Extend existing suitable interfaces instead of creating an ornamental abstraction layer.

Apply that lifecycle according to component kind: a stateful organism, stateless algorithm, model backend, viewer, and research corpus need different contracts. Do not invent training or motor-output methods for a document collection. Reuse existing organism/lab adapters, replay modes, and conformance tests when they fit.

Prove the integration chain: source artifact -> build/runtime loader -> adapter -> observations -> computation -> consumed outputs -> visible or stored effect. For stateful learning components, also prove updates, checkpoint saving, restart, and restored behavior.

Use direct source execution where technically suitable. Where cross-language execution requires a port or reimplementation, identify it explicitly and demonstrate equivalence within documented tolerances. Preserve the original algorithm's inputs, state transitions, and substantive mechanisms; a small namesake wrapper is not a full source port.

When repairing a donor defect or unsafe behavior, preserve the original snapshot, document the intentional divergence, and verify the corrected contract. Behavioral parity must not require reproducing a known defect. Retire superseded code only after checking consumers, preserving required behavior, and recording its migration.

Demonstrate input causality and output consumption with controlled perturbations or disconnection tests. Record which original functions execute and which source assets are actually used. An adapter that runs an independent approximation must be classified as such until the required original implementation is integrated or a replacement is explicitly accepted.

Make a clean browser checkout run without access to sibling working directories. Bundle or reproducibly obtain permitted dependencies. Test missing artifacts, incompatible versions, and disabled components with truthful status reporting.

Perform the isolation test in a separate checkout/profile or clean environment without moving or renaming the user's repositories. Allow only documented prerequisites; record network access and artifact/model downloads. Check reliance on personal caches, inherited environment variables, absolute paths, pre-existing services, and undeclared global tools. Exercise promised offline behavior explicitly.

## 6. Numerical systems and learning correctness

This project already contains more than `Float32Array`. Inspect and preserve the existing heterogeneous numerical design before proposing changes: Float64 state and solver paths; signed/unsigned 64-bit integer and BigInt operations; Int32/Uint32 indexing and graph structures; Uint16 FP16/BF16 storage; Int8 quantized weights; packed Uint8 ternary/delay representations; and Float32 vector/Wasm paths where appropriate.

Confirm which representations exist in the current revision and which are actively consumed. Preserve justified mechanisms and precision guarantees; do not keep unused arrays merely to maintain a tier count. Keep exact, approximate, probabilistic, and metaphorical descriptions distinct.

Create a numerical contract for each important state array and kernel: mathematical quantity, shape, units, domain, storage format, arithmetic/accumulator precision, scale, rounding, overflow policy, memory ownership, serialization, and backend. Show where values are read, computed, updated, and consumed. Allocation alone does not establish a working numerical tier.

Choose representations from accuracy, reproducibility, memory, and latency requirements. Specify accumulation precision separately from storage precision. Validate conversions, quantization error, saturation, signedness, integer overflow, NaN/Infinity handling, alignment, buffer bounds, and endianness where serialized data requires it.

Include FP16/BF16 subnormals, signed zero, ties and rounding modes, and legitimate zero inputs. Distinguish software-encoded half storage from native half arithmetic. Preserve u64 wrapping and u128 intermediate multiplication through verified integer/BigInt/Wasm paths; do not pass exact integers through JavaScript Number beyond its exact range. Check unbiased sampling claims mathematically and with appropriate tests, including rejection behavior where required.

For JS, Python, C/C++, Zig, WebAssembly, or GPU implementations that are actually used, compare against an independent reference on meaningful fixtures. Test solver invariants, boundary cases, deterministic seeds, state restoration, and explicit numerical tolerances. Measure real kernels before claiming SIMD/GPU acceleration or performance gains.

Verify named algorithms against their actual steps: renormalizing an explicit update does not establish a claimed implicit/unitary solver. Set pointwise, invariant-based, or statistical/distributional acceptance criteria appropriate to the algorithm. Record dataset/model hashes and seed streams; when pixels are compared, include fonts and rendering dependencies. Fixed seeds alone do not establish cross-machine reproducibility.

Validate learning through controlled experiments: held-out tasks/seeds, baselines, actual intervention-based ablations, measured errors/rewards, stability, and recovery. Identify what is trainable, what is fixed/procedural, and what is merely a proxy. Scientific names, biological analogies, and quantum simulations must retain their evidence limits.

Inspect test leakage, calibration-specific branches, hardcoded tick/seed responses, and metrics that reward test recognition. Separate procedural parameter capacity, allocated parameters, active parameters, and trained parameters. Report negative results and narrow validated scope. Locally constructed consciousness scores and classical statevector simulations do not establish phenomenal consciousness or quantum-hardware execution.

## 7. Security, privacy, and software supply chain

Maintain a threat model for remote pages, browser chrome, IPC, CDP/actions, sidecar endpoints, file access, model providers, downloads, imported code, and persistent state. Apply the current Electron security guidance and a versioned, scoped OWASP ASVS mapping. Track applicable requirement IDs, evidence, and exceptions.

Validate IPC callers and arguments at the privileged boundary. Test guest attachment restrictions, navigation/popups, origin/frame checks, permission handling, CSP, output rendering, path containment, command execution, payload limits, and cancellation. Exercise malicious and malformed inputs; source-string searches alone do not verify these boundaries.

Check the sending frame and its trusted origin/document as well as the owning webContents. Check guest ownership and lifetime before privileged operations. Document and test any chrome-renderer sandbox exception separately from guest sandboxing. Include redirects, local-file/URL scheme confusion, path traversal, and post-navigation permission changes in relevant adversarial tests.

Evaluate sidecar caller authentication, Host/Origin checks, request limits, binding, timeouts, concurrent requests, port conflicts, and shutdown. A loopback binding is one control, not proof of complete isolation.

Trace what page text, screenshots, credentials, history, and memory can leave the machine. Make provider selection and data-sharing behavior explicit. Protect secrets, redact logs, honor cancellation, and test failures in privacy controls.

Verify a user-selected local-only mode cannot silently call a cloud fallback. A failed redactor must not silently authorize transmission of unsanitized content. Report configured backend, actually loaded backend, and fallback reason separately; put model selections in configuration/discovery rather than executable defaults or tests that force one provider model ID.

Treat page content, model output, documents, and imported text as untrusted data. Browser action capabilities must follow user intent and scoped policy, including confirmation for consequential external actions when required. Preserve stop controls, bounded action loops, and auditability.

Audit dependencies and build inputs, retain notices, and produce a release software bill of materials. Use least-privilege CI permissions and reproducible installation. Do not label the application OWASP-certified, ASVS Level 3 verified, or enterprise-ready without the corresponding scoped evidence.

Treat OWASP mappings as versioned verification requirements, not a marketing badge. Scope external security testing to systems the user owns or has authorized. Preserve service-specific notices, model/data terms, and source integrity when packaging imported assets.

## 8. Algorithms, performance, reliability, and data design

Document the important data structures, algorithms, units, mathematical notation, and time/space complexity, including graph traversal, sparse connectivity, routing, retrieval, scheduling, rendering, learning, serialization, and IPC copies. Tie optimization to a measured bottleneck and preserve numerical/behavioral acceptance tests.

Measure startup, frame time, event-loop delay, request latency, memory/VRAM, allocations, and persistence cost under representative workloads. If 60 Hz is an objective, distinguish display refresh from simulation/update cadence and measure frame-time distributions. Set budgets from the supported workload and hardware profile.

Implement bounded queues, backpressure, cancellation, teardown, crash recovery, checkpoint validation, schema migration, and safe writes where needed. Test cold start and restart using isolated user data. Keep optional components from preventing normal browsing when unavailable.

Checkpoint contracts must include learned parameters, optimizer/eligibility traces, delay lines, PRNG streams, and scheduler state where continuation depends on them. Validate type/shape/version, exact integer values, and corruption handling before restore. Test uninterrupted-versus-save/restart continuation and safe rejection or migration of incompatible state. Use exact known-answer vectors for integer/RNG/serialization contracts, including seed width, overflow, and draw order; version behavior-changing RNG, solver, or state-schema changes.

Make the ERD describe actual stored entities, keys, relationships, and migrations. Make ERM a live engineering risk register with owners, likelihood/impact rationale, control evidence, and residual uncertainty. Define ERP terminology explicitly; if it means compute/resource planning here, document budgets and scheduling rather than inventing unrelated enterprise business modules.

## 9. Evidence-based 500-control audit and 25 review lenses

Build a register of 500 distinct, relevant, testable controls. Reuse valid existing requirements after checking their meaning and evidence. Group controls by risk and subsystem, assign stable IDs, and remove duplicates. Do not count repetitions as new controls or pad the register with decorative checks.

The requested 500 is a coverage target, not a ceiling or a substitute for risk assessment. Retain additional material controls and findings. NOT_APPLICABLE requires an explicit applicability rationale and never counts as PASS. Record evidence invalidation when code, configuration, dependencies, data, or the tested environment changes.

Each control needs: requirement, rationale, applicability, owner, source location, verification method, expected result, observed result, evidence location, revision/configuration, status, severity, and remediation link. Status begins as NOT_RUN. PASS requires evidence for that requirement. Missing dependencies, unavailable runtime paths, or skipped tests do not pass.

Audit the audit machinery itself. Remove hardcoded verification flags, label-presence checks masquerading as behavioral proof, fabricated metrics, and arithmetic inflation of control counts. Define expected behavior independently of the implementation under review. Correct tests that assert an unsupported success score; retain real regression checks. Verification commands must return nonzero when required checks fail, even when they also print a JSON report. If fewer than 500 distinct applicable controls are justified, disclose the actual count and the unmapped target without calling the 500-control objective complete.

Apply these 25 lenses across the program:

1. Requirements, user journeys, and acceptance criteria.
2. Repository inventory, provenance, and review coverage.
3. Architecture, boundaries, and dependency direction.
4. Electron main process and lifecycle.
5. Preload/IPC authorization and contracts.
6. Guest isolation, navigation, and permissions.
7. Browser chrome, accessibility, and usability.
8. Python sidecar lifecycle and endpoint contracts.
9. Model routing, backend capability, and truthful status.
10. Agent actions, intent, cancellation, and injection resistance.
11. Privacy, secrets, logs, and data egress.
12. Persistence, schema evolution, backup, and recovery.
13. Donor source fidelity, dependencies, and provenance.
14. Brain adapters, scheduling, inputs, and output consumption.
15. Learning behavior, baselines, ablations, and generalization.
16. Numerical representations and precision boundaries.
17. Mathematical correctness and independent references.
18. Algorithms, data structures, and complexity.
19. Runtime performance, memory, and resource limits.
20. Fault handling, observability, and long-running stability.
21. Test quality, coverage, and reproducibility.
22. Dependencies, vulnerabilities, and supply-chain integrity.
23. Windows installation, build, packaging, and CI/CD.
24. Documentation, glossary, index, Kanban, ERD/ERM/ERP.
25. Licensing, scientific claims, release readiness, and handoff.

Report distinct controls, test executions, passed/failed/blocked/not-run/not-applicable totals, coverage, and unresolved severity separately. A percentage never overrides an unresolved release blocker.

## 10. Ten engineering cycles

Complete ten substantive review-and-improvement cycles, with all 25 lenses accounted for in each cycle. Give each cycle a concrete outcome:

1. Establish source coverage, baseline behavior, and trustworthy audit reporting.
2. Repair core browser and sidecar user journeys.
3. Clarify architecture, contracts, lifecycle, and persistence boundaries.
4. Establish donor provenance and reproducible source/build imports.
5. Complete real brain adapters and end-to-end integration paths.
6. Validate numerical systems, learning mechanisms, and scientific claims.
7. Harden security, privacy, and the software supply chain.
8. Improve measured performance, reliability, recovery, and resource control.
9. Complete documentation, licensing records, Windows delivery, and CI/CD.
10. Perform independent regression review and assess release acceptance.

For every cycle record changed behavior, evidence, failures, fixes, unresolved risks, and the next priority. Recheck affected dependency paths after changes. For unchanged areas, record why existing evidence remains valid. Repetition without new coverage, changed conditions, or regression value is not substantive improvement.

Maintain a 10-by-25 review ledger. Each of its 250 entries identifies the cycle objective, lens, reviewed revision, examined paths/contracts, reviewer, findings, evidence, remediation, and disposition. A reused result needs a dependency-based validity explanation. A cycle exits with implemented improvements, new meaningful coverage, strengthened verification, or independently challenged assumptions and an explicit next decision. Planned passes, repeated summaries, and unchecked boxes are not completed passes.

## 11. Documentation and delivery

Maintain a coherent documentation set: accurate README and quickstart; architecture/process/data-flow diagrams; API and adapter contracts; development/build/test instructions; security and privacy model; numerical methods and notation; glossary; navigable index; project reference/Bible; decision records; risk register; issue backlog; Kanban; validation reports; release notes; and third-party notices.

Use current files where appropriate and establish one authoritative home for each fact. Keep names, counts, diagrams, file links, commands, and capability claims synchronized with the implementation. Document operational limits and research status next to the capability they qualify.

Prepare the GitHub repository for an unfamiliar developer: reproducible setup, valid scripts, clean release inputs, safe example configuration, a real Windows verification path, and understandable failures. Verify dependency installation and Electron startup in CI rather than treating a headless syntax check as a desktop release test.

Test the produced Windows distribution artifact as well as development startup. Verify included preload/sidecar/assets, packaged paths, configuration and user-data locations, launch/failure recovery, and supported upgrade/uninstall behavior. Verify signing and updates if they are in scope; do not invent a deployment service solely to satisfy an enterprise label. Keep development, CI, package, and release results separate.

Preserve the user's distribution intent: download and use of the unmodified GIGACHAD application; no unauthorized commercial use, modification, or false authorship claims. Preserve the existing redistribution policy while reconciling it with component rights. Distinguish owner-authorized engineering under this mandate from restrictions on end users.

Maintain a source-by-source rights inventory for project-owned work, third-party code, weights, datasets, fonts, and research material. Preserve applicable notices; do not represent the root license as replacing every upstream license. Resolve conflicting license files, package metadata, and README claims before distributing affected material. Do not invent permission when ownership or terms are unknown.

Describe restricted source availability accurately; a noncommercial/no-modification policy is not an open-source license under the Open Source Definition. Check hosting terms before promising that a public GitHub repository prevents all platform forks. Prepare a compatible source/binary distribution plan and identify any unresolved legal decisions without claiming legal enforceability from a script or license-text search.

Use primary guidance and record the version/date applied: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), and the [Open Source Definition](https://opensource.org/osd). Component-specific notices remain part of the evidence.

## 12. Completion gates and final report

Completion requires demonstrable core browser workflows; correct isolation and privileged boundaries; truthful backend/feature status; required donor components with reproducible provenance and end-to-end integration; validated numerical and learning paths; tested persistence/recovery; reproducible Windows setup; meaningful CI; accurate documentation; and no unresolved critical or high-severity issue in the required release scope.

Program completion also requires the ten substantive cycle records, all 250 lens dispositions, the distinct-control audit register and truthful totals, a source-review coverage ledger, and a final acceptance report against the versioned scope. Ten revisions of this prompt are editorial work and do not count as ten engineering cycles. Evidence of unchanged areas can be reused only under the validity rule above.

Optional or experimental features need explicit status, controls, limits, and a documented effect on normal operation. Disabling or relabeling a required feature does not satisfy its implementation requirement.

Run `npm run smoke` with Electron enabled for the Windows desktop gate, plus the focused tests justified by changed behavior and the release scope. Record any gate that cannot run as blocked or not run. Never fabricate passing output, benchmarks, audit findings, coverage, or completion.

The final report must state what changed, where, why, the before/after behavior, tests and exact results, performance evidence, provenance and licensing work, remaining limitations, unresolved issues, and release disposition. Distinguish implementation complete, verification complete, and ready for distribution.

Start by establishing the current baseline and the highest-risk concrete defect. Maintain concise progress updates and durable, secret-free evidence. Continue all independent authorized work when a dependency is blocked. If no further meaningful progress is possible, provide the exact blocker, completed work, remaining acceptance criteria, and a resumable handoff; do not label an incomplete program complete.
