/**
 * rdapInspector.js
 * Queries live ICANN RDAP (Registration Data Access Protocol) servers in real time.
 * Calculates exact domain age, registrar identity, and flags Newly Registered Domains (NRDs).
 */

export async function lookupDomainRdap(domainName, timeoutMs = 3000) {
  if (!domainName || /^\d{1,3}(\.\d{1,3}){3}$/.test(domainName) || domainName.includes(':')) {
    return {
      available: false,
      reason: 'Target is a raw IP address, skipping RDAP registry lookup.'
    };
  }

  const cleanDomain = domainName.toLowerCase().trim();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`, {
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': 'UrlAnalyser-Cyber-Intel/2.0'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        available: false,
        reason: `RDAP registry returned HTTP ${res.status} (${res.statusText})`
      };
    }

    const data = await res.json();
    const events = data.events || [];

    let registrationDate = null;
    let expirationDate = null;
    let lastChangedDate = null;

    for (const evt of events) {
      if (evt.eventAction === 'registration') {
        registrationDate = evt.eventDate;
      } else if (evt.eventAction === 'expiration') {
        expirationDate = evt.eventDate;
      } else if (evt.eventAction === 'last changed' || evt.eventAction === 'last update of RDAP database') {
        lastChangedDate = evt.eventDate;
      }
    }

    // Extract Registrar name from entities
    let registrarName = 'Unknown Registrar';
    if (data.entities && Array.isArray(data.entities)) {
      for (const ent of data.entities) {
        if (ent.roles && ent.roles.includes('registrar')) {
          if (ent.vcardArray && ent.vcardArray[1]) {
            const fnItem = ent.vcardArray[1].find(item => item[0] === 'fn');
            if (fnItem && fnItem[3]) {
              registrarName = fnItem[3];
              break;
            }
          }
        }
      }
    }

    let domainAgeDays = null;
    let isNewlyRegistered = false;
    let nrdSeverity = null;

    if (registrationDate) {
      const regTime = new Date(registrationDate).getTime();
      const now = Date.now();
      domainAgeDays = Math.max(0, Math.round((now - regTime) / (1000 * 60 * 60 * 24)));

      if (domainAgeDays < 14) {
        isNewlyRegistered = true;
        nrdSeverity = 'critical';
      } else if (domainAgeDays < 30) {
        isNewlyRegistered = true;
        nrdSeverity = 'high';
      } else if (domainAgeDays < 90) {
        isNewlyRegistered = true;
        nrdSeverity = 'med';
      }
    }

    return {
      available: true,
      domain: cleanDomain,
      handle: data.handle || null,
      registrar: registrarName,
      registrationDate,
      expirationDate,
      lastChangedDate,
      domainAgeDays,
      isNewlyRegistered,
      nrdSeverity,
      status: data.status || []
    };

  } catch (err) {
    return {
      available: false,
      reason: err.name === 'AbortError' ? 'RDAP query timed out' : `RDAP query error: ${err.message}`
    };
  }
}
