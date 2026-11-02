import http from 'node:http';
import { spawn } from 'node:child_process';

console.log('Spawning server for integration test...');
const server = spawn('node', ['server.js'], { stdio: 'pipe' });

server.stdout.on('data', data => {
  const msg = data.toString();
  console.log('[Server stdout]:', msg.trim());
  if (msg.includes('running on http://localhost:3000')) {
    runRequests();
  }
});

server.stderr.on('data', data => {
  console.error('[Server stderr]:', data.toString());
});

async function runRequests() {
  try {
    console.log('Sending test POST /api/extract-text request...');
    const payload = JSON.stringify({
      text: 'Suspicious email received with link: hxxps://my-bank[.]xyz/login and http://0x7f000001/admin'
    });

    const res = await fetch('http://localhost:3000/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });

    const data = await res.json();
    console.log('Response /api/extract-text:', data);

    console.log('Sending test POST /api/compare request...');
    const compRes = await fetch('http://localhost:3000/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urlA: 'https://paypal.com/signin',
        urlB: 'hxxps://paypal.com.evil-spoof[.]xyz/verify'
      })
    });
    const compData = await compRes.json();
    console.log('Response /api/compare differences:', compData.differences);

    console.log('Integration test completed successfully!');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exitCode = 1;
  } finally {
    server.kill();
    process.exit(0);
  }
}
