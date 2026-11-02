/**
 * redirectTracer.js
 * Unwraps enterprise tracking links and traces multi-hop HTTP/HTML redirects.
 */

// Decodes known wrapper query formats
export function unwrapTrackingLink(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();

    // 1. Microsoft SafeLinks (safelinks.protection.outlook.com)
    if (host.includes('safelinks.protection.outlook.com')) {
      const target = u.searchParams.get('url');
      if (target) return { unwrapped: true, wrapper: 'Microsoft Defender SafeLinks', target };
    }

    // 2. Google Click Redirector
    if ((host === 'google.com' || host.endsWith('.google.com')) && u.pathname === '/url') {
      const q = u.searchParams.get('q') || u.searchParams.get('url');
      if (q) return { unwrapped: true, wrapper: 'Google Redirector', target: q };
    }

    // 3. Facebook Link Shim
    if (host.includes('facebook.com') && (u.pathname === '/l.php' || u.pathname.includes('/l.php'))) {
      const uParam = u.searchParams.get('u');
      if (uParam) return { unwrapped: true, wrapper: 'Facebook Link Shim', target: uParam };
    }

    // 4. generic ?redirect= or ?url= or ?next= or ?destination=
    const genericParams = ['redirect', 'redirect_uri', 'redirect_url', 'target', 'dest', 'destination', 'return_to', 'goto'];
    for (const p of genericParams) {
      const val = u.searchParams.get(p);
      if (val && /^https?:\/\//i.test(val)) {
        return { unwrapped: true, wrapper: `Generic Redirect Parameter (${p})`, target: val };
      }
    }
  } catch {}

  return { unwrapped: false, wrapper: null, target: urlStr };
}

// Follow HTTP redirects manually up to maxHops
export async function traceRedirectChain(initialUrl, maxHops = 5, timeoutMs = 2500) {
  const chain = [];
  let currentUrl = initialUrl;
  const visited = new Set();

  // First check if it is an enterprise wrapper link and unwrap it
  const unwrapCheck = unwrapTrackingLink(currentUrl);
  if (unwrapCheck.unwrapped) {
    chain.push({
      hop: 0,
      url: currentUrl,
      type: 'tracking-wrapper-unwrapped',
      wrapperName: unwrapCheck.wrapper,
      destination: unwrapCheck.target
    });
    currentUrl = unwrapCheck.target;
  }

  for (let step = 1; step <= maxHops; step++) {
    if (visited.has(currentUrl)) {
      chain.push({
        hop: step,
        url: currentUrl,
        statusCode: 0,
        statusText: 'Redirect Loop Detected',
        headers: {},
        durationMs: 0
      });
      break;
    }
    visited.add(currentUrl);

    const startTime = Date.now();
    let res;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Do not automatically follow, so we record each hop
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal
      });
      clearTimeout(timer);
    } catch (err) {
      chain.push({
        hop: step,
        url: currentUrl,
        statusCode: 0,
        statusText: err.name === 'AbortError' ? 'Connection Timed Out' : `Connection Failed: ${err.message}`,
        headers: {},
        durationMs: Date.now() - startTime
      });
      break;
    }

    const durationMs = Date.now() - startTime;
    const statusCode = res.status;
    const location = res.headers.get('location');
    const server = res.headers.get('server');
    const contentType = res.headers.get('content-type');

    chain.push({
      hop: step,
      url: currentUrl,
      statusCode,
      statusText: res.statusText || String(statusCode),
      locationHeader: location || null,
      serverHeader: server || null,
      contentType: contentType || null,
      durationMs
    });

    // Check if redirect status (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
      try {
        const nextUrl = new URL(location, currentUrl).href;
        currentUrl = nextUrl;
      } catch {
        break;
      }
    } else {
      // Terminal HTTP hop reached
      break;
    }
  }

  const finalUrl = chain.length ? chain[chain.length - 1].url : initialUrl;
  return {
    initialUrl,
    finalUrl,
    totalHops: chain.length,
    isRedirected: chain.length > 1,
    chain
  };
}
