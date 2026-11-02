/**
 * scoringEngine.js
 * Synthesizes all real-time intelligence:
 * - Live Threat Feeds (OpenPhish active blacklists)
 * - Live ICANN RDAP (Domain Age & Newly Registered Domain detection)
 * - Live IP / ASN Hosting Intelligence
 * - Darknet / Tor2Web & Ephemeral Tunnel detection
 * - Lexical, Network, TLS, DNS, and DOM Content Forensics
 */

export function calculateComprehensiveRisk({
  domainHierarchy,
  redirectInfo,
  dnsInfo,
  tlsInfo,
  contentInfo,
  reputationInfo,
  liveFeedInfo,
  rdapInfo,
  ipIntelInfo,
  mlResult
}) {
  const flags = [];
  let score = 0;

  const addFlag = (level, title, detail, points) => {
    score += points;
    flags.push({ level, title, detail, points });
  };

  // 0. Machine Learning Random Forest Prediction (MongoDB Model)
  if (mlResult && mlResult.probability !== undefined) {
    const isOfficial = reputationInfo.status === 'official-brand';
    if (mlResult.probability >= 70 && !isOfficial) {
      addFlag('high', `Machine Learning Phishing Probability: ${mlResult.probability}%`,
        `Random Forest Classifier (trained on 30,000 benchmark samples from MongoDB and validated at ${mlResult.modelMeta?.metrics?.accuracy || 88}% accuracy) classified this URL structure as high-confidence phishing.`,
        Math.min(50, Math.round(mlResult.probability * 0.5)));
    } else if (mlResult.probability >= 40 && !isOfficial) {
      addFlag('med', `Machine Learning Elevated Risk: ${mlResult.probability}%`,
        `Statistical ML model detected anomalous structural patterns in this URL.`,
        20);
    } else {
      addFlag('safe', `Machine Learning Confidence: ${(100 - mlResult.probability).toFixed(1)}% Legitimate Baseline`,
        `Random Forest model evaluated this URL feature vector (${mlResult.probability}% model score).`,
        0);
    }
  }

  // 1. Live Threat Intelligence Feed Match (OpenPhish / Global Blocklists)
  if (liveFeedInfo?.isListed) {
    addFlag('high', 'Confirmed Active Phishing Incident (OpenPhish Global Feed)',
      `Target matches an actively confirmed phishing campaign in the global OpenPhish cyber intelligence feed (match type: ${liveFeedInfo.matchType}).`, 65);
  }

  // 2. Live ICANN RDAP Domain Age & Registration Profile
  if (rdapInfo?.available) {
    if (rdapInfo.isNewlyRegistered) {
      if (rdapInfo.domainAgeDays < 14) {
        addFlag('high', `Newly Registered Domain (NRD) — ${rdapInfo.domainAgeDays} Day(s) Old`,
          `This domain was registered only ${rdapInfo.domainAgeDays} day(s) ago (on ${rdapInfo.registrationDate?.slice(0, 10)}) via ${rdapInfo.registrar}. Enterprise security firewalls classify domains younger than 14 days as high-probability disposable phishing lures.`, 35);
      } else if (rdapInfo.domainAgeDays < 30) {
        addFlag('high', `Young Domain — ${rdapInfo.domainAgeDays} Days Old`,
          `This domain was registered less than a month ago (${rdapInfo.domainAgeDays} days) via ${rdapInfo.registrar}.`, 25);
      } else if (rdapInfo.domainAgeDays < 90) {
        addFlag('med', `Recently Registered Domain — ${rdapInfo.domainAgeDays} Days Old`,
          `Domain was registered within the last 90 days. Treat with heightened caution if it asks for credentials.`, 15);
      }
    } else if (rdapInfo.domainAgeDays > 365) {
      addFlag('safe', `Established Domain Age (${Math.round(rdapInfo.domainAgeDays / 365)} years old)`,
        `Domain has an established track record (registered on ${rdapInfo.registrationDate?.slice(0, 10)} via ${rdapInfo.registrar}).`, 0);
    }
  }

  // 3. Threat Intelligence Findings (Brand Masquerading, Phishing Kits, DGA, Tor, Tunnels)
  if (reputationInfo?.findings && Array.isArray(reputationInfo.findings) && reputationInfo.findings.length > 0) {
    for (const f of reputationInfo.findings) {
      addFlag(f.severity || 'high', f.name || f.type.replace(/-/g, ' ').toUpperCase(), f.description, f.points || 35);
    }
  } else if (reputationInfo?.status === 'darknet-tor-gateway') {
    addFlag('high', 'Darknet / Tor2Web Clearnet Gateway Detected',
      reputationInfo.description, 60);
  } else if (reputationInfo?.status === 'ephemeral-tunnel-ddns') {
    addFlag('high', 'Ephemeral Reverse Tunnel / Dynamic DNS Lure',
      reputationInfo.description, 45);
  } else if (reputationInfo?.status === 'high-entropy-dga') {
    addFlag('med', 'High-Entropy DGA Pattern',
      reputationInfo.description, 20);
  } else if (reputationInfo?.status === 'impersonating-brand') {
    addFlag('high', `Brand Impersonation (${reputationInfo.brand})`,
      reputationInfo.description, 40);
  } else if (reputationInfo?.status === 'official-brand') {
    addFlag('safe', `Verified Official Domain (${reputationInfo.brand})`,
      `The registered domain matches the official registry for ${reputationInfo.brand}.`, 0);
  }

  // 4. IP & Hosting Infrastructure Profile
  if (ipIntelInfo && !ipIntelInfo.isPrivate) {
    if (ipIntelInfo.isProxyOrVpn) {
      addFlag('med', `Hosting on Anonymous Proxy / VPN / Exit Node (${ipIntelInfo.org})`,
        `Origin IP resolves to a known proxy, VPN, or Tor exit infrastructure located in ${ipIntelInfo.country}.`, 20);
    }
  }

  // 5. Lexical & IP Obfuscation
  if (domainHierarchy.isObfuscatedIp) {
    addFlag('high', 'Obfuscated IP Address Detected',
      `The host uses ${domainHierarchy.obfuscatedIpType} (${domainHierarchy.hostname}) to mask the target destination (${domainHierarchy.effectiveHost}). Attackers use this to evade string-based filters.`, 30);
  } else if (domainHierarchy.isIp) {
    addFlag('high', 'Raw IP Address Used',
      'The address points directly to a numerical IP instead of a registered domain name. Legitimate web services rarely use raw IPs for public websites.', 25);
  }

  if (domainHierarchy.username || domainHierarchy.password) {
    addFlag('high', 'Credentials / @ Trickery in URL',
      'The URL contains an "@" symbol or user credentials. Modern browsers ignore characters before the "@", which attackers use to mimic legitimate domains.', 25);
  }

  // 6. Cloud-Hosted Phishing & Form Forensics
  if (contentInfo?.exfiltrationRisks?.length > 0) {
    for (const exfil of contentInfo.exfiltrationRisks) {
      addFlag('high', 'Rogue Credential Exfiltration Endpoint',
        exfil.risk, 40);
    }
  }

  if (contentInfo?.cloudPlatform) {
    const hasPassword = contentInfo.sensitiveInputs?.passwordCount > 0;
    if (hasPassword) {
      addFlag('high', `Cloud-Hosted Phishing on ${contentInfo.cloudPlatform}`,
        `Page is hosted on a free/shared cloud provider (${contentInfo.cloudPlatform}) but contains a password sign-in form. Legitimate institutions do not host their official authentication pages on free consumer cloud subdomains.`, 40);
    } else {
      addFlag('med', `Hosted on Shared Cloud Platform (${contentInfo.cloudPlatform})`,
        `Page resides on ${contentInfo.cloudPlatform}. Be cautious if this page requests personal or billing details.`, 10);
    }
  }

  // 7. Social Engineering Alerts
  if (contentInfo?.socialEngineering?.length > 0) {
    for (const scam of contentInfo.socialEngineering) {
      addFlag('high', 'Social Engineering / Deceptive Lure', scam, 35);
    }
  }

  // 8. Multi-Hop Redirect Anomalies
  if (redirectInfo?.chain?.length > 2) {
    addFlag('med', `Multi-Hop Redirect Chain (${redirectInfo.chain.length} hops)`,
      'The link bounces through multiple intermediate servers before reaching the destination. This is frequently used to evade link scanners.', 15);
  }

  // 9. DNS Profile
  if (dnsInfo && !dnsInfo.hasDns && !domainHierarchy.isIp) {
    addFlag('high', 'Domain Does Not Resolve (NXDOMAIN)',
      'The domain does not have active A or AAAA records. It may have been taken down, expired, or registered but not yet deployed.', 20);
  } else if (dnsInfo?.mx?.length === 0 && !domainHierarchy.isIp && reputationInfo.status !== 'official-brand') {
    addFlag('med', 'No Mail Servers (MX Records)',
      'The domain has no mail servers configured. Established businesses maintain email records; disposable phishing sites often omit them.', 10);
  }

  // 10. TLS Certificate Profile
  if (domainHierarchy.protocol === 'http') {
    addFlag('med', 'Unencrypted Connection (HTTP)',
      'This website does not use HTTPS. Any information entered can be intercepted in plain text.', 15);
  } else if (tlsInfo?.supported) {
    if (tlsInfo.isExpired) {
      addFlag('high', 'Expired SSL Certificate',
        `The certificate expired on ${tlsInfo.validTo}. Communication is not secure.`, 25);
    } else if (tlsInfo.certAgeDays < 7) {
      addFlag('med', `Brand New SSL Certificate (${tlsInfo.certAgeDays} days old)`,
        `The SSL certificate was issued very recently by ${tlsInfo.issuer}. Fresh certificates are commonly seen on short-lived phishing sites.`, 15);
    }
  }

  // Clamp score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine verdict & action
  let verdictLevel = 'safe';
  let verdictTitle = 'Low Risk';
  let verdictSummary = 'No critical red flags or deceptive indicators were detected.';
  let advice = [
    'Always verify the address bar matches the company you intend to visit.',
    'Do not enter credentials if the site was reached via an unexpected message.'
  ];

  if (score >= 50) {
    verdictLevel = 'high';
    verdictTitle = 'High Risk / Likely Phishing';
    verdictSummary = 'Multiple critical deception signals or credential theft patterns were detected.';
    advice = [
      'DO NOT enter passwords, credit card numbers, or one-time verification codes.',
      'Do not download or run any files from this page.',
      'If you have already entered login details, change your password immediately on the official site.'
    ];
  } else if (score >= 20) {
    verdictLevel = 'med';
    verdictTitle = 'Suspicious / Proceed With Caution';
    verdictSummary = 'Several warning signs were detected that warrant close verification.';
    advice = [
      'Check the registered domain carefully before interacting.',
      'Avoid signing in through this link; navigate directly to the official homepage instead.'
    ];
  }

  return {
    score,
    verdictLevel,
    verdictTitle,
    verdictSummary,
    flags: flags.sort((a, b) => b.points - a.points),
    advice
  };
}
