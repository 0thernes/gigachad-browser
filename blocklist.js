const fs = require('fs');
const path = require('path');

function parseFilterFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return { block: [], allow: [] };
  const block = [];
  const allow = [];
  const text = fs.readFileSync(filePath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim().toLowerCase();
    if (!line) continue;
    if (line.startsWith('@@')) {
      const pattern = line.slice(2).trim();
      if (pattern.length >= 4) allow.push(pattern);
      continue;
    }
    if (line.length >= 4) block.push(line);
  }
  return { block, allow };
}

function loadBlocklist(filePath) {
  const target = filePath || path.join(__dirname, 'tracker-blocklist.txt');
  return parseFilterFile(target).block;
}

function loadFilters(blockFiles, allowFiles) {
  const block = [];
  const allow = [];
  for (const file of blockFiles || []) {
    const parsed = parseFilterFile(file);
    block.push(...parsed.block);
    allow.push(...parsed.allow);
  }
  for (const file of allowFiles || []) {
    const parsed = parseFilterFile(file);
    allow.push(...parsed.block, ...parsed.allow);
  }
  return { block, allow };
}

const compiledCache = new WeakMap();

function getCompiledRegex(list) {
  if (!Array.isArray(list) || !list.length) return null;
  if (compiledCache.has(list)) return compiledCache.get(list);
  const escaped = list
    .filter((p) => typeof p === 'string' && p.length > 0)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = escaped.length ? new RegExp(escaped.join('|'), 'i') : null;
  compiledCache.set(list, re);
  return re;
}

function isTrackerUrl(url, patterns, allow) {
  const haystack = String(url || '').toLowerCase();
  if (!haystack) return false;
  const allowRe = getCompiledRegex(allow);
  if (allowRe && allowRe.test(haystack)) return false;
  const blockRe = getCompiledRegex(patterns);
  return Boolean(blockRe && blockRe.test(haystack));
}

module.exports = { loadBlocklist, loadFilters, parseFilterFile, isTrackerUrl };
