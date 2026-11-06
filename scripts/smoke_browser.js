const assert = require('assert');
const {
  isHttpUrl,
  addHistory,
  toggleBookmark,
  sanitizeSession,
  filterBookmarks,
  filterHistory,
  recordClosedTab,
  popClosedTab,
  suggestOmnibox,
  sortTabsByPinned
} = require('../browser-data');

assert.equal(isHttpUrl('https://example.com/a'), true);
assert.equal(isHttpUrl('javascript:alert(1)'), false);
assert.equal(isHttpUrl('file:///tmp/x'), false);

let history = addHistory([], { url: 'https://example.com', title: 'Example' });
history = addHistory(history, { url: 'https://example.com/2', title: 'Two' });
history = addHistory(history, { url: 'javascript:alert(1)', title: 'nope' });
assert.equal(history.length, 2);
assert.equal(history[0].url, 'https://example.com/2');
history = addHistory(history, { url: 'https://example.com', title: 'Example again' });
assert.equal(history.filter((row) => row.url === 'https://example.com').length, 1);
assert.equal(history[0].title, 'Example again');

const added = toggleBookmark([], { url: 'https://example.com/docs', title: 'Docs' });
assert.equal(added.added, true);
assert.equal(added.list.length, 1);
const removed = toggleBookmark(added.list, { url: 'https://example.com/docs', title: 'Docs' });
assert.equal(removed.added, false);
assert.equal(removed.list.length, 0);
const rejected = toggleBookmark([], { url: 'file:///etc/passwd', title: 'no' });
assert.equal(rejected.added, false);
assert.ok(rejected.error);

const session = sanitizeSession([
  { url: 'https://example.com', title: 'Keep' },
  { url: 'javascript:alert(1)', title: 'Drop' },
  { url: 'not a url', title: 'Drop' }
]);
assert.deepEqual(session, [{ url: 'https://example.com', title: 'Keep' }]);

assert.equal(filterBookmarks([{ url: 'https://github.com', title: 'GitHub' }, { url: 'https://arxiv.org', title: 'ArXiv' }], 'git').length, 1);
assert.equal(filterHistory(history, 'two').length, 1);

let closed = recordClosedTab([], { url: 'https://news.ycombinator.com', title: 'Hacker News' });
closed = recordClosedTab(closed, { url: 'file:///local', title: 'Ignored' });
assert.equal(closed.length, 1);
const popped = popClosedTab(closed);
assert.equal(popped.tab.url, 'https://news.ycombinator.com');
assert.equal(popped.stack.length, 0);

const suggestions = suggestOmnibox('git', {
  tabs: [{ id: 't1', title: 'GitHub Repo', url: 'https://github.com/org/repo' }],
  bookmarks: [{ title: 'GitLab', url: 'https://gitlab.com' }],
  history: [{ title: 'Git Docs', url: 'https://git-scm.com/doc' }]
});
assert.equal(suggestions.length, 3);
assert.equal(suggestions[0].kind, 'tab');

const sessionWithPinned = sanitizeSession([
  { url: 'https://github.com', title: 'GitHub', pinned: true, muted: true, workspace: 'Dev' }
]);
assert.deepEqual(sessionWithPinned, [{ url: 'https://github.com', title: 'GitHub', pinned: true, muted: true, workspace: 'Dev' }]);
const ordered = sortTabsByPinned([{ id: '1', pinned: false }, { id: '2', pinned: true }]);
assert.equal(ordered[0].id, '2');

console.log('browser data smoke passed');
