/**
 * ipIntel.js
 * Queries live IP intelligence for resolved A records:
 * ASN, Hosting Provider, Country, ISP, and Proxy/VPN/Datacenter detection.
 */

export async function lookupIpIntel(ipAddress, timeoutMs = 5000) {
  if (!ipAddress || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ipAddress)) {
    return null;
  }

  // Skip private / loopback IPs
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ipAddress)) {
    return {
      ip: ipAddress,
      isPrivate: true,
      org: 'Local / Private Loopback Network',
      country: 'Internal',
      hosting: false
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,city,isp,org,as,proxy,hosting`, {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;

    return {
      ip: ipAddress,
      isPrivate: false,
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      isp: data.isp || 'Unknown',
      org: data.org || data.isp || 'Unknown',
      asn: data.as || 'Unknown',
      isProxyOrVpn: Boolean(data.proxy),
      isDatacenterHosting: Boolean(data.hosting)
    };
  } catch {
    return null;
  }
}
