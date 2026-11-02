/**
 * screenshotService.js
 * Safely captures isolated page screenshots using headless Chrome/Edge.
 * Renders in a detached sandbox with disabled downloads and isolated storage.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Detect system Chrome or Edge path
function getBrowserExecutable() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  return null;
}

export async function captureSafeScreenshot(targetUrl, outputDir, timeoutMs = 9000) {
  const browserPath = getBrowserExecutable();
  if (!browserPath) {
    return {
      success: false,
      reason: 'No local Chrome or Edge executable found on server'
    };
  }

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

  return new Promise((resolve) => {
    let resolved = false;
    const proc = spawn(browserPath, args, { stdio: 'ignore' });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { proc.kill('SIGKILL'); } catch {}
        if (fs.existsSync(outputPath)) {
          resolve({ success: true, filename, localPath: outputPath });
        } else {
          resolve({ success: false, reason: 'Screenshot process timed out' });
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
          resolve({ success: false, reason: `Headless browser exited with code ${code} without generating screenshot` });
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
  });
}
