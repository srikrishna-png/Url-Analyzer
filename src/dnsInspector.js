/**
 * dnsInspector.js
 * Queries native DNS records (A, AAAA, MX, NS, TXT) and PTR reverse lookups.
 */

import dns from 'node:dns/promises';

export async function inspectDns(hostname) {
  if (!hostname || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
    return {
      isIpOnly: true,
      records: {},
      summary: 'Target is a raw IP address; skipping DNS query.'
    };
  }

  const results = {
    hostname,
    hasDns: false,
    a: [],
    aaaa: [],
    mx: [],
    ns: [],
    txt: [],
    ptr: [],
    flags: []
  };

  const lookupSafe = async (fn, ...args) => {
    try {
      return await fn(...args);
    } catch {
      return [];
    }
  };

  try {
    const [aRecords, aaaaRecords, mxRecords, nsRecords, txtRecords] = await Promise.all([
      lookupSafe(dns.resolve4.bind(dns), hostname),
      lookupSafe(dns.resolve6.bind(dns), hostname),
      lookupSafe(dns.resolveMx.bind(dns), hostname),
      lookupSafe(dns.resolveNs.bind(dns), hostname),
      lookupSafe(dns.resolveTxt.bind(dns), hostname)
    ]);

    results.a = aRecords;
    results.aaaa = aaaaRecords;
    results.mx = mxRecords.sort((x, y) => x.priority - y.priority);
    results.ns = nsRecords;
    results.txt = txtRecords.flat();
    results.hasDns = aRecords.length > 0 || aaaaRecords.length > 0;

    // Reverse lookup for primary A record
    if (aRecords.length > 0) {
      try {
        const ptrs = await dns.reverse(aRecords[0]);
        results.ptr = ptrs;
      } catch {}
    }

    // Security evaluation of DNS profile
    if (!results.hasDns) {
      results.flags.push({
        level: 'high',
        text: 'Domain does not resolve (NXDOMAIN or no A/AAAA records). May be inactive or suspended.'
      });
    } else {
      if (results.mx.length === 0) {
        results.flags.push({
          level: 'med',
          text: 'No Mail Exchange (MX) records found. Legitimate corporate domains almost always configure email routing; lack of MX is common in ephemeral phishing sites.'
        });
      }
      if (results.ns.length === 0) {
        results.flags.push({
          level: 'low',
          text: 'No explicit NS records returned for this specific hostname.'
        });
      }
    }

  } catch (err) {
    results.error = err.message;
  }

  return results;
}
