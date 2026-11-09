'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planResearch, normalizeProposal, localEndpoint } = require('../systems/alive-research-planner.cjs');
const response = value => new Response(JSON.stringify(value), { status: 200 });
const payload = { observation: { url: 'https://archive.example/odd', title: 'Signal archive', excerpt: 'An unusual radio archive.', observedAt: 123 }, candidates: [{ url: 'https://other.example/signals', title: 'Signals' }] };
test('autonomous planner cannot send observations to remote or credentialed endpoints', async () => {
  for (const llmBaseUrl of ['https://api.example/v1', 'http://127.0.0.1.evil.example/v1', 'http://user:secret@localhost/v1', 'file:///v1']) {
    let calls = 0;
    const result = await planResearch({ cfg: { llmBaseUrl }, payload, fetchImpl: async () => { calls++; } });
    assert.equal(result.status, 'unavailable'); assert.equal(calls, 0);
  }
  assert.ok(localEndpoint('http://[::1]:1234/v1'));
});
test('planner discovers configured server model and returns bounded proposals without executing model URLs', async () => {
  const calls = [];
  const result = await planResearch({ cfg: { llmBaseUrl: 'http://localhost:1234/v1/' }, payload,
    fetchImpl: async (url, opts) => {
      calls.push({ url: String(url), opts });
      return calls.length === 1 ? response({ data: [{ id: 'fixture-local-model' }] }) : response({ model: 'fixture-local-model', choices: [{ message: { content: JSON.stringify({ goal: 'Find unusual signals', queries: ['numbers stations archive', 'numbers stations archive', 'https://bad.example'], preferredUrl: 'https://not-observed.example' }) } }] });
    } });
  assert.equal(result.status, 'completed'); assert.equal(result.model, 'fixture-local-model');
  assert.deepEqual(result.proposal.queries, ['numbers stations archive']); assert.equal(result.proposal.preferredUrl, null);
  assert.equal(calls.length, 2); assert.equal(calls[1].opts.redirect, 'error');
  assert.equal(JSON.parse(calls[1].opts.body).model, 'fixture-local-model');
  assert.equal(result.sourceUrl, payload.observation.url);
});
test('configured model is honored and missing/malformed providers never become a fake model success', async () => {
  let calls = 0;
  const result = await planResearch({ cfg: { llmBaseUrl: 'http://127.0.0.1:1234/v1', localModel: 'chosen' }, payload,
    fetchImpl: async (_url, opts) => { calls++; assert.equal(JSON.parse(opts.body).model, 'chosen'); return response({ choices: [{ message: { content: 'not json' } }] }); } });
  assert.equal(result.status, 'unavailable'); assert.equal(calls, 1);
  const empty = await planResearch({ cfg: { llmBaseUrl: 'http://localhost:1234/v1' }, payload, fetchImpl: async () => response({ data: [] }) });
  assert.equal(empty.status, 'unavailable');
});
test('only a provided candidate URL survives proposal validation', () => {
  const result = normalizeProposal('```json\n{"queries":["strange radio artifacts"],"preferredUrl":"https://other.example/signals"}\n```', payload.candidates);
  assert.equal(result.preferredUrl, payload.candidates[0].url);
  assert.throws(() => normalizeProposal('{"queries":[]}', []));
});
test('response budget and cancellation produce explicit failures', async () => {
  const cfg = { llmBaseUrl: 'http://localhost:1234/v1', localModel: 'chosen' };
  const oversized = await planResearch({ cfg, payload, fetchImpl: async () => new Response('x'.repeat(60 * 1024)) });
  assert.equal(oversized.status, 'unavailable'); assert.match(oversized.reason, /budget/);
  const abort = new AbortController(); abort.abort();
  const cancelled = await planResearch({ cfg, payload, signal: abort.signal, fetchImpl: async (_url, options) => { options.signal.throwIfAborted(); } });
  assert.equal(cancelled.status, 'timeout');
});

test('large observed frontiers cannot exhaust the local model input budget', async () => {
  const oversized = { observation: { ...payload.observation, excerpt: 'x'.repeat(20000) },
    candidates: Array.from({ length: 32 }, (_, i) => ({ url: 'https://archive.example/' + i + '?q=' + 'x'.repeat(2000), title: 'x'.repeat(160) })),
    recent: Array.from({ length: 12 }, () => ({ url: 'https://archive.example/?q=' + 'x'.repeat(2000), title: 'x'.repeat(120) })) };
  const result = await planResearch({ cfg: { llmBaseUrl: 'http://localhost:1234/v1', localModel: 'chosen' }, payload: oversized,
    fetchImpl: async (_url, options) => {
      const request = JSON.parse(options.body);
      assert.ok(request.messages[1].content.length <= 12000);
      assert.equal(JSON.parse(request.messages[1].content).observation.url, payload.observation.url);
      return response({ choices: [{ message: { content: '{"queries":["unusual radio archives"]}' } }] });
    } });
  assert.equal(result.status, 'completed');
});
