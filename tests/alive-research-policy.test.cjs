'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { create, normalizeURL, dimensions } = require('../systems/alive-research-policy');

function fixture(options = {}) {
  let now = 100000;
  const policy = create({ now: () => now, ...options });
  return { policy, advance: ms => { now += ms; }, now: () => now };
}
function page(url, extra = {}) {
  return { url, title: 'Cryptographic manuscript and strange signal archive', domWeirdAction: 'observed-page',
    specimens: ['Archivists documented ancient symbols and an unknown manuscript.'], doors: [], ...extra };
}
function arrival(policy, url, tabId = 'tab-1', extra = {}) {
  policy.enqueue([{ url, title: 'Strange manuscript archive', source: 'observed-link' }]);
  const pick = policy.choose({ currentUrl: 'https://origin.example/' });
  assert.equal(pick.url, url);
  assert.equal(policy.markDispatched(pick, { tabId }).status, 'dispatched');
  return { pick, result: policy.ingest(page(url, extra), { verified: true, tabId, concepts: ['manuscripts', 'cryptography'] }) };
}

test('normalization preserves path case and meaningful query while removing fragments and tracking', () => {
  const parsed = normalizeURL('https://WWW.Example.com/CaseSensitive?utm_source=feed&b=2&a=1#note');
  assert.equal(parsed.url, 'https://www.example.com/CaseSensitive?a=1&b=2');
  assert.equal(parsed.domain, 'example.com');
  assert.notEqual(parsed.url, normalizeURL('https://www.example.com/casesensitive?a=1&b=2').url);
});

test('discovery rejects nonweb protocols, credentials, internal targets, dangerous downloads and state-changing links', () => {
  for (const url of [
    'javascript:alert(1)', 'data:text/html,hello', 'file:///C:/secret', 'https://user:pass@example.com/',
    'http://127.0.0.1/', 'http://2130706433/', 'http://0x7f000001/', 'http://10.0.0.1/',
    'http://192.168.1.4/', 'http://172.17.0.3/', 'http://169.254.169.254/', 'http://[::1]/',
    'http://localhost./', 'http://router.local/', 'http://intranet/', 'https://example.com:8080/',
    'https://example.com/run.exe', 'https://example.com/%64elete/item', 'https://example.com/account/',
    'https://example.com/?action=delete', 'https://example.com/?access_token=secret',
    'https://example.com/?api_key=secret', 'https://short.onion/'
  ]) assert.equal(normalizeURL(url), null, url);
  assert.ok(normalizeURL('https://example.com/research/deletion-algorithms'));
});

test('frontier deduplicates normalized URLs, rejects current page, and records discovery provenance', () => {
  const { policy } = fixture();
  policy.ingest(page('https://origin.example/', { doors: [
    { href: '/new#first', text: 'Interesting new manuscript', score: 9 },
    { href: '/new#second', text: 'Same manuscript' },
    { href: 'https://other.example/ancient', text: 'Ancient cultural archive' },
    { href: 'http://127.0.0.1/secrets', text: 'Forbidden local page' }
  ] }), { verified: true });
  assert.equal(policy.snapshot().frontierCount, 2);
  const pick = policy.choose({ currentUrl: 'https://origin.example/' });
  assert.equal(pick.url, 'https://other.example/ancient');
  assert.equal(pick.discoveredFrom, 'https://origin.example/');
  assert.equal(pick.source, 'observed-link');
});

test('new domain wins over a repeatedly explored domain with comparable candidates', () => {
  const { policy } = fixture();
  for (let i = 0; i < 4; i++) policy.ingest(page(`https://familiar.example/page${i}`), { verified: true });
  policy.enqueue([
    { url: 'https://familiar.example/next', title: 'Strange cryptographic archive', source: 'observed-link', score: 10 },
    { url: 'https://unexplored.example/archive', title: 'Strange cryptographic archive', source: 'observed-link', score: 10 }
  ]);
  const pick = policy.choose({ currentUrl: 'https://familiar.example/page3' });
  assert.equal(pick.domain, 'unexplored.example');
  assert.match(pick.reason, /new domain/);
});

test('unverified and proprioceptive frames cannot populate memory or train the policy', () => {
  const { policy } = fixture();
  assert.equal(policy.ingest(page('https://example.com/')).status, 'rejected');
  assert.equal(policy.ingest(page('https://example.com/', { domWeirdAction: 'proprioceptiveHold:no-page' }), { verified: true }).status, 'rejected');
  assert.equal(policy.snapshot().observations, 0);
  assert.equal(policy.snapshot().modelUpdates, 0);
});

test('only a dispatched destination arriving in the matching tab trains actual neural weights', () => {
  const { policy } = fixture();
  const before = Array.from(policy.model.inputWeights);
  policy.enqueue([{ url: 'https://destination.example/', title: 'Ancient symbols and strange manuscripts' }]);
  const pick = policy.choose();
  assert.equal(policy.snapshot().modelUpdates, 0, 'ranking is not learning');
  policy.markDispatched(pick, { tabId: 'correct-tab' });
  policy.ingest(page('https://unrelated.example/'), { verified: true, tabId: 'correct-tab' });
  assert.equal(policy.snapshot().modelUpdates, 0);
  const result = policy.ingest(page(pick.url), { verified: true, tabId: 'correct-tab' });
  assert.equal(result.learned, true);
  assert.equal(policy.snapshot().modelUpdates, 1);
  assert.ok(result.learning.reward > 0);
  assert.notDeepEqual(Array.from(policy.model.inputWeights), before);
  assert.equal(policy.snapshot().pending, null);
});

test('repeated polling of the same document is deduplicated without fabricated learning', () => {
  const { policy } = fixture();
  const { pick } = arrival(policy, 'https://archive.example/item');
  for (let i = 0; i < 40; i++) assert.equal(policy.ingest(page(pick.url), { verified: true, tabId: 'tab-1', concepts: ['manuscripts', 'cryptography'] }).status, 'duplicate');
  assert.equal(policy.snapshot().modelUpdates, 1);
  assert.equal(policy.snapshot().observations, 1);
  assert.equal(policy.snapshot().visitedPages, 1);
});

test('dispatched navigation failure trains once and backs off the failed candidate', () => {
  const { policy, advance } = fixture();
  policy.enqueue([{ url: 'https://broken.example/page' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 'failed-tab' });
  assert.equal(policy.failNavigation({ tabId: 'wrong-tab', url: pick.url }).status, 'ignored');
  const result = policy.failNavigation({ tabId: 'failed-tab', url: pick.url, reason: 'ERR_CONNECTION_TIMED_OUT' });
  assert.equal(result.learned, true); assert.equal(result.learning.reward, -.75);
  assert.equal(policy.choose(), null);
  assert.equal(policy.failNavigation({ tabId: 'failed-tab', url: pick.url }).status, 'ignored');
  advance(31000); assert.equal(policy.choose().url, pick.url);
  assert.equal(policy.snapshot().modelUpdates, 1);
});

test('onion candidates require fresh proxy-applied transport evidence, not a port or stale status', () => {
  const { policy, now, advance } = fixture();
  const onion = `http://${'a'.repeat(56)}.onion/archive`;
  policy.enqueue([{ url: onion, title: 'Publisher onion archive' }]);
  assert.equal(policy.choose(), null);
  assert.equal(policy.choose({ tor: { available: true, checkedAt: now() } }), null);
  const evidence = { available: true, proxyApplied: true, checkedAt: now() };
  assert.equal(policy.choose({ tor: evidence }).url, onion);
  const normalizedRoot = normalizeURL(`http://${'a'.repeat(56)}.onion./archive`);
  assert.equal(normalizedRoot.onion, true);
  assert.equal(normalizedRoot.url, onion);
  assert.equal(normalizeURL('http://short.onion./'), null);
  advance(61000); assert.equal(policy.choose({ tor: evidence }), null);
  assert.equal(policy.snapshot().visitedPages, 0, 'candidate selection is not onion reachability');
});

test('query expansion rotates search sources and uses observed concepts with explicit heuristic scope', () => {
  const { policy } = fixture();
  const engines = [
    { name: 'A', buildUrl: q => 'https://search-a.example/?q=' + encodeURIComponent(q) },
    { name: 'B', buildUrl: q => 'https://search-b.example/?q=' + encodeURIComponent(q) },
    { name: 'C', buildUrl: q => 'https://search-c.example/?q=' + encodeURIComponent(q) }
  ];
  const result = policy.expandQueries({ concepts: ['cryptography'], engines });
  assert.equal(result.added, 4);
  assert.match(result.implementation, /heuristic/);
  const candidates = policy.exportState().frontier;
  assert.equal(new Set(candidates.map(item => item.domain)).size, 3);
  assert.ok(candidates.every(item => item.query.includes('cryptography')));
  const originalURLs = new Set(candidates.map(item => item.url));
  policy.expandQueries({ concepts: ['cryptography'], engines });
  assert.equal(policy.snapshot().frontierCount, 8);
  assert.equal(policy.exportState().frontier.filter(item => originalURLs.has(item.url)).length, 4);
});

test('loading stalls recover by deadline while pause, user navigation, and Auto-Hop retain priority', () => {
  const { policy, now, advance } = fixture();
  const input = { enabled: true, pageReady: false, isLoading: true, currentUrl: 'https://slow.example/', lastStartedAt: now() };
  assert.equal(policy.navigationReadiness(input).ready, false);
  advance(26000);
  assert.equal(policy.navigationReadiness(input).ready, true);
  assert.equal(policy.navigationReadiness(input).recovery, true);
  assert.equal(policy.navigationReadiness({ ...input, enabled: false }).ready, false);
  assert.equal(policy.navigationReadiness({ ...input, paused: true }).ready, false);
  assert.equal(policy.navigationReadiness({ ...input, protectedPage: true }).ready, false);
  assert.equal(policy.navigationReadiness({ ...input, lastUserNavAt: now() }).ready, false);
});

test('verified ready pages have bounded reading dwell and missing arrival is timeout evidence', () => {
  const { policy, now, advance } = fixture();
  policy.enqueue([{ url: 'https://slow.example/' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 'slow-tab' });
  const input = { enabled: true, pageReady: true, isLoading: false, currentUrl: pick.url, lastStartedAt: now(), lastReadyAt: now() };
  assert.equal(policy.navigationReadiness(input).ready, false);
  advance(16000); assert.equal(policy.navigationReadiness(input).ready, false, 'needs verified observation');
  advance(10000);
  const recovery = policy.navigationReadiness(input);
  assert.equal(recovery.ready, true); assert.equal(recovery.recovery, true);
  assert.equal(policy.snapshot().lastReward, -.75);
  assert.equal(policy.snapshot().modelUpdates, 1);
  advance(30000);
  assert.match(policy.navigationReadiness(input).reason, /Maximum dwell/);
});

test('pause or supersession cancellation does not fabricate a learning outcome', () => {
  const { policy } = fixture();
  policy.enqueue([{ url: 'https://candidate.example/' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 3 });
  assert.equal(policy.markDispatched(pick, { tabId: 3 }).status, 'blocked');
  assert.equal(policy.cancelPending('paused').learned, false);
  assert.equal(policy.snapshot().modelUpdates, 0);
  assert.equal(policy.snapshot().pending, null);
});

test('frontier, provenance, concepts, and visits remain bounded during broad exploration', () => {
  const { policy } = fixture({ maxCandidates: 16, maxHistory: 16, maxConcepts: 32 });
  for (let i = 0; i < 70; i++) {
    policy.ingest(page(`https://archive${i}.example/page`, { title: `Manuscript${i} epigraphy${i} transmission${i}`, doors: [{ href: `https://future${i}.example/page`, text: 'Unknown historical archive' }] }), { verified: true });
  }
  assert.equal(policy.snapshot().frontierCount, 16);
  assert.equal(policy.snapshot().visitedPages, 16);
  assert.ok(policy.snapshot().visitedDomains <= 16);
  assert.ok(policy.exportState().concepts.length <= 32);
  assert.equal(policy.snapshot().recentPages.length, 8);
});

test('persistence restores exact learned tensors and bounded memories without stale navigation leases', () => {
  const { policy } = fixture();
  arrival(policy, 'https://archive.example/item');
  policy.enqueue([{ url: 'https://next.example/' }]);
  policy.markDispatched(policy.choose(), { tabId: 'in-flight' });
  const exported = policy.exportState(), { policy: restored } = fixture();
  const result = restored.restoreState(JSON.parse(JSON.stringify(exported)));
  assert.equal(result.status, 'restored');
  for (const key of Object.keys(policy.model)) assert.deepEqual(Array.from(restored.model[key]), Array.from(policy.model[key]));
  assert.equal(restored.snapshot().pending, null);
  assert.equal(restored.snapshot().visitedPages, 1);
  assert.equal(restored.choose().url, 'https://next.example/');
});

test('invalid persistence is rejected atomically before any live tensor or memory changes', () => {
  const { policy } = fixture();
  arrival(policy, 'https://archive.example/item');
  const before = JSON.stringify(policy.exportState());
  const bad = policy.exportState(); bad.model.outputWeights[2] = NaN;
  assert.throws(() => policy.restoreState(bad), /tensor/);
  assert.equal(JSON.stringify(policy.exportState()), before);
  const badMetadata = policy.exportState(); badMetadata.concepts = [['valid', -4]];
  assert.throws(() => policy.restoreState(badMetadata), /memory/);
  assert.equal(JSON.stringify(policy.exportState()), before);
});

test('evaluation does not train or mutate state, and one training outcome improves its own prediction', () => {
  const { policy } = fixture();
  policy.enqueue([{ url: 'https://training.example/', title: 'Strange manuscript archive', source: 'observed-link' }]);
  const pick = policy.choose();
  const sample = { features: pick.features, reward: .7 };
  const before = policy.evaluate([sample]);
  policy.markDispatched(pick, { tabId: 1 });
  policy.ingest(page(pick.url), { verified: true, tabId: 1 });
  const serialized = JSON.stringify(policy.exportState());
  const after = policy.evaluate([sample]);
  assert.ok(after.meanSquaredError < before.meanSquaredError, 'measured outcome changed utility prediction in its direction');
  assert.equal(JSON.stringify(policy.exportState()), serialized);
  assert.equal(dimensions.parameters, 217);
  assert.throws(() => policy.evaluate([{ features: [1], reward: 0 }]), /sample/);
});

test('preferred observed URL adds only a bounded prior and cannot create or authorize a new destination', () => {
  const { policy } = fixture();
  policy.enqueue([{ url: 'https://archive.example/a', title: 'Archive manuscript' }, { url: 'https://archive.example/b', title: 'Archive manuscript' }]);
  const baseline = policy.choose({ preferredUrl: 'https://archive.example/a' });
  const preferred = policy.choose({ preferredUrl: 'https://archive.example/b' });
  assert.equal(baseline.url, 'https://archive.example/a');
  assert.equal(preferred.url, 'https://archive.example/b');
  assert.notEqual(policy.choose({ preferredUrl: 'https://unobserved.example/' }).url, 'https://unobserved.example/');
});

test('host-attested redirects can train a matching pending request without counting arbitrary same-tab pages', () => {
  const { policy } = fixture();
  policy.enqueue([{ url: 'https://old.example/archive' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 'tab' });
  const unrelated = policy.ingest(page('https://unrelated.example/'), { verified: true, tabId: 'tab', requestedUrl: 'https://different.example/' });
  assert.equal(unrelated.learned, false);
  const redirected = policy.ingest(page('https://new.example/archive'), { verified: true, tabId: 'tab', requestedUrl: pick.url });
  assert.equal(redirected.learned, true);
  assert.equal(redirected.provenance.requestedUrl, pick.url);
  assert.equal(policy.snapshot().pending, null);
  assert.equal(policy.enqueue([{ url: pick.url }]).added, 0);
  const { policy: restored } = fixture(); restored.restoreState(policy.exportState());
  assert.equal(restored.enqueue([{ url: pick.url }]).added, 0);
});

test('research retains bounded raw excerpts with provenance and a clear unverified-claims label', () => {
  const { policy } = fixture();
  policy.ingest(page('https://archive.example/', { researchExcerpt: 'X'.repeat(3000) }), { verified: true });
  const saved = policy.exportState();
  assert.equal(saved.visits[0].excerpt.length, 2000);
  assert.equal(policy.snapshot().recentPages[0].excerpt.length, 240);
  assert.match(saved.visits[0].contentScope, /not been fact-checked/);
  const { policy: restored } = fixture(); restored.restoreState(saved);
  assert.equal(restored.exportState().visits[0].excerpt.length, 2000);
});

test('verified redirect to identical previously observed content settles once without duplicate page counts', () => {
  const { policy, advance } = fixture();
  const known = page('https://known.example/archive');
  policy.ingest(known, { verified: true, tabId: 'old-tab' });
  policy.enqueue([{ url: 'https://alias.example/archive' }]);
  const selected = policy.choose(); policy.markDispatched(selected, { tabId: 'new-tab' });
  const result = policy.ingest(known, { verified: true, tabId: 'new-tab', requestedUrl: selected.url });
  assert.equal(result.status, 'duplicate'); assert.equal(result.learned, true);
  assert.equal(result.learning.reward, -.25);
  assert.equal(policy.snapshot().pending, null); assert.equal(policy.snapshot().visitedPages, 1);
  assert.equal(policy.snapshot().observations, 1); assert.equal(policy.snapshot().modelUpdates, 1);
  advance(30000);
  policy.navigationReadiness({ enabled: true, pageReady: true, currentUrl: known.url, lastReadyAt: 100000 });
  assert.equal(policy.snapshot().modelUpdates, 1, 'settled arrival cannot receive a later timeout penalty');
  assert.equal(policy.enqueue([{ url: selected.url }]).added, 0);
});

test('persistent frontier preserves normalized salience, neural features, ranking scores and choice', () => {
  const { policy } = fixture();
  policy.enqueue([
    { url: 'https://archive.example/a', title: 'Manuscript archive', source: 'observed-link', score: 1.5 },
    { url: 'https://archive.example/z', title: 'Manuscript archive', source: 'observed-link', score: 10.5 }
  ]);
  const context = { currentUrl: 'https://origin.example/', concepts: ['manuscript'], predictionError: .4 };
  const before = policy.choose(context), saved = JSON.parse(JSON.stringify(policy.exportState()));
  assert.equal(before.url, 'https://archive.example/z');
  assert.equal(before.features[7], .875);
  const { policy: restored } = fixture(); restored.restoreState(saved);
  assert.deepEqual(restored.exportState().frontier.map(candidate => candidate.salience), [.125, .875]);
  const after = restored.choose(context);
  assert.equal(after.url, before.url);
  assert.deepEqual(after.features, before.features);
  assert.equal(after.predictedYield, before.predictedYield);
  assert.equal(after.score, before.score);
});

test('invalid persisted frontier salience is rejected before live state changes', () => {
  const { policy } = fixture();
  policy.enqueue([{ url: 'https://archive.example/', title: 'Manuscript archive', score: 6 }]);
  const before = JSON.stringify(policy.exportState());
  for (const invalid of [-.1, 1.1, NaN, Infinity, '.5', null]) {
    const bad = policy.exportState(); bad.frontier[0].salience = invalid;
    assert.throws(() => policy.restoreState(bad), /salience/);
    assert.equal(JSON.stringify(policy.exportState()), before);
  }
});

test('a redirect chain cannot restart the pending navigation deadline', () => {
  const { policy, advance, now } = fixture();
  policy.enqueue([{ url: 'https://redirect.example/start' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 'redirect-tab' });
  advance(26000);
  const result = policy.navigationReadiness({ enabled: true, pageReady: false, isLoading: true,
    currentUrl: 'https://redirect.example/hop-50', tabId: 'redirect-tab', lastStartedAt: now() - 100 });
  assert.equal(result.ready, true); assert.equal(result.recovery, true);
  assert.equal(policy.snapshot().pending, null);
  assert.equal(policy.snapshot().modelUpdates, 1);
  assert.equal(policy.snapshot().lastReward, -.75);
  const dispatchRecheck = policy.navigationReadiness({ enabled: true, pageReady: false, isLoading: true,
    currentUrl: 'https://redirect.example/hop-50', tabId: 'redirect-tab', lastStartedAt: now() - 100 });
  assert.equal(dispatchRecheck.ready, true, 'dispatch recheck retains scheduler recovery');
  assert.equal(dispatchRecheck.recovery, true);
  policy.navigationReadiness({ enabled: true, pageReady: false, isLoading: true, currentUrl: 'https://redirect.example/hop-51', lastStartedAt: now() });
  assert.equal(policy.snapshot().modelUpdates, 1, 'deadline settles once');
});

test('deadline recovery retains explicit pause, protection and manual-navigation priority', () => {
  const { policy, advance, now } = fixture();
  policy.enqueue([{ url: 'https://slow.example/' }]);
  const pick = policy.choose(); policy.markDispatched(pick, { tabId: 'tab' });
  advance(30000);
  const input = { enabled: true, pageReady: false, isLoading: true, currentUrl: pick.url, lastStartedAt: now() };
  for (const guard of [{ paused: true }, { enabled: false }, { protectedPage: true }, { pinned: true }, { lastUserNavAt: now() }]) {
    assert.equal(policy.navigationReadiness({ ...input, ...guard }).ready, false);
    assert.equal(policy.snapshot().modelUpdates, 0);
    assert.ok(policy.snapshot().pending);
  }
  assert.equal(policy.navigationReadiness(input).recovery, true);
});

test('repeated verified settled content shortens dwell without fabricating more learning', () => {
  const { policy, advance, now } = fixture();
  const documentStartedAt = now(), url = 'https://archive.example/settled';
  const options = { verified: true, tabId: 'tab', documentStartedAt };
  const input = { enabled: true, pageReady: true, isLoading: false, currentUrl: url, tabId: 'tab',
    lastStartedAt: documentStartedAt, lastReadyAt: documentStartedAt };
  policy.ingest(page(url, { researchExcerpt: 'A complete short archival entry.' }), options);
  advance(2000); policy.ingest(page(url, { researchExcerpt: 'A complete short archival entry.' }), options);
  advance(2000); policy.ingest(page(url, { researchExcerpt: 'A complete short archival entry.' }), options);
  assert.equal(policy.navigationReadiness(input).ready, false, 'still keeps the six-second observation floor');
  advance(2000);
  const result = policy.navigationReadiness(input);
  assert.equal(result.ready, true); assert.equal(result.targetDwellMs, 6000);
  assert.equal(result.progress.unchangedObservations, 2);
  assert.match(result.reason, /settled/);
  assert.equal(policy.snapshot().observations, 1); assert.equal(policy.snapshot().modelUpdates, 0);
});

test('new observed content or links retain reading time and stale/other-document progress cannot accelerate departure', () => {
  const { policy, advance, now } = fixture();
  const documentStartedAt = now(), url = 'https://archive.example/live';
  const options = { verified: true, tabId: 'tab', documentStartedAt };
  const input = { enabled: true, pageReady: true, currentUrl: url, tabId: 'tab', lastStartedAt: documentStartedAt, lastReadyAt: documentStartedAt };
  for (let i = 0; i < 4; i++) {
    policy.ingest(page(url, { researchExcerpt: 'Chapter ' + i, doors: [{ href: '/chapter-' + i }] }), options);
    if (i < 3) advance(2000);
  }
  assert.equal(policy.navigationReadiness(input).ready, false);
  advance(2000); policy.ingest(page(url, { researchExcerpt: 'Chapter 3' }), options);
  advance(2000); policy.ingest(page(url, { researchExcerpt: 'Chapter 3' }), options);
  assert.equal(policy.navigationReadiness(input).ready, true);
  assert.equal(policy.navigationReadiness({ ...input, tabId: 'different-tab' }).ready, false);
  assert.equal(policy.navigationReadiness({ ...input, lastStartedAt: documentStartedAt + 1 }).ready, false);
  advance(5001);
  assert.equal(policy.navigationReadiness({ ...input, lastReadyAt: now() - 8000 }).targetDwellMs, 15000);
  policy.restoreState(policy.exportState());
  assert.equal(policy.navigationReadiness({ ...input, lastReadyAt: now() - 8000 }).ready, false);
});

test('validated viewport exhaustion or repeated blockage shortens dwell while interaction yields', () => {
  for (const phase of ['exhausted', 'blocked', 'yielding']) {
    const { policy, now, advance } = fixture();
    const documentStartedAt = now(), url = 'https://archive.example/viewport';
    const input = { enabled: true, pageReady: true, currentUrl: url, tabId: 'tab', lastStartedAt: documentStartedAt, lastReadyAt: documentStartedAt };
    advance(7000);
    policy.ingest(page(url, { exploration: { phase, observations: 3, stagnantObservations: 2, scrollY: 1600, maxScroll: 1600 } }),
      { verified: true, tabId: 'tab', documentStartedAt });
    const result = policy.navigationReadiness(input);
    assert.equal(result.ready, phase !== 'yielding');
    assert.equal(result.progress.explorationPhase, phase);
  }
});

test('malformed or unmeasured exploration reports cannot shorten dwell', () => {
  const { policy, now, advance } = fixture();
  const documentStartedAt = now(), url = 'https://archive.example/viewport';
  advance(7000);
  const input = { enabled: true, pageReady: true, currentUrl: url, tabId: 'tab', lastStartedAt: documentStartedAt, lastReadyAt: documentStartedAt };
  for (const exploration of [
    { phase: 'exhausted' },
    { phase: 'exhausted', observations: 1, stagnantObservations: 0, scrollY: 0, maxScroll: 1600 },
    { phase: 'blocked', observations: 1, stagnantObservations: 0, scrollY: 0, maxScroll: 1600 },
    { phase: 'exhausted', observations: 2, stagnantObservations: 0, scrollY: NaN, maxScroll: 0 }
  ]) {
    policy.ingest(page(url, { researchExcerpt: JSON.stringify(exploration), exploration }), { verified: true, tabId: 'tab', documentStartedAt });
    const result = policy.navigationReadiness(input);
    assert.equal(result.ready, false); assert.equal(result.targetDwellMs, 15000);
    assert.equal(result.progress.explorationPhase, null);
  }
});

test('checkpoint restoration retains the complete frontier beyond the per-observation ingestion cap', () => {
  for (const count of [384, 1024]) {
    const { policy } = fixture({ maxCandidates: count });
    for (let offset = 0; offset < count; offset += 128) policy.enqueue(Array.from({ length: Math.min(128, count - offset) }, (_, i) => ({
      url: `https://archive${offset + i}.example/`, title: 'Unknown manuscript', score: (offset + i) % 12
    })));
    const before = policy.exportState(), { policy: restored } = fixture({ maxCandidates: count });
    assert.equal(restored.restoreState(JSON.parse(JSON.stringify(before))).frontierCount, count);
    assert.deepEqual(restored.exportState().frontier, before.frontier);
    assert.equal(restored.choose().url, policy.choose().url);
  }
});

test('live fast-forager dwell settings are honored and floors still bound misconfiguration', () => {
  const fast = create({ minDwellMs: 5000, settledDwellMs: 2500, maxDwellMs: 14000, loadTimeoutMs: 10000 });
  assert.equal(fast.minDwellMs, 5000); assert.equal(fast.settledDwellMs, 2500);
  assert.equal(fast.maxDwellMs, 14000); assert.equal(fast.loadTimeoutMs, 10000);
  const extreme = create({ minDwellMs: 1, settledDwellMs: 1, loadTimeoutMs: 1 });
  assert.equal(extreme.minDwellMs, 1500); assert.equal(extreme.settledDwellMs, 1000); assert.equal(extreme.loadTimeoutMs, 3000);
  const defaults = create();
  assert.equal(defaults.minDwellMs, 15000); assert.equal(defaults.settledDwellMs, 6000); assert.equal(defaults.loadTimeoutMs, 25000);
});
