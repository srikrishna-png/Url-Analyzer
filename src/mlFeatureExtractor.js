/**
 * mlFeatureExtractor.js
 * Standardized feature extraction aligned with the GregaVrbancic Phishing Benchmark Dataset.
 * Extracts identical features from incoming URLs for inference and model training.
 */

import { parse as parseDomain } from 'tldts';

export const FEATURE_NAMES = [
  'length_url',
  'domain_length',
  'directory_length',
  'params_length',
  'qty_dot_url',
  'qty_hyphen_url',
  'qty_slash_url',
  'qty_questionmark_url',
  'qty_equal_url',
  'qty_at_url',
  'qty_and_url',
  'qty_percent_url',
  'domain_in_ip',
  'qty_vowels_domain',
  'qty_dot_directory',
  'qty_hyphen_directory',
  'qty_slash_directory',
  'qty_equal_params',
  'qty_params',
  'tls_ssl_certificate',
  'qty_redirects',
  'url_shortened',
  'brand_in_path_flag'
];

const BRAND_KEYWORDS = [
  'paypal', 'google', 'microsoft', 'apple', 'amazon', 'chase', 'bankofamerica',
  'wellsfargo', 'netflix', 'facebook', 'instagram', 'whatsapp', 'binance', 'coinbase'
];

const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly'
]);

export function extractUrlFeatures(rawUrl, tlsSupported = true, redirectCount = 0) {
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl);
  } catch {
    return null;
  }

  const fullUrl = u.href;
  const host = u.hostname.toLowerCase();
  const pathname = u.pathname.toLowerCase();
  const search = u.search.toLowerCase();

  const parsed = parseDomain(host);
  const regDomain = (parsed.domain || host).toLowerCase();
  const regLabel = regDomain.split('.')[0] || '';

  // 1. Lengths
  const length_url = fullUrl.length;
  const domain_length = host.length;
  const directory_length = pathname.length;
  const params_length = search.length;

  // 2. Global URL punctuation counts
  const qty_dot_url = (fullUrl.match(/\./g) || []).length;
  const qty_hyphen_url = (fullUrl.match(/-/g) || []).length;
  const qty_slash_url = (fullUrl.match(/\//g) || []).length;
  const qty_questionmark_url = (fullUrl.match(/\?/g) || []).length;
  const qty_equal_url = (fullUrl.match(/=/g) || []).length;
  const qty_at_url = (fullUrl.match(/@/g) || []).length;
  const qty_and_url = (fullUrl.match(/&/g) || []).length;
  const qty_percent_url = (fullUrl.match(/%/g) || []).length;

  // 3. Domain attributes
  const domain_in_ip = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? 1 : 0;
  const qty_vowels_domain = (regLabel.match(/[aeiou]/g) || []).length;

  // 4. Directory attributes
  const qty_dot_directory = (pathname.match(/\./g) || []).length;
  const qty_hyphen_directory = (pathname.match(/-/g) || []).length;
  const qty_slash_directory = (pathname.match(/\//g) || []).length;

  // 5. Parameter attributes
  const qty_equal_params = (search.match(/=/g) || []).length;
  const qty_params = u.searchParams.size;

  // 6. Network/Security state
  const tls_ssl_certificate = u.protocol === 'https:' && tlsSupported ? 1 : 0;
  const qty_redirects = redirectCount;
  const url_shortened = SHORTENER_DOMAINS.has(regDomain) ? 1 : 0;

  // 7. Brand in path
  let brand_in_path_flag = 0;
  for (const b of BRAND_KEYWORDS) {
    if (pathname.includes(b) && !regDomain.includes(b)) {
      brand_in_path_flag = 1;
      break;
    }
  }

  const featureDict = {
    length_url,
    domain_length,
    directory_length,
    params_length,
    qty_dot_url,
    qty_hyphen_url,
    qty_slash_url,
    qty_questionmark_url,
    qty_equal_url,
    qty_at_url,
    qty_and_url,
    qty_percent_url,
    domain_in_ip,
    qty_vowels_domain,
    qty_dot_directory,
    qty_hyphen_directory,
    qty_slash_directory,
    qty_equal_params,
    qty_params,
    tls_ssl_certificate,
    qty_redirects,
    url_shortened,
    brand_in_path_flag
  };

  const vector = FEATURE_NAMES.map(name => featureDict[name]);

  return {
    vector,
    featureDict,
    rawUrl: fullUrl
  };
}
