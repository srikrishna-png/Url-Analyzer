/**
 * threatIntelligence.js
 * Advanced Cyber Threat Intelligence Engine:
 * - Brand Impersonation across Host, Subdomains, and URL Paths
 * - Phishing Kit Signatures & Exploit Kit Patterns (PayPal webscr, Microsoft OAuth lures, etc.)
 * - Linguistic DGA & Consonant-Cluster Analysis (e.g. dghjdgf, random string domains)
 * - Tor2Web Clearnet Proxies & Darknet Gateways
 * - Ephemeral Reverse Tunnels & Dynamic DNS
 * - Shannon Entropy & Character Distribution
 */

export const REPUTABLE_BRANDS = {
  'paypal.com': { name: 'PayPal', category: 'Financial Payments', aliases: ['paypal.co.uk', 'paypal.de', 'paypal.fr', 'paypal.ca', 'paypal.me'] },
  'google.com': { name: 'Google', category: 'Search & Cloud', aliases: ['google.co.uk', 'google.de', 'google.fr', 'gmail.com'] },
  'microsoft.com': { name: 'Microsoft', category: 'Software & Cloud', aliases: ['office.com', 'office365.com', 'live.com', 'outlook.com', 'microsoftonline.com'] },
  'apple.com': { name: 'Apple', category: 'Technology', aliases: ['icloud.com', 'appleid.apple.com'] },
  'amazon.com': { name: 'Amazon', category: 'E-Commerce & AWS', aliases: ['amazon.co.uk', 'amazon.de', 'amazon.ca'] },
  'chase.com': { name: 'Chase Bank', category: 'Banking', aliases: ['chaseonline.chase.com', 'jpmorganchase.com'] },
  'bankofamerica.com': { name: 'Bank of America', category: 'Banking', aliases: ['bofa.com'] },
  'wellsfargo.com': { name: 'Wells Fargo', category: 'Banking', aliases: [] },
  'citi.com': { name: 'Citibank', category: 'Banking', aliases: ['citigroup.com', 'citibank.com'] },
  'netflix.com': { name: 'Netflix', category: 'Streaming', aliases: [] },
  'facebook.com': { name: 'Facebook (Meta)', category: 'Social Network', aliases: ['meta.com', 'fb.com'] },
  'instagram.com': { name: 'Instagram', category: 'Social Media', aliases: [] },
  'whatsapp.com': { name: 'WhatsApp', category: 'Messaging', aliases: [] },
  'dhl.com': { name: 'DHL Express', category: 'Logistics', aliases: ['dhl.de', 'dhl-express.com'] },
  'fedex.com': { name: 'FedEx', category: 'Logistics', aliases: [] },
  'usps.com': { name: 'USPS', category: 'Postal Service', aliases: [] },
  'coinbase.com': { name: 'Coinbase', category: 'Cryptocurrency', aliases: [] },
  'binance.com': { name: 'Binance', category: 'Cryptocurrency', aliases: [] },
  'stripe.com': { name: 'Stripe', category: 'Payment Processing', aliases: [] }
};

export const RISKY_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'click',
  'work', 'support', 'icu', 'rest', 'country', 'cam', 'monster', 'sbs',
  'cfd', 'buzz', 'fit', 'surf', 'quest', 'loan', 'gdn'
]);

// Known Phishing Kit Structural Signatures
const PHISHING_KIT_SIGNATURES = [
  { pattern: /(?:cgi-bin|cycgi-bin)?\/webscr/i, name: 'PayPal Webscr Phishing Kit' },
  { pattern: /webscrcmd=/i, name: 'PayPal IPN / Cmd Lure' },
  { pattern: /_home-customer/i, name: 'PayPal Customer Session Stealer' },
  { pattern: /\/(?:loading|signin-loading|redirecting|action|verification|confirm-identity)\.php/i, name: 'Generic Phishing Kit State Controller' },
  { pattern: /\/common\/oauth2\/(?:authorize|deviceauth)/i, name: 'Microsoft 365 Device Code / OAuth Lure' },
  { pattern: /\/(?:appleid|myappleid)\/(?:auth|verify)/i, name: 'Apple ID Credential Stealer' },
  { pattern: /\/(?:webmail|cpanel|roundcube)\/login/i, name: 'Webmail / cPanel Phishing Kit' },
  { pattern: /\/(?:update-billing|verify-account|security-alert|card-details)\.php/i, name: 'Banking / Credit Card Harvester Script' }
];

// Tor2Web Clearnet Proxies & Darknet Gateways
export const TOR2WEB_GATEWAYS = [
  'onion.to', 'onion.ws', 'onion.pet', 'onion.ly', 'onion.cab',
  'onion.dog', 'onion.foundation', 'onion.direct', 'onion.moe',
  'onion.casa', 'onion.link', 'tor2web.org', 'tor2web.io', 'tor2web.in'
];

// Ephemeral Tunneling & Dynamic DNS
export const EPHEMERAL_TUNNELS_AND_DDNS = [
  'ngrok.io', 'ngrok-free.app', 'localtunnel.me', 'trycloudflare.com',
  'serveo.net', 'pagekite.me', 'duckdns.org', 'no-ip.com', 'ddns.net',
  'zapto.org', 'hopto.org', 'sytes.net', 'bounceme.net', 'freeddns.org', 'dynu.net'
];

// Shannon Entropy Calculation
export function calculateShannonEntropy(str) {
  if (!str) return 0;
  const s = str.toLowerCase();
  const freq = {};
  for (let i = 0; i < s.length; i++) {
    freq[s[i]] = (freq[s[i]] || 0) + 1;
  }
  let entropy = 0;
  const len = s.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Linguistic DGA / Consonant-Cluster Analysis (e.g., dghjdgf has 0 vowels, 7 consonants)
export function evaluateDgaLinguistics(label) {
  if (!label || label.length < 5) return { isDga: false };

  const clean = label.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 5) return { isDga: false };

  // Count vowels (a, e, i, o, u)
  const vowels = (clean.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / clean.length;

  // Check for long consecutive consonant runs (e.g. dghjdgf = 7 consonants)
  const maxConsonants = (clean.match(/[^aeiou]{4,}/g) || []).reduce((max, m) => Math.max(max, m.length), 0);

  // If 5+ letters and ZERO vowels (e.g. dghjdgf, zxcvbn)
  if (vowels === 0 && clean.length >= 5) {
    return {
      isDga: true,
      reason: `Zero vowels in ${clean.length}-letter domain ("${label}"). Human language domains always contain vowels; this is a hallmark of an auto-generated DGA (Domain Generation Algorithm) disposable phishing host.`,
      severity: 'high'
    };
  }

  // If >= 5 consecutive consonants (e.g. bcdfg, rstplm)
  if (maxConsonants >= 5) {
    return {
      isDga: true,
      reason: `Unnatural consonant cluster of ${maxConsonants} consecutive consonants in domain ("${label}"). Characteristic of machine-generated DGA domains.`,
      severity: 'med'
    };
  }

  // If vowel ratio is extremely abnormal (< 12%)
  if (vowelRatio < 0.12 && clean.length >= 8) {
    return {
      isDga: true,
      reason: `Abnormally low vowel ratio (${Math.round(vowelRatio * 100)}%) in domain ("${label}"). Characteristic of DGA domains.`,
      severity: 'med'
    };
  }

  return { isDga: false };
}

/**
 * Core Domain & URL Intelligence Evaluator
 */
export function evaluateDomainReputation(registeredDomain, fullHost, fullUrl = '') {
  const reg = (registeredDomain || '').toLowerCase();
  const host = (fullHost || '').toLowerCase();
  const rawUrl = (fullUrl || '').toLowerCase();

  let pathname = '';
  try {
    pathname = new URL(rawUrl || `https://${host}`).pathname.toLowerCase();
  } catch {
    pathname = rawUrl;
  }

  const findings = [];

  // 1. Phishing Kit Structural Signatures
  for (const sig of PHISHING_KIT_SIGNATURES) {
    if (sig.pattern.test(rawUrl)) {
      findings.push({
        type: 'phishing-kit-signature',
        name: sig.name,
        severity: 'high',
        points: 40,
        description: `Known Phishing Kit Footprint Detected: "${sig.name}". The URL path or query contains signatures identical to widely deployed credential stealer kits.`
      });
    }
  }

  // 2. Brand Masquerading in Path / Path Spoofing (e.g., dghjdgf.com/paypal.co.uk/...)
  let brandInPathMatch = null;
  for (const [brandDomain, brandInfo] of Object.entries(REPUTABLE_BRANDS)) {
    const brandKey = brandDomain.split('.')[0];
    const allNames = [brandDomain, brandKey, ...(brandInfo.aliases || [])];

    for (const name of allNames) {
      if (name.length >= 4 && (pathname.includes('/' + name) || pathname.includes(name + '/') || pathname.includes(name))) {
        // Only trigger if the registered domain is NOT the official brand
        if (reg !== brandDomain && !brandInfo.aliases?.includes(reg)) {
          brandInPathMatch = {
            brand: brandInfo.name,
            spoofedName: name,
            realDomain: reg,
            points: 50,
            description: `Target Brand Masquerading in URL Path: The path prominently features "${name}" (${brandInfo.name}), but the actual destination domain is "${reg}". Phishing kits uploaded to compromised web servers use this exact tactic to trick users into trusting the link.`
          };
          break;
        }
      }
    }
    if (brandInPathMatch) break;
  }

  if (brandInPathMatch) {
    findings.push({
      type: 'brand-in-path-spoof',
      ...brandInPathMatch
    });
  }

  // 3. Tor / Darknet & Tor2Web Clearnet Gateway Detection
  const isDirectOnion = host.endsWith('.onion') || reg === 'onion';
  const isTor2Web = TOR2WEB_GATEWAYS.some(gw => host.endsWith(gw) || reg === gw);
  const isOtherDarknet = host.endsWith('.i2p') || host.endsWith('.loki') || host.includes('.i2p.');

  const subLabels = host.split('.');
  const hasTorHash = subLabels.some(l => /^[a-z2-7]{16}$/i.test(l) || /^[a-z2-7]{56}$/i.test(l));

  if (isDirectOnion || isTor2Web || isOtherDarknet || (hasTorHash && (host.includes('onion') || isTor2Web))) {
    const gatewayName = isTor2Web ? 'Tor2Web Clearnet Proxy' : isDirectOnion ? 'Tor Hidden Service (.onion)' : 'Darknet Gateway';
    findings.push({
      type: 'darknet-tor-gateway',
      severity: 'high',
      points: 60,
      description: `CRITICAL: ${gatewayName} detected! The domain connects users directly to an anonymous Tor Dark Web hidden service. Legitimate commercial businesses never use Tor2Web bridges for customer traffic.`
    });
  }

  // 4. Linguistic DGA / Consonant-Cluster Detection on Registered Domain
  const regLabel = reg.split('.')[0];
  const dgaCheck = evaluateDgaLinguistics(regLabel);
  if (dgaCheck.isDga) {
    findings.push({
      type: 'dga-linguistic-anomaly',
      severity: dgaCheck.severity,
      points: dgaCheck.severity === 'high' ? 35 : 20,
      description: dgaCheck.reason
    });
  }

  // 5. Ephemeral Reverse Tunnel & Dynamic DNS Detection
  const matchedTunnel = EPHEMERAL_TUNNELS_AND_DDNS.find(t => host.endsWith(t) || reg === t);
  if (matchedTunnel) {
    findings.push({
      type: 'ephemeral-tunnel-ddns',
      severity: 'high',
      points: 45,
      description: `Target uses an ephemeral reverse tunnel or dynamic DNS provider (${matchedTunnel}). Attackers use disposable tunnels (e.g. ngrok, trycloudflare, duckdns) to host temporary phishing kits.`
    });
  }

  // 6. Subdomain Brand Spoofing (e.g., paypal.com.evil.xyz)
  for (const [brandDomain, brandInfo] of Object.entries(REPUTABLE_BRANDS)) {
    const brandKey = brandDomain.split('.')[0];
    if (brandKey.length >= 4 && host.includes(brandKey) && reg !== brandDomain && !brandInfo.aliases?.includes(reg)) {
      findings.push({
        type: 'brand-in-subdomain-spoof',
        severity: 'high',
        points: 40,
        description: `Hostname contains brand keyword "${brandKey}" (${brandInfo.name}), but the actual registered domain is "${reg}". Classic subdomain masquerading.`
      });
      break;
    }
  }

  // Check if official brand
  const isOfficialBrand = REPUTABLE_BRANDS[reg];
  if (isOfficialBrand) {
    return {
      status: 'official-brand',
      brand: isOfficialBrand.name,
      category: isOfficialBrand.category,
      findings,
      riskPenalty: 0
    };
  }

  return {
    status: findings.length > 0 ? 'threat-signals-detected' : 'unlisted-domain',
    findings,
    brand: null,
    riskPenalty: findings.reduce((acc, f) => acc + (f.points || 0), 0)
  };
}
