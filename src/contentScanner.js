/**
 * contentScanner.js
 * Scans destination HTML using Cheerio for:
 * 1. Form destination viewer & credential theft endpoints (Telegram, Discord, Formspree, external IPs)
 * 2. Cloud-hosted phishing detector (free-tier abuse on Firebase, Cloudflare, Vercel, GitHub, etc.)
 * 3. Deception & social engineering (fake tech support phone numbers, fake countdowns, bot-verification trickery)
 * 4. Third-party script map & outbound links
 */

import * as cheerio from 'cheerio';
import { parse as parseDomain } from 'tldts';

// Known shared free-tier cloud platforms frequently abused for zero-cost phishing
const CLOUD_PLATFORMS = [
  { pattern: /firebaseapp\.com$/i, name: 'Google Firebase' },
  { pattern: /web\.app$/i, name: 'Google Firebase Hosting' },
  { pattern: /pages\.dev$/i, name: 'Cloudflare Pages' },
  { pattern: /workers\.dev$/i, name: 'Cloudflare Workers' },
  { pattern: /vercel\.app$/i, name: 'Vercel Free Tier' },
  { pattern: /netlify\.app$/i, name: 'Netlify Free Tier' },
  { pattern: /github\.io$/i, name: 'GitHub Pages' },
  { pattern: /gitlab\.io$/i, name: 'GitLab Pages' },
  { pattern: /notion\.site$/i, name: 'Notion Public Site' },
  { pattern: /canva\.site$/i, name: 'Canva Web Site' },
  { pattern: /glitch\.me$/i, name: 'Glitch App' },
  { pattern: /weebly\.com$/i, name: 'Weebly Free Site' },
  { pattern: /wixsite\.com$/i, name: 'Wix Free Site' },
  { pattern: /blogspot\.com$/i, name: 'Google Blogger' },
  { pattern: /forms\.gle$/i, name: 'Google Forms' },
  { pattern: /docs\.google\.com\/forms/i, name: 'Google Forms' },
  { pattern: /forms\.office\.com/i, name: 'Microsoft Forms' }
];

// Major brands commonly impersonated
const TARGET_BRANDS = [
  'microsoft', 'office365', 'outlook', 'apple', 'icloud', 'google', 'gmail',
  'paypal', 'chase', 'wellsfargo', 'bankofamerica', 'citi', 'netflix', 'amazon',
  'facebook', 'instagram', 'whatsapp', 'coinbase', 'binance', 'metamask', 'dhl', 'fedex', 'usps'
];

export async function scanPageContent(targetUrl, timeoutMs = 8000) {
  const result = {
    url: targetUrl,
    fetched: false,
    title: '',
    cloudPlatform: null,
    forms: [],
    sensitiveInputs: {
      passwordCount: 0,
      creditCardCount: 0,
      emailLoginCount: 0,
      otpCount: 0
    },
    exfiltrationRisks: [],
    socialEngineering: [],
    scripts: {
      total: 0,
      external: [],
      suspicious: []
    },
    outboundLinks: [],
    flags: []
  };

  let html = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Linkscope/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      result.flags.push({ level: 'low', text: `Destination returned non-HTML content (${contentType})` });
      return result;
    }

    html = await res.text();
    result.fetched = true;
  } catch (err) {
    result.flags.push({ level: 'low', text: `Could not fetch page body: ${err.message}` });
    return result;
  }

  const $ = cheerio.load(html);
  result.title = $('title').text().trim();
  const pageText = $('body').text().replace(/\s+/g, ' ').toLowerCase();
  const pageUrlObj = new URL(targetUrl);
  const pageHost = pageUrlObj.hostname.toLowerCase();
  const pageDomainInfo = parseDomain(pageHost);
  const pageRegisteredDomain = pageDomainInfo.domain || pageHost;

  // 1. Cloud-Hosted Phishing Detection
  for (const cloud of CLOUD_PLATFORMS) {
    if (cloud.pattern.test(pageHost) || cloud.pattern.test(targetUrl)) {
      result.cloudPlatform = cloud.name;
      break;
    }
  }

  // 2. Forms & Credential Destination Viewer
  $('form').each((i, el) => {
    const form = $(el);
    const rawAction = form.attr('action') || '';
    const method = (form.attr('method') || 'GET').toUpperCase();

    let resolvedAction = rawAction;
    let actionHost = '';
    let isExternal = false;

    if (rawAction) {
      try {
        const actionUrl = new URL(rawAction, targetUrl);
        resolvedAction = actionUrl.href;
        actionHost = actionUrl.hostname.toLowerCase();
        const actionDomainInfo = parseDomain(actionHost);
        const actionRegisteredDomain = actionDomainInfo.domain || actionHost;
        isExternal = actionRegisteredDomain !== pageRegisteredDomain;
      } catch {}
    }

    // Inspect inputs inside this form
    const inputs = [];
    form.find('input, textarea, select').each((j, inp) => {
      const inputEl = $(inp);
      const type = (inputEl.attr('type') || 'text').toLowerCase();
      const name = (inputEl.attr('name') || '').toLowerCase();
      const placeholder = (inputEl.attr('placeholder') || '').toLowerCase();
      const id = (inputEl.attr('id') || '').toLowerCase();

      inputs.push({ type, name, placeholder });

      if (type === 'password' || name.includes('pass') || placeholder.includes('password')) {
        result.sensitiveInputs.passwordCount++;
      }
      if (type === 'email' || name.includes('email') || name.includes('username') || placeholder.includes('email')) {
        result.sensitiveInputs.emailLoginCount++;
      }
      if (name.includes('card') || name.includes('cc_') || placeholder.includes('card number') || name.includes('cvv')) {
        result.sensitiveInputs.creditCardCount++;
      }
      if (name.includes('otp') || name.includes('token') || placeholder.includes('code') || placeholder.includes('2fa')) {
        result.sensitiveInputs.otpCount++;
      }
    });

    // Check for malicious exfiltration endpoints
    let exfilRisk = null;
    if (/api\.telegram\.org\/bot/i.test(resolvedAction)) {
      exfilRisk = 'Credentials exfiltrated directly to Telegram Bot API!';
    } else if (/discord(?:app)?\.com\/api\/webhooks/i.test(resolvedAction)) {
      exfilRisk = 'Credentials exfiltrated directly to Discord Webhook!';
    } else if (/(formspree\.io|getform\.io|web3forms\.com|formkeep\.com|formsubmit\.co)/i.test(resolvedAction)) {
      exfilRisk = 'Form submits directly to third-party form handler service (' + resolvedAction + ')';
    } else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(actionHost)) {
      exfilRisk = `Form posts directly to raw IP address (${actionHost})!`;
    } else if (isExternal && result.sensitiveInputs.passwordCount > 0) {
      exfilRisk = `Cross-domain credential submission! Page is ${pageRegisteredDomain} but password form posts to ${actionHost}`;
    }

    if (exfilRisk) {
      result.exfiltrationRisks.push({
        formIndex: i + 1,
        action: resolvedAction,
        risk: exfilRisk
      });
      result.flags.push({ level: 'high', text: exfilRisk });
    }

    result.forms.push({
      index: i + 1,
      action: resolvedAction || '(submits to current page)',
      method,
      isExternal,
      inputCount: inputs.length,
      hasPassword: inputs.some(x => x.type === 'password' || x.name.includes('pass')),
      exfilRisk
    });
  });

  // Cross-reference: Cloud Platform + Sensitive Login
  if (result.cloudPlatform) {
    const hasLoginLure = result.sensitiveInputs.passwordCount > 0 ||
      TARGET_BRANDS.some(b => pageText.includes(b) && (pageText.includes('sign in') || pageText.includes('log in') || pageText.includes('verify')));

    if (hasLoginLure) {
      result.flags.push({
        level: 'high',
        text: `CRITICAL: Cloud-hosted credential phishing detected! Hosted on ${result.cloudPlatform} but presents a password login / credential prompt.`
      });
    } else {
      result.flags.push({
        level: 'med',
        text: `Hosted on shared cloud platform (${result.cloudPlatform}). Check if content is authorized.`
      });
    }
  }

  // 3. Social Engineering & Scam Patterns
  // A. Fake Tech Support / Virus Scam
  const phoneMatch = pageText.match(/(?:\+?1[-.\s]?)?\(?(?:800|888|877|866|855|844|833)\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
  const supportScamPhrases = [
    'your computer has been infected',
    'windows defender alert',
    'call microsoft support',
    'call apple support',
    'pornographic spyware',
    'error #0x',
    'do not restart your computer',
    'hard drive will be deleted'
  ];
  const foundScamPhrases = supportScamPhrases.filter(p => pageText.includes(p));

  if (foundScamPhrases.length > 0 || (phoneMatch && pageText.includes('support') && pageText.includes('call'))) {
    const detail = `Fake Tech Support Scam detected! Matched: "${foundScamPhrases.join('", "')}"${phoneMatch ? ' with helpline: ' + phoneMatch.join(', ') : ''}`;
    result.socialEngineering.push(detail);
    result.flags.push({ level: 'high', text: detail });
  }

  // B. Fake Urgency & Countdown
  if (pageText.includes('account suspended') || pageText.includes('suspended within 24 hours') || pageText.includes('immediate action required')) {
    result.socialEngineering.push('Extreme urgency trigger: claims immediate suspension or emergency');
    result.flags.push({ level: 'med', text: 'Social engineering urgency pattern: creates panic to force rapid sign-in' });
  }

  // C. Aggressive Notification / Captcha Trickery
  if (pageText.includes('click allow to prove you are not a robot') || pageText.includes('press allow to continue')) {
    result.socialEngineering.push('Browser Notification Hijack: tricks user into subscribing to spam notifications');
    result.flags.push({ level: 'high', text: 'Browser Notification Hijacking: page tricks visitors into enabling rogue push notifications' });
  }

  // 4. Scripts & External Resources
  $('script').each((_, el) => {
    result.scripts.total++;
    const src = $(el).attr('src');
    if (src) {
      try {
        const scriptUrl = new URL(src, targetUrl).href;
        result.scripts.external.push(scriptUrl);
      } catch {}
    }
  });

  // Outbound links
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && /^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        if (u.hostname !== pageHost && !result.outboundLinks.includes(u.origin)) {
          result.outboundLinks.push(u.origin);
        }
      } catch {}
    }
  });

  return result;
}
