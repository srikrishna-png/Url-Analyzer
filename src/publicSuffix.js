/**
 * publicSuffix.js
 * Accurately parses domain hierarchies using the Public Suffix List (via tldts).
 * Correctly distinguishes ccTLDs (e.g. co.uk, com.au) and platform suffixes (github.io, pages.dev).
 */

import { parse as tldtsParse } from 'tldts';
import { decodeObfuscatedIp } from './normalizer.js';

export function parseDomainHierarchy(urlInput) {
  let u;
  try {
    u = new URL(urlInput);
  } catch (err) {
    return { error: 'Invalid URL format: ' + err.message };
  }

  const rawHost = u.hostname;
  const ipCheck = decodeObfuscatedIp(rawHost);
  const effectiveHost = ipCheck.isObfuscated ? ipCheck.decoded : rawHost;

  const parsed = tldtsParse(effectiveHost, { allowPrivateDomains: true });

  const isIp = parsed.isIp || ipCheck.isObfuscated;
  const registeredDomain = isIp ? effectiveHost : (parsed.domain || effectiveHost);
  const subdomain = isIp ? '' : (parsed.subdomain || '');
  const publicSuffix = isIp ? '' : (parsed.publicSuffix || '');
  const domainWithoutSuffix = isIp ? effectiveHost : (registeredDomain.replace(new RegExp(`\\.${publicSuffix}$`), ''));

  return {
    rawUrl: urlInput,
    protocol: u.protocol.replace(':', ''),
    username: u.username,
    password: u.password,
    hostname: rawHost,
    effectiveHost,
    port: u.port || (u.protocol === 'https:' ? '443' : '80'),
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    subdomain,
    registeredDomain,
    publicSuffix,
    domainWithoutSuffix,
    isIp,
    isObfuscatedIp: ipCheck.isObfuscated,
    obfuscatedIpType: ipCheck.type,
    isIcann: parsed.isIcann,
    isPrivateDomain: parsed.isPrivate // true for pages.dev, github.io, web.app
  };
}
