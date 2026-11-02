/**
 * normalizer.js
 * Handles URL canonicalization, defanging reversal, IP decoding (hex/decimal/octal),
 * double-encoding revelation, and text/email URL extraction.
 */

import { parse as parseDomain } from 'tldts';

// Refang defanged indicators commonly used in security writeups / emails
export function refangUrl(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.trim();

  // Remove wrapping brackets or quotes e.g. <https://...> or "https://..."
  s = s.replace(/^[<"'\`]|([>"'\`]$)/g, '');

  // hxxp / hxxps / fxp
  s = s.replace(/^hxxps/i, 'https')
       .replace(/^hxxp/i, 'http')
       .replace(/^fxp/i, 'ftp');

  // [.] or (.) or {.} -> .
  s = s.replace(/\[\.\]|\(\.\)|\{\.\}/g, '.');

  // [:] or (:) -> :
  s = s.replace(/\[:\]|\(:\)/g, ':');

  // [//] or (//) -> //
  s = s.replace(/\[\/\/\]|\(\/\/\)/g, '//');

  // backslashes instead of forward slashes
  s = s.replace(/^https?:\\{1,2}/i, m => m.replace(/\\/g, '/'));

  // If missing protocol but looks like domain, prepend https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s) && !s.startsWith('data:') && !s.startsWith('javascript:')) {
    s = 'https://' + s;
  }

  return s;
}

// Defang a URL for safe sharing
export function defangUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  return urlStr
    .replace(/^https/i, 'hxxps')
    .replace(/^http/i, 'hxxp')
    .replace(/\./g, '[.]')
    .replace(/:\/\//g, '[://]');
}

// Convert obfuscated IP representations (hex, decimal, octal, dotted-hex) to standard dotted-decimal
export function decodeObfuscatedIp(hostname) {
  if (!hostname) return { isObfuscated: false, original: hostname, decoded: hostname };
  const h = hostname.trim();

  // 1. Single 32-bit Integer / Decimal IP (e.g., 2130706433 = 127.0.0.1)
  if (/^\d{8,11}$/.test(h)) {
    const num = parseInt(h, 10);
    if (num >= 0 && num <= 4294967295) {
      const b1 = (num >>> 24) & 255;
      const b2 = (num >>> 16) & 255;
      const b3 = (num >>> 8) & 255;
      const b4 = num & 255;
      return { isObfuscated: true, type: 'decimal-ip', original: h, decoded: `${b1}.${b2}.${b3}.${b4}` };
    }
  }

  // 2. Single 32-bit Hex IP (e.g., 0x7f000001)
  if (/^0x[0-9a-f]{8}$/i.test(h)) {
    const num = parseInt(h, 16);
    const b1 = (num >>> 24) & 255;
    const b2 = (num >>> 16) & 255;
    const b3 = (num >>> 8) & 255;
    const b4 = num & 255;
    return { isObfuscated: true, type: 'hex-ip', original: h, decoded: `${b1}.${b2}.${b3}.${b4}` };
  }

  // 3. Dotted Hex / Octal parts (e.g. 0x7f.0.0.1 or 0177.0.0.1)
  const parts = h.split('.');
  if (parts.length === 4) {
    let hasObfuscation = false;
    const decodedParts = [];
    for (const part of parts) {
      if (/^0x[0-9a-f]+$/i.test(part)) {
        hasObfuscation = true;
        decodedParts.push(parseInt(part, 16));
      } else if (/^0\d+$/.test(part) && part !== '0') {
        hasObfuscation = true;
        decodedParts.push(parseInt(part, 8));
      } else if (/^\d+$/.test(part)) {
        decodedParts.push(parseInt(part, 10));
      } else {
        return { isObfuscated: false, original: h, decoded: h };
      }
    }
    if (hasObfuscation && decodedParts.every(p => p >= 0 && p <= 255)) {
      return { isObfuscated: true, type: 'mixed-hex-octal-ip', original: h, decoded: decodedParts.join('.') };
    }
  }

  return { isObfuscated: false, original: h, decoded: h };
}

// Multi-level URL percent-decoding to uncover double-encoded strings
export function decodeMultiPercent(str) {
  if (!str || typeof str !== 'string') return { decoded: '', layers: 0 };
  let current = str;
  let layers = 0;
  while (layers < 5) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
      layers++;
    } catch {
      break;
    }
  }
  return { decoded: current, layers };
}

// Extract all candidate URLs from an email, SMS, or raw message text
export function extractUrlsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const found = new Set();

  // Pattern for explicit URLs (http, https, hxxp, etc.)
  const explicitRegex = /(?:https?|hxxps?|ftp|fxp):\/\/[^\s<>"'{}|\\^`\[\]]+/gi;
  let match;
  while ((match = explicitRegex.exec(text)) !== null) {
    found.add(match[0]);
  }

  // Pattern for defanged domains with paths (e.g. example[.]com/login or bad(.)site.xyz)
  const defangedRegex = /[a-zA-Z0-9-]+\s*(?:\[\.\]|\(\.\)|\{\.\})\s*[a-zA-Z0-9-.]+(?:\/[^\s<>"'{}|\\^`\[\]]*)?/gi;
  while ((match = defangedRegex.exec(text)) !== null) {
    found.add(match[0]);
  }

  // Pattern for bare common domains with tlds e.g. login-secure.xyz/verify
  const bareRegex = /\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|xyz|top|info|biz|ru|cn|online|site|app|cc|co|io|me|tk|ga|ml|cf|gq)(?:\/[^\s<>"'{}|\\^`\[\]]*)?/gi;
  while ((match = bareRegex.exec(text)) !== null) {
    const raw = match[0];
    if (![...found].some(existing => existing.includes(raw))) {
      found.add(raw);
    }
  }

  // Refang and normalize all extracted candidates
  return Array.from(found).map(raw => {
    const clean = refangUrl(raw);
    return {
      rawSnippet: raw,
      url: clean
    };
  });
}
