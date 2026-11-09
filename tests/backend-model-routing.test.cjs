'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalizeOpenAiBase } = require('../config');
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const modelSource = source.slice(source.indexOf('const NON_CHAT_MODEL_RE ='), source.indexOf('async function queryRouter('));
function harness(rows) {
  const requests = [];
  const sandbox = { URL, Date, cfg: { llmBaseUrl: 'http://127.0.0.1:11111/v1', llmApiKey: 'fixture-key', localModel: 'fixture-local', omniModel: 'fixture-vision' },
    normalizeOpenAiBase, fetchJson: async (url, init) => { requests.push({ url, init }); return { ok: true, data: { data: rows } }; } };
  vm.createContext(sandbox); vm.runInContext(modelSource, sandbox);
  return { sandbox, requests };
}
test('model catalog ranks only returned chat models and explicit preferences', async () => {
  const { sandbox } = harness([{ id: 'z-other' }, { id: 'fixture-vision' }, { id: 'fixture-local', status: { value: 'loaded' } }, { id: 'nomic-embed-fixture' }]);
  const out = await sandbox.listLocalModels();
  assert.deepEqual(Array.from(out.models), ['fixture-local', 'fixture-vision', 'z-other']);
  assert.equal(out.loadedModel, 'fixture-local');
  assert.equal(out.visionModel, 'fixture-vision');
});
test('all-embedding catalogs cannot become a chat fallback', async () => {
  const { sandbox } = harness([{ id: 'nomic-embed-only' }]);
  const out = await sandbox.listLocalModels();
  assert.equal(out.models.length, 0);
  assert.equal(out.visionModel, '');
});
test('model catalog never forwards stored API key to a different endpoint origin', async () => {
  const { sandbox, requests } = harness([{ id: 'fixture-local' }]);
  await sandbox.listLocalModels();
  await sandbox.listLocalModels('http://127.0.0.1:22222/v1');
  await sandbox.listLocalModels('https://other.example.test/v1');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer fixture-key');
  assert.equal(requests[1].init.headers.Authorization, undefined);
  assert.equal(requests[2].init.headers.Authorization, undefined);
});
test('unknown text-only model does not imply a vision model', async () => {
  const { sandbox } = harness([{ id: 'fixture-text-model' }]);
  const out = await sandbox.listLocalModels();
  assert.equal(out.visionModel, '');
});
