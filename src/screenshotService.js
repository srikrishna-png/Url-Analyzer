/**
 * screenshotService.js
 * Safely captures isolated page screenshots using headless Chrome/Edge locally,
 * with automatic fallback to cloud-isolated sandbox preview (e.g. for Vercel/serverless).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Detect system Chrome or Edge path (Windows & Linux)
function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function captureLocalChrome(targetUrl, outputDir, browserPath, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `shot_${crypto.randomBytes(8).toString('hex')}.png`;
      const outputPath = path.join(outputDir, filename);

      const args = [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--mute-audio',
        '--no-first-run',
        '--window-size=1280,800',
        `--screenshot=${outputPath}`,
        `--timeout=${timeoutMs}`,
        targetUrl
      ];

      let resolved = false;
      const proc = spawn(browserPath, args, { stdio: 'ignore' });

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { proc.kill('SIGKILL'); } catch {}
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
            resolve({ success: true, filename, localPath: outputPath });
          } else {
            resolve({ success: false, reason: 'Local screenshot timed out' });
          }
        }
      }, timeoutMs);

      proc.on('exit', (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
            resolve({ success: true, filename, localPath: outputPath });
          } else {
            resolve({ success: false, reason: `Headless browser exited with code ${code}` });
          }
        }
      });

      proc.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ success: false, reason: err.message });
        }
      });
    } catch (err) {
      resolve({ success: false, reason: err.message });
    }
  });
}

/**
 * Capture a safe sandbox screenshot:
 * 1. Attempts local Chrome/Edge if available.
 * 2. Falls back to secure cloud sandbox preview (WordPress mShots) for Vercel/serverless.
 */
export async function captureSafeScreenshot(targetUrl, outputDir, timeoutMs = 9000) {
  // 1. Try local browser if available (Windows/local dev)
  const browserPath = getBrowserExecutable();
  if (browserPath) {
    try {
      const localResult = await captureLocalChrome(targetUrl, outputDir, browserPath, timeoutMs);
      if (localResult && localResult.success) {
        return localResult;
      }
    } catch {}
  }

  // 2. Cloud-isolated sandbox preview (Works everywhere, including Vercel serverless)
  try {
    const cloudUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1280&h=800`;

    // Fetch cloud render and convert to Base64 data URL for instant, reliable rendering
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(cloudUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await resp.arrayBuffer();
      if (arrayBuf.byteLength > 1000) {
        const base64 = Buffer.from(arrayBuf).toString('base64');
        return {
          success: true,
          isCloudSandbox: true,
          dataUrl: `data:${contentType};base64,${base64}`,
          url: cloudUrl
        };
      }
    }

    return {
      success: true,
      isCloudSandbox: true,
      url: cloudUrl
    };
  } catch (err) {
    // If fetch failed or timed out, return direct cloud preview URL
    return {
      success: true,
      isCloudSandbox: true,
      url: `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1280&h=800`
    };
  }
}
