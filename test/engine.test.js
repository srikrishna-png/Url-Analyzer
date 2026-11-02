import test from 'node:test';
import assert from 'node:assert/strict';

import { refangUrl, defangUrl, decodeObfuscatedIp, extractUrlsFromText } from '../src/normalizer.js';
import { parseDomainHierarchy } from '../src/publicSuffix.js';
import { unwrapTrackingLink } from '../src/redirectTracer.js';
import { generateVariants } from '../src/lookalikeGenerator.js';
import { calculateComprehensiveRisk } from '../src/scoringEngine.js';

test('URL Normalizer: Refanging and Defanging', () => {
  const defanged = 'hxxps://login-alert.paypal[.]com/verify';
  const refanged = refangUrl(defanged);
  assert.equal(refanged, 'https://login-alert.paypal.com/verify');

  const backToDefanged = defangUrl(refanged);
  assert.equal(backToDefanged, 'hxxps[://]login-alert[.]paypal[.]com/verify');

  const bare = 'google.com/search?q=test';
  assert.equal(refangUrl(bare), 'https://google.com/search?q=test');
});

test('URL Normalizer: Obfuscated IP Decoding', () => {
  // Decimal IP 2130706433 -> 127.0.0.1
  const dec = decodeObfuscatedIp('2130706433');
  assert.equal(dec.isObfuscated, true);
  assert.equal(dec.decoded, '127.0.0.1');

  // Hex IP 0x7f000001 -> 127.0.0.1
  const hex = decodeObfuscatedIp('0x7f000001');
  assert.equal(hex.isObfuscated, true);
  assert.equal(hex.decoded, '127.0.0.1');

  // Standard domain -> not obfuscated
  const dom = decodeObfuscatedIp('example.com');
  assert.equal(dec.isObfuscated, true);
  assert.equal(dom.isObfuscated, false);
});

test('URL Normalizer: Extract URLs from raw email / text', () => {
  const emailText = `
    Urgent Security Notice from your IT Dept:
    Please click here: https://support.company.com/reset or visit our emergency portal
    at hxxps://emergency-portal[.]xyz/auth before 5 PM.
    Also check google.com for announcements.
  `;
  const extracted = extractUrlsFromText(emailText);
  assert.ok(extracted.length >= 2, `Expected at least 2 extracted links, got ${extracted.length}`);
  const urls = extracted.map(e => e.url);
  assert.ok(urls.some(u => u.includes('support.company.com')));
  assert.ok(urls.some(u => u.includes('emergency-portal.xyz')));
});

test('Public Suffix Hierarchy Breakdown', () => {
  const parsed = parseDomainHierarchy('https://secure.banking.chase.co.uk/portal/login?session=123');
  assert.equal(parsed.protocol, 'https');
  assert.equal(parsed.subdomain, 'secure.banking');
  assert.equal(parsed.registeredDomain, 'chase.co.uk');
  assert.equal(parsed.publicSuffix, 'co.uk');
  assert.equal(parsed.pathname, '/portal/login');
});

test('Redirect Tracer: Wrapper Unmasking', () => {
  const safeLink = 'https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Ffinaldestination.com%2Fwelcome&data=05';
  const unwrapped = unwrapTrackingLink(safeLink);
  assert.equal(unwrapped.unwrapped, true);
  assert.equal(unwrapped.target, 'https://finaldestination.com/welcome');

  const googleRedirect = 'https://www.google.com/url?q=https://destination.org/path&sa=D';
  const googleUnwrapped = unwrapTrackingLink(googleRedirect);
  assert.equal(googleUnwrapped.unwrapped, true);
  assert.equal(googleUnwrapped.target, 'https://destination.org/path');
});

test('Lookalike Permutation Generator', () => {
  const variants = generateVariants('paypal.com');
  assert.ok(variants.length > 5, 'Should generate multiple variants');
  const domains = variants.map(v => v.domain);
  // Should include omission variants like paypl.com or tld swaps like paypal.net
  assert.ok(domains.includes('paypl.com') || domains.includes('paypal.net'));
});

import { evaluateDomainReputation } from '../src/threatIntelligence.js';

test('Threat Intelligence: Darknet Tor2Web & Onion Gateway Detection', () => {
  const rep = evaluateDomainReputation('onion.to', 'zjfq4lnfbs7pncr5.onion.to', 'https://zjfq4lnfbs7pncr5.onion.to');
  assert.ok(rep.findings.some(f => f.type === 'darknet-tor-gateway'));
  assert.ok(rep.riskPenalty >= 50);

  const direct = evaluateDomainReputation('onion', 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion', 'http://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion');
  assert.ok(direct.findings.some(f => f.type === 'darknet-tor-gateway'));
});

test('Threat Intelligence: Phishing Kit & Brand In Path Detection', () => {
  const kitUrl = 'http://www.dghjdgf.com/paypal.co.uk/cycgi-bin/webscrcmd=_home-customer&nav=1/loading.php';
  const rep = evaluateDomainReputation('dghjdgf.com', 'www.dghjdgf.com', kitUrl);
  assert.ok(rep.findings.some(f => f.type === 'brand-in-path-spoof'));
  assert.ok(rep.findings.some(f => f.type === 'phishing-kit-signature'));
  assert.ok(rep.findings.some(f => f.type === 'dga-linguistic-anomaly'));
  assert.ok(rep.riskPenalty >= 90);
});

test('Comprehensive Scoring Engine', () => {
  // Test Legitimate Official Brand
  const legitResult = calculateComprehensiveRisk({
    domainHierarchy: { isIp: false, isObfuscatedIp: false, protocol: 'https', registeredDomain: 'paypal.com' },
    redirectInfo: { chain: [{ statusCode: 200 }] },
    dnsInfo: { hasDns: true, mx: [{ exchange: 'mail.paypal.com' }] },
    tlsInfo: { supported: true, isExpired: false, certAgeDays: 300, issuer: 'DigiCert' },
    contentInfo: { forms: [], sensitiveInputs: { passwordCount: 0 }, exfiltrationRisks: [] },
    reputationInfo: { status: 'official-brand', brand: 'PayPal' }
  });
  assert.equal(legitResult.verdictLevel, 'safe');
  assert.ok(legitResult.score < 25);

  // Test Cloud-hosted Phishing Attack
  const phishResult = calculateComprehensiveRisk({
    domainHierarchy: { isIp: false, isObfuscatedIp: false, protocol: 'https', registeredDomain: 'pages.dev', hostname: 'paypal-verify.pages.dev' },
    redirectInfo: { chain: [{ statusCode: 200 }] },
    dnsInfo: { hasDns: true, mx: [] },
    tlsInfo: { supported: true, isExpired: false, certAgeDays: 2, issuer: "Let's Encrypt" },
    contentInfo: {
      cloudPlatform: 'Cloudflare Pages',
      forms: [{ action: 'https://api.telegram.org/bot12345/sendMessage' }],
      sensitiveInputs: { passwordCount: 1 },
      exfiltrationRisks: [{ risk: 'Telegram Exfiltration' }]
    },
    reputationInfo: { status: 'impersonating-brand', brand: 'PayPal', description: 'Impersonating PayPal on pages.dev' }
  });
  assert.equal(phishResult.verdictLevel, 'high');
  assert.ok(phishResult.score >= 50);
});
