/**
 * server.js
 * URL Analyser & Phishing Detection Engine Server.
 */

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

import { refangUrl, defangUrl, extractUrlsFromText } from './src/normalizer.js';
import { parseDomainHierarchy } from './src/publicSuffix.js';
import { traceRedirectChain, unwrapTrackingLink } from './src/redirectTracer.js';
import { inspectDns } from './src/dnsInspector.js';
import { inspectTlsCertificate } from './src/tlsInspector.js';
import { scanPageContent } from './src/contentScanner.js';
import { findActiveLookalikes } from './src/lookalikeGenerator.js';
import { captureSafeScreenshot } from './src/screenshotService.js';
import { evaluateDomainReputation } from './src/threatIntelligence.js';
import { calculateComprehensiveRisk } from './src/scoringEngine.js';
import { threatFeedManager } from './src/liveThreatFeeds.js';
import { lookupDomainRdap } from './src/rdapInspector.js';
import { lookupIpIntel } from './src/ipIntel.js';
import { connectDb, getActiveModel, logScanTelemetry, getDb } from './src/db.js';
import { extractUrlFeatures } from './src/mlFeatureExtractor.js';
import { RandomForestModel } from './src/mlClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const publicDir = path.join(__dirname, 'public');
const screenshotDir = path.join(publicDir, 'screenshots');
try {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
} catch {
  // Read-only filesystem in serverless environments (e.g. Vercel)
}
app.use(express.static(publicDir));

// Clean old screenshots on startup if directory exists
try {
  if (fs.existsSync(screenshotDir)) {
    const existingFiles = fs.readdirSync(screenshotDir);
    for (const f of existingFiles) {
      if (f.startsWith('shot_')) {
        fs.unlinkSync(path.join(screenshotDir, f));
      }
    }
  }
} catch {}

// Load trained ML Model from MongoDB or local cache
let activeMlModel = null;
let activeModelMeta = null;

async function initMl() {
  try {
    await connectDb();
    const dbModel = await getActiveModel();
    if (dbModel && dbModel.modelWeights) {
      activeMlModel = RandomForestModel.fromJSON(dbModel.modelWeights);
      activeModelMeta = {
        version: dbModel.version,
        metrics: dbModel.metrics,
        trainingDataset: dbModel.trainingDataset,
        featureImportances: dbModel.featureImportances
      };
      console.log(`[ML Engine] Loaded active model "${dbModel.version}" from MongoDB (${dbModel.metrics?.accuracy}% accuracy)`);
      return activeMlModel;
    }
  } catch (err) {
    console.warn('[ML Engine] MongoDB model check warning:', err.message);
  }

  try {
    const localModelPath = path.join(__dirname, 'models', 'active_model.json');
    if (fs.existsSync(localModelPath)) {
      const raw = JSON.parse(fs.readFileSync(localModelPath, 'utf8'));
      activeMlModel = RandomForestModel.fromJSON(raw.modelWeights);
      activeModelMeta = {
        version: raw.version,
        metrics: raw.metrics,
        trainingDataset: raw.trainingDataset,
        featureImportances: raw.featureImportances
      };
      console.log(`[ML Engine] Loaded active model "${raw.version}" from local cache (${raw.metrics?.accuracy}% accuracy)`);
      return activeMlModel;
    }
  } catch (err) {
    console.warn('[ML Engine] Local model check warning:', err.message);
  }
  return null;
}
initMl().catch(() => {});

/**
 * POST /api/scan
 * Primary endpoint for full multi-tier URL analysis
 */
app.post('/api/scan', async (req, res) => {
  try {
    const rawInput = (req.body.url || '').trim();
    if (!rawInput) {
      return res.status(400).json({ error: 'Please provide a URL to analyze' });
    }

    // 1. Refang and normalize input
    const normalizedUrl = refangUrl(rawInput);
    const domainHierarchy = parseDomainHierarchy(normalizedUrl);
    if (domainHierarchy.error) {
      return res.status(400).json({ error: domainHierarchy.error });
    }

    // 2. Trace multi-hop redirects and unwrap tracking links
    const redirectInfo = await traceRedirectChain(normalizedUrl);
    const terminalUrl = redirectInfo.finalUrl;
    const terminalHierarchy = terminalUrl !== normalizedUrl ? parseDomainHierarchy(terminalUrl) : domainHierarchy;

    // 3. Parallel deep inspection: DNS, TLS, Content, Screenshots, and Live ICANN RDAP
    const targetHost = terminalHierarchy.effectiveHost;
    const targetPort = terminalHierarchy.port;
    const regDomain = terminalHierarchy.registeredDomain;

    const [dnsInfo, tlsInfo, contentInfo, screenshotInfo, rdapInfo] = await Promise.all([
      inspectDns(targetHost),
      inspectTlsCertificate(targetHost, targetPort),
      scanPageContent(terminalUrl),
      captureSafeScreenshot(terminalUrl, screenshotDir),
      lookupDomainRdap(regDomain)
    ]);

    // Live IP Intel on primary A record (if available)
    let ipIntelInfo = null;
    if (dnsInfo?.a && dnsInfo.a.length > 0) {
      ipIntelInfo = await lookupIpIntel(dnsInfo.a[0]);
    }

    // Live Community Phishing & Threat Feed Lookup (OpenPhish, etc.)
    const liveFeedInfo = threatFeedManager.checkUrl(terminalUrl, targetHost);

    // 4. Domain reputation, phishing kit signatures, and brand impersonation check
    const reputationInfo = evaluateDomainReputation(
      terminalHierarchy.registeredDomain,
      terminalHierarchy.hostname,
      terminalUrl
    );

    // 5. Machine Learning Feature Extraction & Inference
    const mlFeatures = extractUrlFeatures(terminalUrl);
    let mlResult = null;
    if (activeMlModel && mlFeatures) {
      const probability = activeMlModel.predictProbability(mlFeatures.vector);
      const probPct = Math.round(probability * 1000) / 10;
      mlResult = {
        probability: probPct,
        isPhishing: probability >= 0.5,
        confidence: Math.round(Math.abs(probability - 0.5) * 2 * 100),
        features: mlFeatures.featureDict,
        topFeatures: Object.entries(activeModelMeta?.featureImportances || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, imp]) => ({ name, importance: imp, value: mlFeatures.featureDict[name] })),
        modelMeta: activeModelMeta
      };
    }

    // 6. Synthesize comprehensive risk score & findings
    const riskAnalysis = calculateComprehensiveRisk({
      domainHierarchy: terminalHierarchy,
      redirectInfo,
      dnsInfo,
      tlsInfo,
      contentInfo,
      reputationInfo,
      liveFeedInfo,
      rdapInfo,
      ipIntelInfo,
      mlResult
    });

    // Log telemetry to MongoDB
    logScanTelemetry({
      url: terminalUrl,
      registeredDomain: terminalHierarchy.registeredDomain,
      riskScore: riskAnalysis.score,
      verdict: riskAnalysis.verdictTitle,
      mlProbability: mlResult?.probability,
      scannedAt: new Date()
    });

    // 6. Query parameter explanation & tracker cleaner
    const urlObj = new URL(terminalUrl);
    const paramsList = [];
    const cleanUrlObj = new URL(terminalUrl);
    const TRACKER_KEYS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid', 'dclid', '_hsenc', '_hsmi', 'mc_cid', 'mc_eid']);

    urlObj.searchParams.forEach((val, key) => {
      const isTracker = TRACKER_KEYS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_');
      let explanation = 'Standard application query parameter';
      let isSuspicious = false;

      if (isTracker) {
        explanation = 'Marketing / Ad-tracking telemetry parameter';
        cleanUrlObj.searchParams.delete(key);
      } else if (['redirect', 'redirect_uri', 'next', 'url', 'dest'].includes(key.toLowerCase())) {
        explanation = 'Navigation redirect destination — potential open redirect target!';
        isSuspicious = true;
      } else if (['token', 'key', 'auth', 'session'].includes(key.toLowerCase())) {
        explanation = 'Authentication token or session identifier';
      }

      paramsList.push({
        key,
        value: val,
        isTracker,
        isSuspicious,
        explanation
      });
    });

    res.json({
      success: true,
      input: {
        raw: rawInput,
        normalized: normalizedUrl,
        defanged: defangUrl(normalizedUrl)
      },
      hierarchy: terminalHierarchy,
      initialHierarchy: domainHierarchy,
      redirects: redirectInfo,
      dns: dnsInfo,
      tls: tlsInfo,
      content: contentInfo,
      reputation: reputationInfo,
      threatFeed: liveFeedInfo,
      rdap: rdapInfo,
      ipIntel: ipIntelInfo,
      risk: riskAnalysis,
      ml: mlResult,
      screenshot: screenshotInfo.success ? `/screenshots/${screenshotInfo.filename}` : null,
      parameters: {
        total: paramsList.length,
        items: paramsList,
        cleanUrl: cleanUrlObj.href
      },
      analyzedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

/**
 * POST /api/extract-text
 * Extracts embedded links from raw email or message bodies
 */
app.post('/api/extract-text', (req, res) => {
  const text = req.body.text || '';
  if (!text.trim()) {
    return res.status(400).json({ error: 'Text content is empty' });
  }

  const extracted = extractUrlsFromText(text);
  res.json({
    success: true,
    count: extracted.length,
    links: extracted
  });
});

/**
 * GET /api/lookalikes
 * Generates typosquatting and homoglyph variants with active DNS probes
 */
app.get('/api/lookalikes', async (req, res) => {
  const domain = (req.query.domain || '').trim();
  if (!domain) {
    return res.status(400).json({ error: 'Please provide a domain to inspect' });
  }

  try {
    const result = await findActiveLookalikes(domain, 16);
    res.json({
      success: true,
      domain,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/compare
 * Compares two URLs side-by-side to highlight deceptive differences
 */
app.post('/api/compare', (req, res) => {
  const urlA = refangUrl(req.body.urlA || '');
  const urlB = refangUrl(req.body.urlB || '');

  if (!urlA || !urlB) {
    return res.status(400).json({ error: 'Please provide both URLs for comparison' });
  }

  const parsedA = parseDomainHierarchy(urlA);
  const parsedB = parseDomainHierarchy(urlB);

  const differences = [];
  if (parsedA.protocol !== parsedB.protocol) {
    differences.push(`Protocols differ: ${parsedA.protocol} vs ${parsedB.protocol}`);
  }
  if (parsedA.registeredDomain !== parsedB.registeredDomain) {
    differences.push(`Different registered domain owners: "${parsedA.registeredDomain}" vs "${parsedB.registeredDomain}"`);
  }
  if (parsedA.subdomain !== parsedB.subdomain) {
    differences.push(`Subdomains differ: "${parsedA.subdomain || '(none)'}" vs "${parsedB.subdomain || '(none)'}"`);
  }
  if (parsedA.isIp !== parsedB.isIp) {
    differences.push(`One URL is a raw numerical IP while the other is a registered domain`);
  }
  if (parsedA.pathname !== parsedB.pathname) {
    differences.push(`Paths differ: "${parsedA.pathname}" vs "${parsedB.pathname}"`);
  }

  res.json({
    success: true,
    urlA: { url: urlA, parsed: parsedA },
    urlB: { url: urlB, parsed: parsedB },
    differencesCount: differences.length,
    differences
  });
});

/**
 * GET /api/ml/stats
 * Returns active ML model metadata, MongoDB training count, and scan telemetry
 */
app.get('/api/ml/stats', async (req, res) => {
  try {
    const db = getDb();
    let trainingSamplesCount = 0;
    let totalScansLogged = 0;
    if (db) {
      trainingSamplesCount = await db.collection('training_dataset').countDocuments();
      totalScansLogged = await db.collection('scan_telemetry').countDocuments();
    }
    res.json({
      success: true,
      mongoConnected: Boolean(db),
      activeModel: activeModelMeta,
      trainingSamplesInDb: trainingSamplesCount,
      totalScansLogged
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`URL Analyser Server running on http://localhost:${PORT}`);
  });
}

export default app;
