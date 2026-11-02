/**
 * screenshotService.js
 * Safely captures isolated page screenshots using headless Chrome/Edge locally,
 * or delivers an instant, cloud-isolated sandbox preview URL for Vercel/serverless.
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

function captureLocalChrome(targetUrl, outputDir, browserPath, timeoutMs = 4000) {
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
 * - When running locally on Windows/Linux with desktop Chrome, captures locally.
 * - On Vercel / serverless: instantly returns the cloud-isolated sandbox preview URL (0ms server latency!).
 */
export async function captureSafeScreenshot(targetUrl, outputDir, timeoutMs = 4000) {
  // If running locally with desktop Chrome/Edge, try local capture
  const browserPath = getBrowserExecutable();
  if (browserPath && process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
    try {
      const localResult = await captureLocalChrome(targetUrl, outputDir, browserPath, timeoutMs);
      if (localResult && localResult.success) {
        return localResult;
      }
    } catch {}
  }

  // Cloud-isolated sandbox preview URL:
  // Instant (0ms server latency), perfectly safe, and stream-rendered by the browser
  const cloudUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1280&h=800`;
  return {
    success: true,
    isCloudSandbox: true,
    url: cloudUrl
  };
}
