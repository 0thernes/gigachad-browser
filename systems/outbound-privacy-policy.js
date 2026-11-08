'use strict';

class OutboundPrivacyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OutboundPrivacyError';
    this.code = code;
    this.blocksOutboundRequest = true;
  }
}

function isLoopbackEndpoint(endpoint) {
  let url;
  try { url = new URL(endpoint); } catch (_) {
    throw new OutboundPrivacyError('OUTBOUND_ENDPOINT_INVALID', 'The inference endpoint is not a valid URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new OutboundPrivacyError('OUTBOUND_ENDPOINT_INVALID', 'Inference endpoints must use HTTP(S) without URL credentials.');
  }
  const host = url.hostname.toLowerCase();
  return host === 'localhost' || host === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(host);
}

/** Build the complete provider payload before any request is sent. No I/O is performed here. */
async function prepareOutboundMessages({ endpoint, messages, piiFirewall = true, allowUnredactedImages = false, redactText }) {
  const remote = !isLoopbackEndpoint(endpoint);
  if (!Array.isArray(messages) || !messages.length) {
    throw new OutboundPrivacyError('OUTBOUND_MESSAGES_INVALID', 'Inference needs a nonempty message list.');
  }
  let redactedCount = 0;
  let imageCount = 0;
  const textCache = new Map();
  const protectText = async (text) => {
    if (typeof text !== 'string') {
      throw new OutboundPrivacyError('OUTBOUND_MESSAGES_INVALID', 'Every outbound text field must be a string.');
    }
    if (!remote || piiFirewall === false || !text) return text;
    if (textCache.has(text)) return textCache.get(text);
    let result;
    try {
      if (typeof redactText !== 'function') throw new Error('No redactor');
      result = await redactText(text);
    } catch (_) {
      throw new OutboundPrivacyError('PII_REDACTION_UNAVAILABLE', 'Remote inference was blocked because the PII firewall could not check every message. Start or repair the local sidecar and retry.');
    }
    if (!result || result.error || typeof result.redacted_text !== 'string' ||
        !Number.isInteger(result.pii_redacted_count) || result.pii_redacted_count < 0 ||
        (result.pii_redacted_count > 0 && result.redacted_text === text)) {
      throw new OutboundPrivacyError('PII_REDACTION_INVALID', 'Remote inference was blocked because the PII firewall returned an invalid redaction result.');
    }
    redactedCount += result.pii_redacted_count;
    textCache.set(text, result.redacted_text);
    return result.redacted_text;
  };

  // Validate image consent before sending even text to the local redaction service.
  for (const message of messages) {
    if (!message || !['system', 'user', 'assistant'].includes(message.role)) {
      throw new OutboundPrivacyError('OUTBOUND_MESSAGES_INVALID', 'An outbound message has an unsupported role.');
    }
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part?.type === 'image_url') {
          imageCount += 1;
          if (typeof part.image_url?.url !== 'string' || !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(part.image_url.url)) {
            throw new OutboundPrivacyError('OUTBOUND_IMAGE_INVALID', 'Only inline PNG, JPEG, WebP or GIF images are supported for inference.');
          }
          if (remote && allowUnredactedImages !== true) {
            throw new OutboundPrivacyError('CLOUD_IMAGE_CONSENT_REQUIRED', 'This request includes an image that the text PII firewall cannot redact. Explicitly allow unredacted images for this request or enable allowCloudImages in Settings, then retry.');
          }
        } else if (part?.type !== 'text') {
          throw new OutboundPrivacyError('OUTBOUND_MESSAGES_INVALID', 'An outbound message contains an unsupported content part.');
        }
      }
    } else if (typeof message.content !== 'string') {
      throw new OutboundPrivacyError('OUTBOUND_MESSAGES_INVALID', 'An outbound message has invalid content.');
    }
  }

  const protectedMessages = [];
  for (const message of messages) {
    let content;
    if (typeof message.content === 'string') {
      content = await protectText(message.content);
    } else {
      content = [];
      for (const part of message.content) {
        content.push(part.type === 'text'
          ? { type: 'text', text: await protectText(part.text) }
          : { type: 'image_url', image_url: { url: part.image_url.url } });
      }
    }
    protectedMessages.push({ role: message.role, content });
  }
  return {
    messages: protectedMessages,
    redactedCount,
    privacy: {
      destination: remote ? 'remote' : 'loopback',
      textProtection: !remote ? 'local' : piiFirewall === false ? 'disabled' : 'redacted',
      imageCount,
      unredactedImagesAllowed: remote && imageCount > 0 && allowUnredactedImages === true
    }
  };
}

module.exports = { OutboundPrivacyError, isLoopbackEndpoint, prepareOutboundMessages };
