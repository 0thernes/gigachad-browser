const assert = require('assert');
const { parseAgentReply, explainAction } = require('../agent-actions');

const click = parseAgentReply('Sure.\n```json\n{"action":"click","mark":"12","reason":"search"}\n```');
assert.equal(click.error, null);
assert.equal(click.actions[0].action, 'click');
assert.equal(click.actions[0].mark, 12);

const raw = parseAgentReply('{"action":"goto","url":"example.com"}');
assert.equal(raw.actions[0].action, 'navigate');
assert.equal(raw.actions[0].url, 'https://example.com/');

const blocked = parseAgentReply('```json\n{"action":"navigate","url":"javascript:alert(1)"}\n```');
assert.ok(blocked.error && blocked.error.includes('http'));
assert.equal(blocked.actions.length, 0);

const broken = parseAgentReply('```json\n{"action":"click",}\n```');
assert.equal(broken.actions[0].action, 'click');

const invalid = parseAgentReply('```json\n{not json}\n```');
assert.ok(invalid.error);
assert.equal(invalid.actions.length, 0);

const prose = parseAgentReply('The page is a document about ports. No click is required.');
assert.equal(prose.error, null);
assert.equal(prose.actions.length, 0);

const scroll = parseAgentReply('{"action":"scroll","direction":"up"}');
assert.equal(scroll.actions[0].direction, 'up');

const extra = parseAgentReply('{"actions":[{"action":"type","mark":2,"text":"hi","pressEnter":false},{"action":"scroll","direction":"down"}]}');
assert.equal(extra.actions.length, 1);
assert.equal(extra.actions[0].action, 'type');
assert.equal(extra.actions[0].pressEnter, false);
assert.equal(extra.ignored, 1);

const done = parseAgentReply('```json\n{"action":"done","summary":"finished"}\n```');
assert.equal(done.actions[0].action, 'done');
assert.equal(done.actions[0].summary, 'finished');

const keyCmd = parseAgentReply('{"action":"key","key":"escape"}');
assert.equal(keyCmd.actions[0].action, 'press_key');
assert.equal(keyCmd.actions[0].key, 'Escape');
assert.ok(explainAction(keyCmd.actions[0]).includes('Press Escape'));

const waitCmd = parseAgentReply('{"action":"wait","ms":99999}');
assert.equal(waitCmd.actions[0].action, 'wait');
assert.equal(waitCmd.actions[0].ms, 5000);

const hoverCmd = parseAgentReply('{"action":"hover","mark":4,"reason":"open menu"}');
assert.equal(hoverCmd.actions[0].action, 'hover');
assert.equal(hoverCmd.actions[0].mark, 4);

const openTabCmd = parseAgentReply('{"action":"open_tab","url":"news.ycombinator.com"}');
assert.equal(openTabCmd.actions[0].action, 'open_tab');
assert.equal(openTabCmd.actions[0].url, 'https://news.ycombinator.com/');

const memCmd = parseAgentReply('{"action":"save_memory","title":"HN Key Takeaway","content":"Rust kernel drivers"}');
assert.equal(memCmd.actions[0].action, 'save_memory');
assert.equal(memCmd.actions[0].title, 'HN Key Takeaway');

const dlLinksCmd = parseAgentReply('{"action":"download_links","filter":"pdf"}');
assert.equal(dlLinksCmd.actions[0].action, 'download_links');
assert.equal(dlLinksCmd.actions[0].filter, 'pdf');

const dragCmd = parseAgentReply('{"action":"drag","mark":2,"toMark":5,"reason":"move card"}');
assert.equal(dragCmd.actions[0].action, 'drag');
assert.equal(dragCmd.actions[0].mark, 2);
assert.equal(dragCmd.actions[0].toMark, 5);

const watchCmd = parseAgentReply('{"action":"watch_page","url":"example.com/pricing","intervalSec":45,"goal":"Alert on price drop"}');
assert.equal(watchCmd.actions[0].action, 'watch_page');
assert.equal(watchCmd.actions[0].intervalSec, 45);
assert.equal(watchCmd.actions[0].goal, 'Alert on price drop');

const makeCmd = parseAgentReply('{"action":"make_artifact","title":"ROI Calculator","html":"<h1>ROI</h1>"}');
assert.equal(makeCmd.actions[0].action, 'make_artifact');
assert.equal(makeCmd.actions[0].title, 'ROI Calculator');

const formCmd = parseAgentReply('{"action":"fill_form","fields":{"email":"user@example.com","name":"Ada"}}');
assert.equal(formCmd.actions[0].action, 'fill_form');
assert.equal(formCmd.actions[0].fields.email, 'user@example.com');

const blockedWatchJs = parseAgentReply('{"action":"watch_page","url":"javascript:alert(1)","intervalSec":60}');
assert.ok(blockedWatchJs.error && blockedWatchJs.error.includes('http'), 'watch_page must reject javascript: URLs');
assert.equal(blockedWatchJs.actions.length, 0);

const blockedWatchFile = parseAgentReply('{"action":"watch_page","url":"file:///etc/passwd","intervalSec":60}');
assert.ok(blockedWatchFile.error && blockedWatchFile.error.includes('http'), 'watch_page must reject file: URLs');
assert.equal(blockedWatchFile.actions.length, 0);

const nanCoords = parseAgentReply('{"action":"click","mark":3,"x":"not-a-number","y":"NaN"}');
assert.equal(nanCoords.actions[0].action, 'click');
assert.equal(nanCoords.actions[0].x, undefined, 'Non-finite x coordinate must not become NaN');
assert.equal(nanCoords.actions[0].y, undefined, 'Non-finite y coordinate must not become NaN');

console.log('agent action smoke passed');
