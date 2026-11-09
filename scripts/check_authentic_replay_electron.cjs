'use strict';
// Run the installed Electron executable with ELECTRON_RUN_AS_NODE=1. This
// verification creates no windows, profiles, services, or network requests.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
if (!process.versions.electron || process.env.ELECTRON_RUN_AS_NODE !== '1') throw new Error('Use the actual Electron executable in explicit Node mode');
const { AuthenticAsmodensiusAdapter: Adapter } = require('../systems/authentic-asmodensius-adapter');
const root = path.resolve(__dirname, '..');
const files = ['systems/authentic-asmodensius-adapter.js', 'systems/generated/authentic-asmodensius.js', 'scripts/check_authentic_replay_electron.cjs'];
const report = { versions: process.versions, sourceDigest: Adapter.sourceDigest, networkRequests: 0,
  scope: 'Actual Electron embedded Node; exact saved-state continuation including forced developmental sprouting. No renderer, profile migration, or public-web claim.',
  sourceHashes: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])), cases: [] };
for (const seed of [1, 17, 31]) {
  const a = new Adapter({ seed });
  const input = Float64Array.from({ length: 16 }, (_, i) => .5 + .25 * Math.sin(i));
  for (let t = 0; t < 20; t++) a.step(input);
  a._creature.o.devTarget = a._creature.o.devSlots.length;
  const checkpoint = a.exportState(), b = new Adapter({ seed: 999 });
  const imported = b.importState(checkpoint);
  let exact = imported && b.exportState().payload === checkpoint.payload, observedSteps = 0;
  for (let t = 0; t < 120 && exact; t++) {
    a._creature.o.devRefine(); b._creature.o.devRefine();
    a.step(input); b.step(input); observedSteps++;
    exact = a.exportState().payload === b.exportState().payload;
  }
  report.cases.push({ seed, imported, error: b.lastError, exactContinuation: exact, observedSteps,
    edges: a._creature.o.syn.pre.length, affinityRows: JSON.parse(checkpoint.payload).developmentAffinity.length,
    sprouted: a._creature.o.devStats.sprouted, payloadCharacters: checkpoint.payload.length });
}
report.ok = report.cases.every(item => item.imported && item.exactContinuation && item.observedSteps === 120 && item.sprouted >= 120);
if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
process.exitCode = report.ok ? 0 : 1;
