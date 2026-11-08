'use strict';

/** Authorize only the current application top frame, never another frame sharing its process. */
function isTrustedChromeSender(event, window, isTrustedDocument) {
  try {
    if (!event || !window || window.isDestroyed()) return false;
    const contents = window.webContents;
    const frame = event.senderFrame;
    return Boolean(contents && !contents.isDestroyed() && event.sender === contents &&
      frame && frame === contents.mainFrame && frame.parent == null && frame.detached !== true &&
      isTrustedDocument(frame.url) && isTrustedDocument(contents.getURL()));
  } catch (_) {
    return false;
  }
}

module.exports = { isTrustedChromeSender };
