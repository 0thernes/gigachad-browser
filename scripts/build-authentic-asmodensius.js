'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = name => path.relative(root, name).replaceAll('\\', '/');
const bundlePath = path.join(root, 'systems/generated/authentic-asmodensius.js');
const manifestPath = path.join(root, 'systems/generated/authentic-asmodensius.manifest.json');
const options = {
  absWorkingDir: root, entryPoints: ['systems/authentic-asmodensius-entry.ts'],
  bundle: true, platform: 'browser', format: 'iife', globalName: 'GigachadAsmodensiusSource',
  target: 'es2022', define: {process: 'undefined'}, external: ['fs', 'os', 'perf_hooks'],
  minify: false, charset: 'utf8', legalComments: 'inline', metafile: true, write: false,
  outfile: bundlePath
};
const result = esbuild.buildSync(options);
const inputs = Object.keys(result.metafile.inputs).sort().map(file => {
  const bytes = fs.readFileSync(path.resolve(root, file));
  return {path: file.replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes)};
});
const noticePaths = ['brains/asmodensius-v40/LICENSE'];
const notices = noticePaths.map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  return {path: file, bytes: bytes.length, sha256: hash(bytes), text: bytes.toString('utf8')};
});
const sourceDigest = hash(Buffer.from(JSON.stringify({inputs, notices})));
const footer = `\nGigachadAsmodensiusSource.sourceDigest = ${JSON.stringify(sourceDigest)};\n` +
  'globalThis.GigachadAsmodensiusSource = GigachadAsmodensiusSource;\n' +
  "if (typeof module !== 'undefined' && module.exports) module.exports = GigachadAsmodensiusSource;\n";
const notice = notices.map(n => '/* Original donor notice: ' + n.path + '\n' + n.text.replaceAll('*/', '* /') + '\n*/\n').join('');
const output = notice + result.outputFiles[0].text + footer;
const manifest = {
  schema: 'gigachad.authentic-asmodensius.build.v1', compiler: {name: 'esbuild', version: esbuild.version},
  profile: 'original-v40-seeded-synthetic', sourceDigest,
  timeContract: 'One original organism tick is one simulated minute; host scheduler advances at most one tick each 250 ms of active animation time.',
  transformations: ['TypeScript compilation and bundling only; donor bytes unchanged.', 'process is undefined: donor environment overrides and Node live/file entropy modes are unavailable.'],
  inputs, notices, output: {path: relative(bundlePath), bytes: Buffer.byteLength(output), sha256: hash(Buffer.from(output))}
};
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(bundlePath) || !fs.existsSync(manifestPath) || fs.readFileSync(bundlePath, 'utf8') !== output || fs.readFileSync(manifestPath, 'utf8') !== manifestText) {
    throw new Error('Authentic Asmodensius build is stale. Run npm run build:brains.');
  }
} else {
  fs.mkdirSync(path.dirname(bundlePath), {recursive: true});
  fs.writeFileSync(bundlePath, output);
  fs.writeFileSync(manifestPath, manifestText);
}
console.log(JSON.stringify({ok:true,sourceDigest,inputFiles:inputs.length,bundleBytes:Buffer.byteLength(output),checked:process.argv.includes('--check')}));
