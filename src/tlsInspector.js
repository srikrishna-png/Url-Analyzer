/**
 * tlsInspector.js
 * Inspects TLS/SSL certificates natively using Node's tls module.
 */

import tls from 'node:tls';

export function inspectTlsCertificate(hostname, port = 443, timeoutMs = 6000) {
  return new Promise(resolve => {
    if (!hostname || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return resolve({
        supported: false,
        reason: 'Target is a raw IP address without TLS or domain certificate'
      });
    }

    const options = {
      host: hostname,
      port: Number(port) || 443,
      servername: hostname,
      rejectUnauthorized: false, // We want to inspect self-signed / expired certs too
      timeout: timeoutMs
    };

    let socket;
    const timer = setTimeout(() => {
      if (socket) socket.destroy();
      resolve({
        supported: false,
        reason: 'TLS handshake timed out'
      });
    }, timeoutMs);

    try {
      socket = tls.connect(options, () => {
        clearTimeout(timer);
        const cert = socket.getPeerCertificate(true);
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        const authorized = socket.authorized;
        const authError = socket.authorizationError;

        socket.destroy();

        if (!cert || Object.keys(cert).length === 0) {
          return resolve({
            supported: false,
            reason: 'No certificate presented by server'
          });
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const isExpired = now > validTo;
        const daysRemaining = Math.round((validTo - now) / (1000 * 60 * 60 * 24));
        const certAgeDays = Math.round((now - validFrom) / (1000 * 60 * 60 * 24));

        const flags = [];
        if (isExpired) {
          flags.push({ level: 'high', text: `SSL Certificate expired on ${cert.valid_to}` });
        }
        if (!authorized && authError) {
          flags.push({ level: 'high', text: `SSL Certificate validation error: ${authError}` });
        }
        if (certAgeDays < 7) {
          flags.push({ level: 'med', text: `SSL Certificate was issued very recently (${certAgeDays} day(s) ago). Disposable phishing kits often deploy brand-new certificates.` });
        }

        resolve({
          supported: true,
          authorized,
          authError: authError || null,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown Issuer',
          issuerDetails: cert.issuer,
          subject: cert.subject?.CN || 'Unknown Subject',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          certAgeDays,
          daysRemaining,
          isExpired,
          protocol,
          cipher: cipher ? cipher.name : 'Unknown',
          subjectAltNames: cert.subjectaltname ? cert.subjectaltname.split(', ') : [],
          flags
        });
      });

      socket.on('error', err => {
        clearTimeout(timer);
        resolve({
          supported: false,
          reason: `TLS connection error: ${err.message}`
        });
      });

    } catch (err) {
      clearTimeout(timer);
      resolve({
        supported: false,
        reason: `TLS initialization failed: ${err.message}`
      });
    }
  });
}
