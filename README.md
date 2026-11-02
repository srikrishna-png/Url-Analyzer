# Linkscope 2.0 – Advanced URL Forensics & Phishing Defense Engine

Linkscope is a production-grade URL intelligence and phishing detection platform designed to protect users and security analysts from sophisticated social engineering, tracking wrappers, credential harvesters, and cloud-hosted phishing campaigns.

---

## 🌟 Key Features

### 1. Multi-Modal Input Engine
* **Direct URL Inspection:** Accepts standard URLs, naked domains, and automatically refangs security writeup strings (`hxxps://`, `[.]`, `[:]`).
* **Raw Message / Email Extractor:** Paste an entire email body, WhatsApp message, or SMS. Linkscope automatically identifies, normalizes, and extracts all embedded links for single-click forensic inspection.
* **Side-by-Side URL Diff:** Compare legitimate brand URLs with suspected imitations to expose deceptive subdomain spoofing and character discrepancies.
* **Active Typosquat & Lookalike Hunter:** Generates homoglyphs, omissions, and TLD permutations with parallel DNS resolution.

### 2. Machine Learning & Database Intelligence
* **Random Forest Classifier (Ensemble):** Trained on 30,000 public research samples (GregaVrbancic Phishing Dataset), evaluating 23 structural and lexical features per URL.
* **MongoDB 8.3 Integration:** Stores benchmark training datasets, model weights, and real-time scan telemetry.
* **Live Global Threat Feeds:** Continuously synchronizes with the live OpenPhish active phishing database.
* **Official ICANN RDAP Registry:** Queries domain creation timestamps to detect Newly Registered Domains (NRDs).

### 2. Multi-Tier Analysis Engine
* **Visual Safe Preview (Headless Sandbox):** Renders a high-resolution screenshot of the target website using an isolated headless browser with disabled cookies, detached storage, and blocked downloads.
* **Multi-Hop Redirect Tracer:** Follows HTTP 301, 302, 303, 307, 308 redirects and automatically unwraps enterprise tracking wrappers like **Microsoft Defender SafeLinks**, **Google Click Redirectors**, and **Facebook Link Shims**.
* **Form & Credential Theft Forensics:** Scans the destination HTML for `<form action="...">` submissions. Immediately alerts if entered credentials are sent to Discord Webhooks, Telegram Bots (`api.telegram.org`), Formspree, or raw numerical IP addresses.
* **Cloud-Hosted Phishing Detection:** Flags credential collection and banking lures hosted on free shared cloud providers (`web.app`, `firebaseapp.com`, `pages.dev`, `workers.dev`, `vercel.app`, `github.io`, `notion.site`, etc.).
* **Social Engineering & Deception Scanners:** Detects fake tech support hotline lures ("Call Microsoft Support"), fake urgency countdowns, and rogue browser notification hijackers.
* **Native DNS & TLS Profile:** Queries A, AAAA, MX, NS, and TXT records natively. Inspects TLS certificates for issuer credibility, certificate age, expiration, and cipher suites.
* **Lookalike & Typosquat Hunter:** Generates homoglyph permutations and performs real-time parallel DNS queries to identify active registered impersonators.
* **URL Parameter Explainer & Cleaner:** Analyzes every query parameter (`utm_*`, `fbclid`, `redirect_uri`) and provides one-click copying of clean, tracker-free links or defanged incident report strings.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+ (tested on Node.js v22)

### Installation
Dependencies are already installed in this directory:
```bash
npm install
```

### Running the Server
To launch the Linkscope dashboard and engine:
```bash
npm start
```
The application will be live at `http://localhost:3000`.

### Running Tests
To run the automated test suite:
```bash
npm test
```
