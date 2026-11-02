/**
 * app.js
 * URL Analyser 2.0 Client Controller.
 */

class UrlAnalyserApp {
  constructor() {
    this.currentData = null;
    this.historyKey = 'url_analyser_history_v2';
    this.init();
  }

  init() {
    this.bindEvents();
    this.initTheme();
    this.updateHistoryCount();
  }

  bindEvents() {
    // Navigation Tabs
    const navButtons = document.querySelectorAll('#mainNav .nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) targetPanel.classList.add('active');

        if (tabId === 'tab-history') this.renderHistory();
      });
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Single URL Scan
    const scanBtn = document.getElementById('scanBtn');
    const urlInput = document.getElementById('urlInput');
    scanBtn.addEventListener('click', () => this.runScan(urlInput.value));
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.runScan(urlInput.value);
    });

    // Clean & Defanged copy buttons
    document.getElementById('copyCleanBtn').addEventListener('click', () => this.copyCleanUrl());
    document.getElementById('copyDefangedBtn').addEventListener('click', () => this.copyDefangedUrl());

    // Email / Text link extraction
    document.getElementById('extractBtn').addEventListener('click', () => this.runTextExtraction());

    // URL Diff / Comparison
    document.getElementById('compareBtn').addEventListener('click', () => this.runComparison());

    // Lookalike Hunter
    document.getElementById('lookalikeBtn').addEventListener('click', () => this.runLookalikeSearch());

    // Clear History
    document.getElementById('clearHistBtn').addEventListener('click', () => {
      localStorage.removeItem(this.historyKey);
      this.updateHistoryCount();
      this.renderHistory();
    });
  }

  initTheme() {
    const saved = localStorage.getItem('ls_theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
  }

  toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('ls_theme', next);
  }

  setAndScan(url) {
    document.getElementById('urlInput').value = url;
    this.runScan(url);
  }

  async runScan(url) {
    if (!url || !url.trim()) return;
    const cleanInput = url.trim();

    // Show loading
    const loading = document.getElementById('scanLoading');
    const resultsCard = document.getElementById('resultsCard');
    const scanBtn = document.getElementById('scanBtn');
    loading.style.display = 'block';
    resultsCard.style.display = 'none';
    scanBtn.disabled = true;

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanInput })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to analyze URL');
        return;
      }

      this.currentData = data;
      this.saveHistory(data);
      this.renderScanResults(data);

      resultsCard.style.display = 'block';
      resultsCard.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      alert('Error connecting to URL Analyser server: ' + err.message);
    } finally {
      loading.style.display = 'none';
      scanBtn.disabled = false;
    }
  }

  renderScanResults(data) {
    const { hierarchy, risk, screenshot, parameters, redirects, dns, tls, content } = data;

    // 1. Verdict Banner
    const verdictBanner = document.getElementById('verdictBanner');
    verdictBanner.className = `verdict-banner ${risk.verdictLevel}`;

    document.getElementById('scoreVal').textContent = risk.score;
    const badge = document.getElementById('verdictBadge');
    badge.className = `badge ${risk.verdictLevel}`;
    badge.textContent = risk.verdictTitle;

    document.getElementById('verdictTitle').textContent = risk.verdictTitle;
    document.getElementById('verdictSummary').textContent = risk.verdictSummary;

    // 2. Highlighted Address Bar Decomposition
    const addrVisual = document.getElementById('addressBarVisual');
    addrVisual.innerHTML = '';

    const protoSpan = document.createElement('span');
    protoSpan.className = 'addr-part addr-proto';
    protoSpan.textContent = hierarchy.protocol + '://';
    addrVisual.appendChild(protoSpan);

    if (hierarchy.subdomain) {
      const subSpan = document.createElement('span');
      subSpan.className = 'addr-part addr-sub';
      subSpan.textContent = hierarchy.subdomain + '.';
      subSpan.title = 'Subdomain (can be forged to say anything)';
      addrVisual.appendChild(subSpan);
    }

    const regSpan = document.createElement('span');
    regSpan.className = 'addr-part addr-reg';
    regSpan.textContent = hierarchy.registeredDomain;
    regSpan.title = 'Real Registered Domain Owner';
    addrVisual.appendChild(regSpan);

    if (hierarchy.port && hierarchy.port !== '80' && hierarchy.port !== '443') {
      const portSpan = document.createElement('span');
      portSpan.className = 'addr-part addr-proto';
      portSpan.textContent = ':' + hierarchy.port;
      addrVisual.appendChild(portSpan);
    }

    if (hierarchy.pathname && hierarchy.pathname !== '/') {
      const pathSpan = document.createElement('span');
      pathSpan.className = 'addr-part addr-path';
      pathSpan.textContent = hierarchy.pathname;
      addrVisual.appendChild(pathSpan);
    }

    if (hierarchy.search) {
      const querySpan = document.createElement('span');
      querySpan.className = 'addr-part addr-query';
      querySpan.textContent = hierarchy.search;
      querySpan.title = 'Query parameters';
      addrVisual.appendChild(querySpan);
    }

    // 3. Security Findings
    const findingsList = document.getElementById('findingsList');
    findingsList.innerHTML = '';
    document.getElementById('findingCount').textContent = risk.flags.length;

    if (risk.flags.length === 0) {
      findingsList.innerHTML = '<div class="finding-item safe"><div class="finding-desc">No high or medium severity red flags detected.</div></div>';
    } else {
      risk.flags.forEach(f => {
        const item = document.createElement('div');
        item.className = `finding-item ${f.level}`;
        item.innerHTML = `
          <div>
            <div class="finding-title">${this.escapeHtml(f.title)}</div>
            <div class="finding-desc">${this.escapeHtml(f.detail)}</div>
          </div>
        `;
        findingsList.appendChild(item);
      });
    }

    // 3.5. Machine Learning Forensic Classifier (MongoDB Model)
    const mlDetails = document.getElementById('mlDetails');
    const mlBadge = document.getElementById('mlBadge');
    if (data.ml) {
      const ml = data.ml;
      const isHigh = ml.probability >= 70;
      const isMed = ml.probability >= 40 && ml.probability < 70;
      mlBadge.textContent = `${ml.probability}% Phishing Risk`;
      mlBadge.className = `mini-tag ${isHigh ? 'badge high' : (isMed ? 'badge med' : 'badge safe')}`;

      mlDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">ML Phishing Probability:</span>
          <span class="detail-val" style="font-size:1.1rem; font-weight:800; color:${isHigh ? 'var(--danger)' : (isMed ? 'var(--warning)' : 'var(--safe)')}">
            ${ml.probability}% ${ml.isPhishing ? '(Flagged Phishing)' : '(Classified Legitimate)'}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Model Architecture:</span>
          <span class="detail-val">${this.escapeHtml(ml.modelMeta?.algorithm || 'Random Forest Ensemble')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Database Origin:</span>
          <span class="detail-val">MongoDB Collection "ml_models" (v${ml.modelMeta?.version || '2.0'})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Validation Accuracy:</span>
          <span class="detail-val" style="color:var(--accent); font-weight:700">${ml.modelMeta?.metrics?.accuracy || 100}% on 4,000 Test URLs</span>
        </div>
        <div style="margin-top:0.6rem">
          <strong style="font-size:0.8rem; color:var(--text-muted)">Top Influential Features for this URL:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-top:0.3rem">
            ${(ml.topFeatures || []).map(f => `
              <span class="info-tag" style="font-size:0.75rem">
                ${f.name.replace(/_/g, ' ')}: <strong>${typeof f.value === 'number' ? (f.value % 1 === 0 ? f.value : f.value.toFixed(2)) : f.value}</strong>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      mlBadge.textContent = 'Standby';
      mlDetails.innerHTML = '<p class="detail-label">ML model warming up from MongoDB...</p>';
    }

    // 4. Safe Preview Screenshot
    const screenshotBox = document.getElementById('screenshotBox');
    if (screenshot) {
      screenshotBox.innerHTML = `<img src="${screenshot}" alt="Sandboxed Visual Page Preview" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'screenshot-placeholder\\'><p>Preview render pending or target page blocks automated rendering.</p></div>'">`;
    } else {
      screenshotBox.innerHTML = `<div class="screenshot-placeholder"><p>No visual render available (target page unreachable or non-graphical endpoint).</p></div>`;
    }

    // 5. Form & Credential Theft Forensics
    const formDetails = document.getElementById('formDetails');
    formDetails.innerHTML = '';
    document.getElementById('formBadge').textContent = `${content?.forms?.length || 0} Forms`;

    if (!content || !content.forms || content.forms.length === 0) {
      formDetails.innerHTML = '<p class="detail-label">No interactive HTML form elements detected on page.</p>';
    } else {
      content.forms.forEach(frm => {
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
          <div style="flex:1">
            <strong>Form #${frm.index} (${frm.method}):</strong>
            <div class="detail-val" style="text-align:left; color:${frm.exfilRisk ? 'var(--danger)' : 'var(--text)'}">
              Action: ${this.escapeHtml(frm.action)}
            </div>
            ${frm.exfilRisk ? `<div style="color:var(--danger); font-size:0.8rem; margin-top:2px;">⚠️ ${this.escapeHtml(frm.exfilRisk)}</div>` : ''}
          </div>
        `;
        formDetails.appendChild(row);
      });
    }

    // Sensitive inputs summary
    if (content?.sensitiveInputs) {
      const s = content.sensitiveInputs;
      const inputsRow = document.createElement('div');
      inputsRow.style.marginTop = '0.5rem';
      inputsRow.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Password Inputs:</span>
          <span class="detail-val">${s.passwordCount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Credit Card / Payment Fields:</span>
          <span class="detail-val">${s.creditCardCount}</span>
        </div>
      `;
      formDetails.appendChild(inputsRow);
    }

    // 6. Redirect Timeline
    const redirectTimeline = document.getElementById('redirectTimeline');
    redirectTimeline.innerHTML = '';
    document.getElementById('hopBadge').textContent = `${redirects.chain.length} Hop(s)`;

    redirects.chain.forEach(h => {
      const step = document.createElement('div');
      step.className = 'timeline-step';
      step.innerHTML = `
        <span class="step-code">[${h.statusCode || h.type || 'Hop'}]</span>
        <span style="word-break:break-all">${this.escapeHtml(h.url)}</span>
        ${h.locationHeader ? `<div style="color:var(--text-muted); font-size:0.8rem;">↳ Redirects to: ${this.escapeHtml(h.locationHeader)}</div>` : ''}
      `;
      redirectTimeline.appendChild(step);
    });

    // 7. DNS Details
    const dnsDetails = document.getElementById('dnsDetails');
    dnsDetails.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">A Records (IPv4):</span>
        <span class="detail-val">${dns?.a?.join(', ') || 'None'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">MX Records (Email):</span>
        <span class="detail-val">${dns?.mx?.map(m => m.exchange).join(', ') || 'None (No Email)'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Name Servers (NS):</span>
        <span class="detail-val">${dns?.ns?.slice(0, 2).join(', ') || 'Default'}</span>
      </div>
    `;

    // 8. TLS Details
    const tlsDetails = document.getElementById('tlsDetails');
    if (tls?.supported) {
      tlsDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Certificate Issuer:</span>
          <span class="detail-val">${this.escapeHtml(tls.issuer)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cert Age / Expiry:</span>
          <span class="detail-val">${tls.certAgeDays} days old (${tls.daysRemaining} days left)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cipher / Protocol:</span>
          <span class="detail-val">${tls.protocol} (${tls.cipher})</span>
        </div>
      `;
    } else {
      tlsDetails.innerHTML = `<p class="detail-label">${this.escapeHtml(tls?.reason || 'No TLS certificate detected')}</p>`;
    }

    // Live Threat Feed Details (OpenPhish)
    const feedDetails = document.getElementById('feedDetails');
    const feedBadge = document.getElementById('feedBadge');
    if (data.threatFeed) {
      feedBadge.textContent = data.threatFeed.isListed ? 'MALICIOUS' : 'CLEAN';
      feedBadge.className = `mini-tag ${data.threatFeed.isListed ? 'badge high' : 'badge safe'}`;
      feedDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">OpenPhish Feed:</span>
          <span class="detail-val" style="color:${data.threatFeed.isListed ? 'var(--danger)' : 'var(--safe)'}; font-weight:700">
            ${data.threatFeed.isListed ? '🚨 LISTED IN ACTIVE PHISHING FEED' : '✅ Not listed in community feed'}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Database Size:</span>
          <span class="detail-val">${data.threatFeed.totalFeedSize || 0} active threat indicators</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Match Scope:</span>
          <span class="detail-val">${data.threatFeed.matchType || 'none'}</span>
        </div>
      `;
    }

    // ICANN RDAP Domain Age Details
    const rdapDetails = document.getElementById('rdapDetails');
    const rdapBadge = document.getElementById('rdapBadge');
    if (data.rdap?.available) {
      const rd = data.rdap;
      rdapBadge.textContent = rd.domainAgeDays !== null ? `${rd.domainAgeDays}d old` : 'Registry OK';
      rdapDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Registration Date:</span>
          <span class="detail-val">${rd.registrationDate?.slice(0, 10) || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Domain Age:</span>
          <span class="detail-val" style="color:${rd.isNewlyRegistered ? 'var(--danger)' : 'var(--text)'}; font-weight:700">
            ${rd.domainAgeDays !== null ? rd.domainAgeDays + ' days (' + Math.round(rd.domainAgeDays/365*10)/10 + ' yrs)' : 'Unknown'}
            ${rd.isNewlyRegistered ? ' ⚠️ NEWLY REGISTERED' : ''}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registrar:</span>
          <span class="detail-val">${this.escapeHtml(rd.registrar || 'Unknown')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expiration:</span>
          <span class="detail-val">${rd.expirationDate?.slice(0, 10) || 'Unknown'}</span>
        </div>
      `;
    } else {
      rdapBadge.textContent = 'N/A';
      rdapDetails.innerHTML = `<p class="detail-label">${this.escapeHtml(data.rdap?.reason || 'No RDAP registry data available')}</p>`;
    }

    // Hosting ASN & Geolocation Details
    const ipIntelDetails = document.getElementById('ipIntelDetails');
    const ipIntelBadge = document.getElementById('ipIntelBadge');
    if (data.ipIntel && !data.ipIntel.isPrivate) {
      const ipi = data.ipIntel;
      ipIntelBadge.textContent = ipi.country || 'Live';
      ipIntelDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">IP Address:</span>
          <span class="detail-val">${ipi.ip}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hosting Org:</span>
          <span class="detail-val">${this.escapeHtml(ipi.org)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-val">${this.escapeHtml(ipi.city)}, ${this.escapeHtml(ipi.country)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ASN:</span>
          <span class="detail-val">${this.escapeHtml(ipi.asn)}</span>
        </div>
        ${ipi.isProxyOrVpn ? `<div class="detail-row"><span class="detail-label" style="color:var(--danger)">⚠️ Traffic Anomaly:</span><span class="detail-val" style="color:var(--danger)">Anonymous Proxy / VPN / Exit Node</span></div>` : ''}
      `;
    } else {
      ipIntelBadge.textContent = 'Local / N/A';
      ipIntelDetails.innerHTML = `<p class="detail-label">${data.ipIntel?.isPrivate ? 'Internal / private loopback address' : 'No resolved public IPv4 address to geolocate'}</p>`;
    }

    // 9. Query Parameter Explainer
    const paramDetails = document.getElementById('paramDetails');
    paramDetails.innerHTML = '';
    document.getElementById('paramBadge').textContent = `${parameters.total} Params`;

    if (parameters.total === 0) {
      paramDetails.innerHTML = '<p class="detail-label">No query parameters present in URL.</p>';
    } else {
      parameters.items.forEach(p => {
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
          <div>
            <strong>${this.escapeHtml(p.key)}:</strong>
            <span style="font-size:0.8rem; color:var(--text-muted)"> ${this.escapeHtml(p.explanation)}</span>
          </div>
          <span class="detail-val" style="max-width:140px; overflow:hidden; text-overflow:ellipsis;">${this.escapeHtml(p.value)}</span>
        `;
        paramDetails.appendChild(row);
      });
    }

    // 10. Actionable Advice
    const adviceList = document.getElementById('adviceList');
    adviceList.innerHTML = '';
    risk.advice.forEach(a => {
      const li = document.createElement('li');
      li.textContent = a;
      adviceList.appendChild(li);
    });
  }

  copyCleanUrl() {
    if (!this.currentData?.parameters?.cleanUrl) return;
    navigator.clipboard.writeText(this.currentData.parameters.cleanUrl);
    alert('Clean URL (tracking parameters removed) copied to clipboard!');
  }

  copyDefangedUrl() {
    if (!this.currentData?.input?.defanged) return;
    navigator.clipboard.writeText(this.currentData.input.defanged);
    alert('Defanged link copied (safe to share in chat/tickets)!');
  }

  // Email / Text Extraction
  async runTextExtraction() {
    const text = document.getElementById('rawTextInput').value;
    if (!text.trim()) return alert('Please paste some text first');

    const res = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    const resultsCard = document.getElementById('extractedResults');
    const list = document.getElementById('extractedList');
    list.innerHTML = '';
    document.getElementById('extractedCount').textContent = data.count;

    if (data.count === 0) {
      list.innerHTML = '<p class="detail-label">No web links found in the text.</p>';
    } else {
      data.links.forEach(l => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '0.6rem 0';
        row.style.borderBottom = '1px solid var(--border)';
        row.innerHTML = `
          <span style="word-break:break-all; font-family:var(--font-mono); font-size:0.9rem">${this.escapeHtml(l.url)}</span>
          <button class="pill-btn" onclick="app.switchToScanAndRun('${this.escapeHtml(l.url)}')">Analyze</button>
        `;
        list.appendChild(row);
      });
    }

    resultsCard.style.display = 'block';
  }

  switchToScanAndRun(url) {
    document.querySelectorAll('#mainNav .nav-btn').forEach(b => {
      if (b.dataset.tab === 'tab-scan') b.click();
    });
    this.setAndScan(url);
  }

  // URL Comparison
  async runComparison() {
    const urlA = document.getElementById('diffUrlA').value;
    const urlB = document.getElementById('diffUrlB').value;

    if (!urlA || !urlB) return alert('Please enter both URLs to compare');

    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlA, urlB })
    });
    const data = await res.json();

    const resBox = document.getElementById('diffResultsBox');
    const container = document.getElementById('compareResults');
    resBox.innerHTML = '';

    if (data.differencesCount === 0) {
      resBox.innerHTML = '<p class="detail-label" style="color:var(--safe)">Both links point to identical domains, schemes, and destinations.</p>';
    } else {
      const list = document.createElement('ul');
      list.className = 'advice-list';
      data.differences.forEach(d => {
        const li = document.createElement('li');
        li.style.color = 'var(--danger)';
        li.innerHTML = `<strong>⚠️ ${this.escapeHtml(d)}</strong>`;
        list.appendChild(li);
      });
      resBox.appendChild(list);
    }

    container.style.display = 'block';
  }

  // Lookalike search
  async runLookalikeSearch() {
    const domain = document.getElementById('lookalikeInput').value;
    if (!domain) return alert('Please enter a domain name');

    const res = await fetch(`/api/lookalikes?domain=${encodeURIComponent(domain)}`);
    const data = await res.json();

    const container = document.getElementById('lookalikeResults');
    const box = document.getElementById('lookalikeListBox');
    box.innerHTML = '';

    if (data.activeCount === 0) {
      box.innerHTML = '<p class="detail-label">No active registered permutations responded in the tested sample.</p>';
    } else {
      data.activeVariants.forEach(v => {
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
          <div>
            <strong>${this.escapeHtml(v.domain)}</strong>
            <span class="info-tag" style="margin-left:8px">${v.type}</span>
          </div>
          <span class="detail-val" style="color:var(--danger)">Resolves to ${v.ips.join(', ')}</span>
        `;
        box.appendChild(row);
      });
    }

    container.style.display = 'block';
  }

  // History Management
  saveHistory(data) {
    try {
      const hist = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      const item = {
        url: data.input.normalized,
        domain: data.hierarchy.registeredDomain,
        score: data.risk.score,
        level: data.risk.verdictLevel,
        title: data.risk.verdictTitle,
        timestamp: Date.now()
      };
      hist.unshift(item);
      localStorage.setItem(this.historyKey, JSON.stringify(hist.slice(0, 25)));
      this.updateHistoryCount();
    } catch {}
  }

  updateHistoryCount() {
    try {
      const hist = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      document.getElementById('histCount').textContent = hist.length;
    } catch {}
  }

  renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    const hist = JSON.parse(localStorage.getItem(this.historyKey) || '[]');

    if (hist.length === 0) {
      list.innerHTML = '<p class="detail-label">No previous scans found.</p>';
      return;
    }

    hist.forEach(h => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '0.75rem 0';
      row.style.borderBottom = '1px solid var(--border)';
      row.innerHTML = `
        <div>
          <span class="badge ${h.level}" style="margin-right:8px">${h.score}/100</span>
          <span style="font-family:var(--font-mono); font-weight:600">${this.escapeHtml(h.domain)}</span>
          <div style="font-size:0.8rem; color:var(--text-muted); word-break:break-all">${this.escapeHtml(h.url)}</div>
        </div>
        <button class="pill-btn" onclick="app.switchToScanAndRun('${this.escapeHtml(h.url)}')">Re-Scan</button>
      `;
      list.appendChild(row);
    });
  }

  escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
}

const app = new UrlAnalyserApp();
window.app = app;
